import type { ReactElement } from 'react'
import { Toolbar } from './components/layout/Toolbar'
import { MainLayout } from './components/layout/MainLayout'
import { StatusBar } from './components/layout/StatusBar'

export function App(): ReactElement {
  return (
    <div className="app">
      <Toolbar />
      <MainLayout />
      <StatusBar />
    </div>
  )
}
