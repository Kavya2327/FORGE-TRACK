import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error) setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  useEffect(() => {
    console.log('AuthContext mounted') // ← tells us if this runs

    const timeout = setTimeout(() => {
      console.log('Timeout fired — forcing loading false') // ← tells us if stuck
      setLoading(false)
    }, 3000)

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session) // ← tells us if Supabase responds
      clearTimeout(timeout)
      setUser(session?.user || null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      listener?.subscription.unsubscribe()
    }
  }, [])
  const timeout = setTimeout(() => {
    console.log('Timeout fired — forcing loading false')
    setLoading(false)
  }, 8000) // ← increased from 3000 to 8000

  const value = {
    user,
    profile,
    loading,
    role: profile?.role || null,
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)