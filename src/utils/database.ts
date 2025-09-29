// Base de datos IndexedDB para el sistema de comedor escolar
export interface Teacher {
  id: string;
  name: string;
  email: string;
  password: string;
  personalCode: string;
  selectedGroup: string;
  role: "teacher" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: string;
  description: string;
  category:
    | "ciclo1"
    | "ciclo2"
    | "ciclo3"
    | "ciclo4"
    | "modalidad_tecnica"; // Cambió de "especiales" a "modalidad_tecnica"
  scheduleStart: string; // Hora de inicio del almuerzo (formato HH:MM)
  scheduleEnd: string; // Hora de fin del almuerzo (formato HH:MM)
  maxReinforcements: number; // NUEVO: Número máximo de refuerzos permitidos para este grado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuEntry {
  id: string;
  date: string;
  mainDish: string;
  sideDish: string;
  drink: string;
  dessert?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ACTUALIZADA: Interfaz de MealRecord con campos adicionales para el nuevo sistema
export interface MealRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  selectedGroup: string;
  registeredAt: string; // Cuando eligió el grupo (estado "registrado")
  enteredAt?: string; // Cuando puso el código personal (estado "comiendo")
  timestamp: string; // Por compatibilidad (igual a enteredAt o registeredAt)
  date: string;
  method: "personal_code";
  status: "registered" | "eating" | "finished"; // Estado actual del maestro
}

// NUEVA: Interfaz para registros de asistencia de estudiantes
export interface StudentAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  gradeName: string;
  gradeCategory: Grade["category"];
  date: string;
  studentsPresent: number;
  studentsEating: number;
  studentsNotEating: number;
  reinforcementsUsed: number; // NUEVO: Número de refuerzos utilizados para este grado
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseStats {
  totalTeachers: number;
  activeTeachers: number;
  totalAdmins: number;
  totalGrades: number;
  activeGrades: number;
  totalMenus: number;
  todayRecords: number;
  lastCleanup: string | null;
  dbSize: number;
  isInitialized: boolean;
}

// NUEVA: Interfaz para estadísticas del maestro
export interface TeacherStats {
  totalRecords: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  lastRecord: string | null;
  averagePerWeek: number;
  currentStreak: number;
  favoriteTimeSlot: string | null;
}

// NUEVA: Interfaz para estadísticas del administrador
export interface AdminStats extends DatabaseStats {
  studentAttendanceRecords: StudentAttendanceRecord[];
}

// Utilidad para obtener el nombre legible de la categoría
export const getCategoryDisplayName = (
  category: Grade["category"],
): string => {
  switch (category) {
    case "ciclo1":
      return "Ciclo 1";
    case "ciclo2":
      return "Ciclo 2";
    case "ciclo3":
      return "Ciclo 3";
    case "ciclo4":
      return "Ciclo 4";
    case "modalidad_tecnica":
      return "Modalidad Técnica";
    default:
      return "Sin categoría";
  }
};

// Utilidad para obtener la descripción de la categoría
export const getCategoryDescription = (
  category: Grade["category"],
): string => {
  switch (category) {
    case "ciclo1":
      return "Transición a 3° Grado + Brújula 1 y 2";
    case "ciclo2":
      return "4° a 5° Grado + Aceleración 1 y 2";
    case "ciclo3":
      return "6° a 8° Grado + CS1";
    case "ciclo4":
      return "9° a 11° Grado + CS2";
    case "modalidad_tecnica":
      return "Programas Técnicos";
    default:
      return "Sin descripción";
  }
};

// NUEVA: Utilidad para calcular la duración de un grado en minutos
export const getGradeDurationInMinutes = (
  grade: Grade,
): number => {
  try {
    const start = new Date(
      `2000-01-01T${grade.scheduleStart}:00`,
    );
    const end = new Date(`2000-01-01T${grade.scheduleEnd}:00`);
    return Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );
  } catch (error) {
    return 20; // Duración por defecto de 20 minutos
  }
};

// NUEVA: Función para calcular el estado actual de un maestro basado en la nueva lógica
export const calculateTeacherStatus = (
  record: MealRecord,
  grade: Grade | undefined,
  currentTime: Date,
): MealRecord["status"] => {
  try {
    // Si no hay grado, usar lógica básica
    if (!grade) {
      return record.enteredAt ? "eating" : "registered";
    }

    // Si aún no ha empezado a comer (no tiene enteredAt), está registrado
    if (!record.enteredAt) {
      return "registered";
    }

    // Calcular tiempo transcurrido desde que empezó a comer (enteredAt)
    const enteredTime = new Date(record.enteredAt);
    const minutesEating = Math.floor(
      (currentTime.getTime() - enteredTime.getTime()) /
        (1000 * 60),
    );

    // Obtener duración del grado
    const gradeDuration = getGradeDurationInMinutes(grade);

    // Si ha pasado el tiempo asignado desde que empezó a comer, está terminado
    if (minutesEating >= gradeDuration) {
      return "finished";
    }

    // Si está dentro del tiempo desde que empezó a comer, está comiendo
    return "eating";
  } catch (error) {
    console.error(
      "Error calculando estado del maestro:",
      error,
    );
    return record.enteredAt ? "eating" : "registered";
  }
};

// NUEVA: Función para obtener tiempo restante en minutos
export const getRemainingTimeInMinutes = (
  record: MealRecord,
  grade: Grade | undefined,
): number => {
  try {
    if (!record.enteredAt || !grade) return 0;

    const enteredTime = new Date(record.enteredAt);
    const currentTime = new Date();
    const minutesEating = Math.floor(
      (currentTime.getTime() - enteredTime.getTime()) /
        (1000 * 60),
    );
    const gradeDuration = getGradeDurationInMinutes(grade);

    return Math.max(0, gradeDuration - minutesEating);
  } catch (error) {
    return 0;
  }
};

// NUEVA: Función utilitaria para obtener fecha local en formato YYYY-MM-DD
export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// NUEVA: Función utilitaria para obtener timestamp local en formato ISO
export const getLocalISOString = (date?: Date): string => {
  const d = date || new Date();
  return d.toISOString();
};

// NUEVA: Función utilitaria para formatear hora con a.m./p.m.
export const formatTimeWithAmPm = (timeString: string): string => {
  try {
    // Si la hora ya incluye a.m./p.m., devolverla tal como está
    if (timeString.includes('a.m.') || timeString.includes('p.m.') || timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    // Crear una fecha con la hora proporcionada
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
    
    // Formatear con a.m./p.m. en español
    return date.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace('AM', 'a.m.').replace('PM', 'p.m.');
  } catch (error) {
    // Si hay error en el formateo, devolver la hora original con indicación de formato
    return timeString + (timeString.includes(':') ? '' : ':00');
  }
};

// NUEVA: Función utilitaria para formatear fecha y hora con a.m./p.m.
export const formatDateTimeWithAmPm = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace('AM', 'a.m.').replace('PM', 'p.m.');
  } catch (error) {
    return dateString;
  }
};

// NUEVA: Función utilitaria para formatear solo fecha en formato largo
export const formatDateLong = (dateString: string): string => {
  try {
    // Si es formato YYYY-MM-DD, convertir correctamente
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month - 1 porque los meses en JS empiezan en 0
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else {
      // Para otros formatos de fecha
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formateando fecha larga:', error);
    return dateString;
  }
};

// NUEVA: Función para generar IDs únicos
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// NUEVAS: Funciones para manejo de contraseñas con hash
export const hashPassword = async (password: string): Promise<string> => {
  // Usar Web Crypto API para hacer hash de la contraseña
  try {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const hashedInput = await hashPassword(password);
    return hashedInput === hashedPassword;
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return false;
  }
};

// Base de datos IndexedDB
let db: IDBDatabase | null = null;

const DB_NAME = "TeacherMealDB";
const DB_VERSION = 10; // Incrementamos versión para agregar funcionalidad de refuerzos

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest)
        .result;

      // Crear store para maestros si no existe
      if (!database.objectStoreNames.contains("teachers")) {
        const teacherStore = database.createObjectStore(
          "teachers",
          { keyPath: "id" },
        );
        teacherStore.createIndex("email", "email", {
          unique: true,
        });
        teacherStore.createIndex(
          "personalCode",
          "personalCode",
          { unique: true },
        );
        teacherStore.createIndex("role", "role");
      }

      // Crear store para grados si no existe o actualizarlo
      if (!database.objectStoreNames.contains("grades")) {
        const gradeStore = database.createObjectStore(
          "grades",
          { keyPath: "id" },
        );
        gradeStore.createIndex("name", "name", {
          unique: true,
        });
        gradeStore.createIndex("category", "category");
        gradeStore.createIndex("isActive", "isActive");
      } else if (event.oldVersion < 9) {
        // NUEVA MIGRACIÓN: Actualizar grados según nuevos requerimientos organizacionales
        console.log(
          "🔄 Migrando grados: aplicando nueva estructura organizacional...",
        );
        const transaction = (event.target as IDBOpenDBRequest)
          .transaction!;
        const gradeStore = transaction.objectStore("grades");

        gradeStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest)
            .result;
          if (cursor) {
            const grade = cursor.value;
            let updated = false;

            // Migrar de "especiales" a "modalidad_tecnica"
            if (grade.category === "especiales") {
              grade.category = "modalidad_tecnica";
              updated = true;
            }

            // Reorganizar grados según las nuevas reglas
            const name = grade.name.toLowerCase();
            
            // Identificar y reclasificar programas especiales según nuevas reglas
            if (name.includes("brújula")) {
              if (grade.category !== "ciclo1") {
                grade.category = "ciclo1";
                updated = true;
              }
            } else if (name.includes("aceleración")) {
              if (grade.category !== "ciclo2") {
                grade.category = "ciclo2";
                updated = true;
              }
            } else if (name.includes("caminar") || name.includes("cs1")) {
              if (grade.category !== "ciclo3") {
                grade.category = "ciclo3";
                updated = true;
              }
            } else if (name.includes("cs2")) {
              if (grade.category !== "ciclo4") {
                grade.category = "ciclo4";
                updated = true;
              }
            } else if (
              name.includes("técnic") ||
              name.includes("sistema") ||
              name.includes("diseño") ||
              name.includes("automotriz") ||
              name.includes("moto") ||
              name.includes("gastronom") ||
              name.includes("mueble") ||
              name.includes("música") ||
              name.includes("media técnica")
            ) {
              if (grade.category !== "modalidad_tecnica") {
                grade.category = "modalidad_tecnica";
                updated = true;
              }
            }

            // Convertir level a category basado en el nivel anterior (para versiones muy antigas)
            if (grade.level !== undefined && !grade.category) {
              if (
                grade.level === 1 ||
                grade.level === 2 ||
                grade.level === 3
              ) {
                grade.category = "ciclo1";
              } else if (
                grade.level === 4 ||
                grade.level === 5
              ) {
                grade.category = "ciclo2";
              } else if (
                grade.level === 6 ||
                grade.level === 7 ||
                grade.level === 8
              ) {
                grade.category = "ciclo3";
              } else if (
                grade.level === 9 ||
                grade.level === 10 ||
                grade.level === 11
              ) {
                grade.category = "ciclo4";
              } else {
                grade.category = "modalidad_tecnica";
              }
              updated = true;
            }

            // Asignar categoría por nombre si no tiene level
            if (!grade.category) {
              if (
                name.includes("transición") ||
                name.includes("1°") ||
                name.includes("2°") ||
                name.includes("3°")
              ) {
                grade.category = "ciclo1";
              } else if (
                name.includes("4°") ||
                name.includes("5°")
              ) {
                grade.category = "ciclo2";
              } else if (
                name.includes("6°") ||
                name.includes("7°") ||
                name.includes("8°")
              ) {
                grade.category = "ciclo3";
              } else if (
                name.includes("9°") ||
                name.includes("10") ||
                name.includes("11°")
              ) {
                grade.category = "ciclo4";
              } else {
                grade.category = "modalidad_tecnica";
              }
              updated = true;
            }

            // Agregar campos faltantes
            if (!grade.scheduleStart) {
              grade.scheduleStart = "12:00";
              updated = true;
            }
            if (!grade.scheduleEnd) {
              grade.scheduleEnd = "12:30";
              updated = true;
            }

            // Remover campo level obsoleto
            if (grade.level !== undefined) {
              delete grade.level;
              updated = true;
            }

            if (updated) {
              console.log(
                `📚 Actualizando grado "${grade.name}" a categoría "${grade.category}"`,
              );
              cursor.update(grade);
            }

            cursor.continue();
          }
        };
      } else if (event.oldVersion < 10) {
        // NUEVA MIGRACIÓN V10: Agregar campo de refuerzos a grados
        console.log("🔄 Migrando grados: agregando funcionalidad de refuerzos...");
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const gradeStore = transaction.objectStore("grades");

        gradeStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest).result;
          if (cursor) {
            const grade = cursor.value;
            let updated = false;

            // Agregar campo maxReinforcements si no existe
            if (grade.maxReinforcements === undefined) {
              grade.maxReinforcements = 0; // Valor por defecto
              updated = true;
            }

            if (updated) {
              console.log(`📚 Agregando refuerzos al grado "${grade.name}"`);
              cursor.update(grade);
            }

            cursor.continue();
          }
        };
      }

      // Crear store para menús si no existe
      if (!database.objectStoreNames.contains("menus")) {
        const menuStore = database.createObjectStore("menus", {
          keyPath: "id",
        });
        menuStore.createIndex("date", "date", { unique: true });
        menuStore.createIndex("isActive", "isActive");
      }

      // Crear store para registros de comidas si no existe o actualizarlo
      if (!database.objectStoreNames.contains("mealRecords")) {
        const recordStore = database.createObjectStore(
          "mealRecords",
          { keyPath: "id" },
        );
        recordStore.createIndex("teacherId", "teacherId");
        recordStore.createIndex("date", "date");
        recordStore.createIndex("timestamp", "timestamp");
        recordStore.createIndex("status", "status");
      } else if (event.oldVersion < 7) {
        // Migrar registros existentes para el nuevo sistema de estados
        console.log(
          "🔄 Migrando registros de comidas al nuevo sistema de estados...",
        );
        const transaction = (event.target as IDBOpenDBRequest)
          .transaction!;
        const recordStore =
          transaction.objectStore("mealRecords");

        // Añadir índice de status si no existe
        if (!recordStore.indexNames.contains("status")) {
          recordStore.createIndex("status", "status");
        }

        recordStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest)
            .result;
          if (cursor) {
            const record = cursor.value;
            let updated = false;

            // Agregar campos faltantes para la nueva lógica
            if (!record.registeredAt) {
              record.registeredAt = record.timestamp; // Usar timestamp original como registro
              updated = true;
            }

            if (!record.enteredAt) {
              // Para registros existentes, asumir que enteredAt = timestamp
              record.enteredAt = record.timestamp;
              updated = true;
            }

            if (!record.status) {
              // Para registros existentes, asumir que están "eating"
              record.status = "eating";
              updated = true;
            }

            if (updated) {
              console.log(
                `🍽️ Actualizando registro de "${record.teacherName}" al nuevo sistema`,
              );
              cursor.update(record);
            }

            cursor.continue();
          }
        };
      }

      // NUEVO: Crear store para registros de asistencia de estudiantes
      if (!database.objectStoreNames.contains("studentAttendance")) {
        console.log("🎓 Creando store de asistencia de estudiantes...");
        const attendanceStore = database.createObjectStore(
          "studentAttendance",
          { keyPath: "id" }
        );
        attendanceStore.createIndex("teacherId", "teacherId");
        attendanceStore.createIndex("gradeId", "gradeId");
        attendanceStore.createIndex("date", "date");
        attendanceStore.createIndex("timestamp", "timestamp");
        // Índice compuesto para búsquedas por maestro y fecha
        attendanceStore.createIndex("teacherDate", ["teacherId", "date"]);
        // Índice compuesto para búsquedas por grado y fecha
        attendanceStore.createIndex("gradeDate", ["gradeId", "date"]);
      } else if (event.oldVersion < 10) {
        // NUEVA MIGRACIÓN V10: Agregar campo de refuerzos a registros de asistencia
        console.log("🔄 Migrando asistencia de estudiantes: agregando refuerzos...");
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const attendanceStore = transaction.objectStore("studentAttendance");

        attendanceStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest).result;
          if (cursor) {
            const record = cursor.value;
            let updated = false;

            // Agregar campo reinforcementsUsed si no existe
            if (record.reinforcementsUsed === undefined) {
              record.reinforcementsUsed = 0; // Valor por defecto
              updated = true;
            }

            if (updated) {
              console.log(`🎓 Agregando refuerzos al registro de "${record.gradeName}"`);
              cursor.update(record);
            }

            cursor.continue();
          }
        };
      }
    };
  });
};

export const initDatabase = async (): Promise<void> => {
  try {
    console.log("🚀 Inicializando base de datos...");
    
    // Abrir la base de datos
    db = await openDB();
    console.log("📦 Base de datos IndexedDB abierta correctamente");

    // Crear el administrador por defecto si no existe
    await createDefaultAdmin();

    // Solo crear grados por defecto si NO HAY NINGÚN GRADO
    await createDefaultGradesIfEmpty();

    // Verificar que todo esté funcionando correctamente
    const stats = await getDatabaseStats();
    console.log("📊 Estadísticas de inicialización:", {
      maestros: stats.totalTeachers,
      admins: stats.totalAdmins,
      grados: stats.totalGrades,
      inicializada: stats.isInitialized
    });

    console.log("✅ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
    
    // Información adicional para debugging
    console.log("🔍 Estado del navegador:");
    console.log("- IndexedDB disponible:", 'indexedDB' in window);
    console.log("- localStorage disponible:", 'localStorage' in window);
    console.log("- Base de datos (db):", !!db);
    
    throw error;
  }
};

// Función para crear el administrador por defecto
const createDefaultAdmin = async (): Promise<void> => {
  try {
    const adminEmail = "admin@colegio.edu.co";
    
    // Verificar directamente en la base de datos usando una consulta más simple
    const existingAdmin = await new Promise<Teacher | null>((resolve) => {
      try {
        const transaction = db!.transaction(["teachers"], "readonly");
        const store = transaction.objectStore("teachers");
        const index = store.index("email");
        const request = index.get(adminEmail);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null); // Si hay error, asumir que no existe
      } catch (error) {
        console.log("🔍 No se pudo verificar admin existente, creando uno nuevo...");
        resolve(null);
      }
    });
    
    if (!existingAdmin) {
      console.log("👑 Creando usuario administrador por defecto...");
      const hashedPassword = await hashPassword("admin123");
      
      const adminTeacher = await createTeacher({
        name: "Administrador",
        email: adminEmail,
        password: hashedPassword,
        selectedGroup: "Admin",
        role: "admin",
        isActive: true,
      });
      
      console.log("✅ Usuario administrador creado exitosamente");
      console.log("📧 Email: admin@colegio.edu.co");
      console.log("🔑 Contraseña: admin123");
      console.log("👤 Código personal:", adminTeacher.personalCode);
    } else {
      console.log("👑 Usuario administrador ya existe");
    }
  } catch (error) {
    console.error("❌ Error creando administrador por defecto:", error);
    // En caso de error, intentar crear de todas formas
    try {
      console.log("🔄 Intentando crear admin de emergencia...");
      const hashedPassword = await hashPassword("admin123");
      const adminTeacher = await createTeacher({
        name: "Administrador",
        email: "admin@colegio.edu.co",
        password: hashedPassword,
        selectedGroup: "Admin",
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin de emergencia creado:", adminTeacher.email);
    } catch (emergencyError) {
      console.error("❌ Error crítico creando admin:", emergencyError);
    }
  }
};

// Función para crear grados por defecto si está vacío
const createDefaultGradesIfEmpty = async (): Promise<void> => {
  try {
    const existingGrades = await getAllGrades();
    
    if (existingGrades.length === 0) {
      console.log("📚 Creando grados por defecto...");
      
      const defaultGrades = [
        // Ciclo 1
        { name: "Transición", description: "Grado de transición", category: "ciclo1" as const },
        { name: "1° Grado", description: "Primer grado de primaria", category: "ciclo1" as const },
        { name: "2° Grado", description: "Segundo grado de primaria", category: "ciclo1" as const },
        { name: "3° Grado", description: "Tercer grado de primaria", category: "ciclo1" as const },
        { name: "Brújula 1", description: "Programa Brújula 1", category: "ciclo1" as const },
        { name: "Brújula 2", description: "Programa Brújula 2", category: "ciclo1" as const },
        
        // Ciclo 2
        { name: "4° Grado", description: "Cuarto grado de primaria", category: "ciclo2" as const },
        { name: "5° Grado", description: "Quinto grado de primaria", category: "ciclo2" as const },
        { name: "Aceleración 1", description: "Programa Aceleración 1", category: "ciclo2" as const },
        { name: "Aceleración 2", description: "Programa Aceleración 2", category: "ciclo2" as const },
        
        // Ciclo 3
        { name: "6° Grado", description: "Sexto grado", category: "ciclo3" as const },
        { name: "7° Grado", description: "Séptimo grado", category: "ciclo3" as const },
        { name: "8° Grado", description: "Octavo grado", category: "ciclo3" as const },
        { name: "CS1", description: "Caminar en Secundaria 1", category: "ciclo3" as const },
        
        // Ciclo 4
        { name: "9° Grado", description: "Noveno grado", category: "ciclo4" as const },
        { name: "10° Grado", description: "Décimo grado", category: "ciclo4" as const },
        { name: "11° Grado", description: "Once grado", category: "ciclo4" as const },
        { name: "CS2", description: "Caminar en Secundaria 2", category: "ciclo4" as const },
        
        // Modalidad Técnica
        { name: "Técnico en Sistemas", description: "Programa técnico en sistemas", category: "modalidad_tecnica" as const },
        { name: "Técnico en Diseño", description: "Programa técnico en diseño", category: "modalidad_tecnica" as const },
        { name: "Técnico Automotriz", description: "Programa técnico automotriz", category: "modalidad_tecnica" as const },
        { name: "Técnico en Gastronomía", description: "Programa técnico en gastronomía", category: "modalidad_tecnica" as const },
        { name: "Técnico en Ebanistería", description: "Programa técnico en ebanistería", category: "modalidad_tecnica" as const },
        { name: "Técnico en Música", description: "Programa técnico en música", category: "modalidad_tecnica" as const },
      ];

      for (const gradeData of defaultGrades) {
        await createGrade({
          ...gradeData,
          scheduleStart: "12:00",
          scheduleEnd: "12:30",
          maxReinforcements: 0, // Valor por defecto para refuerzos
          isActive: true,
        });
      }
      
      console.log(`✅ ${defaultGrades.length} grados por defecto creados exitosamente`);
    }
  } catch (error) {
    console.error("❌ Error creando grados por defecto:", error);
  }
};

// Función para verificar si es primera instalación
export const isFirstTimeInstall =
  async (): Promise<boolean> => {
    try {
      // Verificar si existe la flag de instalación en localStorage
      const installFlag = localStorage.getItem("app_installed");
      if (installFlag) {
        return false;
      }

      // Verificar si existe algún dato en la base de datos
      const teachers = await getAllTeachers().catch(() => []);

      if (teachers.length === 0) {
        // Primera instalación - establecer flag
        localStorage.setItem(
          "app_installed",
          new Date().toISOString(),
        );
        return true;
      }

      // Ya hay datos, no es primera instalación
      localStorage.setItem(
        "app_installed",
        new Date().toISOString(),
      );
      return false;
    } catch (error) {
      console.error(
        "Error verificando primera instalación:",
        error,
      );
      return true; // Asumir primera instalación si hay error
    }
  };

// Función para obtener estadísticas detalladas de la base de datos
export const getDatabaseStats =
  async (): Promise<DatabaseStats> => {
    try {
      const [teachers, grades, menus, todayRecords] =
        await Promise.all([
          getAllTeachers(),
          getAllGrades(),
          getAllMenus(),
          getTodayMealRecords(),
        ]);

      // Calcular tamaño aproximado de la DB (en bytes)
      const dbSize = JSON.stringify({
        teachers,
        grades,
        menus,
        todayRecords,
      }).length;

      return {
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter(
          (t) => t.isActive && t.role === "teacher",
        ).length,
        totalAdmins: teachers.filter((t) => t.role === "admin")
          .length,
        totalGrades: grades.length,
        activeGrades: grades.filter((g) => g.isActive).length,
        totalMenus: menus.length,
        todayRecords: todayRecords.length,
        lastCleanup: localStorage.getItem("lastAutoCleanup"),
        dbSize,
        isInitialized: db !== null,
      };
    } catch (error) {
      console.error(
        "Error obteniendo estadísticas de la base de datos:",
        error,
      );
      return {
        totalTeachers: 0,
        activeTeachers: 0,
        totalAdmins: 0,
        totalGrades: 0,
        activeGrades: 0,
        totalMenus: 0,
        todayRecords: 0,
        lastCleanup: null,
        dbSize: 0,
        isInitialized: false,
      };
    }
  };

// NUEVA: Función para obtener estadísticas específicas del administrador
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const [basicStats, studentAttendanceRecords] = await Promise.all([
      getDatabaseStats(),
      getTodayStudentAttendanceRecords(),
    ]);

    return {
      ...basicStats,
      studentAttendanceRecords,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del administrador:", error);
    const basicStats = await getDatabaseStats();
    return {
      ...basicStats,
      studentAttendanceRecords: [],
    };
  }
};

// ===== FUNCIONES PRINCIPALES =====

export const getAllTeachers = async (): Promise<Teacher[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAllGrades = async (): Promise<Grade[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAllMenus = async (): Promise<MenuEntry[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readonly");
    const store = transaction.objectStore("menus");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getTodayMealRecords = async (): Promise<MealRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const today = getLocalDateString();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readonly");
    const store = transaction.objectStore("mealRecords");
    const index = store.index("date");
    const request = index.getAll(today);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const createTeacher = async (
  teacherData: Omit<Teacher, "id" | "personalCode" | "createdAt" | "updatedAt">
): Promise<Teacher> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const id = generateId();
  const personalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = getLocalISOString();

  const teacher: Teacher = {
    ...teacherData,
    id,
    personalCode,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readwrite");
    const store = transaction.objectStore("teachers");
    const request = store.add(teacher);

    request.onsuccess = () => resolve(teacher);
    request.onerror = () => reject(request.error);
  });
};

export const authenticateUser = async (email: string, password: string): Promise<Teacher> => {
  if (!db) throw new Error("Base de datos no inicializada");

  console.log(`🔐 Intentando autenticar usuario: ${email}`);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const index = store.index("email");
    const request = index.get(email);

    request.onsuccess = async () => {
      const teacher = request.result;
      
      if (!teacher) {
        console.log(`❌ Usuario no encontrado: ${email}`);
        
        // Debug: listar todos los usuarios para ayudar con el debugging
        const allTeachersRequest = store.getAll();
        allTeachersRequest.onsuccess = () => {
          const allTeachers = allTeachersRequest.result || [];
          console.log(`📋 Usuarios disponibles en la BD (${allTeachers.length}):`, 
            allTeachers.map(t => ({ email: t.email, name: t.name, role: t.role }))
          );
        };
        
        reject(new Error("Usuario no encontrado"));
        return;
      }

      console.log(`✅ Usuario encontrado: ${teacher.name} (${teacher.role})`);

      try {
        const isValid = await verifyPassword(password, teacher.password);
        if (isValid) {
          console.log(`🎉 Autenticación exitosa para: ${teacher.name}`);
          resolve(teacher);
        } else {
          console.log(`❌ Contraseña incorrecta para: ${email}`);
          reject(new Error("Contraseña incorrecta"));
        }
      } catch (error) {
        console.error("❌ Error verificando contraseña:", error);
        reject(error);
      }
    };

    request.onerror = () => {
      console.error("❌ Error accediendo a la base de datos:", request.error);
      reject(request.error);
    };
  });
};

export const getTeacherByEmail = async (email: string): Promise<Teacher | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const index = store.index("email");
    const request = index.get(email);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getTeacherByPersonalCode = async (code: string): Promise<Teacher | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const index = store.index("personalCode");
    const request = index.get(code);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const updateTeacher = async (updates: Partial<Teacher> & { id: string }): Promise<Teacher> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise(async (resolve, reject) => {
    try {
      const existingTeacher = await getTeacherById(updates.id);
      if (!existingTeacher) {
        reject(new Error("Maestro no encontrado"));
        return;
      }

      const updatedTeacher: Teacher = {
        ...existingTeacher,
        ...updates,
        updatedAt: getLocalISOString()
      };

      const transaction = db!.transaction(["teachers"], "readwrite");
      const store = transaction.objectStore("teachers");
      const request = store.put(updatedTeacher);

      request.onsuccess = () => resolve(updatedTeacher);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
};

export const createGrade = async (
  gradeData: Omit<Grade, "id" | "createdAt" | "updatedAt">
): Promise<Grade> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const id = generateId();
  const now = getLocalISOString();

  const grade: Grade = {
    ...gradeData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readwrite");
    const store = transaction.objectStore("grades");
    const request = store.add(grade);

    request.onsuccess = () => resolve(grade);
    request.onerror = () => reject(request.error);
  });
};

export const updateGrade = async (grade: Grade): Promise<Grade> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const updatedGrade = {
    ...grade,
    updatedAt: getLocalISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readwrite");
    const store = transaction.objectStore("grades");
    const request = store.put(updatedGrade);

    request.onsuccess = () => resolve(updatedGrade);
    request.onerror = () => reject(request.error);
  });
};

export const deleteGrade = async (gradeId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readwrite");
    const store = transaction.objectStore("grades");
    const request = store.delete(gradeId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getGradeById = async (id: string): Promise<Grade | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getGradeByName = async (name: string): Promise<Grade | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const index = store.index("name");
    const request = index.get(name);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getActiveGrades = async (): Promise<Grade[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const index = store.index("isActive");
    const request = index.getAll(true);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getTodayMenu = async (): Promise<MenuEntry | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const today = getLocalDateString();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readonly");
    const store = transaction.objectStore("menus");
    const index = store.index("date");
    const request = index.get(today);

    request.onsuccess = () => {
      const menu = request.result;
      if (menu && menu.isActive) {
        resolve(menu);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const upsertMenu = async (
  menuData: Omit<MenuEntry, "id" | "createdAt" | "updatedAt">
): Promise<MenuEntry> => {
  if (!db) throw new Error("Base de datos no inicializada");

  // Buscar si ya existe un menú para esta fecha
  const existingMenu = await new Promise<MenuEntry | null>((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readonly");
    const store = transaction.objectStore("menus");
    const index = store.index("date");
    const request = index.get(menuData.date);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  if (existingMenu) {
    // Actualizar el menú existente
    return updateMenu({
      ...existingMenu,
      ...menuData,
    });
  } else {
    // Crear nuevo menú
    return createMenu(menuData);
  }
};

export const createMenu = async (
  menuData: Omit<MenuEntry, "id" | "createdAt" | "updatedAt">
): Promise<MenuEntry> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const id = generateId();
  const now = getLocalISOString();

  const menu: MenuEntry = {
    ...menuData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readwrite");
    const store = transaction.objectStore("menus");
    const request = store.add(menu);

    request.onsuccess = () => resolve(menu);
    request.onerror = () => reject(request.error);
  });
};

export const updateMenu = async (menu: MenuEntry): Promise<MenuEntry> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const updatedMenu = {
    ...menu,
    updatedAt: getLocalISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readwrite");
    const store = transaction.objectStore("menus");
    const request = store.put(updatedMenu);

    request.onsuccess = () => resolve(updatedMenu);
    request.onerror = () => reject(request.error);
  });
};

export const deleteMenu = async (menuId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readwrite");
    const store = transaction.objectStore("menus");
    const request = store.delete(menuId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addMealRecord = async (
  recordData: Omit<MealRecord, "id" | "date" | "timestamp">
): Promise<MealRecord> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const id = generateId();
  const now = new Date();

  const record: MealRecord = {
    ...recordData,
    id,
    date: getLocalDateString(now),
    timestamp: getLocalISOString(now),
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readwrite");
    const store = transaction.objectStore("mealRecords");
    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
};

export const updateMealRecord = async (recordId: string, updates: Partial<MealRecord>): Promise<MealRecord> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readwrite");
    const store = transaction.objectStore("mealRecords");

    // Primero obtener el registro actual
    const getRequest = store.get(recordId);

    getRequest.onsuccess = () => {
      const existingRecord = getRequest.result;
      if (!existingRecord) {
        reject(new Error("Registro de comida no encontrado"));
        return;
      }

      // Crear el registro actualizado
      const updatedRecord: MealRecord = {
        ...existingRecord,
        ...updates,
        // Mantener timestamp actualizado para compatibilidad
        timestamp: updates.enteredAt || existingRecord.timestamp
      };

      // Guardar el registro actualizado
      const putRequest = store.put(updatedRecord);

      putRequest.onsuccess = () => {
        console.log('✅ Registro de comida actualizado:', updatedRecord.teacherName);
        resolve(updatedRecord);
      };

      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getMealRecordsByTeacherId = async (teacherId: string): Promise<MealRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readonly");
    const store = transaction.objectStore("mealRecords");
    const index = store.index("teacherId");
    const request = index.getAll(teacherId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getTeacherStats = async (teacherId: string): Promise<TeacherStats> => {
  if (!db) throw new Error("Base de datos no inicializada");

  try {
    const allRecords = await getMealRecordsByTeacherId(teacherId);

    if (!Array.isArray(allRecords) || allRecords.length === 0) {
      return {
        totalRecords: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0,
        lastRecord: null,
        averagePerWeek: 0,
        currentStreak: 0,
        favoriteTimeSlot: null,
      };
    }

    const now = new Date();
    const today = getLocalDateString(now);

    // Calcular inicio del mes actual
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const startOfMonthStr = getLocalDateString(startOfMonth);

    // Calcular inicio de la semana (lunes)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes = 0
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
    const startOfWeekStr = getLocalDateString(startOfWeek);

    // Filtrar registros por períodos
    const totalRecords = allRecords.length;
    const thisMonth = allRecords.filter(
      (r) => r.date >= startOfMonthStr,
    ).length;
    const thisWeek = allRecords.filter(
      (r) => r.date >= startOfWeekStr,
    ).length;
    const todayRecords = allRecords.filter(
      (r) => r.date === today,
    ).length;

    // Encontrar el último registro
    const sortedRecords = allRecords.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    );
    const lastRecord = sortedRecords.length > 0
      ? sortedRecords[0].timestamp
      : null;

    return {
      totalRecords,
      thisMonth,
      thisWeek,
      today: todayRecords,
      lastRecord,
      averagePerWeek: thisWeek, // Simplificado
      currentStreak: 0, // Simplificado
      favoriteTimeSlot: null, // Simplificado
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del maestro:", error);
    throw error;
  }
};

export const clearTodayMealRecords = async (): Promise<number> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const todayRecords = await getTodayMealRecords();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readwrite");
    const store = transaction.objectStore("mealRecords");
    
    let deletedCount = 0;
    let completed = 0;
    const total = todayRecords.length;

    if (total === 0) {
      resolve(0);
      return;
    }

    todayRecords.forEach(record => {
      const request = store.delete(record.id);
      
      request.onsuccess = () => {
        deletedCount++;
        completed++;
        if (completed === total) {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        completed++;
        if (completed === total) {
          resolve(deletedCount);
        }
      };
    });
  });
};

// Nueva función que elimina registros de comida y asistencia en cascada
export const clearTodayMealRecordsWithCascade = async (): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  if (!db) throw new Error("Base de datos no inicializada");

  console.log('🗑️ Iniciando limpieza en cascada de registros de hoy...');

  try {
    // Obtener todos los registros de comida de hoy
    const todayMealRecords = await getTodayMealRecords();
    console.log(`📊 Encontrados ${todayMealRecords.length} registros de comida para eliminar`);

    if (todayMealRecords.length === 0) {
      console.log('📝 No hay registros para eliminar');
      return {
        deletedMealRecords: 0,
        deletedAttendanceRecords: 0
      };
    }

    // Obtener todos los grados para mapear nombres a IDs
    const allGrades = await getAllGrades();
    let totalAttendanceDeleted = 0;

    // Eliminar registros de asistencia relacionados para cada registro de comida
    for (const mealRecord of todayMealRecords) {
      const grade = allGrades.find(g => g.name === mealRecord.selectedGroup);
      if (grade) {
        console.log(`🗑️ Eliminando asistencia para maestro ${mealRecord.teacherId}, grado ${grade.id}, fecha ${mealRecord.date}`);
        
        const deletedAttendanceCount = await deleteStudentAttendanceRecordsByTeacherAndDate(
          mealRecord.teacherId,
          grade.id,
          mealRecord.date
        );
        
        totalAttendanceDeleted += deletedAttendanceCount;
        
        if (deletedAttendanceCount > 0) {
          console.log(`✅ ${deletedAttendanceCount} registros de asistencia eliminados para ${mealRecord.teacherName} - ${mealRecord.selectedGroup}`);
        }
      }
    }

    // Ahora eliminar todos los registros de comida
    console.log('🗑️ Eliminando registros de comida...');
    const deletedMealCount = await clearTodayMealRecords();

    console.log(`✅ Limpieza en cascada completada: ${deletedMealCount} registros de comida y ${totalAttendanceDeleted} registros de asistencia eliminados`);

    return {
      deletedMealRecords: deletedMealCount,
      deletedAttendanceRecords: totalAttendanceDeleted
    };

  } catch (error) {
    console.error('❌ Error durante la limpieza en cascada:', error);
    throw error;
  }
};

export const factoryReset = async (): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(
      ["teachers", "grades", "menus", "mealRecords", "studentAttendance"],
      "readwrite"
    );

    const stores = ["teachers", "grades", "menus", "mealRecords", "studentAttendance"];
    let completed = 0;

    stores.forEach(storeName => {
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        completed++;
        if (completed === stores.length) {
          // Limpiar localStorage también
          localStorage.removeItem("app_installed");
          localStorage.removeItem("lastAutoCleanup");
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    transaction.onerror = () => reject(transaction.error);
  });
};

export const cleanupOldRecords = async (): Promise<void> => {
  // Implementación simplificada - no hacer nada por ahora
  return Promise.resolve();
};

// Funciones legacy para compatibilidad
export const startEating = async (recordId: string): Promise<MealRecord> => {
  return updateMealRecord(recordId, {
    enteredAt: getLocalISOString(),
    status: 'eating'
  });
};

// ===== FUNCIONES DE ASISTENCIA DE ESTUDIANTES =====

export const createStudentAttendanceRecord = async (
  recordData: Omit<StudentAttendanceRecord, "id" | "timestamp" | "createdAt" | "updatedAt">
): Promise<StudentAttendanceRecord> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const id = generateId();
  const now = getLocalISOString();

  const record: StudentAttendanceRecord = {
    ...recordData,
    id,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readwrite");
    const store = transaction.objectStore("studentAttendance");
    const request = store.add(record);

    request.onsuccess = () => {
      console.log(`Registro de asistencia creado para ${record.gradeName}`);
      resolve(record);
    };
    
    request.onerror = () => {
      console.error("Error creando registro de asistencia:", request.error);
      reject(request.error);
    };
  });
};

export const getTodayStudentAttendanceRecords = async (): Promise<StudentAttendanceRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const today = getLocalDateString();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readonly");
    const store = transaction.objectStore("studentAttendance");
    
    // Verificar si el índice existe
    if (!store.indexNames.contains("date")) {
      resolve([]); // Retornar array vacío si no existe el índice
      return;
    }
    
    const index = store.index("date");
    const request = index.getAll(today);

    request.onsuccess = () => {
      const records = request.result || [];
      resolve(records);
    };

    request.onerror = () => {
      console.error("Error obteniendo registros de asistencia estudiantil:", request.error);
      resolve([]); // Retornar array vacío en caso de error
    };
  });
};

export const getStudentAttendanceRecord = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<StudentAttendanceRecord | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readonly");
    const store = transaction.objectStore("studentAttendance");
    
    // Buscar por fecha primero, luego filtrar
    const index = store.index("date");
    const request = index.getAll(date);

    request.onsuccess = () => {
      const records = request.result || [];
      const record = records.find(r => r.teacherId === teacherId && r.gradeId === gradeId);
      resolve(record || null);
    };

    request.onerror = () => {
      console.error("❌ Error obteniendo registro de asistencia:", request.error);
      reject(request.error);
    };
  });
};

export const updateStudentAttendanceRecord = async (
  recordId: string,
  updates: Partial<StudentAttendanceRecord>
): Promise<StudentAttendanceRecord> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readwrite");
    const store = transaction.objectStore("studentAttendance");
    
    // Primero obtener el registro actual
    const getRequest = store.get(recordId);
    
    getRequest.onsuccess = () => {
      const existingRecord = getRequest.result;
      if (!existingRecord) {
        reject(new Error("Registro no encontrado"));
        return;
      }

      // Actualizar el registro
      const updatedRecord = {
        ...existingRecord,
        ...updates,
        updatedAt: getLocalISOString()
      };

      const updateRequest = store.put(updatedRecord);
      
      updateRequest.onsuccess = () => {
        console.log(`✅ Registro de asistencia actualizado para grado: ${updatedRecord.gradeName}`);
        resolve(updatedRecord);
      };
      
      updateRequest.onerror = () => {
        console.error("❌ Error actualizando registro de asistencia:", updateRequest.error);
        reject(updateRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error("❌ Error obteniendo registro para actualizar:", getRequest.error);
      reject(getRequest.error);
    };
  });
};

export const hasStudentAttendanceRecord = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<boolean> => {
  const record = await getStudentAttendanceRecord(teacherId, gradeId, date);
  return record !== null;
};

export const getStudentAttendanceByTeacherAndDate = async (
  teacherId: string,
  date: string
): Promise<StudentAttendanceRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readonly");
    const store = transaction.objectStore("studentAttendance");
    const index = store.index("date");
    const request = index.getAll(date);

    request.onsuccess = () => {
      const records = request.result || [];
      const filtered = records.filter(r => r.teacherId === teacherId);
      resolve(filtered);
    };

    request.onerror = () => {
      console.error("❌ Error obteniendo registros por maestro y fecha:", request.error);
      reject(request.error);
    };
  });
};

export const getStudentAttendanceByGradeAndDate = async (
  gradeId: string,
  date: string
): Promise<StudentAttendanceRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readonly");
    const store = transaction.objectStore("studentAttendance");
    const index = store.index("date");
    const request = index.getAll(date);

    request.onsuccess = () => {
      const records = request.result || [];
      const filtered = records.filter(r => r.gradeId === gradeId);
      resolve(filtered);
    };

    request.onerror = () => {
      console.error("❌ Error obteniendo registros por grado y fecha:", request.error);
      reject(request.error);
    };
  });
};

export const getStudentAttendanceByTeacher = async (
  teacherId: string
): Promise<StudentAttendanceRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readonly");
    const store = transaction.objectStore("studentAttendance");
    const index = store.index("teacherId");
    const request = index.getAll(teacherId);

    request.onsuccess = () => {
      const records = request.result || [];
      resolve(records);
    };

    request.onerror = () => {
      console.error("❌ Error obteniendo registros por maestro:", request.error);
      reject(request.error);
    };
  });
};

export const getTeacherAttendanceStats = async (teacherId: string): Promise<{
  totalSessions: number;
  totalStudentsPresent: number;
  totalStudentsEating: number;
  totalStudentsNotEating: number;
  averageAttendance: number;
  averageEatingPercentage: number;
}> => {
  const records = await getStudentAttendanceByTeacher(teacherId);
  
  if (records.length === 0) {
    return {
      totalSessions: 0,
      totalStudentsPresent: 0,
      totalStudentsEating: 0,
      totalStudentsNotEating: 0,
      averageAttendance: 0,
      averageEatingPercentage: 0,
    };
  }

  const totalStudentsPresent = records.reduce((sum, record) => sum + record.studentsPresent, 0);
  const totalStudentsEating = records.reduce((sum, record) => sum + record.studentsEating, 0);
  const totalStudentsNotEating = records.reduce((sum, record) => sum + record.studentsNotEating, 0);

  return {
    totalSessions: records.length,
    totalStudentsPresent,
    totalStudentsEating,
    totalStudentsNotEating,
    averageAttendance: Math.round(totalStudentsPresent / records.length),
    averageEatingPercentage: totalStudentsPresent > 0 ? Math.round((totalStudentsEating / totalStudentsPresent) * 100) : 0,
  };
};

// ===== FUNCIONES DE ELIMINACIÓN =====

export const deleteMealRecord = async (recordId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readwrite");
    const store = transaction.objectStore("mealRecords");
    const request = store.delete(recordId);

    request.onsuccess = () => {
      console.log(`✅ Registro de comida eliminado: ${recordId}`);
      resolve();
    };

    request.onerror = () => {
      console.error("❌ Error eliminando registro de comida:", request.error);
      reject(request.error);
    };
  });
};

export const deleteStudentAttendanceRecord = async (recordId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readwrite");
    const store = transaction.objectStore("studentAttendance");
    const request = store.delete(recordId);

    request.onsuccess = () => {
      console.log(`✅ Registro de asistencia eliminado: ${recordId}`);
      resolve();
    };

    request.onerror = () => {
      console.error("❌ Error eliminando registro de asistencia:", request.error);
      reject(request.error);
    };
  });
};

export const deleteStudentAttendanceRecordsByTeacherAndDate = async (
  teacherId: string,
  gradeId: string,
  date: string
): Promise<number> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["studentAttendance"], "readwrite");
    const store = transaction.objectStore("studentAttendance");
    const index = store.index("date");
    const request = index.getAll(date);

    request.onsuccess = () => {
      const records = request.result || [];
      console.log(`🔍 Registros de asistencia encontrados para fecha ${date}: ${records.length}`);
      
      const recordsToDelete = records.filter(
        r => r.teacherId === teacherId && r.gradeId === gradeId
      );
      
      console.log(`📊 Registros que coinciden con teacherId=${teacherId} y gradeId=${gradeId}: ${recordsToDelete.length}`);
      
      if (recordsToDelete.length === 0) {
        console.log(`ℹ️ No se encontraron registros de asistencia para eliminar`);
        resolve(0);
        return;
      }
      
      console.log(`🗑️ Eliminando ${recordsToDelete.length} registros de asistencia...`);

      let deletedCount = 0;
      let completed = 0;
      const total = recordsToDelete.length;

      recordsToDelete.forEach((record, index) => {
        console.log(`🗑️ Eliminando registro ${index + 1}/${total}: ${record.id}`);
        const deleteRequest = store.delete(record.id);
        
        deleteRequest.onsuccess = () => {
          deletedCount++;
          completed++;
          console.log(`✅ Registro ${record.id} eliminado exitosamente (${completed}/${total})`);
          if (completed === total) {
            console.log(`✅ ${deletedCount} registros de asistencia eliminados para maestro ${teacherId}, grado ${gradeId}, fecha ${date}`);
            resolve(deletedCount);
          }
        };
        
        deleteRequest.onerror = () => {
          completed++;
          if (completed === total) {
            resolve(deletedCount);
          }
        };
      });
    };

    request.onerror = () => {
      console.error("❌ Error obteniendo registros de asistencia para eliminar:", request.error);
      reject(request.error);
    };
  });
};

// ===== FUNCIONES DE ELIMINACIÓN EN CASCADA =====

// NUEVA: Función para eliminar un registro de comida específico con su asistencia asociada
export const deleteMealRecordWithCascade = async (
  recordId: string,
  teacherId: string,
  selectedGroup: string,
  date: string
): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔍 Iniciando eliminación en cascada para registro ${recordId}`);
      console.log(`📋 Datos: teacherId=${teacherId}, selectedGroup=${selectedGroup}, date=${date}`);
      
      // Primero obtener el grado para mapear el nombre al ID
      const allGrades = await getAllGrades();
      console.log(`📚 Grados disponibles: ${allGrades.map(g => `${g.name}(${g.id})`).join(', ')}`);
      
      const grade = allGrades.find(g => g.name === selectedGroup);
      
      let deletedAttendanceCount = 0;
      
      // Si encontramos el grado, eliminar registros de asistencia asociados
      if (grade) {
        console.log(`✅ Grado encontrado: ${grade.name} (ID: ${grade.id})`);
        console.log(`🗑️ Eliminando asistencia para maestro ${teacherId}, grado ${grade.id}, fecha ${date}`);
        deletedAttendanceCount = await deleteStudentAttendanceRecordsByTeacherAndDate(
          teacherId,
          grade.id,
          date
        );
        console.log(`📊 ${deletedAttendanceCount} registros de asistencia eliminados`);
      } else {
        console.warn(`⚠️ No se encontró el grado con nombre: "${selectedGroup}"`);
        console.log(`🔍 Grados disponibles para comparación:`, allGrades.map(g => ({ name: g.name, id: g.id })));
      }
      
      // Ahora eliminar el registro de comida
      console.log(`🗑️ Eliminando registro de comida con ID: ${recordId}`);
      await deleteMealRecord(recordId);
      
      console.log(`✅ Eliminación completada: 1 registro de comida y ${deletedAttendanceCount} registros de asistencia`);
      
      resolve({
        deletedMealRecords: 1,
        deletedAttendanceRecords: deletedAttendanceCount
      });
      
    } catch (error) {
      console.error('❌ Error eliminando registro individual con cascada:', error);
      reject(error);
    }
  });
};

// NUEVA: Función para eliminar solo los registros del maestro actual del día (para maestros)
export const clearTeacherTodayRecordsWithCascade = async (teacherId: string): Promise<{
  deletedMealRecords: number;
  deletedAttendanceRecords: number;
}> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const today = getLocalDateString();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords", "studentAttendance"], "readwrite");
    const mealStore = transaction.objectStore("mealRecords");
    const attendanceStore = transaction.objectStore("studentAttendance");
    
    // Obtener registros de comida del maestro de hoy
    const mealIndex = mealStore.index("date");
    const mealRequest = mealIndex.getAll(today);
    
    mealRequest.onsuccess = () => {
      const allMealRecords = mealRequest.result || [];
      const teacherMealRecords = allMealRecords.filter(record => record.teacherId === teacherId);
      
      // Obtener registros de asistencia del maestro de hoy
      const attendanceIndex = attendanceStore.index("date");
      const attendanceRequest = attendanceIndex.getAll(today);
      
      attendanceRequest.onsuccess = () => {
        const allAttendanceRecords = attendanceRequest.result || [];
        const teacherAttendanceRecords = allAttendanceRecords.filter(record => record.teacherId === teacherId);
        
        if (teacherMealRecords.length === 0 && teacherAttendanceRecords.length === 0) {
          resolve({ deletedMealRecords: 0, deletedAttendanceRecords: 0 });
          return;
        }
        
        let deletedMealCount = 0;
        let deletedAttendanceCount = 0;
        let totalOperations = teacherMealRecords.length + teacherAttendanceRecords.length;
        let completedOperations = 0;
        
        // Eliminar registros de comida del maestro
        teacherMealRecords.forEach(record => {
          const deleteRequest = mealStore.delete(record.id);
          
          deleteRequest.onsuccess = () => {
            deletedMealCount++;
            completedOperations++;
            
            if (completedOperations === totalOperations) {
              console.log(`✅ Registros del maestro eliminados: ${deletedMealCount} registros de comida, ${deletedAttendanceCount} registros de asistencia`);
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: deletedAttendanceCount });
            }
          };
          
          deleteRequest.onerror = () => {
            completedOperations++;
            if (completedOperations === totalOperations) {
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: deletedAttendanceCount });
            }
          };
        });
        
        // Eliminar registros de asistencia del maestro
        teacherAttendanceRecords.forEach(record => {
          const deleteRequest = attendanceStore.delete(record.id);
          
          deleteRequest.onsuccess = () => {
            deletedAttendanceCount++;
            completedOperations++;
            
            if (completedOperations === totalOperations) {
              console.log(`✅ Registros del maestro eliminados: ${deletedMealCount} registros de comida, ${deletedAttendanceCount} registros de asistencia`);
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: deletedAttendanceCount });
            }
          };
          
          deleteRequest.onerror = () => {
            completedOperations++;
            if (completedOperations === totalOperations) {
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: deletedAttendanceCount });
            }
          };
        });
      };
      
      attendanceRequest.onerror = () => {
        // Si falla obtener asistencias, solo eliminar registros de comida del maestro
        if (teacherMealRecords.length === 0) {
          resolve({ deletedMealRecords: 0, deletedAttendanceRecords: 0 });
          return;
        }
        
        let deletedMealCount = 0;
        let completedOperations = 0;
        const totalMealOperations = teacherMealRecords.length;
        
        teacherMealRecords.forEach(record => {
          const deleteRequest = mealStore.delete(record.id);
          
          deleteRequest.onsuccess = () => {
            deletedMealCount++;
            completedOperations++;
            
            if (completedOperations === totalMealOperations) {
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: 0 });
            }
          };
          
          deleteRequest.onerror = () => {
            completedOperations++;
            if (completedOperations === totalMealOperations) {
              resolve({ deletedMealRecords: deletedMealCount, deletedAttendanceRecords: 0 });
            }
          };
        });
      };
    };
    
    mealRequest.onerror = () => {
      console.error("❌ Error obteniendo registros de comida del maestro para eliminación:", mealRequest.error);
      reject(mealRequest.error);
    };
  });
};