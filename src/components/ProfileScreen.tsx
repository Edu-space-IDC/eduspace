import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Calendar, Shield, LogOut, Edit, Save, X, AlertCircle, CheckCircle, TrendingUp, Clock, Target, Award, Lock, Camera, Eye, EyeOff, Settings, Key } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { UserAvatar } from './UserAvatar'
// TEMPORALMENTE DESACTIVADO
// import { ThemeSwitch } from './ThemeToggle'
import { updateTeacher, getTeacherByEmail, getTeacherStats, hashPassword, verifyPassword, type Teacher, type TeacherStats } from '../utils/unifiedDatabase'
import type { Teacher as TeacherType } from '../App'

interface ProfileScreenProps {
  teacher: TeacherType
  onLogout: () => void
  onBack: () => void
  onTeacherUpdate: (teacher: TeacherType) => void
}

export function ProfileScreen({
  teacher,
  onLogout,
  onBack,
  onTeacherUpdate
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [stats, setStats] = useState<TeacherStats | null>(null)
  
  const [editData, setEditData] = useState({
    name: teacher.name,
    email: teacher.email
  })

  // Estados para manejo de contraseñas y configuraciones
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  // Cargar foto de perfil desde localStorage
  useEffect(() => {
    const savedPhoto = localStorage.getItem(`profile_photo_${teacher.id}`)
    if (savedPhoto) {
      setProfilePhoto(savedPhoto)
    }
  }, [teacher.id])

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadTeacherStats()
  }, [teacher.id])

  const loadTeacherStats = async () => {
    try {
      setStatsLoading(true)
      const teacherStats = await getTeacherStats(teacher.id)
      setStats(teacherStats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      // Establecer estadísticas por defecto en caso de error
      setStats({
        totalRecords: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0,
        lastRecord: null,
        averagePerWeek: 0,
        currentStreak: 0,
        favoriteTimeSlot: null
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Nunca'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Fecha inválida'
      
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Fecha inválida'
    }
  }

  const formatTimeSlot = (timeSlot: string | null): string => {
    if (!timeSlot) return 'No definido'
    return timeSlot
  }

  const getStreakText = (streak: number): string => {
    if (streak === 0) return 'Sin racha activa'
    if (streak === 1) return '1 día'
    return `${streak} días consecutivos`
  }

  const handleSave = async () => {
    if (!editData.name.trim() || !editData.email.trim()) {
      showMessage('Por favor completa todos los campos', 'error')
      return
    }

    if (!editData.email.includes('@')) {
      showMessage('Por favor ingresa un email válido', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Verificar si el email ya existe (solo si cambió)
      if (editData.email !== teacher.email) {
        const existingTeacher = await getTeacherByEmail(editData.email)
        if (existingTeacher && existingTeacher.id !== teacher.id) {
          showMessage('Ya existe un usuario con este email', 'error')
          return
        }
      }

      // Actualizar en la base de datos
      const updatedTeacher: Teacher = {
        ...teacher,
        name: editData.name.trim(),
        email: editData.email.trim(),
        updatedAt: new Date().toISOString()
      }

      await updateTeacher(updatedTeacher)
      
      // Actualizar en el estado del componente padre
      onTeacherUpdate(updatedTeacher)
      
      setIsEditing(false)
      showMessage('✅ Perfil actualizado correctamente', 'success')
      
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      showMessage('Error al actualizar el perfil', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      name: teacher.name,
      email: teacher.email
    })
    setIsEditing(false)
    setMessage('')
  }

  const handleLogout = () => {
    const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?')
    if (confirmed) {
      onLogout()
    }
  }

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  // Función para cambiar contraseña
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showMessage('Por favor completa todos los campos', 'error')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    try {
      setPasswordLoading(true)
      
      // Verificar que las funciones están disponibles
      if (typeof hashPassword !== 'function' || typeof verifyPassword !== 'function') {
        throw new Error('Funciones de contraseña no disponibles')
      }
      
      // Verificar contraseña actual
      const isCurrentValid = await verifyPassword(passwordForm.currentPassword, teacher.password)
      if (!isCurrentValid) {
        showMessage('La contraseña actual es incorrecta', 'error')
        return
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await hashPassword(passwordForm.newPassword)
      
      // Actualizar en la base de datos
      const updatedTeacher: Teacher = {
        ...teacher,
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      }

      await updateTeacher(updatedTeacher)
      onTeacherUpdate(updatedTeacher)
      
      // Limpiar formulario y cerrar diálogo
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordDialog(false)
      showMessage('✅ Contraseña actualizada correctamente', 'success')
      
    } catch (error) {
      console.error('Error cambiando contraseña:', error)
      
      // Mostrar error específico si está disponible
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showMessage(`Error al cambiar la contraseña: ${errorMessage}`, 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Función para configurar contraseña admin
  const handleAdminPasswordChange = async () => {
    if (!adminPassword.trim()) {
      showMessage('Por favor ingresa la nueva contraseña de administrador', 'error')
      return
    }

    if (adminPassword.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    try {
      setPasswordLoading(true)
      
      // Guardar contraseña admin en localStorage
      localStorage.setItem('admin_password', adminPassword)
      
      setAdminPassword('')
      setShowAdminDialog(false)
      showMessage('✅ Contraseña de administrador actualizada', 'success')
      
    } catch (error) {
      console.error('Error configurando contraseña admin:', error)
      showMessage('Error al configurar contraseña de administrador', 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Función para manejar foto de perfil
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('La imagen debe ser menor a 2MB', 'error')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      showMessage('Solo se permiten archivos de imagen', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setProfilePhoto(result)
      localStorage.setItem(`profile_photo_${teacher.id}`, result)
      showMessage('✅ Foto de perfil actualizada', 'success')
      setShowPhotoDialog(false)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setProfilePhoto(null)
    localStorage.removeItem(`profile_photo_${teacher.id}`)
    showMessage('Foto de perfil eliminada', 'success')
    setShowPhotoDialog(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[rgba(105,107,205,1)] text-white px-6 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={loading}
              className="text-white hover:bg-white/10 p-2 h-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-medium text-white">
                Mi Perfil
              </h1>
              <p className="text-blue-light text-sm">
                Información personal y estadísticas
              </p>
            </div>
          </div>

          {/* Avatar y info básica */}
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-4">
            <UserAvatar teacher={teacher} size="lg" />
            <div className="flex-1">
              <p className="text-white font-medium text-lg">{teacher.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    teacher.role === 'admin' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-blue-light text-white'
                  }`}
                >
                  {teacher.role === 'admin' ? 'Administrador' : 'Maestro'}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/30">
                  {teacher.personalCode}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Mensajes */}
          {message && (
            <Alert className={`${
              messageType === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={`${
                messageType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-black-soft">
                Información Personal
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      disabled={loading}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      disabled={loading}
                      placeholder="tu.email@colegio.edu"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-purple-dark hover:bg-purple-dark/90"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-light" />
                    <div>
                      <p className="text-sm font-medium text-black-soft">Nombre</p>
                      <p className="text-sm text-muted-foreground">{teacher.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-light" />
                    <div>
                      <p className="text-sm font-medium text-black-soft">Email</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-light" />
                    <div>
                      <p className="text-sm font-medium text-black-soft">Código Personal</p>
                      <p className="text-sm text-muted-foreground font-mono">{teacher.personalCode}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-light" />
                    <div>
                      <p className="text-sm font-medium text-black-soft">Miembro desde</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(teacher.createdAt)}
                      </p>
                    </div>
                  </div>

                  {teacher.selectedGroup && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-light" />
                        <div>
                          <p className="text-sm font-medium text-black-soft">Grado Asignado</p>
                          <p className="text-sm text-muted-foreground">{teacher.selectedGroup}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas de Uso - RENOVADAS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black-soft">
                <TrendingUp className="w-5 h-5 text-blue-light" />
                Estadísticas de Uso
                {statsLoading && (
                  <div className="w-4 h-4 border-2 border-purple-light border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Skeleton loading */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center">
                      <div className="w-12 h-8 bg-muted rounded mx-auto mb-2"></div>
                      <div className="w-16 h-3 bg-muted rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <>
                  {/* Estadísticas principales */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-light">{stats.totalRecords}</p>
                      <p className="text-xs text-muted-foreground">Total registros</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-light">{stats.thisMonth}</p>
                      <p className="text-xs text-muted-foreground">Este mes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.thisWeek}</p>
                      <p className="text-xs text-muted-foreground">Esta semana</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
                      <p className="text-xs text-muted-foreground">Hoy</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Estadísticas adicionales */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-light" />
                        <span className="text-sm font-medium text-black-soft">Último registro</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(stats.lastRecord)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-light" />
                        <span className="text-sm font-medium text-black-soft">Promedio semanal</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.averagePerWeek} registros
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-black-soft">Racha actual</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {getStreakText(stats.currentStreak)}
                      </span>
                    </div>

                    {stats.favoriteTimeSlot && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-black-soft">Horario favorito</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeSlot(stats.favoriteTimeSlot)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-blue-light/5 border border-blue-light/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Nota:</strong> Las estadísticas se calculan en tiempo real desde todos tus registros de entrada al comedor escolar.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No se pudieron cargar las estadísticas</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadTeacherStats}
                    className="mt-2"
                  >
                    Intentar de nuevo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NUEVA SECCIÓN: Seguridad y Personalización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black-soft">
                <Settings className="w-5 h-5 text-purple-primary" />
                Seguridad y Personalización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Cambiar contraseña personal */}
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      disabled={loading}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Cambiar contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm mx-auto">
                    <DialogHeader>
                      <DialogTitle>Cambiar contraseña</DialogTitle>
                      <DialogDescription>
                        Ingresa tu contraseña actual y la nueva contraseña.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Contraseña actual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            disabled={passwordLoading}
                            placeholder="Contraseña actual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-password">Nueva contraseña</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          disabled={passwordLoading}
                          placeholder="Nueva contraseña (mín. 6 caracteres)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          disabled={passwordLoading}
                          placeholder="Confirma la nueva contraseña"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                          setShowPasswordDialog(false)
                        }}
                        disabled={passwordLoading}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={passwordLoading}
                        className="bg-purple-primary hover:bg-purple-primary/90"
                      >
                        {passwordLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Cambiar'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Configurar contraseña admin (solo para admins) */}
                {teacher.role === 'admin' && (
                  <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        disabled={loading}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Configurar contraseña admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm mx-auto">
                      <DialogHeader>
                        <DialogTitle>Contraseña de administrador</DialogTitle>
                        <DialogDescription>
                          Establece la contraseña que permitirá a otros usuarios convertirse en administradores.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="admin-password">Nueva contraseña admin</Label>
                          <Input
                            id="admin-password"
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            disabled={passwordLoading}
                            placeholder="Contraseña para usuarios admin (mín. 6 chars)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Los usuarios podrán usar esta contraseña para obtener permisos de administrador.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAdminPassword('')
                            setShowAdminDialog(false)
                          }}
                          disabled={passwordLoading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAdminPasswordChange}
                          disabled={passwordLoading}
                          className="bg-purple-primary hover:bg-purple-primary/90"
                        >
                          {passwordLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Guardar'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Foto de perfil */}
                <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {profilePhoto ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm mx-auto">
                    <DialogHeader>
                      <DialogTitle>Foto de perfil</DialogTitle>
                      <DialogDescription>
                        Agrega o cambia tu foto de perfil. Máximo 2MB.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {profilePhoto && (
                        <div className="flex justify-center">
                          <img 
                            src={profilePhoto} 
                            alt="Foto de perfil actual" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-purple-primary/20"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="photo-upload">Seleccionar imagen</Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos soportados: JPG, PNG, GIF. Máximo 2MB.
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="flex-col gap-2">
                      {profilePhoto && (
                        <Button 
                          variant="outline" 
                          onClick={removePhoto}
                          className="w-full border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Eliminar foto actual
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setShowPhotoDialog(false)}
                        className="w-full"
                      >
                        Cerrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="mt-4 p-3 bg-purple-primary/5 border border-purple-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> La foto de perfil se almacena localmente en tu dispositivo. 
                    Los cambios de contraseña se aplican inmediatamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black-soft">
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black-soft">Estado de la cuenta</span>
                  <Badge className={`text-xs ${
                    teacher.isActive ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {teacher.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black-soft">Rol en el sistema</span>
                  <Badge variant="outline" className="text-xs">
                    {teacher.role === 'admin' ? 'Administrador' : 'Maestro'}
                  </Badge>
                </div>
                
                {/* TEMPORALMENTE DESACTIVADO - Toggle de tema */}
                {/*
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black-soft">Tema de la aplicación</span>
                  <ThemeSwitch />
                </div>
                */}
                
                <Separator />
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-black-soft">
                    Datos seguros y locales
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu información personal y estadísticas se almacenan de forma segura en tu dispositivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}