import { useState, useEffect } from 'react'
import { 
  User, Settings, Database, Trash2, RotateCcw, Users, 
  Calendar, Menu, Plus, Edit, Save, X, AlertCircle, 
  CheckCircle, Clock, Shield, TrendingUp, FileText,
  Download, Upload, RefreshCw, Book, GraduationCap,
  BarChart3, PieChart, Eye, Gift
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { UserAvatar } from './UserAvatar'
import { 
  getAdminStats, clearTodayMealRecords, clearTodayMealRecordsWithCascade, factoryReset, 
  getAllGrades, createGrade, updateGrade, deleteGrade,
  getAllMenus, createMenu, updateMenu, deleteMenu, upsertMenu,
  getAllTeachers, updateTeacher, getTodayStudentAttendanceRecords,
  getCategoryDisplayName, getCategoryDescription, getLocalDateString,
  formatDateTimeWithAmPm, formatTimeWithAmPm, formatDateLong,
  type Teacher, type Grade, type MenuEntry, type StudentAttendanceRecord
} from '../utils/unifiedDatabase'
import { eventBus } from '../utils/types'

interface AdminDashboardProps {
  teacher: Teacher
  onBack: () => void
}

export function AdminDashboard({ teacher, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  // Estados para gestión de grados
  const [grades, setGrades] = useState<Grade[]>([])
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [newGrade, setNewGrade] = useState({ 
    name: '', 
    description: '', 
    category: 'ciclo1' as Grade['category'],
    scheduleStart: '12:00',
    scheduleEnd: '12:30',
    maxReinforcements: 0
  })

  // Estados para gestión de menús
  const [menus, setMenus] = useState<MenuEntry[]>([])
  const [editingMenu, setEditingMenu] = useState<MenuEntry | null>(null)
  const [newMenu, setNewMenu] = useState({
    date: getLocalDateString(),
    mainDish: '',
    sideDish: '',
    drink: '',
    dessert: ''
  })

  // Estados para gestión de usuarios
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Estado para estadísticas de asistencia estudiantil
  const [attendanceViewMode, setAttendanceViewMode] = useState<'individual' | 'summary'>('individual')

  // Auto-refresh cada 5 segundos cuando está en la tab de usuarios
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (activeTab === 'users') {
      interval = setInterval(() => {
        loadData(false) // Cargar sin mostrar loading
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [])

  // Escuchar eventos de eliminación de registros para actualizar estadísticas
  useEffect(() => {
    const handleRecordDeleted = (data?: any) => {
      console.log('📊 AdminDashboard: Evento de eliminación de registro recibido:', data)
      // Recargar datos sin mostrar loading para actualizar estadísticas
      loadData(false)
    }

    eventBus.on('recordDeleted', handleRecordDeleted)
    
    return () => {
      eventBus.off('recordDeleted', handleRecordDeleted)
    }
  }, [])

  // Función para calcular estadísticas de asistencia estudiantil
  const calculateAttendanceStats = () => {
    const attendanceRecords = stats?.studentAttendanceRecords || []
    
    const stats_attendance = {
      totalGrades: attendanceRecords.length,
      totalPresent: 0,
      totalEating: 0,
      totalNotEating: 0,
      overallPercentage: 0,
      totalReinforcements: 0,
      byCategory: {} as {[category: string]: {
        grades: number
        present: number
        eating: number
        notEating: number
        reinforcements: number
        percentage: number
      }}
    }

    // Calcular totales generales
    attendanceRecords.forEach((record: StudentAttendanceRecord) => {
      stats_attendance.totalPresent += record.studentsPresent
      stats_attendance.totalEating += record.studentsEating
      stats_attendance.totalNotEating += record.studentsNotEating
      stats_attendance.totalReinforcements += record.reinforcementsUsed || 0
    })

    stats_attendance.overallPercentage = stats_attendance.totalPresent > 0 ? Math.round((stats_attendance.totalEating / stats_attendance.totalPresent) * 100) : 0

    // Calcular estadísticas por categoría
    attendanceRecords.forEach((record: StudentAttendanceRecord) => {
      let category = 'otros'
      const gradeName = record.gradeName.toLowerCase()
      
      if (gradeName.includes('transición') || gradeName.includes('1°') || gradeName.includes('2°') || gradeName.includes('3°') || gradeName.includes('brújula')) {
        category = 'ciclo1'
      } else if (gradeName.includes('4°') || gradeName.includes('5°') || gradeName.includes('aceleración')) {
        category = 'ciclo2'
      } else if (gradeName.includes('6°') || gradeName.includes('7°') || gradeName.includes('8°') || gradeName.includes('cs1')) {
        category = 'ciclo3'
      } else if (gradeName.includes('9°') || gradeName.includes('10°') || gradeName.includes('11°') || gradeName.includes('cs2')) {
        category = 'ciclo4'
      } else if (gradeName.includes('técnica') || gradeName.includes('tecnica')) {
        category = 'modalidad_tecnica'
      }

      if (!stats_attendance.byCategory[category]) {
        stats_attendance.byCategory[category] = {
          grades: 0,
          present: 0,
          eating: 0,
          notEating: 0,
          reinforcements: 0,
          percentage: 0
        }
      }

      stats_attendance.byCategory[category].grades += 1
      stats_attendance.byCategory[category].present += record.studentsPresent
      stats_attendance.byCategory[category].eating += record.studentsEating
      stats_attendance.byCategory[category].notEating += record.studentsNotEating
      stats_attendance.byCategory[category].reinforcements += record.reinforcementsUsed || 0
      stats_attendance.byCategory[category].percentage = stats_attendance.byCategory[category].present > 0 
        ? Math.round((stats_attendance.byCategory[category].eating / stats_attendance.byCategory[category].present) * 100) 
        : 0
    })

    return stats_attendance
  }

  // ACTUALIZADA: Opciones de categoría incluyendo Ciclo 4
  const categoryOptions: { value: Grade['category']; label: string; description: string }[] = [
    { value: 'ciclo1', label: 'Ciclo 1', description: '1°, 2° y 3° Grado' },
    { value: 'ciclo2', label: 'Ciclo 2', description: '4° y 5° Grado' },
    { value: 'ciclo3', label: 'Ciclo 3', description: '6°, 7° y 8° Grado' },
    { value: 'ciclo4', label: 'Ciclo 4', description: '9°, 10° y 11° Grado' },
    { value: 'modalidad_tecnica', label: 'Modalidad Técnica', description: 'Programas Técnicos' }
  ]

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
        setMessage('')
      }
      
      // Cargar datos con timeout para evitar cuelgues
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
      
      const adminStats = await Promise.race([getAdminStats(), timeout(10000)])
      const allGrades = await Promise.race([getAllGrades(), timeout(5000)])
      const allMenus = await Promise.race([getAllMenus(), timeout(5000)])
      const allTeachers = await Promise.race([getAllTeachers(), timeout(5000)])
      
      // Actualizar todos los estados con los datos frescos
      setStats(adminStats)
      setGrades(allGrades)
      setMenus(allMenus)
      setTeachers(allTeachers)
      setLastUpdate(Date.now())
      
    } catch (error) {
      console.error('❌ Error cargando datos del administrador:', error)
      
      // Solo mostrar mensaje de error si es una carga con loading visible
      if (showLoading) {
        setMessage('❌ Error al cargar los datos. Verifica tu conexión e inténtalo de nuevo.')
        setMessageType('error')
      }
      
      // Re-throw el error para que el botón de actualización pueda manejarlo
      throw error
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return formatDateLong(dateString)
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateString: string): string => {
    try {
      return formatDateTimeWithAmPm(dateString)
    } catch (error) {
      return dateString
    }
  }

  // Funciones para gestión de grados
  const handleCreateGrade = async () => {
    if (!newGrade.name.trim()) {
      setMessage('El nombre del grado es requerido')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      await createGrade({
        ...newGrade,
        isActive: true
      })
      setNewGrade({ 
        name: '', 
        description: '', 
        category: 'ciclo1',
        scheduleStart: '12:00',
        scheduleEnd: '12:30',
        maxReinforcements: 0
      })
      setMessage('Grado creado exitosamente')
      setMessageType('success')
      await loadData()
    } catch (error) {
      console.error('Error creando grado:', error)
      setMessage('Error al crear el grado')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGrade = async () => {
    if (!editingGrade) return

    try {
      setLoading(true)
      await updateGrade(editingGrade)
      setEditingGrade(null)
      setMessage('Grado actualizado exitosamente')
      setMessageType('success')
      await loadData()
    } catch (error) {
      console.error('Error actualizando grado:', error)
      setMessage('Error al actualizar el grado')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grado?')) return

    try {
      setLoading(true)
      await deleteGrade(gradeId)
      setMessage('Grado eliminado exitosamente')
      setMessageType('success')
      await loadData()
    } catch (error) {
      console.error('Error eliminando grado:', error)
      setMessage('Error al eliminar el grado')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para gestión de menús
  const handleCreateMenu = async () => {
    if (!newMenu.mainDish.trim()) {
      setMessage('El plato principal es requerido')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      await upsertMenu({
        ...newMenu,
        isActive: true
      })
      setNewMenu({
        date: getLocalDateString(),
        mainDish: '',
        sideDish: '',
        drink: '',
        dessert: ''
      })
      setMessage('Menú guardado exitosamente')
      setMessageType('success')
      await loadData()
      
      // Notificar actualización del menú
      eventBus.emit('menuUpdated')
    } catch (error) {
      console.error('Error guardando menú:', error)
      setMessage('Error al guardar el menú')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMenu = async () => {
    if (!editingMenu) return

    try {
      setLoading(true)
      await updateMenu(editingMenu)
      setEditingMenu(null)
      setMessage('Menú actualizado exitosamente')
      setMessageType('success')
      await loadData()
      
      // Notificar actualización del menú
      eventBus.emit('menuUpdated')
    } catch (error) {
      console.error('Error actualizando menú:', error)
      setMessage('Error al actualizar el menú')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este menú?')) return

    try {
      setLoading(true)
      await deleteMenu(menuId)
      setMessage('Menú eliminado exitosamente')
      setMessageType('success')
      await loadData()
      
      // Notificar actualización del menú
      eventBus.emit('menuUpdated')
    } catch (error) {
      console.error('Error eliminando menú:', error)
      setMessage('Error al eliminar el menú')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para gestión de usuarios
  const handleUpdateTeacher = async (teacherId: string, updates: Partial<Teacher>) => {
    try {
      setLoading(true)
      await updateTeacher({ id: teacherId, ...updates })
      setMessage('Usuario actualizado exitosamente')
      setMessageType('success')
      await loadData()
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      setMessage('Error al actualizar el usuario')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Funciones de administración del sistema
  const handleClearTodayRecords = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los registros de hoy?\n\nEsto eliminará:\n• Todos los registros de comida de hoy\n• Todos los registros de asistencia de estudiantes asociados\n\nEsta acción no se puede deshacer.')) {
      return
    }

    try {
      setLoading(true)
      console.log('🗑️ Iniciando limpieza completa de registros de hoy...')
      
      const result = await clearTodayMealRecordsWithCascade()
      
      let successMessage = `✅ Limpieza completada exitosamente: ${result.deletedMealRecords} registros de comida eliminados`
      
      if (result.deletedAttendanceRecords > 0) {
        successMessage += ` y ${result.deletedAttendanceRecords} registros de asistencia eliminados`
      }
      
      setMessage(successMessage)
      setMessageType('success')
      
      console.log(`✅ Limpieza completada: ${result.deletedMealRecords} comidas, ${result.deletedAttendanceRecords} asistencias`)
      
      await loadData()
    } catch (error) {
      console.error('❌ Error limpiando registros:', error)
      setMessage('Error al limpiar los registros. Inténtalo de nuevo.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleFactoryReset = async () => {
    const confirmation = prompt(
      'ADVERTENCIA: Esto eliminará TODOS los datos del sistema de manera PERMANENTE.\n\n' +
      'Para confirmar, escribe exactamente: ELIMINAR TODO'
    )

    if (confirmation !== 'ELIMINAR TODO') {
      setMessage('Reset cancelado por seguridad')
      setMessageType('info')
      return
    }

    try {
      setLoading(true)
      await factoryReset()
      setMessage('Reset completado. Recargando la aplicación...')
      setMessageType('success')
      
      // Recargar la página después de un breve delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error en factory reset:', error)
      setMessage('Error durante el reset del sistema')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onBack}>
                  ←
                </Button>
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    teacher={teacher} 
                    size="sm"
                    className="border-2 border-purple-primary"
                  />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-primary" />
                      Panel de Administración
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Bienvenido, {teacher.name}
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    await loadData(true)
                    setMessage('✅ Datos actualizados correctamente')
                    setMessageType('success')
                    setTimeout(() => setMessage(''), 3000)
                  } catch (error) {
                    setMessage('❌ Error al actualizar los datos')
                    setMessageType('error')
                    setTimeout(() => setMessage(''), 5000)
                  }
                }}
                disabled={loading}
                className={loading ? 'opacity-75' : 'hover:bg-purple-50 hover:border-purple-primary/30'}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-purple-primary' : ''}`} />
                {loading ? 'Actualizando...' : 'Actualizar Todo'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Mensajes */}
        {message && (
          <Alert className={
            messageType === 'success' ? 'border-green-500 bg-green-50' :
            messageType === 'error' ? 'border-red-500 bg-red-50' :
            'border-blue-500 bg-blue-50'
          }>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Grados
            </TabsTrigger>
            <TabsTrigger value="menus" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Menús
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* Tab Overview */}
          <TabsContent value="overview" className="space-y-6">
            {loading && !stats ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Cargando estadísticas...
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4 text-blue-600" />
                        Maestros
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total:</span>
                          <span className="font-medium">{stats?.totalTeachers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Activos:</span>
                          <span className="font-medium text-green-600">{stats?.activeTeachers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Admins:</span>
                          <span className="font-medium text-purple-primary">{stats?.totalAdmins || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        Grados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total:</span>
                          <span className="font-medium">{stats?.totalGrades || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Activos:</span>
                          <span className="font-medium text-green-600">{stats?.activeGrades || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="w-4 h-4 text-orange-600" />
                        Registros Hoy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Comidas:</span>
                          <span className="font-medium text-orange-600">{stats?.todayRecords || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Menús:</span>
                          <span className="font-medium">{stats?.totalMenus || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Estadísticas de Asistencia Estudiantil */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Estadísticas de Asistencia Estudiantil
                        <Badge variant="secondary">{stats?.studentAttendanceRecords?.length || 0} grados</Badge>
                      </div>
                      {stats?.studentAttendanceRecords && stats.studentAttendanceRecords.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant={attendanceViewMode === 'individual' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAttendanceViewMode('individual')}
                            className="h-8 px-3"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Por Grado
                          </Button>
                          <Button
                            variant={attendanceViewMode === 'summary' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAttendanceViewMode('summary')}
                            className="h-8 px-3"
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Resumen
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Debug: verificar qué datos tenemos (solo en development)
                      if (process.env.NODE_ENV === 'development') {
                        console.log('🐛 Renderizando estadísticas - stats:', stats)
                        console.log('🐛 studentAttendanceRecords:', stats?.studentAttendanceRecords)
                        console.log('🐛 length:', stats?.studentAttendanceRecords?.length)
                      }
                      
                      // Verificar si tenemos datos válidos
                      const hasValidRecords = stats?.studentAttendanceRecords && 
                                            Array.isArray(stats.studentAttendanceRecords) && 
                                            stats.studentAttendanceRecords.length > 0
                      
                      if (!hasValidRecords) {
                        return (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">
                              No hay registros de asistencia estudiantil para hoy
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Los maestros pueden registrar la asistencia desde el dashboard principal
                            </p>
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                                <p className="text-yellow-800">Debug Info:</p>
                                <p className="text-xs text-yellow-600">
                                  Stats existe: {stats ? 'Sí' : 'No'}<br/>
                                  studentAttendanceRecords existe: {stats?.studentAttendanceRecords ? 'Sí' : 'No'}<br/>
                                  Es array: {Array.isArray(stats?.studentAttendanceRecords) ? 'Sí' : 'No'}<br/>
                                  Cantidad de registros: {stats?.studentAttendanceRecords?.length || 0}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      return attendanceViewMode === 'individual' ? (
                        <div className="space-y-4">
                          {stats.studentAttendanceRecords.map((record: StudentAttendanceRecord) => {
                            const percentage = record.studentsPresent > 0 
                              ? Math.round((record.studentsEating / record.studentsPresent) * 100) 
                              : 0
                            
                            return (
                              <div key={record.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50/30 to-blue-50/30">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-purple-primary text-white px-3 py-1">
                                        {record.gradeName}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        por <span className="font-medium text-black-soft">{record.teacherName}</span>
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-green-600">{percentage}%</p>
                                      <p className="text-xs text-muted-foreground">comieron</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <p className="text-lg font-bold text-blue-600">{record.studentsPresent || 0}</p>
                                      <p className="text-xs text-muted-foreground">Presentes</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      </div>
                                      <p className="text-lg font-bold text-green-600">{record.studentsEating || 0}</p>
                                      <p className="text-xs text-muted-foreground">Comieron</p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <X className="w-4 h-4 text-red-600" />
                                      </div>
                                      <p className="text-lg font-bold text-red-600">{record.studentsNotEating || 0}</p>
                                      <p className="text-xs text-muted-foreground">No comieron</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <Gift className="w-4 h-4 text-purple-600" />
                                      </div>
                                      <p className="text-lg font-bold text-purple-600">{record.reinforcementsUsed || 0}</p>
                                      <p className="text-xs text-muted-foreground">Refuerzos</p>
                                    </div>
                                  </div>

                                  {/* Barra de progreso visual */}
                                  <div className="space-y-2">
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>0%</span>
                                      <span className="font-medium text-green-600">{percentage}% comieron</span>
                                      <span>100%</span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-muted-foreground pt-2 border-t">
                                    <span>Registrado: {formatDateTimeWithAmPm(record.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {(() => {
                            // Calcular estadísticas manualmente con datos seguros
                            const records = stats.studentAttendanceRecords || []
                            const attendanceStats = {
                              totalGrades: records.length,
                              totalPresent: records.reduce((sum, r) => sum + (r.studentsPresent || 0), 0),
                              totalEating: records.reduce((sum, r) => sum + (r.studentsEating || 0), 0),
                              totalNotEating: records.reduce((sum, r) => sum + (r.studentsNotEating || 0), 0),
                              totalReinforcements: records.reduce((sum, r) => sum + (r.reinforcementsUsed || 0), 0),
                              overallPercentage: 0,
                              byCategory: {} as any
                            }
                            
                            // Calcular porcentaje general
                            if (attendanceStats.totalPresent > 0) {
                              attendanceStats.overallPercentage = Math.round(
                                (attendanceStats.totalEating / attendanceStats.totalPresent) * 100
                              )
                            }
                            
                            // Agrupar por categoría de grado
                            records.forEach((record) => {
                              if (!record.gradeCategory) return
                              
                              if (!attendanceStats.byCategory[record.gradeCategory]) {
                                attendanceStats.byCategory[record.gradeCategory] = {
                                  grades: 0,
                                  present: 0,
                                  eating: 0,
                                  notEating: 0,
                                  reinforcements: 0,
                                  percentage: 0
                                }
                              }
                              
                              const category = attendanceStats.byCategory[record.gradeCategory]
                              category.grades += 1
                              category.present += record.studentsPresent || 0
                              category.eating += record.studentsEating || 0
                              category.notEating += record.studentsNotEating || 0
                              category.reinforcements += record.reinforcementsUsed || 0
                              
                              if (category.present > 0) {
                                category.percentage = Math.round((category.eating / category.present) * 100)
                              }
                            })
                            
                            return (
                              <>
                                {/* Resumen General */}
                                <div className="bg-gradient-to-r from-purple-primary/5 to-blue-600/5 rounded-lg p-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="w-5 h-5 text-purple-primary" />
                                    <h3 className="text-lg font-medium text-black-soft">Resumen General del Día</h3>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                    <div className="text-center p-4 bg-white rounded-lg border">
                                      <p className="text-2xl font-bold text-purple-primary">{attendanceStats.totalGrades}</p>
                                      <p className="text-sm text-muted-foreground">Grados Registrados</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg border">
                                      <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalPresent}</p>
                                      <p className="text-sm text-muted-foreground">Total Presentes</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg border">
                                      <p className="text-2xl font-bold text-green-600">{attendanceStats.totalEating}</p>
                                      <p className="text-sm text-muted-foreground">Total Comieron</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg border">
                                      <p className="text-2xl font-bold text-red-600">{attendanceStats.totalNotEating}</p>
                                      <p className="text-sm text-muted-foreground">Total No Comieron</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg border">
                                      <p className="text-2xl font-bold text-purple-600">{attendanceStats.totalReinforcements}</p>
                                      <p className="text-sm text-muted-foreground">Total Refuerzos</p>
                                    </div>
                                  </div>

                                  {/* Barra de progreso general */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-black-soft">Porcentaje General de Alimentación</span>
                                      <span className="text-2xl font-bold text-green-600">{attendanceStats.overallPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000" 
                                        style={{ width: `${Math.max(0, Math.min(100, attendanceStats.overallPercentage))}%` }}
                                      />
                                    </div>
                                    <p className="text-center text-sm text-muted-foreground">
                                      {attendanceStats.totalEating} de {attendanceStats.totalPresent} estudiantes presentes comieron hoy • {attendanceStats.totalReinforcements} refuerzos utilizados
                                    </p>
                                  </div>
                                </div>

                                {/* Estadísticas por Ciclo */}
                                {Object.keys(attendanceStats.byCategory).length > 0 && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <PieChart className="w-5 h-5 text-blue-600" />
                                      <h3 className="text-lg font-medium text-black-soft">Estadísticas por Ciclo Educativo</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {Object.entries(attendanceStats.byCategory).map(([category, categoryStats]) => (
                                        <div key={category} className="border rounded-lg p-4 bg-white">
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <Badge className="bg-purple-primary text-white px-3 py-1">
                                                {getCategoryDisplayName(category as any)}
                                              </Badge>
                                              <div className="text-right">
                                                <p className="text-xl font-bold text-green-600">{categoryStats.percentage}%</p>
                                                <p className="text-xs text-muted-foreground">comieron</p>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                              <div className="p-2 bg-blue-50 rounded">
                                                <p className="font-bold text-blue-600">{categoryStats.present}</p>
                                                <p className="text-muted-foreground">Presentes</p>
                                              </div>
                                              <div className="p-2 bg-green-50 rounded">
                                                <p className="font-bold text-green-600">{categoryStats.eating}</p>
                                                <p className="text-muted-foreground">Comieron</p>
                                              </div>
                                              <div className="p-2 bg-red-50 rounded">
                                                <p className="font-bold text-red-600">{categoryStats.notEating}</p>
                                                <p className="text-muted-foreground">No comieron</p>
                                              </div>
                                              <div className="p-2 bg-purple-50 rounded">
                                                <p className="font-bold text-purple-600">{categoryStats.reinforcements}</p>
                                                <p className="text-muted-foreground">Refuerzos</p>
                                              </div>
                                            </div>

                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                              <div 
                                                className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.max(0, Math.min(100, categoryStats.percentage))}%` }}
                                              />
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                              {categoryStats.grades} grado{categoryStats.grades !== 1 ? 's' : ''} registrado{categoryStats.grades !== 1 ? 's' : ''} • {categoryStats.reinforcements} refuerzos
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-light" />
                        Sistema de Auto-limpieza
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Sistema Activo</span>
                          </div>
                          <p className="text-xs text-green-700">
                            Los registros se eliminan automáticamente todos los días a las 12:00 AM
                          </p>
                        </div>
                        
                        {stats?.lastCleanup && (
                          <div className="text-sm text-muted-foreground">
                            <p><strong>Última limpieza:</strong></p>
                            <p>{formatDate(stats.lastCleanup)}</p>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={handleClearTodayRecords}
                          disabled={loading}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpiar Registros de Hoy Manualmente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-red-600" />
                        Zona de Peligro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">¡Cuidado!</span>
                          </div>
                          <p className="text-xs text-red-700">
                            Estas acciones son irreversibles y eliminarán datos permanentemente.
                          </p>
                        </div>
                        
                        <Button
                          variant="destructive"
                          onClick={handleFactoryReset}
                          disabled={loading}
                          className="w-full"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Completo del Sistema
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Grades */}
          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear Nuevo Grado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade-name">Nombre del Grado</Label>
                    <Input
                      id="grade-name"
                      value={newGrade.name}
                      onChange={(e) => setNewGrade(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: 5° Grado A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade-category">Categoría</Label>
                    <Select
                      value={newGrade.category}
                      onValueChange={(value: Grade['category']) => 
                        setNewGrade(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule-start">Hora de Inicio</Label>
                    <Input
                      id="schedule-start"
                      type="time"
                      value={newGrade.scheduleStart}
                      onChange={(e) => setNewGrade(prev => ({ ...prev, scheduleStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-end">Hora de Fin</Label>
                    <Input
                      id="schedule-end"
                      type="time"
                      value={newGrade.scheduleEnd}
                      onChange={(e) => setNewGrade(prev => ({ ...prev, scheduleEnd: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="grade-description">Descripción (Opcional)</Label>
                  <Textarea
                    id="grade-description"
                    value={newGrade.description}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción adicional del grado"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="grade-reinforcements">Refuerzos Permitidos</Label>
                  <Input
                    id="grade-reinforcements"
                    type="number"
                    min="0"
                    max="50"
                    value={newGrade.maxReinforcements}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, maxReinforcements: parseInt(e.target.value) || 0 }))}
                    placeholder="Número máximo de refuerzos"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número máximo de estudiantes que pueden usar refuerzos en este grado
                  </p>
                </div>

                <Button onClick={handleCreateGrade} disabled={loading} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Grado
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Grados Existentes ({grades.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grades.map(grade => (
                    <div key={grade.id} className="border rounded-lg p-4">
                      {editingGrade?.id === grade.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                value={editingGrade.name}
                                onChange={(e) => setEditingGrade(prev => 
                                  prev ? { ...prev, name: e.target.value } : null
                                )}
                              />
                            </div>
                            <div>
                              <Label>Categoría</Label>
                              <Select
                                value={editingGrade.category}
                                onValueChange={(value: Grade['category']) => 
                                  setEditingGrade(prev => 
                                    prev ? { ...prev, category: value } : null
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoryOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Hora de Inicio</Label>
                              <Input
                                type="time"
                                value={editingGrade.scheduleStart}
                                onChange={(e) => setEditingGrade(prev => 
                                  prev ? { ...prev, scheduleStart: e.target.value } : null
                                )}
                              />
                            </div>
                            <div>
                              <Label>Hora de Fin</Label>
                              <Input
                                type="time"
                                value={editingGrade.scheduleEnd}
                                onChange={(e) => setEditingGrade(prev => 
                                  prev ? { ...prev, scheduleEnd: e.target.value } : null
                                )}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Descripción</Label>
                            <Textarea
                              value={editingGrade.description}
                              onChange={(e) => setEditingGrade(prev => 
                                prev ? { ...prev, description: e.target.value } : null
                              )}
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label>Refuerzos Permitidos</Label>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={editingGrade.maxReinforcements || 0}
                              onChange={(e) => setEditingGrade(prev => 
                                prev ? { ...prev, maxReinforcements: parseInt(e.target.value) || 0 } : null
                              )}
                              placeholder="Número máximo de refuerzos"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Número máximo de estudiantes que pueden usar refuerzos en este grado
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleUpdateGrade} disabled={loading}>
                              <Save className="w-4 h-4 mr-2" />
                              Guardar
                            </Button>
                            <Button variant="outline" onClick={() => setEditingGrade(null)}>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{grade.name}</h3>
                              <Badge variant={grade.isActive ? "default" : "secondary"}>
                                {getCategoryDisplayName(grade.category)}
                              </Badge>
                              <Badge variant={grade.isActive ? "secondary" : "outline"}>
                                {grade.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Horario: {formatTimeWithAmPm(grade.scheduleStart)} - {formatTimeWithAmPm(grade.scheduleEnd)}</p>
                              <p>Refuerzos permitidos: {grade.maxReinforcements || 0}</p>
                              {grade.description && <p>Descripción: {grade.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingGrade(grade)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Menus */}
          <TabsContent value="menus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear/Editar Menú
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="menu-date">Fecha</Label>
                  <Input
                    id="menu-date"
                    type="date"
                    value={newMenu.date}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="main-dish">Plato Principal *</Label>
                    <Input
                      id="main-dish"
                      value={newMenu.mainDish}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, mainDish: e.target.value }))}
                      placeholder="Ej: Arroz con pollo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="side-dish">Acompañamiento</Label>
                    <Input
                      id="side-dish"
                      value={newMenu.sideDish}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, sideDish: e.target.value }))}
                      placeholder="Ej: Ensalada"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="drink">Bebida</Label>
                    <Input
                      id="drink"
                      value={newMenu.drink}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, drink: e.target.value }))}
                      placeholder="Ej: Jugo natural"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dessert">Postre</Label>
                    <Input
                      id="dessert"
                      value={newMenu.dessert}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, dessert: e.target.value }))}
                      placeholder="Ej: Fruta"
                    />
                  </div>
                </div>

                <Button onClick={handleCreateMenu} disabled={loading} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Guardar Menú
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Menús Programados ({menus.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {menus.map(menu => (
                    <div key={menu.id} className="border rounded-lg p-4">
                      {editingMenu?.id === menu.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Fecha</Label>
                            <Input
                              type="date"
                              value={editingMenu.date}
                              onChange={(e) => setEditingMenu(prev => 
                                prev ? { ...prev, date: e.target.value } : null
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Plato Principal</Label>
                              <Input
                                value={editingMenu.mainDish}
                                onChange={(e) => setEditingMenu(prev => 
                                  prev ? { ...prev, mainDish: e.target.value } : null
                                )}
                              />
                            </div>
                            <div>
                              <Label>Acompañamiento</Label>
                              <Input
                                value={editingMenu.sideDish}
                                onChange={(e) => setEditingMenu(prev => 
                                  prev ? { ...prev, sideDish: e.target.value } : null
                                )}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Bebida</Label>
                              <Input
                                value={editingMenu.drink}
                                onChange={(e) => setEditingMenu(prev => 
                                  prev ? { ...prev, drink: e.target.value } : null
                                )}
                              />
                            </div>
                            <div>
                              <Label>Postre</Label>
                              <Input
                                value={editingMenu.dessert || ''}
                                onChange={(e) => setEditingMenu(prev => 
                                  prev ? { ...prev, dessert: e.target.value } : null
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleUpdateMenu} disabled={loading}>
                              <Save className="w-4 h-4 mr-2" />
                              Guardar
                            </Button>
                            <Button variant="outline" onClick={() => setEditingMenu(null)}>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{formatDate(menu.date)}</h3>
                              <Badge variant={menu.isActive ? "default" : "secondary"}>
                                {menu.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Principal:</strong> {menu.mainDish}</p>
                              {menu.sideDish && <p><strong>Acompañamiento:</strong> {menu.sideDish}</p>}
                              {menu.drink && <p><strong>Bebida:</strong> {menu.drink}</p>}
                              {menu.dessert && <p><strong>Postre:</strong> {menu.dessert}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMenu(menu)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMenu(menu.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Users */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestión de Usuarios ({teachers.length})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Actualizado: {new Date(lastUpdate).toLocaleTimeString()}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teachers.map(teacherUser => (
                    <div key={teacherUser.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar teacher={teacherUser} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{teacherUser.name}</h3>
                              <Badge variant={teacherUser.role === 'admin' ? "default" : "secondary"}>
                                {teacherUser.role === 'admin' ? 'Admin' : 'Maestro'}
                              </Badge>
                              <Badge variant={teacherUser.isActive ? "secondary" : "outline"}>
                                {teacherUser.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Email: {teacherUser.email}</p>
                              <p>Código: {teacherUser.personalCode}</p>
                              <p>Grupo: {teacherUser.selectedGroup || 'Sin asignar'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateTeacher(teacherUser.id, { 
                              isActive: !teacherUser.isActive 
                            })}
                            disabled={loading}
                          >
                            {teacherUser.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                          {teacherUser.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateTeacher(teacherUser.id, { 
                                role: 'admin' 
                              })}
                              disabled={loading}
                            >
                              Hacer Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}