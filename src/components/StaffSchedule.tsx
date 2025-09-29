import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Edit2, Trash2, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface StaffMember {
  id: string
  name: string
  role: string
  day: string
  startTime: string
  endTime: string
  phone: string
}

export function StaffSchedule() {
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'María González',
      role: 'Jefa de Cocina',
      day: 'Lunes',
      startTime: '06:00',
      endTime: '14:00',
      phone: '666-123-456'
    },
    {
      id: '2',
      name: 'Carlos Ruiz',
      role: 'Cocinero',
      day: 'Lunes',
      startTime: '07:00',
      endTime: '15:00',
      phone: '666-234-567'
    },
    {
      id: '3',
      name: 'Ana Martín',
      role: 'Ayudante de Cocina',
      day: 'Lunes',
      startTime: '08:00',
      endTime: '16:00',
      phone: '666-345-678'
    },
    {
      id: '4',
      name: 'Luis Pérez',
      role: 'Personal de Limpieza',
      day: 'Lunes',
      startTime: '14:00',
      endTime: '22:00',
      phone: '666-456-789'
    },
    {
      id: '5',
      name: 'María González',
      role: 'Jefa de Cocina',
      day: 'Martes',
      startTime: '06:00',
      endTime: '14:00',
      phone: '666-123-456'
    }
  ])

  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const roles = [
    'Jefa de Cocina',
    'Cocinero',
    'Ayudante de Cocina',
    'Personal de Limpieza',
    'Camarero/a',
    'Supervisor'
  ]

  const handleAddStaff = () => {
    if (newStaff.name && newStaff.role && newStaff.day && newStaff.startTime && newStaff.endTime) {
      const staffMember: StaffMember = {
        id: Date.now().toString(),
        name: newStaff.name,
        role: newStaff.role,
        day: newStaff.day,
        startTime: newStaff.startTime,
        endTime: newStaff.endTime,
        phone: newStaff.phone || ''
      }
      setStaff([...staff, staffMember])
      setNewStaff({})
      setIsDialogOpen(false)
    }
  }

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter(s => s.id !== id))
  }

  const groupedStaff = staff.reduce((acc, member) => {
    if (!acc[member.day]) acc[member.day] = []
    acc[member.day].push(member)
    return acc
  }, {} as Record<string, StaffMember[]>)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Jefa de Cocina': return 'default'
      case 'Cocinero': return 'secondary'
      case 'Ayudante de Cocina': return 'outline'
      case 'Personal de Limpieza': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1>Turnos de Personal</h1>
          <p className="text-muted-foreground">
            Gestiona los horarios del equipo del restaurante
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Turno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Empleado</Label>
                <Input
                  placeholder="Ej: María García"
                  value={newStaff.name || ''}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Puesto</Label>
                <Select onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Día</Label>
                <Select onValueChange={(value) => setNewStaff({...newStaff, day: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Entrada</Label>
                  <Input
                    type="time"
                    value={newStaff.startTime || ''}
                    onChange={(e) => setNewStaff({...newStaff, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora Salida</Label>
                  <Input
                    type="time"
                    value={newStaff.endTime || ''}
                    onChange={(e) => setNewStaff({...newStaff, endTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Teléfono (opcional)</Label>
                <Input
                  placeholder="666-123-456"
                  value={newStaff.phone || ''}
                  onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                />
              </div>
              
              <Button onClick={handleAddStaff} className="w-full">
                Agregar Turno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {days.map(day => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {day}
                <Badge variant="outline">
                  {groupedStaff[day]?.length || 0} empleados
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedStaff[day]?.map(member => (
                  <div key={member.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Horario:</strong> {member.startTime} - {member.endTime}</p>
                      {member.phone && (
                        <p><strong>Teléfono:</strong> {member.phone}</p>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    No hay turnos programados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}