import React from 'react'
import { Search, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const TopBar = () => {
  const location = useLocation()
  
  // Simple breadcrumb logic
  const path = location.pathname.split('/').filter(Boolean)
  const breadcrumb = path.length > 0 
    ? path[path.length - 1].charAt(0).toUpperCase() + path[path.length - 1].slice(1)
    : 'Overview'

  return (
    <header className="h-20 border-b border-border-subtle flex items-center justify-between px-10 sticky top-0 z-20 bg-canvas/80 backdrop-blur-md">
      <div>
        <p className="text-micro text-fg-tertiary uppercase tracking-widest mb-0.5">Navigation</p>
        <h2 className="text-h3">{breadcrumb}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary group-focus-within:text-accent-glow transition-colors" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-surface-inset border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-4 focus:ring-accent-glow/5 transition-all w-64"
          />
        </div>

        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-raised transition-colors border border-border-subtle">
          <Bell className="w-5 h-5 text-fg-secondary" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent-glow rounded-full"></span>
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-glow to-violet-900 border border-accent-glow/20 flex items-center justify-center text-fg-primary font-bold shadow-lg shadow-accent-glow/10">
          U
        </div>
      </div>
    </header>
  )
}

export default TopBar
