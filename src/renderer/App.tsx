import type { ReactElement } from 'react'
import { Toolbar } from './components/layout/Toolbar'
import { MainLayout } from './components/layout/MainLayout'
import { StatusBar } from './components/layout/StatusBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function App(): ReactElement {
  useKeyboardShortcuts()

  return (
    <div className="app">
      <Toolbar />
      <MainLayout />
      <StatusBar />
    </div>
  )
}
