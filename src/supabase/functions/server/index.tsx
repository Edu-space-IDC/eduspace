// Esta aplicación no requiere edge functions de Supabase
// Funciona completamente con IndexedDB local en el navegador
// Este archivo ha sido deshabilitado para evitar errores de deployment

export default function handler() {
  return new Response(
    JSON.stringify({ 
      message: "Esta aplicación funciona con almacenamiento local (IndexedDB)",
      status: "disabled"
    }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    }
  );
}

// Middleware de autenticación para rutas protegidas
async function requireAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
    // Usar key anónima para operaciones básicas
    return await next()
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (!user) {
    return c.text('Unauthorized', 401)
  }
  
  c.set('userId', user.id)
  return await next()
}

// ===== RUTAS DE MAESTROS =====

// Obtener todos los maestros
app.get('/make-server-66801cfb/teachers', async (c) => {
  try {
    const teachers = await kv.getByPrefix('teacher:')
    return c.json(teachers.map(t => t.value))
  } catch (error) {
    console.log('Error getting teachers:', error)
    return c.json({ error: 'Error obteniendo maestros' }, 500)
  }
})

// Crear maestro
app.post('/make-server-66801cfb/teachers', async (c) => {
  try {
    const teacherData = await c.req.json()
    
    // Generar ID único
    const id = crypto.randomUUID()
    
    // Generar código personal único
    const personalCode = await generateUniquePersonalCode()
    
    // Hash de la contraseña (simplificado)
    const hashedPassword = await hashPassword(teacherData.password)
    
    const teacher = {
      id,
      name: teacherData.name,
      email: teacherData.email,
      password: hashedPassword,
      personalCode,
      selectedGroup: teacherData.selectedGroup || '',
      role: teacherData.role || 'teacher',
      isActive: teacherData.isActive !== undefined ? teacherData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Verificar que el email no exista
    const existingByEmail = await kv.get(`teacher_email:${teacher.email}`)
    if (existingByEmail) {
      return c.json({ error: 'El email ya está registrado' }, 400)
    }
    
    // Guardar maestro y índices
    await kv.set(`teacher:${id}`, teacher)
    await kv.set(`teacher_email:${teacher.email}`, id)
    await kv.set(`teacher_code:${personalCode}`, id)
    
    return c.json(teacher)
  } catch (error) {
    console.log('Error creating teacher:', error)
    return c.json({ error: 'Error creando maestro' }, 500)
  }
})

// Autenticar maestro
app.post('/make-server-66801cfb/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    const teacherId = await kv.get(`teacher_email:${email}`)
    if (!teacherId) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }
    
    const teacher = await kv.get(`teacher:${teacherId}`)
    if (!teacher || !teacher.isActive) {
      return c.json({ error: 'Cuenta inactiva o no encontrada' }, 401)
    }
    
    const isValidPassword = await verifyPassword(password, teacher.password)
    if (!isValidPassword) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }
    
    // Remover contraseña de la respuesta
    const { password: _, ...teacherData } = teacher
    
    return c.json({
      teacher: teacherData,
      token: 'mock_token_' + teacher.id // Token simplificado
    })
  } catch (error) {
    console.log('Error during login:', error)
    return c.json({ error: 'Error de autenticación' }, 500)
  }
})

// Obtener maestro por código personal
app.get('/make-server-66801cfb/teachers/by-code/:code', async (c) => {
  try {
    const code = c.req.param('code')
    const teacherId = await kv.get(`teacher_code:${code}`)
    
    if (!teacherId) {
      return c.json({ error: 'Código no encontrado' }, 404)
    }
    
    const teacher = await kv.get(`teacher:${teacherId}`)
    if (!teacher || !teacher.isActive) {
      return c.json({ error: 'Maestro no encontrado o inactivo' }, 404)
    }
    
    // Remover contraseña
    const { password: _, ...teacherData } = teacher
    return c.json(teacherData)
  } catch (error) {
    console.log('Error getting teacher by code:', error)
    return c.json({ error: 'Error obteniendo maestro' }, 500)
  }
})

// ===== RUTAS DE GRADOS =====

// Obtener todos los grados
app.get('/make-server-66801cfb/grades', async (c) => {
  try {
    const grades = await kv.getByPrefix('grade:')
    return c.json(grades.map(g => g.value).sort((a, b) => a.name.localeCompare(b.name)))
  } catch (error) {
    console.log('Error getting grades:', error)
    return c.json({ error: 'Error obteniendo grados' }, 500)
  }
})

// Crear grado
app.post('/make-server-66801cfb/grades', async (c) => {
  try {
    const gradeData = await c.req.json()
    
    const id = crypto.randomUUID()
    const grade = {
      id,
      name: gradeData.name,
      description: gradeData.description || '',
      category: gradeData.category,
      scheduleStart: gradeData.scheduleStart,
      scheduleEnd: gradeData.scheduleEnd,
      isActive: gradeData.isActive !== undefined ? gradeData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`grade:${id}`, grade)
    return c.json(grade)
  } catch (error) {
    console.log('Error creating grade:', error)
    return c.json({ error: 'Error creando grado' }, 500)
  }
})

// ===== RUTAS DE MENÚS =====

// Obtener menú del día
app.get('/make-server-66801cfb/menu/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const menu = await kv.get(`menu:${today}`)
    
    if (!menu || !menu.isActive) {
      return c.json(null)
    }
    
    return c.json(menu)
  } catch (error) {
    console.log('Error getting today menu:', error)
    return c.json({ error: 'Error obteniendo menú' }, 500)
  }
})

// Crear o actualizar menú
app.post('/make-server-66801cfb/menu', async (c) => {
  try {
    const menuData = await c.req.json()
    
    const id = crypto.randomUUID()
    const menu = {
      id,
      date: menuData.date,
      mainDish: menuData.mainDish,
      sideDish: menuData.sideDish,
      drink: menuData.drink,
      dessert: menuData.dessert || '',
      isActive: menuData.isActive !== undefined ? menuData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`menu:${menuData.date}`, menu)
    return c.json(menu)
  } catch (error) {
    console.log('Error creating/updating menu:', error)
    return c.json({ error: 'Error guardando menú' }, 500)
  }
})

// ===== RUTAS DE REGISTROS DE COMIDA =====

// Obtener registros del día actual
app.get('/make-server-66801cfb/meal-records/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const records = await kv.getByPrefix(`meal_record:${today}:`)
    
    return c.json(records.map(r => r.value))
  } catch (error) {
    console.log('Error getting today meal records:', error)
    return c.json({ error: 'Error obteniendo registros' }, 500)
  }
})

// Crear registro de comida
app.post('/make-server-66801cfb/meal-records', async (c) => {
  try {
    const recordData = await c.req.json()
    
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const date = now.split('T')[0]
    
    const record = {
      id,
      teacherId: recordData.teacherId,
      teacherName: recordData.teacherName,
      teacherCode: recordData.teacherCode,
      selectedGroup: recordData.selectedGroup,
      registeredAt: recordData.registeredAt || now,
      enteredAt: recordData.enteredAt || null,
      timestamp: recordData.timestamp || now,
      date,
      method: 'personal_code',
      status: recordData.status || 'registered'
    }
    
    await kv.set(`meal_record:${date}:${id}`, record)
    
    return c.json(record)
  } catch (error) {
    console.log('Error creating meal record:', error)
    return c.json({ error: 'Error creando registro' }, 500)
  }
})

// Actualizar registro de comida
app.put('/make-server-66801cfb/meal-records/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const updates = await c.req.json()
    
    // Buscar el registro existente
    const existingRecords = await kv.getByPrefix('meal_record:')
    const existingRecord = existingRecords.find(r => r.value.id === id)
    
    if (!existingRecord) {
      return c.json({ error: 'Registro no encontrado' }, 404)
    }
    
    const updated = {
      ...existingRecord.value,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(existingRecord.key, updated)
    
    return c.json(updated)
  } catch (error) {
    console.log('Error updating meal record:', error)
    return c.json({ error: 'Error actualizando registro' }, 500)
  }
})

// ===== FUNCIONES AUXILIARES =====

// Generar código personal único
async function generateUniquePersonalCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  let attempts = 0
  const maxAttempts = 100
  
  do {
    code = Array.from({ length: 6 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    
    attempts++
    if (attempts > maxAttempts) {
      throw new Error('No se pudo generar un código único')
    }
  } while (await kv.get(`teacher_code:${code}`))
  
  return code
}

// Hash de contraseña simplificado
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verificar contraseña
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

// Inicializar datos por defecto
app.post('/make-server-66801cfb/initialize', async (c) => {
  try {
    console.log('🚀 Initializing system...')
    
    // Crear administrador por defecto si no existe
    const adminExists = await kv.get('teacher_email:admin@colegio.edu')
    if (!adminExists) {
      console.log('👑 Creating default admin...')
      const adminId = crypto.randomUUID()
      const adminCode = await generateUniquePersonalCode()
      const hashedPassword = await hashPassword('FOXER_13')
      
      const admin = {
        id: adminId,
        name: 'Administrador',
        email: 'admin@colegio.edu',
        password: hashedPassword,
        personalCode: adminCode,
        selectedGroup: '',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(`teacher:${adminId}`, admin)
      await kv.set(`teacher_email:admin@colegio.edu`, adminId)
      await kv.set(`teacher_code:${adminCode}`, adminId)
      console.log('✅ Admin created with code:', adminCode)
    } else {
      console.log('👑 Default admin already exists')
    }
    
    // Crear grados por defecto si no existen
    const existingGrades = await kv.getByPrefix('grade:')
    console.log('📚 Existing grades:', existingGrades.length)
    
    if (existingGrades.length === 0) {
      console.log('📚 Creating default grades...')
      const defaultGrades = [
        // Ciclo 1
        { name: 'Transición', description: 'Grado de Transición (Preescolar)', category: 'ciclo1', scheduleStart: '08:00', scheduleEnd: '08:20' },
        { name: '1° Grado', description: 'Primer Grado de Primaria', category: 'ciclo1', scheduleStart: '08:00', scheduleEnd: '08:20' },
        { name: '2° Grado', description: 'Segundo Grado de Primaria', category: 'ciclo1', scheduleStart: '08:20', scheduleEnd: '08:40' },
        
        // Ciclo 2
        { name: '3° Grado', description: 'Tercer Grado de Primaria', category: 'ciclo2', scheduleStart: '08:20', scheduleEnd: '08:40' },
        { name: '4° Grado', description: 'Cuarto Grado de Primaria', category: 'ciclo2', scheduleStart: '07:40', scheduleEnd: '08:00' },
        { name: '5° Grado', description: 'Quinto Grado de Primaria', category: 'ciclo2', scheduleStart: '07:40', scheduleEnd: '08:00' },
        
        // Ciclo 3
        { name: '6° Grado', description: 'Sexto Grado de Primaria', category: 'ciclo3', scheduleStart: '07:20', scheduleEnd: '07:40' },
        { name: '7° Grado', description: 'Séptimo Grado de Bachillerato', category: 'ciclo3', scheduleStart: '09:00', scheduleEnd: '09:20' },
        { name: '8° Grado', description: 'Octavo Grado de Bachillerato', category: 'ciclo3', scheduleStart: '09:00', scheduleEnd: '09:20' },
        { name: '9° Grado', description: 'Noveno Grado de Bachillerato', category: 'ciclo3', scheduleStart: '09:20', scheduleEnd: '09:40' },
        { name: '10-1', description: 'Décimo Grado - Grupo 1', category: 'ciclo3', scheduleStart: '09:20', scheduleEnd: '09:40' },
        { name: '10-2', description: 'Décimo Grado - Grupo 2', category: 'ciclo3', scheduleStart: '09:20', scheduleEnd: '09:40' },
        { name: '10-3', description: 'Décimo Grado - Grupo 3', category: 'ciclo3', scheduleStart: '09:20', scheduleEnd: '09:40' },
        { name: '10-4', description: 'Décimo Grado - Grupo 4', category: 'ciclo3', scheduleStart: '10:20', scheduleEnd: '10:40' },
        { name: '11° Grado', description: 'Undécimo Grado de Bachillerato', category: 'ciclo3', scheduleStart: '10:20', scheduleEnd: '10:40' },
        
        // Ciclo 4
        { name: '12° Grado', description: 'Duodécimo Grado de Bachillerato', category: 'ciclo4', scheduleStart: '11:00', scheduleEnd: '11:20' },
        { name: 'Media Técnica - Sistemas', description: 'Educación Media Técnica en Sistemas', category: 'ciclo4', scheduleStart: '10:40', scheduleEnd: '11:00' },
        { name: 'Media Técnica - Contabilidad', description: 'Educación Media Técnica en Contabilidad', category: 'ciclo4', scheduleStart: '10:40', scheduleEnd: '11:00' },
        
        // Especiales
        { name: 'Programa Brújula', description: 'Programa Especial Brújula', category: 'especiales', scheduleStart: '10:20', scheduleEnd: '10:40' },
        { name: 'Aceleración del Aprendizaje', description: 'Programa de Aceleración', category: 'especiales', scheduleStart: '10:20', scheduleEnd: '10:40' },
        { name: 'Caminar a la Secundaria', description: 'Programa Caminar a la Secundaria', category: 'especiales', scheduleStart: '10:20', scheduleEnd: '10:40' }
      ]
      
      for (const gradeData of defaultGrades) {
        const id = crypto.randomUUID()
        const grade = {
          id,
          ...gradeData,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await kv.set(`grade:${id}`, grade)
      }
      console.log(`✅ Created ${defaultGrades.length} default grades`)
    } else {
      console.log('📚 Default grades already exist')
    }
    
    console.log('🎉 System initialization complete')
    return c.json({ success: true, message: 'Sistema inicializado correctamente' })
  } catch (error) {
    console.log('❌ Error initializing system:', error)
    return c.json({ error: 'Error inicializando el sistema' }, 500)
  }
})

// Limpiar registros antiguos
app.post('/make-server-66801cfb/cleanup', async (c) => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // Mantener solo últimos 7 días
    const cutoffString = cutoffDate.toISOString().split('T')[0]
    
    const allRecords = await kv.getByPrefix('meal_record:')
    let deletedCount = 0
    
    for (const record of allRecords) {
      if (record.value.date < cutoffString) {
        await kv.del(record.key)
        deletedCount++
      }
    }
    
    return c.json({ 
      success: true, 
      message: `${deletedCount} registros antiguos eliminados` 
    })
  } catch (error) {
    console.log('Error during cleanup:', error)
    return c.json({ error: 'Error durante la limpieza' }, 500)
  }
})

// Estadísticas del sistema
app.get('/make-server-66801cfb/stats', async (c) => {
  try {
    console.log('🔍 Getting system stats...')
    
    const teachers = await kv.getByPrefix('teacher:')
    const grades = await kv.getByPrefix('grade:')
    const menus = await kv.getByPrefix('menu:')
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = await kv.getByPrefix(`meal_record:${today}:`)
    
    console.log('📊 Raw data:', {
      teachers: teachers.length,
      grades: grades.length,
      menus: menus.length,
      todayRecords: todayRecords.length
    })

    // Asegurar que teachers es un array y acceder correctamente a los datos
    const teacherValues = Array.isArray(teachers) ? teachers.map(t => t?.value || t) : []
    const gradeValues = Array.isArray(grades) ? grades.map(g => g?.value || g) : []
    const menuValues = Array.isArray(menus) ? menus.map(m => m?.value || m) : []
    const recordValues = Array.isArray(todayRecords) ? todayRecords.map(r => r?.value || r) : []
    
    const stats = {
      totalTeachers: teacherValues.length,
      activeTeachers: teacherValues.filter(t => t && t.isActive && t.role === 'teacher').length,
      totalAdmins: teacherValues.filter(t => t && t.role === 'admin').length,
      totalGrades: gradeValues.length,
      activeGrades: gradeValues.filter(g => g && g.isActive).length,
      totalMenus: menuValues.length,
      todayRecords: recordValues.length,
      lastCleanup: null,
      dbSize: 0,
      isInitialized: true
    }
    
    console.log('✅ Stats calculated:', stats)
    return c.json(stats)
  } catch (error) {
    console.log('❌ Error getting stats:', error)
    return c.json({ error: 'Error obteniendo estadísticas' }, 500)
  }
})

Deno.serve(app.fetch)