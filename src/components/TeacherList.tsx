import { useEffect, useState } from 'react'
import { User, Clock, CheckCircle, RefreshCw, Database, Timer, PlayCircle, StopCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Alert, AlertDescription } from './ui/alert'
import { UserAvatar } from './UserAvatar'
import { 
  getTodayMealRecords, 
  getAllGrades, 
  calculateTeacherStatus,
  getRemainingTimeInMinutes,
  getGradeDurationInMinutes,
  getAllTeachers,
  formatDateTimeWithAmPm,
  formatTimeWithAmPm,
  type MealRecord, 
  type Grade,
  type Teacher
} from '../utils/unifiedDatabase'

// Tipo para registro extendido con información del grado
interface ExtendedMealRecord extends MealRecord {
  grade?: Grade
  timeInMinutes: number
  remainingMinutes: number
  registeredAt: Date
  enteredAt?: Date
}

interface StatusCounts {
  registered: number
  eating: number
  finished: number
}

export function TeacherList() {
  const [records, setRecords] = useState<ExtendedMealRecord[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    registered: 0,
    eating: 0,
    finished: 0
  })

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return '??'
    
    const words = name.trim().split(' ').filter(word => word.length > 0)
    if (words.length === 0) return '??'
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  // Función para formatear tiempo de manera segura
  const formatTime = (date: Date | string): string => {
    try {
      let validDate: Date
      
      if (date instanceof Date) {
        validDate = date
      } else if (typeof date === 'string') {
        validDate = new Date(date)
      } else {
        return '--:--'
      }

      // Verificar si la fecha es válida
      if (isNaN(validDate.getTime())) {
        return '--:--'
      }

      return formatDateTimeWithAmPm(validDate.toISOString())
    } catch (error) {
      console.error('Error formateando tiempo:', error)
      return '--:--'
    }
  }

  // Función para formatear tiempo restante
  const formatRemainingTime = (minutes: number): string => {
    if (minutes <= 0) return 'Terminado'
    if (minutes === 1) return '1 min'
    return `${minutes} min`
  }

  // Función para obtener badge del estado con colores y iconos apropiados
  const getStatusBadge = (status: MealRecord['status'], remainingMinutes?: number) => {
    switch (status) {
      case 'registered':
        return (
          <Badge className="bg-blue-light text-white">
            <PlayCircle className="w-3 h-3 mr-1" />
            Registrado
          </Badge>
        )
      case 'eating':
        return (
          <Badge className="bg-green-600 text-white">
            <Timer className="w-3 h-3 mr-1" />
            Comiendo {remainingMinutes ? `(${formatRemainingTime(remainingMinutes)})` : ''}
          </Badge>
        )
      case 'finished':
        return (
          <Badge className="bg-gray-600 text-white">
            <StopCircle className="w-3 h-3 mr-1" />
            Terminado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Desconocido
          </Badge>
        )
    }
  }

  // Función para obtener foto de perfil desde localStorage
  const getProfilePhoto = (teacherId: string): string | null => {
    return localStorage.getItem(`profile_photo_${teacherId}`)
  }

  // Función para cargar y procesar datos
  const loadData = async () => {
    try {
      setError('')
      
      // Cargar datos en paralelo
      const [mealRecords, allGrades, allTeachers] = await Promise.all([
        getTodayMealRecords(),
        getAllGrades(),
        getAllTeachers()
      ])

      if (!Array.isArray(mealRecords)) {
        throw new Error('Los registros de comidas no son válidos')
      }

      if (!Array.isArray(allGrades)) {
        throw new Error('Los grados no son válidos')
      }

      const currentTime = new Date()
      const activeGrades = allGrades.filter(g => g.isActive)
      
      // Procesar registros y calcular estados dinámicamente
      const processedRecords: ExtendedMealRecord[] = mealRecords
        .filter(record => {
          // Validar que el registro tiene los campos necesarios
          return record && 
                 record.id && 
                 record.teacherName && 
                 record.registeredAt && 
                 record.selectedGroup
        })
        .map(record => {
          const grade = activeGrades.find(g => g.name === record.selectedGroup)
          const registeredAt = new Date(record.registeredAt)
          const enteredAt = record.enteredAt ? new Date(record.enteredAt) : undefined
          
          // Calcular estado actual usando la nueva lógica
          const currentStatus = calculateTeacherStatus(record, grade, currentTime)
          
          // Calcular tiempo transcurrido y restante
          let timeInMinutes = 0
          let remainingMinutes = 0
          
          if (enteredAt) {
            timeInMinutes = Math.floor((currentTime.getTime() - enteredAt.getTime()) / (1000 * 60))
            remainingMinutes = getRemainingTimeInMinutes(record, grade)
          } else {
            timeInMinutes = Math.floor((currentTime.getTime() - registeredAt.getTime()) / (1000 * 60))
          }

          return {
            ...record,
            status: currentStatus, // Actualizar estado calculado
            grade,
            timeInMinutes: Math.max(0, timeInMinutes),
            remainingMinutes: Math.max(0, remainingMinutes),
            registeredAt,
            enteredAt
          }
        })
        .sort((a, b) => {
          // Ordenar por prioridad: eating > registered > finished
          const statusPriority = { eating: 1, registered: 2, finished: 3 }
          if (a.status !== b.status) {
            return statusPriority[a.status] - statusPriority[b.status]
          }
          // Luego por tiempo (más recientes primero)
          return b.registeredAt.getTime() - a.registeredAt.getTime()
        })

      // Calcular conteos por estado
      const counts: StatusCounts = {
        registered: processedRecords.filter(r => r.status === 'registered').length,
        eating: processedRecords.filter(r => r.status === 'eating').length,
        finished: processedRecords.filter(r => r.status === 'finished').length
      }

      setRecords(processedRecords)
      setGrades(activeGrades)
      setStatusCounts(counts)
      setLastUpdate(new Date())

    } catch (error) {
      console.error('Error cargando datos:', error)
      setError(error instanceof Error ? error.message : 'Error cargando los datos')
      
      // Establecer valores por defecto en caso de error
      setRecords([])
      setGrades([])
      setStatusCounts({ registered: 0, eating: 0, finished: 0 })
    } finally {
      setLoading(false)
    }
  }

  // Agrupar registros por grupo/grado
  const groupedRecords = records.reduce((acc, record) => {
    const groupName = record.selectedGroup || 'Sin Grupo'
    if (!acc[groupName]) {
      acc[groupName] = []
    }
    acc[groupName].push(record)
    return acc
  }, {} as Record<string, ExtendedMealRecord[]>)

  // Efecto para cargar datos inicialmente
  useEffect(() => {
    loadData()
  }, [])

  // Efecto para actualización automática cada 10 segundos (más frecuente para el conteo regresivo)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 10000) // 10 segundos para actualizar conteo regresivo

    return () => clearInterval(interval)
  }, [])

  // Función de actualización manual
  const handleRefresh = () => {
    setLoading(true)
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-[rgba(0,5,228,1)]">
          <div className="w-12 h-12 border-4 border-purple-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando registros de profesores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-purple-dark text-white px-6 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-medium text-white">
                Lista de Profesores
              </h1>
              <p className="text-blue-light text-sm">
                Estados: Registrado → Comiendo → Terminado
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-white hover:bg-white/10 p-2 h-auto"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Conteo total */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Total profesores hoy:</span>
              <span className="text-white font-medium">{records.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <Database className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Estadísticas con 3 estados */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-light">
                  {statusCounts.registered}
                </div>
                <p className="text-xs text-muted-foreground">Registrados</p>
                <p className="text-xs text-muted-foreground mt-1">Esperando turno</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {statusCounts.eating}
                </div>
                <p className="text-xs text-muted-foreground">Comiendo</p>
                <p className="text-xs text-muted-foreground mt-1">Con conteo regresivo</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {statusCounts.finished}
                </div>
                <p className="text-xs text-muted-foreground">Terminados</p>
                <p className="text-xs text-muted-foreground mt-1">Tiempo cumplido</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de profesores agrupados por grupo */}
          {Object.keys(groupedRecords).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedRecords)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([group, groupRecords]) => (
                <Card key={group}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-black-soft">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-light" />
                        {group}
                      </div>
                      <Badge variant="outline">
                        {groupRecords.length} profesor{groupRecords.length !== 1 ? 'es' : ''}
                      </Badge>
                    </CardTitle>
                    {/* Mostrar horario del grupo si existe */}
                    {groupRecords[0]?.grade && (
                      <div className="text-sm text-muted-foreground">
                        <p>Horario: {formatTimeWithAmPm(groupRecords[0].grade.scheduleStart)} - {formatTimeWithAmPm(groupRecords[0].grade.scheduleEnd)}</p>
                        <p>Duración: {getGradeDurationInMinutes(groupRecords[0].grade)} minutos</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {groupRecords.map((record) => {
                        const profilePhoto = getProfilePhoto(record.teacherId)
                        return (
                          <div 
                            key={record.id} 
                            className={`p-3 rounded-lg transition-all ${
                              record.status === 'eating' ? 'bg-green-50 border border-green-200' :
                              record.status === 'finished' ? 'bg-gray-50 border border-gray-200' :
                              'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                  {profilePhoto ? (
                                    <img 
                                      src={profilePhoto} 
                                      alt={`Foto de ${record.teacherName}`} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-white font-medium ${
                                      record.status === 'eating' ? 'bg-green-600' :
                                      record.status === 'finished' ? 'bg-gray-500' :
                                      'bg-blue-light'
                                    }`}>
                                      {getInitials(record.teacherName)}
                                    </div>
                                  )}
                                </div>
                                
                                <div>
                                  <p className="font-medium text-black-soft text-sm">
                                    {record.teacherName || 'Nombre no disponible'}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {record.status === 'registered' ? 
                                        `Registrado: ${formatTime(record.registeredAt)}` :
                                        record.enteredAt ? 
                                          `Entró: ${formatTime(record.enteredAt)}` :
                                          `Registrado: ${formatTime(record.registeredAt)}`
                                      }
                                    </div>
                                    {record.teacherCode && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono">{record.teacherCode}</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Información adicional según el estado */}
                                  {record.status === 'eating' && record.remainingMinutes > 0 && (
                                    <div className="mt-1 text-xs">
                                      <span className="text-green-700 font-medium">
                                        ⏱️ Le quedan {formatRemainingTime(record.remainingMinutes)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {record.status === 'finished' && (
                                    <div className="mt-1 text-xs">
                                      <span className="text-gray-600">
                                        ✅ Tiempo de comida completado
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                {getStatusBadge(record.status, record.remainingMinutes)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Aún no hay profesores registrados hoy
                </p>
                <p className="text-sm text-muted-foreground">
                  Los profesores aparecerán aquí cuando elijan su grupo y pongan su código personal
                </p>
              </CardContent>
            </Card>
          )}

          {/* Información de actualización */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-black-soft">
                    Sistema en tiempo real con conteo regresivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Última actualización: {formatTime(lastUpdate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se actualiza automáticamente cada 10 segundos para mostrar el tiempo restante
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del sistema mejorada */}
          <Card className="bg-blue-light/5 border-blue-light/20">
            <CardContent className="p-4">
              <h3 className="font-medium text-black-soft mb-2">
                Flujo de Estados del Sistema
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-blue-light" />
                  <div>
                    <strong>1. Registrado:</strong> Maestro eligió su grupo, esperando a poner código personal
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-green-600" />
                  <div>
                    <strong>2. Comiendo:</strong> Maestro puso código, conteo regresivo activo por duración del grupo
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StopCircle className="w-4 h-4 text-gray-600" />
                  <div>
                    <strong>3. Terminado:</strong> Se acabó el tiempo asignado, puede retirarse del comedor
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Transición automática:</strong> Los estados cambian automáticamente según las acciones del maestro y el tiempo transcurrido. El conteo regresivo es específico para cada grupo según su duración asignada.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}