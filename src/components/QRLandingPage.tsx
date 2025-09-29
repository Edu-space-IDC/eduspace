import { useState, useEffect } from 'react'
import { CheckCircle, Clock, User, AlertCircle, QrCode } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { Teacher } from '../App'
import { 
  getScheduleForGrade, 
  getTimeUntilMeal, 
  getRemainingMealTime,
  updateTeacherStatus,
  getTeacherCurrentStatus,
  autoUpdateTeacherStatuses,
  clearQRParams
} from '../utils/scheduleUtils'

interface QRLandingPageProps {
  teacher: Teacher | null
  onLogin: () => void
  onGroupSelect: (group: string) => void
  onComplete: () => void
}

export function QRLandingPage({ teacher, onLogin, onGroupSelect, onComplete }: QRLandingPageProps) {
  const [selectedGroup, setSelectedGroup] = useState(teacher?.selectedGroup || '')
  const [status, setStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [currentStatus, setCurrentStatus] = useState<any>(null)

  const grades = [
    'Párvulos', 'Pre-jardín', 'Jardín', 'Transición',
    'Primero (1°)', 'Segundo (2°)', 'Tercero (3°)', 'Cuarto (4°)', 'Quinto (5°)', 'Sexto (6°)',
    'Séptimo (7°)', 'Octavo (8°)', 'Noveno (9°)',
    'Décimo 10-1', 'Décimo 10-2', 'Décimo 10-3', 'Décimo 10-4',
    'Undécimo (11°)', 'Aceleración', 'Brújula'
  ]

  useEffect(() => {
    // Actualizar estados automáticamente
    autoUpdateTeacherStatuses()
    
    if (teacher) {
      const teacherStatus = getTeacherCurrentStatus(teacher.id)
      setCurrentStatus(teacherStatus)
    }

    // Actualizar cada minuto
    const interval = setInterval(() => {
      autoUpdateTeacherStatuses()
      if (teacher) {
        const teacherStatus = getTeacherCurrentStatus(teacher.id)
        setCurrentStatus(teacherStatus)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [teacher])

  const handleRegister = async () => {
    if (!teacher) {
      setStatus('error')
      setMessage('Debes iniciar sesión primero')
      return
    }

    const groupToUse = selectedGroup || teacher.selectedGroup
    if (!groupToUse) {
      setStatus('error')
      setMessage('Debes seleccionar un grupo primero')
      return
    }

    setStatus('registering')
    setMessage('Registrando tu entrada...')

    // Actualizar el grupo del profesor si seleccionó uno nuevo
    if (selectedGroup && selectedGroup !== teacher.selectedGroup) {
      onGroupSelect(selectedGroup)
    }

    const schedule = getScheduleForGrade(groupToUse)
    if (!schedule) {
      setStatus('error')
      setMessage('No hay horario definido para este grupo')
      return
    }

    const timeStatus = getTimeUntilMeal(groupToUse)

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      // Determinar el estado inicial basado en el horario
      let initialStatus: 'registered' | 'eating' | 'finished' = 'registered'
      
      if (timeStatus === 'En progreso') {
        initialStatus = 'eating'
      } else if (timeStatus === 'Terminado') {
        initialStatus = 'finished'
      }

      // Actualizar el estado del profesor
      updateTeacherStatus(teacher.id, teacher.name, groupToUse, initialStatus)
      
      setCurrentStatus({
        teacherId: teacher.id,
        teacherName: teacher.name,
        group: groupToUse,
        status: initialStatus,
        registeredAt: new Date().toISOString(),
        schedule
      })

      setStatus('success')
      
      let successMessage = ''
      switch (initialStatus) {
        case 'eating':
          successMessage = `¡Registrado! Ya puedes comer. Tienes hasta las ${schedule.endTime}.`
          break
        case 'finished':
          successMessage = `Registro completado, pero el horario de tu grupo (${schedule.timeSlot}) ya finalizó.`
          break
        default:
          successMessage = `¡Registrado! Tu horario es de ${schedule.timeSlot}. Te avisaremos cuando sea tu turno.`
      }
      
      setMessage(successMessage)

      // Auto-completar después de 3 segundos
      setTimeout(() => {
        clearQRParams()
        onComplete()
      }, 3000)

    } catch (error) {
      setStatus('error')
      setMessage('Error al registrar. Inténtalo de nuevo.')
    }
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-dark to-blue-dark flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-dark rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-black-soft">
              Registro de Comedor
            </CardTitle>
            <p className="text-muted-foreground">
              Inicia sesión para registrar tu entrada
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onLogin}
              className="w-full bg-purple-dark hover:bg-purple-dark/90 text-white py-3 h-auto"
            >
              <User className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Debes tener una cuenta registrada para acceder
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const schedule = selectedGroup ? getScheduleForGrade(selectedGroup) : 
                   teacher.selectedGroup ? getScheduleForGrade(teacher.selectedGroup) : null
  const timeStatus = schedule ? getTimeUntilMeal(selectedGroup || teacher.selectedGroup!) : null
  const remainingTime = schedule ? getRemainingMealTime(selectedGroup || teacher.selectedGroup!) : null

  const getStatusColor = () => {
    if (!currentStatus) return 'bg-gray-500'
    
    switch (currentStatus.status) {
      case 'eating':
        return 'bg-green-600'
      case 'finished':
        return 'bg-red-500'
      case 'registered':
        return 'bg-blue-600'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    if (!currentStatus) return 'Sin registrar'
    
    switch (currentStatus.status) {
      case 'eating':
        return 'Comiendo'
      case 'finished':
        return 'Terminado'
      case 'registered':
        return 'Registrado'
      default:
        return 'Sin registrar'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark to-blue-dark">
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <Card className="border-0 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-medium mb-2">Registro QR Comedor</h1>
              <p className="text-blue-light">
                ¡Hola, {teacher.name}!
              </p>
              <Badge className={`${getStatusColor()} text-white mt-2`}>
                {getStatusText()}
              </Badge>
            </CardContent>
          </Card>

          {/* Selección de grupo si no tiene uno */}
          {!teacher.selectedGroup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black-soft">
                  <User className="w-5 h-5 text-blue-light" />
                  Selecciona tu Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elige tu grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Información del horario */}
          {schedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black-soft">
                  <Clock className="w-5 h-5 text-blue-light" />
                  Tu Horario de Comida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-dark mb-1">
                    {schedule.timeSlot}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.description}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    30 minutos para comer
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Estado del turno</p>
                    <Badge className={`${
                      timeStatus === 'En progreso' ? 'bg-green-600' :
                      timeStatus === 'Terminado' ? 'bg-red-500' :
                      timeStatus === 'Ahora' ? 'bg-orange-500' : 'bg-blue-600'
                    } text-white`}>
                      {timeStatus === 'En progreso' ? 'Activo' :
                       timeStatus === 'Terminado' ? 'Finalizado' :
                       timeStatus === 'Ahora' ? 'Iniciando' : 
                       timeStatus || 'Pendiente'}
                    </Badge>
                  </div>
                  
                  {timeStatus === 'En progreso' && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tiempo restante</p>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {remainingTime}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado actual del profesor */}
          {currentStatus && (
            <Alert className={`${
              currentStatus.status === 'eating' ? 'border-green-200 bg-green-50' :
              currentStatus.status === 'finished' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <CheckCircle className={`h-4 w-4 ${
                currentStatus.status === 'eating' ? 'text-green-600' :
                currentStatus.status === 'finished' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <AlertDescription className={`${
                currentStatus.status === 'eating' ? 'text-green-800' :
                currentStatus.status === 'finished' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {currentStatus.status === 'eating' ? 
                  `¡Ya estás registrado como comiendo! Grupo: ${currentStatus.group}` :
                  currentStatus.status === 'finished' ?
                  `Ya completaste tu comida del grupo ${currentStatus.group}` :
                  `Ya estás registrado para el grupo ${currentStatus.group}`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Alertas de tiempo */}
          {schedule && timeStatus === 'Terminado' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                El horario de tu grupo ({schedule.timeSlot}) ya ha finalizado.
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de registro */}
          {status !== 'success' && (
            <Button
              onClick={handleRegister}
              disabled={status === 'registering' || (!selectedGroup && !teacher.selectedGroup)}
              className="w-full bg-purple-dark hover:bg-purple-dark/90 text-white py-4 h-auto text-lg font-medium shadow-lg"
            >
              {status === 'registering' ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {currentStatus ? 'Actualizar Registro' : 'Registrar Entrada'}
                </>
              )}
            </Button>
          )}

          {/* Mensaje de estado */}
          {message && (
            <Alert className={`${
              status === 'success' 
                ? 'border-green-200 bg-green-50' 
                : status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-blue-200 bg-blue-50'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={`${
                status === 'success' 
                  ? 'text-green-800' 
                  : status === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de finalizar si ya registró */}
          {status === 'success' && (
            <Button
              onClick={() => {
                clearQRParams()
                onComplete()
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-auto"
            >
              Continuar a la App
            </Button>
          )}

          {/* Información adicional */}
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-white">
              <h3 className="font-medium mb-2">Información Importante</h3>
              <div className="text-sm space-y-1 opacity-90">
                <p>• Cada grupo tiene exactamente 30 minutos para comer</p>
                <p>• Tu estado se actualiza automáticamente según el horario</p>
                <p>• Puedes registrarte antes, durante o después de tu horario</p>
                <p>• El sistema registra tu hora de entrada automáticamente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}