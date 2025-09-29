// Base de datos unificada que funciona con IndexedDB y Supabase automáticamente
import { projectId, publicAnonKey } from './supabase/info'
import * as IndexedDB from './database'
import * as SupabaseAPI from './apiDatabase'

// Verificar funciones críticas al cargar el módulo
console.log('🔍 Verificando funciones de IndexedDB...');
console.log('- clearTodayMealRecordsWithCascade:', typeof IndexedDB.clearTodayMealRecordsWithCascade);
console.log('- deleteMealRecordWithCascade:', typeof IndexedDB.deleteMealRecordWithCascade);
console.log('- deleteStudentAttendanceRecordsByTeacherAndDate:', typeof IndexedDB.deleteStudentAttendanceRecordsByTeacherAndDate);

// Tipos exportados (reutilizamos los del database original)
export type {
  Teacher,
  Grade,
  MenuEntry,
  MealRecord,
  DatabaseStats,
  TeacherStats,
  StudentAttendanceRecord,
  AdminStats
} from './database'

export {
  getCategoryDisplayName,
  getCategoryDescription,
  getGradeDurationInMinutes,
  calculateTeacherStatus,
  getRemainingTimeInMinutes,
  getLocalDateString,
  getLocalISOString,
  formatTimeWithAmPm,
  formatDateTimeWithAmPm,
  formatDateLong,
  hashPassword,
  verifyPassword
} from './database'

// Estado del sistema
let isSupabaseAvailable = false
let isSupabaseChecked = false
let fallbackToIndexedDB = true

// Verificar si Supabase está disponible
async function checkSupabaseAvailability(): Promise<boolean> {
  if (isSupabaseChecked) return isSupabaseAvailable
  
  try {
    console.log('🔍 Checking Supabase availability...')
    
    // Verificar si las variables están disponibles
    if (!projectId || !publicAnonKey) {
      console.log('❌ Supabase credentials not available')
      isSupabaseAvailable = false
      isSupabaseChecked = true
      return false
    }

    // Intentar hacer una llamada simple a Supabase
    const testUrl = `https://${projectId}.supabase.co/functions/v1/make-server-66801cfb/stats`
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
    })
    
    if (response.ok) {
      console.log('✅ Supabase is available')
      isSupabaseAvailable = true
    } else {
      console.log('❌ Supabase not available (status:', response.status, ')')
      isSupabaseAvailable = false
    }
  } catch (error) {
    console.log('❌ Supabase not available (error):', error)
    isSupabaseAvailable = false
  }
  
  isSupabaseChecked = true
  return isSupabaseAvailable
}

// Función para usar Supabase con fallback a IndexedDB
async function withFallback<T>(
  supabaseOperation: () => Promise<T>,
  indexedDBOperation: () => Promise<T>,
  operationName: string
): Promise<T> {
  console.log(`🔍 withFallback iniciado para operación: ${operationName}`);
  
  const useSupabase = await checkSupabaseAvailability()
  console.log(`🔍 useSupabase: ${useSupabase}, fallbackToIndexedDB: ${fallbackToIndexedDB}`);
  
  if (useSupabase && !fallbackToIndexedDB) {
    try {
      console.log(`🌐 Using Supabase for ${operationName}`)
      return await supabaseOperation()
    } catch (error) {
      console.warn(`⚠️ Supabase failed for ${operationName}, falling back to IndexedDB:`, error)
      fallbackToIndexedDB = true
      console.log(`💾 Intentando IndexedDB para ${operationName}`);
      return await indexedDBOperation()
    }
  } else {
    console.log(`💾 Using IndexedDB for ${operationName}`)
    try {
      const result = await indexedDBOperation()
      console.log(`✅ IndexedDB operación ${operationName} completada exitosamente`);
      return result;
    } catch (error) {
      console.error(`❌ IndexedDB operación ${operationName} falló:`, error);
      throw error;
    }
  }
}

// ===== FUNCIONES PÚBLICAS =====

export const initDatabase = async (): Promise<void> => {
  console.log('🚀 Initializing unified database...')
  
  return withFallback(
    () => SupabaseAPI.initDatabase(),
    () => IndexedDB.initDatabase(),
    'initDatabase'
  )
}

export const isFirstTimeInstall = async (): Promise<boolean> => {
  return withFallback(
    () => SupabaseAPI.isFirstTimeInstall(),
    () => IndexedDB.isFirstTimeInstall(),
    'isFirstTimeInstall'
  )
}

export const getDatabaseStats = async (): Promise<IndexedDB.DatabaseStats> => {
  return withFallback(
    () => SupabaseAPI.getDatabaseStats(),
    () => IndexedDB.getDatabaseStats(),
    'getDatabaseStats'
  )
}

// NUEVA: Función para obtener estadísticas de administrador
export const getAdminStats = async (): Promise<IndexedDB.AdminStats> => {
  return withFallback(
    () => SupabaseAPI.getAdminStats ? SupabaseAPI.getAdminStats() : Promise.reject('Not implemented'),
    () => IndexedDB.getAdminStats(),
    'getAdminStats'
  )
}

// ===== FUNCIONES DE MAESTROS =====

export const getAllTeachers = async (): Promise<IndexedDB.Teacher[]> => {
  return withFallback(
    () => SupabaseAPI.getAllTeachers(),
    () => IndexedDB.getAllTeachers(),
    'getAllTeachers'
  )
}

export const createTeacher = async (teacherData: Omit<IndexedDB.Teacher, 'id' | 'personalCode' | 'createdAt' | 'updatedAt'>): Promise<IndexedDB.Teacher> => {
  return withFallback(
    () => SupabaseAPI.createTeacher(teacherData),
    () => IndexedDB.createTeacher(teacherData),
    'createTeacher'
  )
}

export const authenticateTeacher = async (email: string, password: string): Promise<{ teacher: IndexedDB.Teacher; token?: string }> => {
  return withFallback(
    async () => SupabaseAPI.authenticateTeacher(email, password),
    async () => ({ teacher: await IndexedDB.authenticateUser(email, password) }),
    'authenticateTeacher'
  )
}

export const getTeacherByEmail = async (email: string): Promise<IndexedDB.Teacher | null> => {
  return withFallback(
    () => SupabaseAPI.getTeacherByEmail(email),
    () => IndexedDB.getTeacherByEmail(email),
    'getTeacherByEmail'
  )
}

export const getTeacherByPersonalCode = async (code: string): Promise<IndexedDB.Teacher | null> => {
  return withFallback(
    () => SupabaseAPI.getTeacherByPersonalCode(code),
    () => IndexedDB.getTeacherByPersonalCode(code),
    'getTeacherByPersonalCode'
  )
}

export const getTeacherById = async (id: string): Promise<IndexedDB.Teacher | null> => {
  return withFallback(
    () => SupabaseAPI.getTeacherById(id),
    () => IndexedDB.getTeacherById(id),
    'getTeacherById'
  )
}

export const updateTeacher = async (updates: Partial<IndexedDB.Teacher> & { id: string }): Promise<IndexedDB.Teacher> => {
  return withFallback(
    () => SupabaseAPI.updateTeacher(updates.id, updates),
    () => IndexedDB.updateTeacher(updates),
    'updateTeacher'
  )
}

// ===== FUNCIONES DE GRADOS =====

export const getAllGrades = async (): Promise<IndexedDB.Grade[]> => {
  return withFallback(
    () => SupabaseAPI.getAllGrades(),
    () => IndexedDB.getAllGrades(),
    'getAllGrades'
  )
}

export const createGrade = async (gradeData: Omit<IndexedDB.Grade, 'id' | 'createdAt' | 'updatedAt'>): Promise<IndexedDB.Grade> => {
  return withFallback(
    () => SupabaseAPI.createGrade(gradeData),
    () => IndexedDB.createGrade(gradeData),
    'createGrade'
  )
}

export const updateGrade = async (grade: IndexedDB.Grade): Promise<IndexedDB.Grade> => {
  return withFallback(
    () => SupabaseAPI.updateGrade ? SupabaseAPI.updateGrade(grade.id, grade) : Promise.reject('Not implemented'),
    () => IndexedDB.updateGrade(grade),
    'updateGrade'
  )
}

export const deleteGrade = async (gradeId: string): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.deleteGrade ? SupabaseAPI.deleteGrade(gradeId) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteGrade(gradeId),
    'deleteGrade'
  )
}

export const getGradeById = async (id: string): Promise<IndexedDB.Grade | null> => {
  return withFallback(
    () => SupabaseAPI.getGradeById(id),
    () => IndexedDB.getGradeById(id),
    'getGradeById'
  )
}

export const getGradeByName = async (name: string): Promise<IndexedDB.Grade | null> => {
  return withFallback(
    () => SupabaseAPI.getGradeByName(name),
    () => IndexedDB.getGradeByName(name),
    'getGradeByName'
  )
}

export const getActiveGrades = async (): Promise<IndexedDB.Grade[]> => {
  return withFallback(
    () => SupabaseAPI.getActiveGrades(),
    () => IndexedDB.getActiveGrades(),
    'getActiveGrades'
  )
}

// ===== FUNCIONES DE MENÚS =====

export const getTodayMenu = async (): Promise<IndexedDB.MenuEntry | null> => {
  return withFallback(
    () => SupabaseAPI.getTodayMenu(),
    () => IndexedDB.getTodayMenu(),
    'getTodayMenu'
  )
}

export const upsertMenu = async (menuData: Omit<IndexedDB.MenuEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<IndexedDB.MenuEntry> => {
  return withFallback(
    () => SupabaseAPI.upsertMenu(menuData),
    () => IndexedDB.upsertMenu(menuData),
    'upsertMenu'
  )
}

export const getAllMenus = async (): Promise<IndexedDB.MenuEntry[]> => {
  return withFallback(
    () => SupabaseAPI.getAllMenus(),
    () => IndexedDB.getAllMenus(),
    'getAllMenus'
  )
}

export const createMenu = async (menuData: Omit<IndexedDB.MenuEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<IndexedDB.MenuEntry> => {
  return withFallback(
    () => SupabaseAPI.createMenu ? SupabaseAPI.createMenu(menuData) : Promise.reject('Not implemented'),
    () => IndexedDB.createMenu(menuData),
    'createMenu'
  )
}

export const updateMenu = async (menu: IndexedDB.MenuEntry): Promise<IndexedDB.MenuEntry> => {
  return withFallback(
    () => SupabaseAPI.updateMenu ? SupabaseAPI.updateMenu(menu.id, menu) : Promise.reject('Not implemented'),
    () => IndexedDB.updateMenu(menu),
    'updateMenu'
  )
}

export const deleteMenu = async (menuId: string): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.deleteMenu ? SupabaseAPI.deleteMenu(menuId) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteMenu(menuId),
    'deleteMenu'
  )
}

// ===== FUNCIONES DE REGISTROS DE COMIDA =====

export const getTodayMealRecords = async (): Promise<IndexedDB.MealRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getTodayMealRecords(),
    () => IndexedDB.getTodayMealRecords(),
    'getTodayMealRecords'
  )
}

export const createMealRecord = async (recordData: Omit<IndexedDB.MealRecord, 'id' | 'date' | 'timestamp'>): Promise<IndexedDB.MealRecord> => {
  return withFallback(
    () => SupabaseAPI.createMealRecord(recordData),
    () => IndexedDB.addMealRecord(recordData),
    'createMealRecord'
  )
}

export const updateMealRecord = async (id: string, updates: Partial<IndexedDB.MealRecord>): Promise<IndexedDB.MealRecord> => {
  return withFallback(
    () => SupabaseAPI.updateMealRecord(id, updates),
    () => IndexedDB.updateMealRecord(id, updates), // Corregido para usar la función correcta
    'updateMealRecord'
  )
}

export const getMealRecordsByTeacherId = async (teacherId: string): Promise<IndexedDB.MealRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getMealRecordsByTeacherId(teacherId),
    () => IndexedDB.getMealRecordsByTeacherId(teacherId),
    'getMealRecordsByTeacherId'
  )
}

export const getTeacherStats = async (teacherId: string): Promise<IndexedDB.TeacherStats> => {
  return withFallback(
    () => SupabaseAPI.getTeacherStats(teacherId),
    () => IndexedDB.getTeacherStats(teacherId),
    'getTeacherStats'
  )
}

// ===== FUNCIONES DE LIMPIEZA Y ADMINISTRACIÓN =====

export const cleanupOldRecords = async (): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.cleanupOldRecords(),
    () => IndexedDB.cleanupOldRecords(),
    'cleanupOldRecords'
  )
}

export const clearTodayMealRecords = async (): Promise<number> => {
  return withFallback(
    () => SupabaseAPI.clearTodayMealRecords ? SupabaseAPI.clearTodayMealRecords() : Promise.reject('Not implemented'),
    () => IndexedDB.clearTodayMealRecords(),
    'clearTodayMealRecords'
  )
}

export const factoryReset = async (): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.factoryReset ? SupabaseAPI.factoryReset() : Promise.reject('Not implemented'),
    () => IndexedDB.factoryReset(),
    'factoryReset'
  )
}

// ===== FUNCIONES DE MIGRACIÓN =====

export const migrateToSupabase = async (): Promise<boolean> => {
  const useSupabase = await checkSupabaseAvailability()
  if (!useSupabase) {
    console.log('❌ Cannot migrate: Supabase not available')
    return false
  }

  try {
    console.log('🔄 Starting migration to Supabase...')
    
    // Obtener todos los datos de IndexedDB
    const [teachers, grades, menus, records] = await Promise.all([
      IndexedDB.getAllTeachers(),
      IndexedDB.getAllGrades(),
      IndexedDB.getAllMenus(),
      IndexedDB.getTodayMealRecords()
    ])

    console.log('📊 Data to migrate:', {
      teachers: teachers.length,
      grades: grades.length,
      menus: menus.length,
      records: records.length
    })

    // Migrar maestros
    for (const teacher of teachers) {
      try {
        await SupabaseAPI.createTeacher({
          name: teacher.name,
          email: teacher.email,
          password: teacher.password,
          selectedGroup: teacher.selectedGroup,
          role: teacher.role,
          isActive: teacher.isActive
        })
      } catch (error) {
        // Ignorar si ya existe
        console.log('Teacher already exists or error:', error)
      }
    }

    // Migrar grados
    for (const grade of grades) {
      try {
        await SupabaseAPI.createGrade({
          name: grade.name,
          description: grade.description,
          category: grade.category,
          scheduleStart: grade.scheduleStart,
          scheduleEnd: grade.scheduleEnd,
          isActive: grade.isActive
        })
      } catch (error) {
        console.log('Grade already exists or error:', error)
      }
    }

    // Migrar menús
    for (const menu of menus) {
      try {
        await SupabaseAPI.upsertMenu({
          date: menu.date,
          mainDish: menu.mainDish,
          sideDish: menu.sideDish,
          drink: menu.drink,
          dessert: menu.dessert,
          isActive: menu.isActive
        })
      } catch (error) {
        console.log('Menu migration error:', error)
      }
    }

    console.log('✅ Migration completed successfully')
    fallbackToIndexedDB = false // Cambiar a usar Supabase
    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// ===== FUNCIONES DE UTILIDAD =====

export const getCurrentBackend = async (): Promise<'supabase' | 'indexeddb'> => {
  const useSupabase = await checkSupabaseAvailability()
  return (useSupabase && !fallbackToIndexedDB) ? 'supabase' : 'indexeddb'
}

export const forceIndexedDB = () => {
  fallbackToIndexedDB = true
  console.log('🔄 Forced fallback to IndexedDB')
}

export const resetSupabaseCheck = () => {
  isSupabaseChecked = false
  fallbackToIndexedDB = false
  console.log('🔄 Reset Supabase availability check')
}

// Función legacy para compatibilidad
export const authenticateUser = async (email: string, password: string): Promise<IndexedDB.Teacher> => {
  const result = await authenticateTeacher(email, password)
  return result.teacher
}

// Función legacy para compatibilidad  
export const addMealRecord = async (recordData: any): Promise<IndexedDB.MealRecord> => {
  return createMealRecord(recordData)
}

// Función legacy para compatibilidad
export const startEating = async (recordId: string): Promise<IndexedDB.MealRecord> => {
  return updateMealRecord(recordId, {
    enteredAt: IndexedDB.getLocalISOString(),
    status: 'eating'
  })
}

// ===== FUNCIONES DE ASISTENCIA DE ESTUDIANTES =====

export const createStudentAttendanceRecord = async (
  recordData: Omit<IndexedDB.StudentAttendanceRecord, "id" | "timestamp" | "createdAt" | "updatedAt">
): Promise<IndexedDB.StudentAttendanceRecord> => {
  return withFallback(
    () => SupabaseAPI.createStudentAttendanceRecord ? SupabaseAPI.createStudentAttendanceRecord(recordData) : Promise.reject('Not implemented'),
    () => IndexedDB.createStudentAttendanceRecord(recordData),
    'createStudentAttendanceRecord'
  )
}

export const getTodayStudentAttendanceRecords = async (): Promise<IndexedDB.StudentAttendanceRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getTodayStudentAttendanceRecords ? SupabaseAPI.getTodayStudentAttendanceRecords() : Promise.reject('Not implemented'),
    () => IndexedDB.getTodayStudentAttendanceRecords(),
    'getTodayStudentAttendanceRecords'
  )
}

export const getStudentAttendanceByTeacherAndDate = async (
  teacherId: string,
  date: string
): Promise<IndexedDB.StudentAttendanceRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getStudentAttendanceByTeacherAndDate ? SupabaseAPI.getStudentAttendanceByTeacherAndDate(teacherId, date) : Promise.reject('Not implemented'),
    () => IndexedDB.getStudentAttendanceByTeacherAndDate(teacherId, date),
    'getStudentAttendanceByTeacherAndDate'
  )
}

export const getStudentAttendanceByGradeAndDate = async (
  gradeId: string,
  date: string
): Promise<IndexedDB.StudentAttendanceRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getStudentAttendanceByGradeAndDate ? SupabaseAPI.getStudentAttendanceByGradeAndDate(gradeId, date) : Promise.reject('Not implemented'),
    () => IndexedDB.getStudentAttendanceByGradeAndDate(gradeId, date),
    'getStudentAttendanceByGradeAndDate'
  )
}

export const getStudentAttendanceByTeacher = async (
  teacherId: string
): Promise<IndexedDB.StudentAttendanceRecord[]> => {
  return withFallback(
    () => SupabaseAPI.getStudentAttendanceByTeacher ? SupabaseAPI.getStudentAttendanceByTeacher(teacherId) : Promise.reject('Not implemented'),
    () => IndexedDB.getStudentAttendanceByTeacher(teacherId),
    'getStudentAttendanceByTeacher'
  )
}

export const updateStudentAttendanceRecord = async (
  recordId: string,
  updates: Partial<IndexedDB.StudentAttendanceRecord>
): Promise<IndexedDB.StudentAttendanceRecord> => {
  return withFallback(
    () => SupabaseAPI.updateStudentAttendanceRecord ? SupabaseAPI.updateStudentAttendanceRecord(recordId, updates) : Promise.reject('Not implemented'),
    () => IndexedDB.updateStudentAttendanceRecord(recordId, updates),
    'updateStudentAttendanceRecord'
  )
}

export const hasStudentAttendanceRecord = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<boolean> => {
  return withFallback(
    () => SupabaseAPI.hasStudentAttendanceRecord ? SupabaseAPI.hasStudentAttendanceRecord(teacherId, gradeId, date) : Promise.reject('Not implemented'),
    () => IndexedDB.hasStudentAttendanceRecord(teacherId, gradeId, date),
    'hasStudentAttendanceRecord'
  )
}

export const getStudentAttendanceRecord = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<IndexedDB.StudentAttendanceRecord | null> => {
  return withFallback(
    () => SupabaseAPI.getStudentAttendanceRecord ? SupabaseAPI.getStudentAttendanceRecord(teacherId, gradeId, date) : Promise.reject('Not implemented'),
    () => IndexedDB.getStudentAttendanceRecord(teacherId, gradeId, date),
    'getStudentAttendanceRecord'
  )
}

export const getTeacherAttendanceStats = async (teacherId: string): Promise<{
  totalSessions: number;
  totalStudentsPresent: number;
  totalStudentsEating: number;
  totalStudentsNotEating: number;
  averageAttendance: number;
  averageEatingPercentage: number;
}> => {
  return withFallback(
    () => SupabaseAPI.getTeacherAttendanceStats ? SupabaseAPI.getTeacherAttendanceStats(teacherId) : Promise.reject('Not implemented'),
    () => IndexedDB.getTeacherAttendanceStats(teacherId),
    'getTeacherAttendanceStats'
  )
}

// ===== FUNCIONES DE ELIMINACIÓN =====

export const deleteMealRecord = async (recordId: string): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.deleteMealRecord ? SupabaseAPI.deleteMealRecord(recordId) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteMealRecord(recordId),
    'deleteMealRecord'
  )
}

export const deleteStudentAttendanceRecord = async (recordId: string): Promise<void> => {
  return withFallback(
    () => SupabaseAPI.deleteStudentAttendanceRecord ? SupabaseAPI.deleteStudentAttendanceRecord(recordId) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteStudentAttendanceRecord(recordId),
    'deleteStudentAttendanceRecord'
  )
}

export const deleteStudentAttendanceRecordsByTeacherAndDate = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<number> => {
  return withFallback(
    () => SupabaseAPI.deleteStudentAttendanceRecordsByTeacherAndDate ? SupabaseAPI.deleteStudentAttendanceRecordsByTeacherAndDate(teacherId, gradeId, date) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteStudentAttendanceRecordsByTeacherAndDate(teacherId, gradeId, date),
    'deleteStudentAttendanceRecordsByTeacherAndDate'
  )
}

export const clearTodayMealRecordsWithCascade = async (): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  console.log('🔍 Función clearTodayMealRecordsWithCascade llamada');
  
  // Verificar que la función de IndexedDB existe
  if (typeof IndexedDB.clearTodayMealRecordsWithCascade !== 'function') {
    console.error('❌ IndexedDB.clearTodayMealRecordsWithCascade no es una función:', typeof IndexedDB.clearTodayMealRecordsWithCascade);
    throw new Error('La función clearTodayMealRecordsWithCascade no está disponible en IndexedDB');
  }
  
  return withFallback(
    () => SupabaseAPI.clearTodayMealRecordsWithCascade ? SupabaseAPI.clearTodayMealRecordsWithCascade() : Promise.reject('Not implemented'),
    () => IndexedDB.clearTodayMealRecordsWithCascade(),
    'clearTodayMealRecordsWithCascade'
  )
}

export const deleteMealRecordWithCascade = async (
  recordId: string,
  teacherId: string,
  selectedGroup: string,
  date: string
): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  console.log('🔍 Función deleteMealRecordWithCascade llamada con:', { recordId, teacherId, selectedGroup, date });
  
  // Verificar que la función de IndexedDB existe
  if (typeof IndexedDB.deleteMealRecordWithCascade !== 'function') {
    console.error('❌ IndexedDB.deleteMealRecordWithCascade no es una función:', typeof IndexedDB.deleteMealRecordWithCascade);
    throw new Error('La función deleteMealRecordWithCascade no está disponible en IndexedDB');
  }
  
  return withFallback(
    () => SupabaseAPI.deleteMealRecordWithCascade ? SupabaseAPI.deleteMealRecordWithCascade(recordId, teacherId, selectedGroup, date) : Promise.reject('Not implemented'),
    () => IndexedDB.deleteMealRecordWithCascade(recordId, teacherId, selectedGroup, date),
    'deleteMealRecordWithCascade'
  )
}

export const clearTeacherTodayRecordsWithCascade = async (teacherId: string): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  return withFallback(
    () => SupabaseAPI.clearTeacherTodayRecordsWithCascade ? SupabaseAPI.clearTeacherTodayRecordsWithCascade(teacherId) : Promise.reject('Not implemented'),
    () => IndexedDB.clearTeacherTodayRecordsWithCascade(teacherId),
    'clearTeacherTodayRecordsWithCascade'
  )
}