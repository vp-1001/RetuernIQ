import { useState } from "react"
import { Outlet } from "react-router-dom"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white lg:flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="relative flex-1 overflow-x-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-950/20" />

          <div className="relative mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 xl:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
