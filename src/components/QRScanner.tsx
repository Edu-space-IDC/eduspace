import { useState, useRef, useEffect } from 'react'
import { Camera, ArrowLeft, Hash, CheckCircle, AlertCircle, User, Clock, X, Flashlight, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { getScheduleForGrade, getTimeUntilMeal } from '../utils/scheduleUtils'
import { createCameraManager, type CameraManager, type CameraError } from '../utils/cameraUtils'
import { createMealRecord, getLatestMealRecordByTeacher, type Teacher, type MealRecord } from '../utils/database'

interface QRScannerProps {
  teacher: Teacher
  onBack: () => void
}

export function QRScanner({ teacher, onBack }: QRScannerProps) {
  const [mode, setMode] = useState<'scanner' | 'manual' | 'personal'>('scanner')
  const [manualCode, setManualCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'camera-loading' | 'scanning' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [existingRecord, setExistingRecord] = useState<MealRecord | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraManagerRef = useRef<CameraManager | null>(null)

  const schedule = teacher.selectedGroup ? getScheduleForGrade(teacher.selectedGroup) : null
  const timeUntilMeal = teacher.selectedGroup ? getTimeUntilMeal(teacher.selectedGroup) : null

  useEffect(() => {
    // Verificar si ya hay un registro de hoy
    checkExistingRecord()
    
    return () => {
      // Cleanup when component unmounts
      stopCamera()
    }
  }, [teacher.id])

  const checkExistingRecord = async () => {
    try {
      const record = await getLatestMealRecordByTeacher(teacher.id)
      setExistingRecord(record)
    } catch (error) {
      console.error('Error al verificar registro existente:', error)
    }
  }

  const stopCamera = () => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stopCamera()
      cameraManagerRef.current = null
    }
    setCameraActive(false)
    setFlashOn(false)
    setHasFlash(false)
    setStatus('idle')
  }

  const handleStartScan = async () => {
    if (cameraActive) {
      stopCamera()
      return
    }

    if (!videoRef.current) {
      setCameraError('Error: elemento de video no disponible')
      return
    }

    setStatus('camera-loading')
    setMessage('Solicitando acceso a la cámara...')
    setCameraError('')

    try {
      // Crear manager de cámara
      cameraManagerRef.current = createCameraManager({
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 3
      })

      // Iniciar la cámara
      await cameraManagerRef.current.startCamera(videoRef.current)
      
      // Iniciar el escaneo QR
      await cameraManagerRef.current.startQRScanning(handleQRDetected)

      // Verificar si tiene flash
      const hasFlashlight = await cameraManagerRef.current.hasFlashlight()
      setHasFlash(hasFlashlight)

      setCameraActive(true)
      setStatus('scanning')
      setMessage('Apunta la cámara hacia el código QR del comedor')

    } catch (error: any) {
      console.error('Error al iniciar la cámara:', error)
      setStatus('error')
      setCameraActive(false)
      
      const cameraErr = error as CameraError
      
      switch (cameraErr.type) {
        case 'permission':
          setCameraError('Acceso denegado. Ve a Configuración → Privacidad → Cámara y permite el acceso para este sitio.')
          break
        case 'hardware':
          setCameraError('Problema con la cámara. Verifica que no esté siendo usada por otra aplicación.')
          break
        case 'browser':
          setCameraError('Tu navegador no soporta el acceso a la cámara. Intenta usar Chrome, Firefox o Safari.')
          break
        default:
          setCameraError(`Error de cámara: ${cameraErr.message}`)
      }
      
      setMessage('No se pudo activar la cámara')
    }
  }

  const handleQRDetected = async (qrData: string) => {
    if (status !== 'scanning') return // Evitar múltiples detecciones
    
    setStatus('success')
    setMessage('¡Código QR detectado! Procesando registro...')
    
    // Parar la cámara
    stopCamera()
    
    try {
      await processRegistration(qrData, 'qr')
    } catch (error) {
      console.error('Error al procesar registro:', error)
      setStatus('error')
      setMessage('Error al procesar el registro. Inténtalo de nuevo.')
    }
  }

  const processRegistration = async (code: string, method: 'qr' | 'manual' | 'personal') => {
    if (!teacher.selectedGroup || !schedule) {
      setStatus('error')
      setMessage('Debes seleccionar un grupo antes de registrarte')
      return
    }

    try {
      // Determinar el estado inicial basado en el horario
      let initialStatus: 'registered' | 'eating' | 'finished' = 'registered'
      
      if (timeUntilMeal === 'En progreso') {
        initialStatus = 'eating'
      } else if (timeUntilMeal === 'Terminado') {
        initialStatus = 'finished'
      }

      // Crear el registro en la base de datos
      const mealRecord = await createMealRecord({
        teacherId: teacher.id,
        teacherName: teacher.name,
        group: teacher.selectedGroup,
        status: initialStatus,
        registeredAt: new Date().toISOString(),
        qrCode: method === 'qr' ? code : undefined,
        schedule: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timeSlot: schedule.timeSlot,
          description: schedule.description
        }
      })

      setExistingRecord(mealRecord)

      // Mensaje de éxito personalizado
      let successMessage = ''
      switch (initialStatus) {
        case 'eating':
          successMessage = `¡Registrado! Ya puedes comer. Tienes hasta las ${schedule.endTime} (${schedule.durationMinutes} minutos).`
          break
        case 'finished':
          successMessage = `Registro completado, pero el horario de tu grupo (${schedule.timeSlot}) ya finalizó.`
          break
        default:
          successMessage = `¡Registrado exitosamente! Tu horario es de ${schedule.timeSlot}. El sistema te marcará automáticamente cuando sea tu turno.`
      }
      
      setMessage(successMessage)
      setStatus('success')

    } catch (error) {
      console.error('Error al crear registro:', error)
      setStatus('error')
      setMessage('Error al guardar el registro. Inténtalo de nuevo.')
    }
  }

  const toggleFlash = async () => {
    if (!cameraManagerRef.current || !hasFlash) return
    
    try {
      const isFlashOn = await cameraManagerRef.current.toggleFlashlight()
      setFlashOn(isFlashOn)
    } catch (error) {
      console.error('Error al controlar flash:', error)
    }
  }

  const switchCamera = async () => {
    if (!cameraManagerRef.current) return
    
    try {
      await cameraManagerRef.current.switchCamera()
      setMessage('Cámara cambiada')
    } catch (error) {
      console.error('Error al cambiar cámara:', error)
      setMessage('No se pudo cambiar la cámara')
    }
  }

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setStatus('error')
      setMessage('Por favor ingresa un código válido.')
      return
    }

    setStatus('scanning')
    setMessage('Verificando código...')
    
    // Simulación de verificación de código del comedor
    setTimeout(async () => {
      const validCodes = ['COMEDOR2024', 'CAFETERIA01', 'MEAL001', 'LUNCH123']
      const isValid = validCodes.includes(manualCode.trim())
      
      if (isValid) {
        await processRegistration(manualCode.trim(), 'manual')
      } else {
        setStatus('error')
        setMessage('Código inválido. Verifica con el personal del comedor.')
      }
    }, 1500)
  }

  const handlePersonalCodeSubmit = async () => {
    setStatus('scanning')
    setMessage('Procesando tu código personal...')
    
    setTimeout(async () => {
      await processRegistration(teacher.personalCode, 'personal')
    }, 1000)
  }

  const resetStatus = () => {
    setStatus('idle')
    setMessage('')
    setManualCode('')
    setCameraError('')
  }

  const getStatusColor = () => {
    if (!timeUntilMeal) return 'bg-gray-500'
    
    switch (timeUntilMeal) {
      case 'En progreso':
      case 'Ahora':
        return 'bg-green-600'
      case 'Terminado':
        return 'bg-red-500'
      default:
        return 'bg-orange-500'
    }
  }

  const getStatusText = () => {
    if (!timeUntilMeal) return 'Sin horario'
    
    switch (timeUntilMeal) {
      case 'En progreso':
        return 'Tu turno está activo'
      case 'Ahora':
        return '¡Es tu turno!'
      case 'Terminado':
        return 'Turno finalizado'
      default:
        return `Falta ${timeUntilMeal}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-purple-dark text-white px-6 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10 p-2 h-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-medium text-white">
                Registrar Entrada
              </h1>
              <p className="text-blue-light text-sm">
                {teacher.selectedGroup ? `Grupo: ${teacher.selectedGroup}` : 'Selecciona un grupo primero'}
              </p>
            </div>
          </div>

          {/* Info del profesor y horario */}
          <div className="space-y-3">
            <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{teacher.name}</p>
                <p className="text-blue-light text-xs">Código: {teacher.personalCode}</p>
              </div>
            </div>

            {/* Estado del horario */}
            {schedule && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-light" />
                    <div>
                      <p className="text-white text-sm font-medium">{schedule.timeSlot}</p>
                      <p className="text-blue-light text-xs">{schedule.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor()} text-white text-xs`}>
                    {getStatusText()}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Mostrar registro existente */}
          {existingRecord && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Ya tienes un registro de hoy: <strong>{existingRecord.status === 'eating' ? 'Comiendo' : existingRecord.status === 'finished' ? 'Terminado' : 'Registrado'}</strong> 
                {' '}para el grupo <strong>{existingRecord.group}</strong> a las{' '}
                {new Date(existingRecord.registeredAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta si no está en su horario */}
          {schedule && timeUntilMeal && timeUntilMeal !== 'En progreso' && timeUntilMeal !== 'Ahora' && !existingRecord && (
            <Alert className={`${
              timeUntilMeal === 'Terminado' 
                ? 'border-red-200 bg-red-50' 
                : 'border-yellow-200 bg-yellow-50'
            }`}>
              <AlertCircle className={`h-4 w-4 ${
                timeUntilMeal === 'Terminado' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <AlertDescription className={`${
                timeUntilMeal === 'Terminado' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {timeUntilMeal === 'Terminado' 
                  ? `El horario de tu grupo (${schedule.timeSlot}) ya ha finalizado, pero aún puedes registrarte.`
                  : `Tu horario es de ${schedule.timeSlot}. Aún no es tu turno (falta ${timeUntilMeal}), pero puedes registrarte anticipadamente.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Error de cámara */}
          {cameraError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p>{cameraError}</p>
                  <div className="text-sm">
                    <p><strong>Soluciones:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Verifica los permisos de cámara en tu navegador</li>
                      <li>Asegúrate de usar HTTPS o localhost</li>
                      <li>Cierra otras aplicaciones que usen la cámara</li>
                      <li>Usa los métodos manual o código personal como alternativa</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Selector de modo */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === 'scanner' ? 'default' : 'outline'}
              onClick={() => {
                setMode('scanner')
                resetStatus()
                if (cameraActive) stopCamera()
              }}
              className={`text-xs ${
                mode === 'scanner' 
                  ? 'bg-purple-dark text-white' 
                  : 'border-purple-light text-purple-dark'
              }`}
            >
              <Camera className="w-3 h-3 mr-1" />
              QR
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => {
                setMode('manual')
                resetStatus()
                if (cameraActive) stopCamera()
              }}
              className={`text-xs ${
                mode === 'manual' 
                  ? 'bg-purple-dark text-white' 
                  : 'border-purple-light text-purple-dark'
              }`}
            >
              <Hash className="w-3 h-3 mr-1" />
              Manual
            </Button>
            <Button
              variant={mode === 'personal' ? 'default' : 'outline'}
              onClick={() => {
                setMode('personal')
                resetStatus()
                if (cameraActive) stopCamera()
              }}
              className={`text-xs ${
                mode === 'personal' 
                  ? 'bg-purple-dark text-white' 
                  : 'border-purple-light text-purple-dark'
              }`}
            >
              <User className="w-3 h-3 mr-1" />
              Personal
            </Button>
          </div>

          {/* Área principal */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black-soft">
                {mode === 'scanner' ? (
                  <>
                    <Camera className="w-5 h-5 text-blue-light" />
                    Escáner QR Real
                  </>
                ) : mode === 'manual' ? (
                  <>
                    <Hash className="w-5 h-5 text-blue-light" />
                    Código Manual
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-blue-light" />
                    Código Personal
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mode === 'scanner' ? (
                <div className="text-center space-y-4">
                  {/* Área del video real */}
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden relative">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ display: cameraActive ? 'block' : 'none' }}
                      />
                      
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          {status === 'camera-loading' ? (
                            <div className="text-center text-white">
                              <div className="w-16 h-16 border-4 border-blue-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-black-soft">Iniciando cámara...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-muted-foreground">
                                Presiona el botón para activar la cámara
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Controles de la cámara */}
                      {cameraActive && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          {hasFlash && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={toggleFlash}
                              className={`${flashOn ? 'bg-yellow-500 text-white' : 'bg-white/80'}`}
                            >
                              <Flashlight className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={switchCamera}
                            className="bg-white/80"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={stopCamera}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Marco de escaneo cuando está activo */}
                      {cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-48 border-2 border-green-400 rounded-lg">
                            <div className="w-full h-full border border-white/50 rounded-lg relative">
                              {/* Esquinas del marco */}
                              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleStartScan}
                    disabled={status === 'camera-loading'}
                    className={`w-full py-3 h-auto ${
                      cameraActive 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-light hover:bg-blue-light/90 text-white'
                    }`}
                  >
                    {status === 'camera-loading' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cargando cámara...
                      </div>
                    ) : cameraActive ? (
                      <>
                        <X className="w-5 h-5 mr-2" />
                        Detener Cámara
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Activar Cámara Real
                      </>
                    )}
                  </Button>

                  {cameraActive && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Cámara activa.</strong> Apunta hacia el código QR del comedor para escanearlo automáticamente. 
                        El sistema detectará el código y te registrará instantáneamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : mode === 'manual' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manual-code" className="text-black-soft">
                      Código del Comedor
                    </Label>
                    <Input
                      id="manual-code"
                      type="text"
                      placeholder="Ej: COMEDOR2024"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="mt-2 border-purple-light focus:ring-purple-light"
                      disabled={status === 'scanning'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingresa el código proporcionado por el personal del comedor
                    </p>
                  </div>

                  <div className="bg-blue-light/10 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Códigos válidos de ejemplo:</strong> COMEDOR2024, CAFETERIA01, MEAL001, LUNCH123
                    </p>
                  </div>

                  <Button
                    onClick={handleManualSubmit}
                    disabled={status === 'scanning' || !manualCode.trim()}
                    className="w-full bg-purple-dark hover:bg-purple-dark/90 text-white py-3 h-auto"
                  >
                    {status === 'scanning' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verificando...
                      </div>
                    ) : (
                      <>
                        <Hash className="w-5 h-5 mr-2" />
                        Verificar Código
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-purple-dark rounded-full flex items-center justify-center mx-auto">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-black-soft mb-2">
                        Usar tu código personal
                      </h3>
                      <div className="text-3xl font-bold text-purple-dark mb-2">
                        {teacher.personalCode}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Este es tu código único generado automáticamente
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-light/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-light mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-black-soft">
                          Registro automático con código personal
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tu entrada será registrada en la base de datos local usando tu código único.
                          Este método es el más rápido y no requiere cámara.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePersonalCodeSubmit}
                    disabled={status === 'scanning'}
                    className="w-full bg-purple-dark hover:bg-purple-dark/90 text-white py-3 h-auto"
                  >
                    {status === 'scanning' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Registrando...
                      </div>
                    ) : (
                      <>
                        <User className="w-5 h-5 mr-2" />
                        Registrar con Mi Código
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mensajes de estado */}
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
                <Camera className="h-4 w-4 text-blue-600" />
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

          {/* Botón de éxito */}
          {status === 'success' && (
            <Button
              onClick={() => {
                onBack()
                // Refrescar datos
                checkExistingRecord()
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-auto"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Button>
          )}

          {/* Información adicional */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-medium text-black-soft mb-2">
                Información del Sistema
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Base de datos:</strong> Los datos se guardan localmente en tu navegador</p>
                <p>• <strong>Cámara real:</strong> Usa la cámara de tu dispositivo para escanear</p>
                <p>• <strong>Código único:</strong> Tu código {teacher.personalCode} es único e irrepetible</p>
                <p>• <strong>Registro automático:</strong> Tu estado se actualiza según el horario</p>
                {schedule && (
                  <p>• <strong>Tu horario:</strong> {schedule.timeSlot} ({schedule.durationMinutes} minutos)</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}