import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const initialized = useRef(false)

  const fetchProfile = async (userId) => {
    if (!userId) return null
    try {
      // Use maybeSingle() to avoid 406 errors when user doesn't exist yet
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timed out')), 4000)
      )

      const result = await Promise.race([profilePromise, timeoutPromise])
      
      // result might be from supabase ({ data, error }) or from timeout (throws)
      if (result.error) {
        console.error('Profile fetch error:', result.error.message)
        return null
      }
      return result.data
    } catch (err) {
      console.error('Unexpected error fetching profile:', err.message || err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    if (initialized.current) return
    initialized.current = true

    const initializeAuth = async () => {
      try {
        setLoading(true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.warn('Session error, clearing local session:', sessionError.message)
          await supabase.auth.signOut().catch(() => {})
          if (mounted) {
            setUser(null)
            setProfile(null)
          }
          return // Exit early, user is unauthenticated
        }

        const currentUser = session?.user || null
        if (mounted) setUser(currentUser)
        
        if (currentUser) {
          let userProfile = await fetchProfile(currentUser.id)
          
          // Auto-provision profile if missing (common in fresh dev environments)
          if (!userProfile && mounted) {
            console.log('Profile missing, attempting to auto-provision...')
            const isStudent = currentUser.email?.endsWith('@forge.local')
            const { data: newProfile, error: provisionError } = await supabase
              .from('users')
              .insert([
                { 
                  id: currentUser.id, 
                  email: currentUser.email,
                  role: isStudent ? 'student' : 'mentor',
                  display_name: currentUser.email?.split('@')[0] || 'User'
                }
              ])
              .select()
              .maybeSingle()
            
            if (!provisionError && newProfile) {
              userProfile = newProfile
            } else {
              if (provisionError) console.error('Auto-provisioning failed:', provisionError.message)
              
              // Fallback for Dev: If we are in dev and profile can't be created/fetched, mock it
              if (import.meta.env.DEV) {
                console.warn('Dev Fallback: Mocking mentor role to restore dashboard access')
                userProfile = {
                  id: currentUser.id,
                  email: currentUser.email,
                  role: 'mentor',
                  display_name: currentUser.email?.split('@')[0] || 'Dev Mentor'
                }
              }
            }
          }
          
          if (mounted) setProfile(userProfile)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        // If the system fails to initialize auth, we shouldn't lock the app with a red screen.
        // It's safer to just default to an unauthenticated state and let the user try logging in manually.
        if (mounted) {
          await supabase.auth.signOut().catch(() => {})
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (currentUser) {
        // Only fetch if profile is missing or user changed
        if (!profile || profile.id !== currentUser.id) {
          setLoading(true)
          const userProfile = await fetchProfile(currentUser.id)
          if (mounted) {
            setProfile(userProfile)
            setLoading(false)
          }
        }
      } else {
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
      }
    })

    // Safety timeout to ensure app always unblocks
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Safety timeout: Unblocking UI')
        setLoading(false)
      }
    }, 6000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [profile])

  const mockLogin = (email, role = 'mentor') => {
    const mockUser = {
      id: 'dev-user-' + Date.now(),
      email: email,
      role: role,
    }
    const mockProfile = {
      id: mockUser.id,
      email: email,
      role: role,
      display_name: email.split('@')[0]
    }
    setUser(mockUser)
    setProfile(mockProfile)
    setLoading(false)
  }

  const value = {
    user,
    profile,
    loading,
    error,
    role: profile?.role || null,
    isMock: user?.id?.startsWith('dev-user-'),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => {
      if (user?.id?.startsWith('dev-user-')) {
        setUser(null)
        setProfile(null)
      } else {
        return supabase.auth.signOut()
      }
    },
    mockLogin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)