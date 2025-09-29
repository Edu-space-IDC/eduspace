// ARCHIVO TEMPORAL - ELIMINADO

export function TeacherDashboard({ teacher, onGroupSelect }: TeacherDashboardProps) {
  const [todayRecords, setTodayRecords] = useState<MealRecord[]>([])
  const [personalCode, setPersonalCode] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isStartingMeal, setIsStartingMeal] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [selectedGradeInfo, setSelectedGradeInfo] = useState<Grade | null>(null)
  const [todayMenu, setTodayMenu] = useState<MenuEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [todayAttendanceRecords, setTodayAttendanceRecords] = useState<StudentAttendanceRecord[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [allGrades, setAllGrades] = useState<Grade[]>([])
  const [availableGroups, setAvailableGroups] = useState<string[]>([])

  // Helper function to safely convert to string
  const safeStringify = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') return String(value?.name || value?.id || '')
    return String(value)
  }

  // Verificar que teacher esté definido
  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error: Información de maestro no disponible</p>
            <p className="text-sm text-muted-foreground mt-2">Por favor, inicia sesión nuevamente</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    loadData()
    loadSelectedGradeInfo()
    loadTodayMenu()
    loadAttendanceRecords()
    loadAllGrades()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadData()
      loadTodayMenu()
      loadAttendanceRecords()
      loadAllGrades()
      setCurrentTime(new Date())
    }, 30000)

    // Actualizar hora cada segundo para el timer
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Escuchar eventos de menú desde AdminDashboard
    const handleMenuUpdate = (data?: any) => {
      console.log('🔄 Evento de menú recibido en TeacherDashboard:', data)
      loadTodayMenu()
    }
    
    const handleMenuDelete = (data?: any) => {
      console.log('🗑️ Evento de eliminación de menú recibido:', data)
      loadTodayMenu()
    }

    eventBus.on('menuUpdated', handleMenuUpdate)
    eventBus.on('menuDeleted', handleMenuDelete)
    
    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
      eventBus.off('menuUpdated', handleMenuUpdate)
      eventBus.off('menuDeleted', handleMenuDelete)
    }
  }, [safeStringify(teacher?.selectedGroup)])

  const loadData = async () => {
    try {
      const records = await getTodayMealRecords()
      
      // Limpiar datos de registros para evitar referencias DOM
      const cleanRecords = records.map(record => ({
        id: safeStringify(record.id),
        teacherId: safeStringify(record.teacherId),
        teacherName: safeStringify(record.teacherName || ''),
        teacherCode: safeStringify(record.teacherCode || ''),
        selectedGroup: safeStringify(record.selectedGroup || ''),
        registeredAt: safeStringify(record.registeredAt || record.timestamp || ''),
        enteredAt: record.enteredAt ? safeStringify(record.enteredAt) : undefined,
        method: safeStringify(record.method || 'personal_code'),
        status: safeStringify(record.status || 'registered'),
        timestamp: record.timestamp ? safeStringify(record.timestamp) : safeStringify(record.registeredAt || '')
      }))
      
      setTodayRecords(cleanRecords)
      
      console.log('📊 Registros cargados (limpios):', {
        total: cleanRecords.length,
        registrados: cleanRecords.filter(r => r.status === 'registered').length,
        comiendo: cleanRecords.filter(r => r.status === 'eating').length
      })
      
    } catch (error) {
      console.error('❌ Error cargando registros:', error)
      showMessage('Error al cargar los registros del día', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedGradeInfo = async () => {
    if (teacher?.selectedGroup) {
      try {
        const grades = await getAllGrades()
        const gradeInfo = grades.find(g => safeStringify(g.name) === safeStringify(teacher.selectedGroup))
        setSelectedGradeInfo(gradeInfo || null)
      } catch (error) {
        console.error('Error cargando información del grado:', error)
      }
    }
  }

  const loadTodayMenu = async () => {
    try {
      console.log('🍽️ Cargando menú del día...')
      const menu = await getTodayMenu()
      console.log('🍽️ Menú obtenido:', menu)
      setTodayMenu(menu)
    } catch (error) {
      console.error('Error cargando menú del día:', error)
    }
  }

  const loadAttendanceRecords = async () => {
    if (!teacher?.id) return
    
    try {
      const today = getLocalDateString()
      const records = await getStudentAttendanceByTeacherAndDate(teacher.id, today)
      setTodayAttendanceRecords(records)
    } catch (error) {
      console.error('Error cargando registros de asistencia:', error)
    }
  }

  const loadAllGrades = async () => {
    try {
      const grades = await getAllGrades()
      
      // Limpiar datos de grados para evitar referencias DOM
      const cleanGrades = grades.map(grade => ({
        id: safeStringify(grade.id),
        name: safeStringify(grade.name),
        category: safeStringify(grade.category),
        isActive: Boolean(grade.isActive),
        scheduleStart: safeStringify(grade.scheduleStart || ''),
        scheduleEnd: safeStringify(grade.scheduleEnd || ''),
        durationInMinutes: Number(grade.durationInMinutes || 0)
      }))
      
      setAllGrades(cleanGrades)
      
      // Calcular grupos disponibles usando datos limpios
      const cleanTeacherGroup = safeStringify(teacher?.selectedGroup)
      const occupiedGroups = todayRecords.map(record => safeStringify(record.selectedGroup))
      
      const currentAvailableGroups = cleanGrades
        .filter(grade => 
          Boolean(grade.isActive) && 
          !occupiedGroups.includes(safeStringify(grade.name)) &&
          safeStringify(grade.name) !== cleanTeacherGroup
        )
        .map(grade => safeStringify(grade.name))
      
      setAvailableGroups(currentAvailableGroups)
      
      console.log('📚 Grados cargados (limpios):', {
        total: cleanGrades.length,
        activos: cleanGrades.filter(g => g.isActive).length,
        disponibles: currentAvailableGroups.length
      })
      
    } catch (error) {
      console.error('❌ Error cargando información de los grados:', error)
      showMessage('Error al cargar información de grados', 'error')
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  // Función utilitaria para limpiar datos y evitar DataCloneError
  const sanitizeForIndexedDB = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (obj instanceof Date) return obj.toISOString()
    if (Array.isArray(obj)) return obj.map(sanitizeForIndexedDB)
    
    // Para objetos, crear una copia limpia
    const cleaned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        // Evitar funciones, elementos DOM, eventos, etc.
        if (typeof value === 'function' || 
            (typeof value === 'object' && value !== null && 
             (value.nodeType || value instanceof Event || value instanceof HTMLElement))) {
          continue // Omitir propiedades problemáticas
        }
        cleaned[key] = sanitizeForIndexedDB(value)
      }
    }
    return cleaned
  }

  const handlePersonalCodeSubmit = async (selectedGroupOverride?: string) => {
    // Crear variables limpias sin referencias DOM
    const cleanCode = safeStringify(personalCode).trim().toUpperCase()
    const cleanGroupOverride = selectedGroupOverride ? safeStringify(selectedGroupOverride) : undefined
    const cleanTeacherId = safeStringify(teacher?.id)
    const cleanTeacherName = safeStringify(teacher?.name)
    const cleanTeacherGroup = safeStringify(teacher?.selectedGroup)
    
    if (!cleanCode) {
      showMessage('Por favor ingresa un código personal', 'error')
      return
    }

    if (!cleanTeacherGroup && !cleanGroupOverride) {
      showMessage('Debes seleccionar tu grado antes de registrar entrada', 'error')
      return
    }

    if (!cleanTeacherId || !cleanTeacherName) {
      showMessage('Error: Información de maestro no válida', 'error')
      return
    }

    setIsRegistering(true)

    try {
      // Buscar el maestro por código personal
      const foundTeacher = await getTeacherByPersonalCode(cleanCode)
      
      if (!foundTeacher) {
        showMessage('Código personal no encontrado', 'error')
        return
      }

      if (!foundTeacher.isActive) {
        showMessage('Esta cuenta está desactivada', 'error')
        return
      }

      // Crear variables limpias del maestro encontrado
      const cleanFoundTeacherId = safeStringify(foundTeacher.id)
      const cleanFoundTeacherName = safeStringify(foundTeacher.name)
      const cleanFoundTeacherCode = safeStringify(foundTeacher.personalCode)
      const cleanFoundTeacherGroup = safeStringify(foundTeacher.selectedGroup)

      // El grupo a usar
      const targetGroup = cleanGroupOverride || cleanFoundTeacherGroup || cleanTeacherGroup

      if (!targetGroup) {
        showMessage('No se pudo determinar el grupo objetivo', 'error')
        return
      }

      // Verificar si ya se registró hoy EN ESTE GRUPO ESPECÍFICO
      const existingRecord = todayRecords.find(record => 
        safeStringify(record.teacherId) === cleanFoundTeacherId && 
        safeStringify(record.selectedGroup) === targetGroup
      )

      if (existingRecord) {
        try {
          const formattedTime = formatDateTimeWithAmPm(existingRecord.timestamp || existingRecord.registeredAt)
          showMessage(`${cleanFoundTeacherName} ya se registró en ${targetGroup} el ${formattedTime}`, 'error')
        } catch (error) {
          console.error('Error formateando hora del registro existente:', error)
          showMessage(`${cleanFoundTeacherName} ya se registró en ${targetGroup} hoy`, 'error')
        }
        return
      }

      // Crear objeto de datos completamente serializable
      const cleanRecordData = {
        teacherId: cleanFoundTeacherId,
        teacherName: cleanFoundTeacherName,
        teacherCode: cleanFoundTeacherCode,
        selectedGroup: targetGroup,
        registeredAt: new Date().toISOString(),
        method: 'personal_code' as const,
        status: 'registered' as const
      }

      // Verificar que no hay referencias DOM antes de crear el registro
      console.log('📋 Datos a registrar (limpios):', {
        teacherId: cleanRecordData.teacherId,
        teacherName: cleanRecordData.teacherName,
        selectedGroup: cleanRecordData.selectedGroup,
        method: cleanRecordData.method,
        status: cleanRecordData.status
      })

      const newRecord = await createMealRecord(cleanRecordData)

      // Actualizar la lista local
      setTodayRecords(prev => [newRecord, ...prev])
      setPersonalCode('')
      
      // Mensaje personalizado si se registró a sí mismo
      if (cleanFoundTeacherId === cleanTeacherId) {
        if (cleanGroupOverride && cleanGroupOverride !== cleanTeacherGroup) {
          showMessage(`✅ Te has registrado para cubrir el grupo ${targetGroup}`, 'success')
        } else {
          showMessage(`✅ Te has registrado en fila para comer`, 'success')
        }
      } else {
        if (cleanGroupOverride) {
          showMessage(`✅ ${cleanFoundTeacherName} se registró para cubrir ${targetGroup}`, 'success')
        } else {
          showMessage(`✅ ${cleanFoundTeacherName} está en fila para comer en ${targetGroup}`, 'success')
        }
      }
      
      console.log('✅ Registro en fila exitoso:', cleanFoundTeacherName, cleanFoundTeacherCode, targetGroup)

    } catch (error) {
      console.error('❌ Error en registro:', error)
      // Verificar si es un DataCloneError específicamente
      if (error instanceof Error && error.name === 'DataCloneError') {
        console.error('🚨 DataCloneError detectado - problema con objeto no serializable')
        showMessage('Error de serialización de datos. Inténtalo de nuevo.', 'error')
      } else {
        showMessage('Error al registrar entrada. Inténtalo de nuevo.', 'error')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  const handleStartEating = async () => {
    // Crear variables limpias
    const cleanTeacherGroup = safeStringify(teacher?.selectedGroup)
    const cleanTeacherId = safeStringify(teacher?.id)
    const cleanTeacherName = safeStringify(teacher?.name)

    if (!cleanTeacherGroup) {
      showMessage('Debes seleccionar tu grado antes de empezar a comer', 'error')
      return
    }

    if (!cleanTeacherId) {
      showMessage('Error: ID de maestro no válido', 'error')
      return
    }

    // Buscar el registro del maestro actual para hoy usando datos limpios
    const myRecord = todayRecords.find(record => 
      safeStringify(record.teacherId) === cleanTeacherId
    )

    if (!myRecord) {
      showMessage('Primero debes registrarte con tu código personal', 'error')
      return
    }

    if (myRecord.enteredAt) {
      showMessage('Ya iniciaste tu tiempo de comida', 'info')
      return
    }

    setIsStartingMeal(true)

    try {
      const cleanRecordId = safeStringify(myRecord.id)
      const currentTime = new Date().toISOString()
      
      // Crear datos limpios para la actualización
      const updateData = sanitizeForIndexedDB({
        enteredAt: currentTime,
        status: 'eating'
      })

      console.log('🍽️ Iniciando comida para registro:', {
        recordId: cleanRecordId,
        teacherId: cleanTeacherId,
        teacherName: cleanTeacherName,
        group: cleanTeacherGroup
      })

      // Actualizar el registro para marcar que empezó a comer
      const updatedRecord = await updateMealRecord(cleanRecordId, updateData)
      
      // Actualizar la lista local con datos limpios
      setTodayRecords(prev => 
        prev.map(record => 
          safeStringify(record.id) === cleanRecordId ? sanitizeForIndexedDB(updatedRecord) : record
        )
      )
      
      showMessage(`🍽️ ${cleanTeacherGroup} está comiendo. ¡Buen provecho!`, 'success')
      console.log('✅ Inicio de comida exitoso:', cleanTeacherName, cleanTeacherGroup)

    } catch (error) {
      console.error('❌ Error iniciando comida:', error)
      if (error instanceof Error && error.name === 'DataCloneError') {
        console.error('🚨 DataCloneError en inicio de comida - problema con objeto no serializable')
        showMessage('Error de serialización al iniciar comida. Inténtalo de nuevo.', 'error')
      } else {
        showMessage('Error al iniciar el tiempo de comida. Inténtalo de nuevo.', 'error')
      }
    } finally {
      setIsStartingMeal(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Evitar pasar el evento completo - solo usar la propiedad key
    const key = e.key
    if (key === 'Enter') {
      e.preventDefault()
      handlePersonalCodeSubmit()
    }
  }

  const getCurrentTimeInfo = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const currentTimeFormatted = formatTimeWithAmPm(currentTime)
    
    return {
      currentTime,
      currentTimeFormatted,
      isLunchTime: hour >= 7 && hour <= 12
    }
  }

  const { currentTime: currentTimeStr, currentTimeFormatted, isLunchTime } = getCurrentTimeInfo()

  const formatTime = (timeString: string) => {
    try {
      return formatTimeWithAmPm(timeString)
    } catch (error) {
      console.error('Error formateando tiempo:', error)
      return timeString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return formatDateTimeWithAmPm(dateString)
    } catch (error) {
      console.error('Error formateando tiempo:', error)
      // Fallback manual si hay error
      try {
        return new Date(dateString).toLocaleString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace('AM', 'a.m.').replace('PM', 'p.m.')
      } catch (fallbackError) {
        return dateString
      }
    }
  }

  // Variables limpias para evitar "[object Object]"
  const displayTeacherGroup = safeStringify(teacher?.selectedGroup)
  const displayTeacherId = safeStringify(teacher?.id)
  
  // Filtrar registros del grupo actual usando datos limpios
  const filteredRecords = displayTeacherGroup 
    ? todayRecords.filter(record => safeStringify(record.selectedGroup) === displayTeacherGroup)
    : todayRecords

  // Obtener todos mis registros de hoy usando datos limpios
  const myTodayRecords = todayRecords.filter(record => safeStringify(record.teacherId) === displayTeacherId)
  
  // Verificar si el maestro actual ya se registró hoy (en su grupo principal) usando datos limpios
  const myTodayRecord = todayRecords.find(record => 
    safeStringify(record.teacherId) === displayTeacherId && 
    safeStringify(record.selectedGroup) === displayTeacherGroup
  )
  const canStartEating = myTodayRecord && !myTodayRecord.enteredAt

  // Calcular grupos disponibles usando datos limpios (sin maestro registrado aún)
  const occupiedGroupsClean = todayRecords.map(record => safeStringify(record.selectedGroup))
  const currentAvailableGroupsClean = allGrades
    .filter(grade => 
      Boolean(grade.isActive) && 
      !occupiedGroupsClean.includes(safeStringify(grade.name)) &&
      safeStringify(grade.name) !== displayTeacherGroup
    )
    .map(grade => safeStringify(grade.name))

  // Calcular estado actual del maestro
  let myCurrentStatus = null
  let remainingTime = 0
  if (myTodayRecord && selectedGradeInfo) {
    myCurrentStatus = calculateTeacherStatus(myTodayRecord, selectedGradeInfo, currentTime)
    remainingTime = getRemainingTimeInMinutes(myTodayRecord, selectedGradeInfo)
  }

  const handleAttendanceSave = (record: StudentAttendanceRecord) => {
    setTodayAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(r => r.id === record.id)
      if (existingIndex >= 0) {
        // Actualizar registro existente
        const updated = [...prev]
        updated[existingIndex] = record
        return updated
      } else {
        // Agregar nuevo registro
        return [record, ...prev]
      }
    })
    showMessage('Registro de asistencia guardado exitosamente', 'success')
  }

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="bg-[rgba(105,107,205,1)] text-white px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <UserAvatar teacher={teacher} size="lg" />
            <div className="flex-1">
              <h1 className="text-2xl font-medium text-white">
                ¡Hola, {safeStringify(teacher?.name) || 'Usuario'}!
              </h1>
              <p className="text-[rgba(238,240,243,1)] text-sm">
                Sistema de Control de Acceso al Comedor
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-white/30">
                  {teacher?.role === 'admin' ? 'Administrador' : 'Maestro'}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 font-mono">
                  {safeStringify(teacher?.personalCode) || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Información del tiempo */}
          <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-[rgba(219,97,97,0)]">
              <Clock className="w-5 h-5 text-blue-light" />
              <div>
                <p className="text-white font-medium">{currentTimeFormatted}</p>
                <p className="text-[rgba(255,255,255,1)] text-sm">
                  {formatDateLong(getLocalDateString())}
                </p>
                <p className="text-[rgba(224,231,241,1)] text-xs">
                  {isLunchTime ? 'Horario de comedor activo' : 'Fuera del horario de comedor'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[rgba(224,231,241,1)]">Estado del sistema:</p>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isLunchTime ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <p className="text-xs text-white">
                  {isLunchTime ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Mensaje de estado */}
          {message && (
            <Alert className={`mb-6 ${
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

          {/* Estado actual del maestro */}
          {myTodayRecord && (
            <Card className={`mb-6 ${
              myCurrentStatus === 'eating' ? 'border-green-200' :
              myCurrentStatus === 'finished' ? 'border-gray-200' :
              'border-blue-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {myCurrentStatus === 'eating' ? (
                    <>
                      <ChefHat className="w-5 h-5 text-green-600" />
                      Estás Comiendo
                    </>
                  ) : myCurrentStatus === 'finished' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-gray-600" />
                      Comida Terminada
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-blue-600" />
                      En Fila para Comer
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge className={`${
                      myCurrentStatus === 'eating' ? 'bg-green-600 text-white' :
                      myCurrentStatus === 'finished' ? 'bg-gray-500 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {myCurrentStatus === 'eating' ? 'Comiendo' :
                       myCurrentStatus === 'finished' ? 'Terminado' :
                       'En fila'}
                    </Badge>
                  </div>

                  {myTodayRecord.registeredAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registrado:</span>
                      <span className="text-sm font-mono">{formatDateTime(myTodayRecord.registeredAt)}</span>
                    </div>
                  )}

                  {myTodayRecord.enteredAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Comenzó a comer:</span>
                      <span className="text-sm font-mono">{formatDateTime(myTodayRecord.enteredAt)}</span>
                    </div>
                  )}

                  {myCurrentStatus === 'eating' && selectedGradeInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tiempo restante:</span>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-mono font-medium text-green-600">
                            {remainingTime > 0 ? `${remainingTime} min` : 'Tiempo terminado'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            remainingTime > 5 ? 'bg-green-500' :
                            remainingTime > 2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.max(0, (remainingTime / getGradeDurationInMinutes(selectedGradeInfo)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* BOTÓN "ESTÁ COMIENDO" - Solo aparece si está registrado pero no ha empezado a comer */}
                  {canStartEating && (
                    <div className="pt-3 border-t">
                      <Button
                        onClick={handleStartEating}
                        disabled={isStartingMeal}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {isStartingMeal ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Iniciando...
                          </div>
                        ) : (
                          <>
                            <ChefHat className="w-5 h-5 mr-2" />
                            Está Comiendo
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selección de grado */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5 text-purple-light" />
                Grado Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayTeacherGroup ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-black-soft">{displayTeacherGroup}</p>
                      {selectedGradeInfo && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <strong>Categoría:</strong> {getCategoryDisplayName(selectedGradeInfo.category)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Horario de comida:</strong> {formatTime(selectedGradeInfo.scheduleStart)} - {formatTime(selectedGradeInfo.scheduleEnd)}
                          </p>
                          <Badge className={`text-xs ${
                            isLunchTime && currentTimeStr >= selectedGradeInfo.scheduleStart && currentTimeStr <= selectedGradeInfo.scheduleEnd
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}>
                            {isLunchTime && currentTimeStr >= selectedGradeInfo.scheduleStart && currentTimeStr <= selectedGradeInfo.scheduleEnd
                              ? 'En horario activo' 
                              : 'Fuera de horario'
                            }
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={onGroupSelect}
                      className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Debes seleccionar tu grado asignado para comenzar
                  </p>
                  <Button
                    onClick={onGroupSelect}
                    className="bg-[rgba(105,107,205,1)] hover:bg-purple-dark/90"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    Seleccionar Grado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menú del día */}
          {todayMenu && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  Menú de Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-black-soft">Plato Principal</p>
                        <p className="text-sm text-muted-foreground">{todayMenu.mainDish}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-black-soft">Acompañamiento</p>
                        <p className="text-sm text-muted-foreground">{todayMenu.sideDish}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-black-soft">Bebida</p>
                        <p className="text-sm text-muted-foreground">{todayMenu.drink}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-black-soft">Postre</p>
                        <p className="text-sm text-muted-foreground">{todayMenu.dessert || 'No disponible'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registro de códigos personales */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-light" />
                Registro de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="personalCode">Código Personal (6 caracteres)</Label>
                  <Input
                    id="personalCode"
                    type="text"
                    value={personalCode}
                    onChange={(e) => setPersonalCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: ABC123"
                    maxLength={6}
                    className="font-mono text-center tracking-widest uppercase"
                    disabled={isRegistering}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa tu código personal o el de otro maestro para registrar entrada
                  </p>
                </div>
                
                <Button
                  onClick={() => handlePersonalCodeSubmit()}
                  disabled={isRegistering || !personalCode.trim()}
                  className="w-full bg-[rgba(105,107,205,1)] hover:bg-purple-dark/90"
                  size="lg"
                >
                  {isRegistering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </div>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5 mr-2" />
                      Registrar Entrada
                    </>
                  )}
                </Button>

                {/* Grupos disponibles para registro rápido */}
                {currentAvailableGroupsClean.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-black-soft mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      Grupos Sin Maestro ({currentAvailableGroupsClean.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-2">
                      {currentAvailableGroupsClean.map((group) => {
                        // Buscar información del grado
                        const gradeInfo = allGrades.find(g => safeStringify(g.name) === group)
                        
                        return (
                          <div key={group} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-black-soft">{group}</p>
                              {gradeInfo && (
                                <p className="text-xs text-orange-600">
                                  {getCategoryDisplayName(gradeInfo.category)} • {formatTime(gradeInfo.scheduleStart)} - {formatTime(gradeInfo.scheduleEnd)}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (personalCode.trim()) {
                                  handlePersonalCodeSubmit(group)
                                } else {
                                  showMessage('Primero ingresa un código personal', 'error')
                                }
                              }}
                              disabled={isRegistering || !personalCode.trim()}
                              className="text-xs bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                            >
                              {isRegistering ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>...</span>
                                </div>
                              ) : (
                                'Cubrir Grupo'
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium mb-1">
                        💡 ¿Cómo cubrir un grupo?
                      </p>
                      <p className="text-xs text-blue-700">
                        1. Ingresa tu código personal arriba<br/>
                        2. Haz clic en "Cubrir Grupo" del grupo que necesitas atender<br/>
                        3. Te registrarás como maestro cubriendo ese grupo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de maestros del día */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-light" />
                Maestros Presentes Hoy
                <Badge variant="secondary" className="ml-2">
                  {todayRecords.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-light border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-muted-foreground">Cargando registros...</span>
                </div>
              ) : todayRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No hay registros para el día de hoy
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayRecords.map((record) => {
                    const recordStatus = selectedGradeInfo && record.enteredAt 
                      ? calculateTeacherStatus(record, selectedGradeInfo, currentTime)
                      : record.enteredAt ? 'eating' : 'registered'
                    
                    // Verificar si el maestro está cubriendo (está en un grupo disponible que no es el suyo)
                    const wasCovering = currentAvailableGroupsClean.includes(safeStringify(record.selectedGroup))
                    
                    return (
                      <div
                        key={`${record.teacherId}-${record.selectedGroup}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-black-soft">{record.teacherName}</p>
                            <Badge className="text-xs font-mono">
                              {record.teacherCode}
                            </Badge>
                            {wasCovering && (
                              <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                                Cubriendo
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1">
                            <p className="text-sm font-medium text-black-soft">
                              {record.selectedGroup}
                              {wasCovering && (
                                <span className="text-xs text-orange-600 font-medium ml-2">
                                  (Cubierto por {record.teacherName})
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Registrado: {formatDateTime(record.registeredAt)}
                          </p>
                          {record.enteredAt && (
                            <p className="text-xs text-muted-foreground">
                              Comiendo desde: {formatDateTime(record.enteredAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            recordStatus === 'eating' ? 'bg-green-600 text-white' :
                            recordStatus === 'finished' ? 'bg-gray-500 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {recordStatus === 'eating' ? 'Comiendo' :
                             recordStatus === 'finished' ? 'Terminado' :
                             'En fila'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón para asistencia de estudiantes */}
          {displayTeacherGroup && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-light" />
                  Registro de Asistencia de Estudiantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Registra la asistencia de los estudiantes de tu grupo: {displayTeacherGroup}
                  </p>
                  <Button
                    onClick={() => setShowAttendanceForm(true)}
                    className="w-full bg-[rgba(105,107,205,1)] hover:bg-purple-dark/90"
                    size="lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Registrar Asistencia de Estudiantes
                  </Button>
                  
                  {todayAttendanceRecords.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-black-soft mb-2">
                        Asistencias registradas hoy: {todayAttendanceRecords.length}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Última actualización: {todayAttendanceRecords.length > 0 && formatDateTime(todayAttendanceRecords[0]?.timestamp || '')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de formulario de asistencia */}
      {showAttendanceForm && displayTeacherGroup && selectedGradeInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <StudentAttendanceForm
                teacher={teacher}
                selectedGradeInfo={selectedGradeInfo}
                onSave={handleAttendanceSave}
                onCancel={() => setShowAttendanceForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}