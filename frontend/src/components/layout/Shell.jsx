import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const Shell = () => {
  return (
    <div className="flex min-h-screen bg-canvas text-fg-primary">
      {/* Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 p-10 overflow-y-auto relative">
          {/* Cosmic Glow Overlay */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-glow/10 blur-[140px] rounded-full -translate-y-1/2 pointer-events-none"></div>
          
          {/* Content Wrapper */}
          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Shell
