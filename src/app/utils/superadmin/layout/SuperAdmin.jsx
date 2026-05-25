"use client";
import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const SuperAdminlayout = ({ children }) => {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  return (
    <div className='min-h-screen bg-slate-50'>
      <Header
        onMobileMenu={() => setMobileOpen((v) => !v)}
        mobileOpen={mobileOpen}
      />
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main
        className={`transition-all duration-300 ease-in-out pt-[73px] ${
          collapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        <div className='p-4 sm:p-6 min-h-[calc(100vh-73px)]'>
          {children}
        </div>
      </main>
    </div>
  )
}

export default SuperAdminlayout
