import { Home, Users, User, Shield } from 'lucide-react'
import { Button } from './ui/button'
import { type View } from '../utils/types'

interface NavigationProps {
  activeView: View
  onViewChange: (view: View) => void
  userRole: 'teacher' | 'admin'
}

export function Navigation({ activeView, onViewChange, userRole }: NavigationProps) {
  const navItems = [
    { id: 'dashboard' as View, label: 'Inicio', icon: Home },
    { id: 'teachers' as View, label: 'Maestros', icon: Users },
    { id: 'profile' as View, label: 'Perfil', icon: User },
  ]

  // Agregar panel de admin si es administrador
  if (userRole === 'admin') {
    navItems.push({ id: 'admin' as View, label: 'Admin', icon: Shield })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const Icon = item.icon
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive 
                    ? 'text-purple-dark bg-purple-dark/10' 
                    : 'text-muted-foreground hover:text-purple-dark hover:bg-purple-dark/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-purple-dark' : 'text-muted-foreground'
                }`} />
                <span className={`text-xs ${
                  isActive ? 'text-purple-dark font-medium' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}