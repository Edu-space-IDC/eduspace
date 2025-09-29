import { Calendar, Clock, Users, ChefHat, BarChart3 } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from './ui/utils'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'menu', label: 'Menús', icon: ChefHat },
    { id: 'staff', label: 'Personal', icon: Users },
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-medium">Restaurante Escolar</h1>
            <p className="text-sm text-muted-foreground">Gestión de Horarios</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  activeView === item.id && 'bg-secondary'
                )}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}