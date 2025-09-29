import { useState, useEffect } from 'react'
import { Eye, EyeOff, User, Mail, Lock, LogIn, UserPlus, AlertCircle, Shield, Key } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { initDatabase, createTeacher, authenticateTeacher, type Teacher } from '../utils/unifiedDatabase'

type AuthState = 'login' | 'register' | 'authenticated'

interface AuthScreenProps {
  authState: AuthState
  onStateChange: (state: AuthState) => void
  onLogin: (teacher: Teacher) => void
}

export function AuthScreen({ authState, onStateChange, onLogin }: AuthScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminPassword: '', // Nueva contraseña para validar admin
    isAdmin: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [newTeacherCode, setNewTeacherCode] = useState('')
  const [newTeacherRole, setNewTeacherRole] = useState<'teacher' | 'admin'>('teacher')
  const [dbInitialized, setDbInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase()
        setDbInitialized(true)
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error)
        setError('Error al inicializar la aplicación. Por favor recarga la página.')
      }
    }

    initialize()
  }, [])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleLogin = async () => {
    if (!dbInitialized) {
      setError('La base de datos no está lista. Espera un momento.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos')
        return
      }

      if (!validateEmail(formData.email)) {
        setError('Por favor ingresa un email válido')
        return
      }

      // Usar la nueva función de autenticación
      const { teacher } = await authenticateTeacher(formData.email.toLowerCase(), formData.password)
      
      if (!teacher) {
        setError('Email o contraseña incorrectos')
        return
      }

      // Login exitoso
      console.log(`✅ Login exitoso: ${teacher.name} (${teacher.role === 'admin' ? 'Administrador' : 'Maestro'})`)
      onLogin(teacher)
      
    } catch (error: any) {
      console.error('Error en login:', error)
      if (error.message === 'Cuenta desactivada') {
        setError('Tu cuenta está desactivada. Contacta al administrador.')
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!dbInitialized) {
      setError('La base de datos no está ready. Espera un momento.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      // Validaciones básicas
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor completa todos los campos')
        return
      }

      if (formData.name.length < 2) {
        setError('El nombre debe tener al menos 2 caracteres')
        return
      }

      if (!validateEmail(formData.email)) {
        setError('Por favor ingresa un email válido')
        return
      }

      if (!validatePassword(formData.password)) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden')
        return
      }

      // Validación especial para administradores
      if (formData.isAdmin) {
        if (!formData.adminPassword) {
          setError('Debes ingresar la contraseña de administrador')
          return
        }
        
        // Verificar la contraseña de administrador (puedes cambiarla según sea necesario)
        const adminPassword = localStorage.getItem('admin_password') || 'FOXER_13'
        if (formData.adminPassword !== adminPassword) {
          setError('Contraseña de administrador incorrecta')
          return
        }
      }

      // Crear el nuevo usuario según el rol seleccionado
      const newUser = await createTeacher({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        selectedGroup: '',
        role: formData.isAdmin ? 'admin' : 'teacher',
        isActive: true
      })
      
      setNewTeacherRole(formData.isAdmin ? 'admin' : 'teacher')
      
      if (formData.isAdmin) {
        console.log('👑 Nuevo administrador creado:', newUser.name, newUser.email)
      } else {
        console.log('👨‍🏫 Nuevo maestro creado:', newUser.name, newUser.email)
      }

      setNewTeacherCode(newUser.personalCode)
      
      // Limpiar el formulario
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminPassword: '',
        isAdmin: false
      })

      // Auto-login después de registro exitoso
      setTimeout(() => {
        console.log('🔄 Iniciando sesión automática...')
        onLogin(newUser)
      }, 3000)

    } catch (error: any) {
      console.error('Error en registro:', error)
      if (error.message.includes('código único')) {
        setError('Error interno al generar tu código. Inténtalo de nuevo.')
      } else if (error.message.includes('ya existe')) {
        setError('Ya existe una cuenta con este email')
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('') // Limpiar error cuando el usuario escribe
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-purple-login bg-login-particles flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-purple-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-black-soft">Inicializando aplicación...</p>
            <p className="text-sm text-muted-foreground mt-2">Preparando la base de datos local</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (newTeacherCode) {
    return (
      <div className="min-h-screen bg-purple-login bg-login-particles flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              newTeacherRole === 'admin' ? 'bg-purple-600' : 'bg-green-600'
            }`}>
              {newTeacherRole === 'admin' ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl text-black-soft">
              ¡Cuenta Creada Exitosamente!
            </CardTitle>
            <p className="text-muted-foreground">
              {newTeacherRole === 'admin' ? 
                '👑 Nuevo administrador registrado con éxito' : 
                '✅ Tu registro ha sido completado'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Label className="text-black-soft">Tu código personal único:</Label>
              <div className="text-4xl font-bold text-purple-dark mt-2 mb-4 p-4 bg-purple-50 rounded-lg">
                {newTeacherCode}
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge className={`px-4 py-2 text-sm ${
                  newTeacherRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {newTeacherRole === 'admin' ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Administrador
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Maestro
                    </>
                  )}
                </Badge>
              </div>
            </div>
            
            <Alert className={`${
              newTeacherRole === 'admin' ? 
                'border-purple-200 bg-purple-50' : 
                'border-blue-200 bg-blue-50'
            }`}>
              {newTeacherRole === 'admin' ? (
                <Shield className="h-4 w-4 text-purple-600" />
              ) : (
                <User className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={`${
                newTeacherRole === 'admin' ? 'text-purple-800' : 'text-blue-800'
              }`}>
                <strong>¡Registro completado!</strong> Tu código personal es único y lo necesitarás para registrar tu entrada al comedor.
                {newTeacherRole === 'admin' && (
                  <>
                    <br /><br />
                    <strong>🎉 Privilegios de Administrador:</strong>
                    <br />• Acceso completo al panel de administración
                    <br />• Gestión de usuarios, grados y menús
                    <br />• Configuraciones del sistema
                    <br />• Estadísticas y reportes
                  </>
                )}
                <br /><br />
                <strong>⏱️ Iniciando sesión automáticamente en 3 segundos...</strong>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2 ${
                newTeacherRole === 'admin' ? 'border-purple-light' : 'border-blue-light'
              }`}></div>
              <p className="text-sm text-muted-foreground">
                Preparando tu sesión...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-login bg-login-particles flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            {authState === 'login' ? (
              <LogIn className="w-8 h-8 text-purple-dark" />
            ) : (
              <UserPlus className="w-8 h-8 text-purple-dark" />
            )}
          </div>
          <CardTitle className="text-2xl text-black-soft">
            {authState === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <p className="text-muted-foreground">
            {authState === 'login' 
              ? 'Accede a tu cuenta del sistema de comedor' 
              : 'Regístrate en el sistema de comedor escolar'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {authState === 'register' && (
              <div>
                <Label htmlFor="name" className="text-black-soft">
                  Nombre completo
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej: María González"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 border-purple-light focus:ring-purple-light"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-black-soft">
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@colegio.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 border-purple-light focus:ring-purple-light"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-black-soft">
                Contraseña
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10 border-purple-light focus:ring-purple-light"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authState === 'register' && (
              <>
                <div>
                  <Label htmlFor="confirmPassword" className="text-black-soft">
                    Confirmar contraseña
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 border-purple-light focus:ring-purple-light"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Opción de administrador */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="isAdmin"
                      checked={formData.isAdmin}
                      onCheckedChange={(checked) => handleInputChange('isAdmin', checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-dark" />
                        Registrarse como Administrador
                      </div>
                    </Label>
                  </div>
                  
                  {formData.isAdmin && (
                    <div className="mt-4 space-y-3">
                      <div className="text-xs text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-3 h-3 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Contraseña de Administrador Requerida</span>
                        </div>
                        <p className="text-yellow-700">
                          Necesitas la contraseña especial de administrador para completar este registro.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="adminPassword" className="text-sm font-medium text-purple-dark">
                          Contraseña de Administrador
                        </Label>
                        <div className="relative mt-2">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600" />
                          <Input
                            id="adminPassword"
                            type={showAdminPassword ? 'text' : 'password'}
                            placeholder="Contraseña especial de admin"
                            value={formData.adminPassword}
                            onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                            className="pl-10 pr-10 border-purple-light focus:ring-purple-light bg-purple-50"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-800"
                            disabled={isLoading}
                          >
                            {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!formData.isAdmin && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Los administradores tienen acceso completo al sistema, incluyendo gestión de usuarios, grados, menús y configuraciones.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <Button
            onClick={authState === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
            className={`w-full py-3 h-auto shadow-lg ${
              formData.isAdmin && authState === 'register'
                ? 'bg-purple-dark hover:bg-purple-dark/90'
                : 'bg-purple-dark hover:bg-purple-dark/90'
            } text-white`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {authState === 'login' ? 'Iniciando sesión...' : 
                 formData.isAdmin ? 'Creando administrador...' : 'Creando cuenta...'}
              </div>
            ) : (
              <>
                {authState === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </>
                ) : (
                  <>
                    {formData.isAdmin ? (
                      <Shield className="w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {formData.isAdmin ? 'Crear Administrador' : 'Crear Cuenta'}
                  </>
                )}
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {authState === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                onStateChange(authState === 'login' ? 'register' : 'login')
                setError('')
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  adminPassword: '',
                  isAdmin: false
                })
              }}
              disabled={isLoading}
              className="text-purple-dark hover:text-purple-dark/80 hover:bg-purple-dark/5"
            >
              {authState === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </Button>
          </div>

          {authState === 'register' && (
            <Alert className="border-blue-200 bg-blue-50">
              <User className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Al registrarte, recibirás un código personal único que usarás para registrar tu entrada al comedor escolar.
                {formData.isAdmin && (
                  <>
                    <br /><br />
                    <strong>🔐 Registro de Administrador:</strong> Se requiere contraseña especial para crear cuentas administrativas con privilegios completos del sistema.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}