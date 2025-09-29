import { factoryReset, getDatabaseStats, isFirstTimeInstall, getAllTeachers, createTeacher, hashPassword } from './database'

// Herramientas de desarrollo para la consola del navegador
class DevTools {
  private isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  constructor() {
    if (this.isDevelopment) {
      this.setupConsoleCommands()
    }
  }

  private setupConsoleCommands() {
    // Agregar comandos globales para desarrollo
    (window as any).devTools = {
      // Reset completo de la aplicación
      resetApp: async () => {
        console.log('🔄 Iniciando reset completo desde consola...')
        try {
          await factoryReset()
          console.log('✅ Reset exitoso! Recargando página...')
          setTimeout(() => window.location.reload(), 1000)
        } catch (error) {
          console.error('❌ Error durante reset:', error)
        }
      },

      // Estadísticas de la base de datos
      dbStats: async () => {
        try {
          const stats = await getDatabaseStats()
          console.table(stats)
          return stats
        } catch (error) {
          console.error('Error obteniendo estadísticas:', error)
        }
      },

      // Listar todos los usuarios registrados
      listUsers: async () => {
        try {
          const teachers = await getAllTeachers()
          console.log(`👥 Usuarios registrados (${teachers.length}):`)
          
          if (teachers.length === 0) {
            console.log('❌ No hay usuarios registrados en la base de datos')
            return []
          }
          
          teachers.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.name} (${teacher.email})`)
            console.log(`   - Rol: ${teacher.role}`)
            console.log(`   - Código: ${teacher.personalCode}`)
            console.log(`   - Activo: ${teacher.isActive ? 'Sí' : 'No'}`)
            console.log(`   - Grupo: ${teacher.selectedGroup}`)
            console.log('')
          })
          
          return teachers
        } catch (error) {
          console.error('❌ Error listando usuarios:', error)
          return []
        }
      },

      // Crear usuario admin de emergencia
      createEmergencyAdmin: async () => {
        try {
          console.log('🚨 Creando usuario administrador de emergencia...')
          const hashedPassword = await hashPassword('admin123')
          
          const adminTeacher = await createTeacher({
            name: 'Administrador',
            email: 'admin@colegio.edu.co',
            password: hashedPassword,
            selectedGroup: 'Admin',
            role: 'admin',
            isActive: true,
          })
          
          console.log('✅ Usuario administrador de emergencia creado:')
          console.log(`📧 Email: ${adminTeacher.email}`)
          console.log(`🔑 Contraseña: admin123`)
          console.log(`👤 Código personal: ${adminTeacher.personalCode}`)
          
          return adminTeacher
        } catch (error) {
          console.error('❌ Error creando admin de emergencia:', error)
          return null
        }
      },

      // Verificar si es primera instalación
      isFirstInstall: async () => {
        try {
          const firstInstall = await isFirstTimeInstall()
          console.log(`Primera instalación: ${firstInstall ? 'Sí' : 'No'}`)
          return firstInstall
        } catch (error) {
          console.error('Error verificando instalación:', error)
        }
      },

      // Limpiar localStorage específico
      clearStorage: () => {
        const keys = ['currentTeacher', 'authState', 'selectedGroup']
        keys.forEach(key => localStorage.removeItem(key))
        console.log('✅ LocalStorage específico limpiado:', keys)
      },

      // Mostrar ayuda
      help: () => {
        console.log(`
🔧 HERRAMIENTAS DE DESARROLLO - Aplicación de Control de Comedor

Comandos disponibles:
┌─────────────────────────────────────────────────────────────┐
│ devTools.resetApp()         - Reset completo (borra todo)  │
│ devTools.dbStats()          - Estadísticas de la BD        │
│ devTools.listUsers()        - Listar todos los usuarios    │
│ devTools.createEmergencyAdmin() - Crear admin emergencia   │
│ devTools.isFirstInstall()   - Verificar primera instalación│
│ devTools.clearStorage()     - Limpiar localStorage específico│
│ devTools.help()             - Mostrar esta ayuda           │
│ devTools.emergency()        - Reset de emergencia confirm  │
│ devTools.status()           - Estado actual de la app      │
└─────────────────────────────────────────────────────────────┘

⚠️  ADVERTENCIA: 
- resetApp() borrará TODOS los datos de la aplicación
- Solo disponible en modo desarrollo (localhost)
- Usa con precaución

Ejemplo de uso:
> devTools.dbStats()    // Ver estadísticas
> devTools.resetApp()   // Reset completo
        `)
      },

      // Reset de emergencia con confirmación
      emergency: async () => {
        const confirmation = prompt(
          '⚠️ RESET DE EMERGENCIA ⚠️\n\n' +
          'Esto borrará TODO:\n' +
          '• Maestros registrados\n' +
          '• Registros de comidas\n' +
          '• Configuraciones\n' +
          '• Datos guardados\n\n' +
          'Para confirmar, escribe: BORRAR_TODO'
        )

        if (confirmation === 'BORRAR_TODO') {
          console.log('🚨 Ejecutando reset de emergencia...')
          try {
            await factoryReset()
            alert('✅ Reset de emergencia completado!\n\nLa página se recargará automáticamente.')
            setTimeout(() => window.location.reload(), 2000)
          } catch (error) {
            console.error('❌ Error en reset de emergencia:', error)
            alert('❌ Error durante el reset de emergencia')
          }
        } else {
          console.log('❌ Reset cancelado - confirmación incorrecta')
        }
      },

      // Información del estado actual
      status: () => {
        const currentTeacher = JSON.parse(localStorage.getItem('currentTeacher') || 'null')
        const status = {
          timestamp: new Date().toISOString(),
          authenticated: !!currentTeacher,
          teacher: currentTeacher ? {
            name: currentTeacher.name,
            email: currentTeacher.email,
            personalCode: currentTeacher.personalCode,
            group: currentTeacher.selectedGroup
          } : null,
          localStorage: {
            currentTeacher: !!localStorage.getItem('currentTeacher'),
            keys: Object.keys(localStorage).filter(key => 
              key.includes('teacher') || key.includes('auth') || key.includes('meal')
            )
          },
          isDevelopment: this.isDevelopment,
          url: window.location.href
        }
        
        console.log('📊 Estado actual de la aplicación:')
        console.table(status)
        return status
      }
    }

    // Mostrar mensaje de bienvenida en desarrollo
    console.log(`
🎯 MODO DESARROLLO ACTIVADO

Herramientas de desarrollo disponibles en la consola.
Escribe: devTools.help() para ver comandos disponibles.

Estado: ${this.isDevelopment ? 'Desarrollo' : 'Producción'}
Timestamp: ${new Date().toLocaleString('es-ES')}
    `)
  }

  // Función para monitorear cambios en la aplicación
  static monitorChanges() {
    if (typeof window !== 'undefined') {
      // Monitorear cambios en localStorage
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key: string, value: string) {
        console.log(`📝 localStorage.setItem: ${key}`)
        originalSetItem.apply(this, [key, value])
      }

      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = function(key: string) {
        console.log(`🗑️ localStorage.removeItem: ${key}`)
        originalRemoveItem.apply(this, [key])
      }
    }
  }
}

// Inicializar herramientas de desarrollo si estamos en desarrollo
export const initDevTools = () => {
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (isDev) {
      new DevTools()
      DevTools.monitorChanges()
    }
  }
}

// Función de utilidad para reset rápido desde cualquier lugar
export const quickReset = async (): Promise<boolean> => {
  try {
    await factoryReset()
    return true
  } catch (error) {
    console.error('Error en quickReset:', error)
    return false
  }
}

export default DevTools