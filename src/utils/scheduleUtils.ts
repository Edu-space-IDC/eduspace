export interface MealSchedule {
  startTime: string
  endTime: string
  timeSlot: string
  description: string
  durationMinutes: number
}

export interface GradeSchedule {
  [key: string]: MealSchedule
}

export interface TeacherStatus {
  teacherId: string
  teacherName: string
  group: string
  status: 'registered' | 'eating' | 'finished'
  registeredAt: string
  schedule: MealSchedule
}

export const gradeSchedules: GradeSchedule = {
  // 7:20 – 7:50 → Caminar a la secundaria y Sextos (30 min)
  'Sexto (6°)': {
    startTime: '7:20',
    endTime: '7:50',
    timeSlot: '7:20 - 7:50',
    description: 'Caminar a la secundaria y Sextos',
    durationMinutes: 30
  },
  
  // 7:50 – 8:20 → Cuartos y Quintos (30 min)
  'Cuarto (4°)': {
    startTime: '7:50',
    endTime: '8:20',
    timeSlot: '7:50 - 8:20',
    description: 'Cuartos y Quintos',
    durationMinutes: 30
  },
  'Quinto (5°)': {
    startTime: '7:50',
    endTime: '8:20',
    timeSlot: '7:50 - 8:20',
    description: 'Cuartos y Quintos',
    durationMinutes: 30
  },
  
  // 8:20 – 8:50 → Transición y Primero (30 min)
  'Transición': {
    startTime: '8:20',
    endTime: '8:50',
    timeSlot: '8:20 - 8:50',
    description: 'Transición y Primero',
    durationMinutes: 30
  },
  'Primero (1°)': {
    startTime: '8:20',
    endTime: '8:50',
    timeSlot: '8:20 - 8:50',
    description: 'Transición y Primero',
    durationMinutes: 30
  },
  
  // 8:50 – 9:20 → Segundo y Tercero (30 min)
  'Segundo (2°)': {
    startTime: '8:50',
    endTime: '9:20',
    timeSlot: '8:50 - 9:20',
    description: 'Segundo y Tercero',
    durationMinutes: 30
  },
  'Tercero (3°)': {
    startTime: '8:50',
    endTime: '9:20',
    timeSlot: '8:50 - 9:20',
    description: 'Segundo y Tercero',
    durationMinutes: 30
  },
  
  // 9:20 – 9:50 → Aceleración y Brújula (30 min)
  'Aceleración': {
    startTime: '9:20',
    endTime: '9:50',
    timeSlot: '9:20 - 9:50',
    description: 'Aceleración y Brújula',
    durationMinutes: 30
  },
  'Brújula': {
    startTime: '9:20',
    endTime: '9:50',
    timeSlot: '9:20 - 9:50',
    description: 'Aceleración y Brújula',
    durationMinutes: 30
  },
  
  // 9:50 – 10:20 → Séptimos y Octavos (30 min)
  'Séptimo (7°)': {
    startTime: '9:50',
    endTime: '10:20',
    timeSlot: '9:50 - 10:20',
    description: 'Séptimos y Octavos',
    durationMinutes: 30
  },
  'Octavo (8°)': {
    startTime: '9:50',
    endTime: '10:20',
    timeSlot: '9:50 - 10:20',
    description: 'Séptimos y Octavos',
    durationMinutes: 30
  },
  
  // 10:20 – 10:50 → Novenos, 10-1, 10-2, 10-3 (30 min)
  'Noveno (9°)': {
    startTime: '10:20',
    endTime: '10:50',
    timeSlot: '10:20 - 10:50',
    description: 'Novenos, 10-1, 10-2, 10-3',
    durationMinutes: 30
  },
  'Décimo 10-1': {
    startTime: '10:20',
    endTime: '10:50',
    timeSlot: '10:20 - 10:50',
    description: 'Novenos, 10-1, 10-2, 10-3',
    durationMinutes: 30
  },
  'Décimo 10-2': {
    startTime: '10:20',
    endTime: '10:50',
    timeSlot: '10:20 - 10:50',
    description: 'Novenos, 10-1, 10-2, 10-3',
    durationMinutes: 30
  },
  'Décimo 10-3': {
    startTime: '10:20',
    endTime: '10:50',
    timeSlot: '10:20 - 10:50',
    description: 'Novenos, 10-1, 10-2, 10-3',
    durationMinutes: 30
  },
  
  // 11:20 – 11:50 → 10-4 y Once (30 min)
  'Décimo 10-4': {
    startTime: '11:20',
    endTime: '11:50',
    timeSlot: '11:20 - 11:50',
    description: '10-4 y Once',
    durationMinutes: 30
  },
  'Undécimo (11°)': {
    startTime: '11:20',
    endTime: '11:50',
    timeSlot: '11:20 - 11:50',
    description: '10-4 y Once',
    durationMinutes: 30
  },
  
  // Grupos preescolares - horario especial (30 min)
  'Párvulos': {
    startTime: '11:50',
    endTime: '12:20',
    timeSlot: '11:50 - 12:20',
    description: 'Preescolar - Horario especial',
    durationMinutes: 30
  },
  'Pre-jardín': {
    startTime: '11:50',
    endTime: '12:20',
    timeSlot: '11:50 - 12:20',
    description: 'Preescolar - Horario especial',
    durationMinutes: 30
  },
  'Jardín': {
    startTime: '11:50',
    endTime: '12:20',
    timeSlot: '11:50 - 12:20',
    description: 'Preescolar - Horario especial',
    durationMinutes: 30
  }
}

export const getScheduleForGrade = (grade: string): MealSchedule | null => {
  return gradeSchedules[grade] || null
}

export const getCurrentTimeSlot = (): string => {
  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()
  
  // Convertir horarios a números para comparación (30 min cada uno)
  const timeSlots = [
    { start: 720, end: 750, slot: '7:20 - 7:50' },   // Sextos
    { start: 750, end: 820, slot: '7:50 - 8:20' },   // Cuartos y Quintos
    { start: 820, end: 850, slot: '8:20 - 8:50' },   // Transición y Primero
    { start: 850, end: 920, slot: '8:50 - 9:20' },   // Segundo y Tercero
    { start: 920, end: 950, slot: '9:20 - 9:50' },   // Aceleración y Brújula
    { start: 950, end: 1020, slot: '9:50 - 10:20' }, // Séptimos y Octavos
    { start: 1020, end: 1050, slot: '10:20 - 10:50' }, // Novenos y 10-1,2,3
    { start: 1120, end: 1150, slot: '11:20 - 11:50' }, // 10-4 y Once
    { start: 1150, end: 1220, slot: '11:50 - 12:20' }, // Preescolar
  ]
  
  const activeSlot = timeSlots.find(slot => currentTime >= slot.start && currentTime <= slot.end)
  return activeSlot ? activeSlot.slot : 'Fuera de horario'
}

export const getTimeUntilMeal = (grade: string): string => {
  const schedule = getScheduleForGrade(grade)
  if (!schedule) return 'Horario no definido'
  
  const now = new Date()
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
  
  const mealStartTime = new Date()
  mealStartTime.setHours(startHour, startMinute, 0, 0)
  
  const mealEndTime = new Date()
  mealEndTime.setHours(endHour, endMinute, 0, 0)
  
  const diffMs = mealStartTime.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (now.getTime() >= mealStartTime.getTime() && now.getTime() <= mealEndTime.getTime()) {
    return 'En progreso'
  } else if (now.getTime() > mealEndTime.getTime()) {
    return 'Terminado'
  } else if (diffMinutes === 0) {
    return 'Ahora'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }
}

export const getRemainingMealTime = (grade: string): string => {
  const schedule = getScheduleForGrade(grade)
  if (!schedule) return 'N/A'
  
  const now = new Date()
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
  
  const mealEndTime = new Date()
  mealEndTime.setHours(endHour, endMinute, 0, 0)
  
  const diffMs = mealEndTime.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes <= 0) {
    return 'Tiempo agotado'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min restantes`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m restantes`
  }
}

// Gestión de estados de profesores en localStorage
export const getTeacherStatuses = (): TeacherStatus[] => {
  const statuses = localStorage.getItem('teacherStatuses')
  return statuses ? JSON.parse(statuses) : []
}

export const updateTeacherStatus = (teacherId: string, teacherName: string, group: string, status: TeacherStatus['status']): void => {
  const statuses = getTeacherStatuses()
  const schedule = getScheduleForGrade(group)
  
  if (!schedule) return
  
  const existingIndex = statuses.findIndex(s => s.teacherId === teacherId)
  const newStatus: TeacherStatus = {
    teacherId,
    teacherName,
    group,
    status,
    registeredAt: new Date().toISOString(),
    schedule
  }
  
  if (existingIndex >= 0) {
    statuses[existingIndex] = newStatus
  } else {
    statuses.push(newStatus)
  }
  
  localStorage.setItem('teacherStatuses', JSON.stringify(statuses))
}

export const getTeacherCurrentStatus = (teacherId: string): TeacherStatus | null => {
  const statuses = getTeacherStatuses()
  return statuses.find(s => s.teacherId === teacherId) || null
}

export const autoUpdateTeacherStatuses = (): void => {
  const statuses = getTeacherStatuses()
  const now = new Date()
  let updated = false
  
  statuses.forEach(status => {
    const [endHour, endMinute] = status.schedule.endTime.split(':').map(Number)
    const endTime = new Date()
    endTime.setHours(endHour, endMinute, 0, 0)
    
    // Si el tiempo del grupo ya terminó y el profesor sigue como "eating", marcarlo como "finished"
    if (status.status === 'eating' && now.getTime() > endTime.getTime()) {
      status.status = 'finished'
      updated = true
    }
    
    // Si el profesor se registró y está en su horario, marcarlo como "eating"
    const [startHour, startMinute] = status.schedule.startTime.split(':').map(Number)
    const startTime = new Date()
    startTime.setHours(startHour, startMinute, 0, 0)
    
    if (status.status === 'registered' && 
        now.getTime() >= startTime.getTime() && 
        now.getTime() <= endTime.getTime()) {
      status.status = 'eating'
      updated = true
    }
  })
  
  if (updated) {
    localStorage.setItem('teacherStatuses', JSON.stringify(statuses))
  }
}

// Generar URL del código QR (simulado)
export const generateQRCodeURL = (): string => {
  const baseURL = window.location.origin
  const qrParams = new URLSearchParams({
    action: 'register_meal',
    timestamp: Date.now().toString(),
    location: 'cafeteria'
  })
  
  return `${baseURL}?${qrParams.toString()}`
}

// Verificar si la URL es de un escaneo QR
export const isQRScanURL = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('action') === 'register_meal'
}

// Limpiar parámetros QR de la URL
export const clearQRParams = (): void => {
  const url = new URL(window.location.href)
  url.searchParams.delete('action')
  url.searchParams.delete('timestamp')
  url.searchParams.delete('location')
  window.history.replaceState({}, '', url.toString())
}