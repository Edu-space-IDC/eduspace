import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface ScheduleItem {
  id: string
  day: string
  meal: string
  startTime: string
  endTime: string
  capacity: number
}

export function ScheduleView() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { id: '1', day: 'Lunes', meal: 'Desayuno', startTime: '07:00', endTime: '09:00', capacity: 150 },
    { id: '2', day: 'Lunes', meal: 'Almuerzo', startTime: '12:00', endTime: '14:30', capacity: 300 },
    { id: '3', day: 'Lunes', meal: 'Cena', startTime: '18:00', endTime: '20:00', capacity: 200 },
    { id: '4', day: 'Martes', meal: 'Desayuno', startTime: '07:00', endTime: '09:00', capacity: 150 },
    { id: '5', day: 'Martes', meal: 'Almuerzo', startTime: '12:00', endTime: '14:30', capacity: 300 },
  ])

  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const meals = ['Desayuno', 'Almuerzo', 'Cena']

  const handleAddSchedule = () => {
    if (newSchedule.day && newSchedule.meal && newSchedule.startTime && newSchedule.endTime) {
      const schedule: ScheduleItem = {
        id: Date.now().toString(),
        day: newSchedule.day,
        meal: newSchedule.meal,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        capacity: newSchedule.capacity || 100
      }
      setSchedules([...schedules, schedule])
      setNewSchedule({})
      setIsDialogOpen(false)
    }
  }

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id))
  }

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) acc[schedule.day] = []
    acc[schedule.day].push(schedule)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1>Horarios de Comidas</h1>
          <p className="text-muted-foreground">
            Gestiona los horarios semanales del restaurante
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Horario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Día</Label>
                <Select onValueChange={(value) => setNewSchedule({...newSchedule, day: value})}>
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
              
              <div>
                <Label>Comida</Label>
                <Select onValueChange={(value) => setNewSchedule({...newSchedule, meal: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comida" />
                  </SelectTrigger>
                  <SelectContent>
                    {meals.map(meal => (
                      <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={newSchedule.startTime || ''}
                    onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={newSchedule.endTime || ''}
                    onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newSchedule.capacity || ''}
                  onChange={(e) => setNewSchedule({...newSchedule, capacity: parseInt(e.target.value)})}
                />
              </div>
              
              <Button onClick={handleAddSchedule} className="w-full">
                Agregar Horario
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
                  {groupedSchedules[day]?.length || 0} comidas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedSchedules[day]?.map(schedule => (
                  <div key={schedule.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={
                        schedule.meal === 'Desayuno' ? 'default' :
                        schedule.meal === 'Almuerzo' ? 'secondary' : 'outline'
                      }>
                        {schedule.meal}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Horario:</strong> {schedule.startTime} - {schedule.endTime}</p>
                      <p><strong>Capacidad:</strong> {schedule.capacity} personas</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    No hay horarios programados
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