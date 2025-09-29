import { useState, useEffect } from 'react'
import { 
  Trash2, Clock, User, AlertCircle, CheckCircle, RefreshCw,
  Calendar, Badge as BadgeIcon
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { UserAvatar } from './UserAvatar'
import { 
  getTodayMealRecords,
  deleteMealRecord,
  deleteStudentAttendanceRecordsByTeacherAndDate,
  getAllGrades,
  getLocalDateString,
  formatTimeWithAmPm,
  formatDateTimeWithAmPm,
  formatDateLong,
  calculateTeacherStatus,
  getRemainingTimeInMinutes,
  getCategoryDisplayName,
  type Teacher, 
  type MealRecord,
  type Grade
} from '../utils/unifiedDatabase'

interface MealRecordsManagerProps {
  currentTeacher: Teacher
}

export function MealRecordsManager({ currentTeacher }: MealRecordsManagerProps) {
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [allGrades, setAllGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadData()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadData(false)
      setCurrentTime(new Date())
    }, 30000)

    // Actualizar hora cada segundo para los timers
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [])

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
        console.log('🔄 Actualizando registros de comida...')
      }
      
      // Forzar recarga completa de datos desde la base de datos
      const [records, grades] = await Promise.all([
        getTodayMealRecords().then(data => {
          console.log('✅ Registros de comida actualizados:', data.length, 'registros')
          return data
        }),
        getAllGrades().then(data => {
          console.log('✅ Grados actualizados:', data.length, 'grados')
          return data
        })
      ])
      
      // Actualizar estados con datos frescos
      setMealRecords(records)
      setAllGrades(grades)
      
      // Log de actualización exitosa
      if (showLoading) {
        console.log('✅ Datos de registros actualizados correctamente')
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error)
      
      // Solo mostrar mensaje si es una carga visible
      if (showLoading) {
        showMessage('❌ Error al cargar los datos. Verifica tu conexión e inténtalo de nuevo.', 'error')
      }
      
      // Re-throw para manejo del botón
      throw error
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleDeleteRecord = async (recordId: string, teacherName: string, group: string) => {
    // Si es maestro normal, solo puede eliminar sus propios registros
    if (currentTeacher.role !== 'admin') {
      const record = mealRecords.find(r => r.id === recordId)
      if (record && record.teacherId !== currentTeacher.id) {
        showMessage('Solo puedes eliminar tus propios registros', 'error')
        return
      }
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el registro de ${teacherName} para ${group}?\n\nEsto también eliminará cualquier registro de asistencia de estudiantes asociado.`)) {
      return
    }

    try {
      console.log(`🗑️ Eliminando registro de comida: ${recordId}`)
      
      // Obtener el registro para conseguir la información necesaria para eliminar asistencia
      const record = mealRecords.find(r => r.id === recordId)
      if (!record) {
        showMessage('Registro no encontrado', 'error')
        return
      }

      // Buscar el grado para obtener el gradeId
      const grade = allGrades.find(g => g.name === record.selectedGroup)
      if (grade) {
        console.log(`🗑️ Eliminando registros de asistencia relacionados para maestro ${record.teacherId}, grado ${grade.id}, fecha ${record.date}`)
        
        // Eliminar registros de asistencia de estudiantes relacionados
        const deletedAttendanceCount = await deleteStudentAttendanceRecordsByTeacherAndDate(
          record.teacherId,
          grade.id,
          record.date
        )
        
        if (deletedAttendanceCount > 0) {
          console.log(`✅ ${deletedAttendanceCount} registros de asistencia eliminados`)
        }
      }
      
      // Eliminar el registro de comida
      await deleteMealRecord(recordId)
      
      // Actualizar la lista local
      setMealRecords(prev => prev.filter(record => record.id !== recordId))
      
      showMessage(`✅ Registro de ${teacherName} eliminado correctamente`, 'success')
      console.log(`✅ Registro eliminado exitosamente: ${teacherName} - ${group}`)
      
    } catch (error) {
      console.error('❌ Error eliminando registro:', error)
      showMessage('Error al eliminar el registro. Inténtalo de nuevo.', 'error')
    }
  }

  const handleDeleteAllMyRecords = async () => {
    if (myRecords.length === 0) {
      showMessage('No tienes registros para eliminar', 'info')
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar TODOS tus ${myRecords.length} registros de hoy?\n\nEsto también eliminará todos tus registros de asistencia de estudiantes asociados.\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      let totalAttendanceDeleted = 0;
      
      // Eliminar todos los registros del profesor uno por uno junto con su asistencia
      for (const record of myRecords) {
        // Buscar el grado para obtener el gradeId
        const grade = allGrades.find(g => g.name === record.selectedGroup)
        if (grade) {
          console.log(`🗑️ Eliminando registros de asistencia relacionados para grado ${grade.id}, fecha ${record.date}`)
          
          // Eliminar registros de asistencia de estudiantes relacionados
          const deletedAttendanceCount = await deleteStudentAttendanceRecordsByTeacherAndDate(
            record.teacherId,
            grade.id,
            record.date
          )
          
          totalAttendanceDeleted += deletedAttendanceCount
        }
        
        // Eliminar el registro de comida
        await deleteMealRecord(record.id)
      }
      
      // Actualizar la lista local
      setMealRecords(prev => prev.filter(record => record.teacherId !== currentTeacher.id))
      
      let successMessage = `✅ Todos tus registros (${myRecords.length}) han sido eliminados`
      if (totalAttendanceDeleted > 0) {
        successMessage += ` junto con ${totalAttendanceDeleted} registros de asistencia`
      }
      
      showMessage(successMessage, 'success')
      console.log(`✅ ${myRecords.length} registros de comida y ${totalAttendanceDeleted} registros de asistencia eliminados`)
      
    } catch (error) {
      console.error('❌ Error eliminando registros:', error)
      showMessage('Error al eliminar algunos registros. Inténtalo de nuevo.', 'error')
    }
  }

  const handleDeleteAllRecords = async () => {
    if (mealRecords.length === 0) {
      showMessage('No hay registros para eliminar', 'info')
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar TODOS los ${mealRecords.length} registros de hoy?\n\nEsto también eliminará TODOS los registros de asistencia de estudiantes asociados.\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      let totalAttendanceDeleted = 0;
      const recordCount = mealRecords.length;
      
      // Eliminar todos los registros uno por uno junto con su asistencia
      for (const record of mealRecords) {
        // Buscar el grado para obtener el gradeId
        const grade = allGrades.find(g => g.name === record.selectedGroup)
        if (grade) {
          console.log(`🗑️ Eliminando registros de asistencia relacionados para maestro ${record.teacherId}, grado ${grade.id}, fecha ${record.date}`)
          
          // Eliminar registros de asistencia de estudiantes relacionados
          const deletedAttendanceCount = await deleteStudentAttendanceRecordsByTeacherAndDate(
            record.teacherId,
            grade.id,
            record.date
          )
          
          totalAttendanceDeleted += deletedAttendanceCount
        }
        
        // Eliminar el registro de comida
        await deleteMealRecord(record.id)
      }
      
      // Limpiar la lista local
      setMealRecords([])
      
      let successMessage = `✅ Todos los registros (${recordCount}) han sido eliminados`
      if (totalAttendanceDeleted > 0) {
        successMessage += ` junto con ${totalAttendanceDeleted} registros de asistencia`
      }
      
      showMessage(successMessage, 'success')
      console.log(`✅ ${recordCount} registros de comida y ${totalAttendanceDeleted} registros de asistencia eliminados`)
      
    } catch (error) {
      console.error('❌ Error eliminando registros:', error)
      showMessage('Error al eliminar algunos registros. Inténtalo de nuevo.', 'error')
    }
  }

  const getStatusBadge = (record: MealRecord) => {
    const grade = allGrades.find(g => g.name === record.selectedGroup)
    const status = calculateTeacherStatus(record, grade, currentTime)
    const remainingTime = getRemainingTimeInMinutes(record, grade)

    switch (status) {
      case 'registered':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En fila</Badge>
      case 'eating':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">Comiendo</Badge>
            {remainingTime > 0 && (
              <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                {remainingTime} min
              </Badge>
            )}
          </div>
        )
      case 'finished':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Terminado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desconocido</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return formatDateTimeWithAmPm(dateString)
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return dateString
    }
  }

  // Separar registros del maestro actual y otros
  const myRecords = mealRecords.filter(record => record.teacherId === currentTeacher.id)
  const otherRecords = mealRecords.filter(record => record.teacherId !== currentTeacher.id)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Cargando registros...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensajes */}
      {message && (
        <Alert className={`${
          messageType === 'success' ? 'border-green-200 bg-green-50' :
          messageType === 'error' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : messageType === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={`${
            messageType === 'success' ? 'text-green-800' :
            messageType === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeIcon className="w-5 h-5 text-purple-primary" />
            Gestión de Registros de Comida
            <Badge variant="secondary" className="ml-2">
              {formatDateLong(getLocalDateString())}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-primary">{mealRecords.length}</p>
              <p className="text-sm text-muted-foreground">Total Registros</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {mealRecords.filter(r => r.status === 'eating').length}
              </p>
              <p className="text-sm text-muted-foreground">Comiendo</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {mealRecords.filter(r => r.status === 'registered').length}
              </p>
              <p className="text-sm text-muted-foreground">En fila</p>
            </div>
            {currentTeacher.role !== 'admin' && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{myRecords.length}</p>
                <p className="text-sm text-muted-foreground">Mis Registros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mis Registros - Solo para maestros normales */}
      {currentTeacher.role !== 'admin' && (
        <Card className="border-purple-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-primary" />
                Mis Registros de Hoy
                <Badge variant="secondary" className="ml-2">
                  {myRecords.length}
                </Badge>
              </CardTitle>
              {myRecords.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAllMyRecords}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Todos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {myRecords.length === 0 ? (
              <div className="text-center py-6">
                <User className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No tienes registros de comida para hoy
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tus registros aparecerán aquí cuando te registres
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-purple-primary text-white px-3 py-1">
                          {record.selectedGroup}
                        </Badge>
                        {getStatusBadge(record)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Registrado: {formatDateTime(record.registeredAt)}</p>
                        {record.enteredAt && (
                          <p>Inició comida: {formatDateTime(record.enteredAt)}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id, record.teacherName, record.selectedGroup)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Todos los Registros - Para administradores o vista general */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              {currentTeacher.role === 'admin' ? 'Todos los Registros de Hoy' : 'Registros del Comedor'}
              <Badge variant="secondary" className="ml-2">
                {currentTeacher.role === 'admin' ? mealRecords.length : otherRecords.length}
              </Badge>
            </CardTitle>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mealRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No hay registros de comida para hoy
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Los registros aparecerán aquí cuando los maestros se registren
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(currentTeacher.role === 'admin' ? mealRecords : otherRecords)
                .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
                .map((record) => {
                  const grade = allGrades.find(g => g.name === record.selectedGroup)
                  const categoryDisplay = grade ? getCategoryDisplayName(grade.category as any) : 'Sin categoría'
                  const isMyRecord = record.teacherId === currentTeacher.id
                  
                  return (
                    <div 
                      key={record.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        isMyRecord ? 'bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-purple-200' : 
                        'bg-gradient-to-r from-gray-50/50 to-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <UserAvatar 
                          teacher={{
                            id: record.teacherId,
                            name: record.teacherName,
                            email: '',
                            personalCode: record.teacherCode,
                            selectedGroup: record.selectedGroup,
                            role: 'teacher',
                            isActive: true,
                            createdAt: '',
                            updatedAt: '',
                            password: ''
                          }} 
                          size="sm" 
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{record.teacherName}</h4>
                            {isMyRecord && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                Tú
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-purple-primary text-white px-3 py-1">
                              {record.selectedGroup}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {categoryDisplay}
                            </Badge>
                            {getStatusBadge(record)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>Registrado: {formatDateTime(record.registeredAt)}</span>
                            </div>
                            {record.enteredAt && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Inició comida: {formatDateTime(record.enteredAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <BadgeIcon className="w-3 h-3" />
                              <span className="font-mono text-xs">Código: {record.teacherCode}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Solo mostrar botón eliminar si es admin o es el propio registro del maestro */}
                      {(currentTeacher.role === 'admin' || isMyRecord) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id, record.teacherName, record.selectedGroup)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones administrativas - Solo para admins */}
      {currentTeacher.role === 'admin' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Acciones Administrativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteAllRecords}
                  disabled={mealRecords.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Todos los Registros ({mealRecords.length})
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => loadData()}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Recargar Datos
                </Button>
              </div>
              
              {mealRecords.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-muted-foreground">
                    No hay registros para administrar hoy
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-primary">{mealRecords.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {mealRecords.filter(r => r.status === 'eating').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Comiendo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">
                      {mealRecords.filter(r => r.status === 'registered').length}
                    </p>
                    <p className="text-xs text-muted-foreground">En fila</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 p-2 bg-red-50 rounded border-l-4 border-red-200">
              ⚠️ Las acciones de eliminación son permanentes y no se pueden deshacer
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}