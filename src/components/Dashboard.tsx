import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Calendar, Clock, Users, ChefHat } from 'lucide-react'
import { Badge } from './ui/badge'

export function Dashboard() {
  const todayMenu = {
    breakfast: 'Cereales con leche, tostadas integrales, fruta',
    lunch: 'Pollo asado con verduras, arroz, ensalada mixta',
    dinner: 'Sopa de verduras, pasta con queso, yogur'
  }

  const stats = [
    { title: 'Comidas Programadas Hoy', value: '3', icon: ChefHat, color: 'text-blue-600' },
    { title: 'Personal en Turno', value: '8', icon: Users, color: 'text-green-600' },
    { title: 'Próxima Comida', value: '1:00 p.m', icon: Clock, color: 'text-orange-600' },
    { title: 'Capacidad Ocupada', value: '85%', icon: Calendar, color: 'text-purple-600' }
  ]

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general del restaurante escolar
          </p>
        </div>
        <Badge variant="secondary">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Menú de Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Desayuno</Badge>
                <span className="text-sm">7:00 - 9:00 AM</span>
              </div>
              <p className="text-sm text-muted-foreground">{todayMenu.breakfast}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Almuerzo</Badge>
                <span className="text-sm">12:00 - 2:30 PM</span>
              </div>
              <p className="text-sm text-muted-foreground">{todayMenu.lunch}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Cena</Badge>
                <span className="text-sm">6:00 - 8:00 PM</span>
              </div>
              <p className="text-sm text-muted-foreground">{todayMenu.dinner}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal en Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'María González', role: 'Jefa de Cocina', time: '6:00 - 14:00' },
                { name: 'Carlos Ruiz', role: 'Cocinero', time: '7:00 - 15:00' },
                { name: 'Ana Martín', role: 'Ayudante', time: '8:00 - 16:00' },
                { name: 'Luis Pérez', role: 'Limpieza', time: '14:00 - 22:00' }
              ].map((staff, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-sm text-muted-foreground">{staff.role}</p>
                  </div>
                  <Badge variant="secondary">{staff.time}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}