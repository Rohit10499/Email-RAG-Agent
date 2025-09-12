import React from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Logs from './pages/Logs'
import History from './pages/History'
import Escalations from './pages/Escalations'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import {SidebarLogic} from './pages/Sidebar'


const navItems = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Logs', path: '/logs', icon: '🕑' },
  { name: 'History', path: '/history', icon: '📂' },
  { name: 'Escalations', path: '/escalations', icon: '🚨' },
  { name: 'Analytics', path: '/analytics', icon: '📈' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
]

function App() {
  return <SidebarLogic />
}

export default App
