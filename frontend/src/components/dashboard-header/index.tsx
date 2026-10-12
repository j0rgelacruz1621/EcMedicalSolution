import type { ReactNode } from 'react'
import './style.scss'

type DashboardHeaderProps = {
  title: string
  centerContent?: ReactNode
  children: ReactNode
}

export default function DashboardHeader({
  title,
  centerContent,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <h1>{title}</h1>
      <div className="dashboard-header__center">{centerContent}</div>
      <div className="dashboard-header__actions">{children}</div>
    </header>
  )
}
