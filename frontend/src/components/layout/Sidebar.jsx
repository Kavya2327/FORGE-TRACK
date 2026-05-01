import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  UserCheck, 
  Calendar,
  LogOut 
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const { role, profile, signOut } = useAuth()

  const mentorLinks = [
    { label: 'Overview', items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]},
    { label: 'Activity', items: [
      { to: '/attendance', label: 'Mark Attendance', icon: CheckSquare },
      { to: '/history', label: 'Student History', icon: Users },
      { to: '/materials', label: 'Materials', icon: BookOpen },
    ]},
    { label: 'Data', items: [
      { to: '/upload', label: 'Upload CSV', icon: Upload }
    ]}
  ]

  const studentLinks = [
    { label: 'Overview', items: [
      { to: '/me/attendance', label: 'My Attendance', icon: UserCheck },
      { to: '/me/upcoming', label: 'Upcoming', icon: Calendar },
      { to: '/me/materials', label: 'Materials', icon: BookOpen },
    ]}
  ]

  const links = role === 'mentor' ? mentorLinks : studentLinks

  const NavItem = ({ to, label, icon: Icon }) => (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group relative
        ${isActive 
          ? 'bg-surface-raised text-fg-primary' 
          : 'text-fg-secondary hover:text-fg-primary hover:bg-surface/50'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 stroke-[1.75px] ${isActive ? 'text-accent-glow' : 'text-fg-secondary group-hover:text-fg-primary'}`} />
          <span className="text-body font-medium">{label}</span>
          {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent-glow rounded-full"></div>}
        </>
      )}
    </NavLink>
  )

  return (
    <aside className="w-[260px] h-screen border-r border-border-subtle flex flex-col sticky top-0 bg-canvas">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-accent-glow/10 border border-accent-glow/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-h3 tracking-tight">ForgeTrack</span>
        </div>

        <div className="p-4 bg-surface-raised rounded-xl mb-8 border border-border-subtle">
          <p className="text-micro text-fg-tertiary mb-1">Welcome Back</p>
          <p className="text-body font-semibold truncate">{profile?.display_name || 'User'}</p>
          <p className="text-[10px] text-accent-glow uppercase tracking-wider font-bold mt-1">
            {role === 'mentor' ? 'Lead Mentor' : 'Student'}
          </p>
        </div>

        <nav className="space-y-8">
          {links.map((section) => (
            <div key={section.label}>
              <p className="text-label text-fg-tertiary mb-4 px-4">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border-subtle">
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-fg-secondary hover:text-danger hover:bg-danger-bg/20 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 stroke-[1.75px] group-hover:text-danger" />
          <span className="text-body font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
