import { projectId, publicAnonKey } from "./supabase/info";

// Interfaces (reutilizamos las mismas del archivo database.ts original)
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
    | "especiales";
  scheduleStart: string;
  scheduleEnd: string;
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

export interface MealRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  selectedGroup: string;
  registeredAt: string;
  enteredAt?: string;
  timestamp: string;
  date: string;
  method: "personal_code";
  status: "registered" | "eating" | "finished";
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

// URL base de la API
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-66801cfb`;

// Headers por defecto
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
});

// Función auxiliar para hacer requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  console.log("🌐 API Request:", {
    url,
    method: options.method || "GET",
    headers: getHeaders(),
  });

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
      ...options,
    });

    console.log("📡 API Response:", {
      status: response.status,
      statusText: response.statusText,
      url,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ API Error Response:", errorData);
      throw new Error(
        `API Error: ${response.status} - ${errorData}`,
      );
    }

    const data = await response.json();
    console.log(
      "✅ API Data received for",
      endpoint,
      ":",
      data,
    );
    return data;
  } catch (error) {
    console.error("❌ API Request failed:", { url, error });
    throw error;
  }
}

// ===== FUNCIONES DE INICIALIZACIÓN =====

export const initDatabase = async (): Promise<void> => {
  try {
    console.log("🚀 Initializing database...");
    const result = await apiRequest("/initialize", {
      method: "POST",
    });
    console.log(
      "✅ Base de datos inicializada correctamente:",
      result,
    );
  } catch (error) {
    console.error(
      "❌ Error al inicializar la base de datos:",
      error,
    );

    // Si la inicialización falla, puede ser porque ya está inicializada
    // Intentar obtener estadísticas para verificar si el sistema funciona
    try {
      console.log("🔍 Verifying system state...");
      const stats = await apiRequest<DatabaseStats>("/stats");
      if (stats.isInitialized) {
        console.log("✅ Sistema ya inicializado y funcionando");
        return;
      }
    } catch (statsError) {
      console.error(
        "❌ Sistema no funciona correctamente:",
        statsError,
      );
    }

    throw error;
  }
};

export const isFirstTimeInstall =
  async (): Promise<boolean> => {
    try {
      const installFlag = localStorage.getItem("app_installed");
      if (installFlag) {
        return false;
      }

      const teachers = await getAllTeachers().catch(() => []);
      if (teachers.length === 0) {
        localStorage.setItem(
          "app_installed",
          new Date().toISOString(),
        );
        return true;
      }

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
      return true;
    }
  };

export const getDatabaseStats =
  async (): Promise<DatabaseStats> => {
    try {
      console.log("🔍 Requesting database stats...");
      const stats = await apiRequest<DatabaseStats>("/stats");
      console.log("✅ Stats received:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas:", error);

      // Intentar nuevamente la inicialización si las estadísticas fallan
      try {
        console.log("🔄 Attempting to re-initialize system...");
        await initDatabase();

        // Intentar obtener estadísticas nuevamente
        const retryStats =
          await apiRequest<DatabaseStats>("/stats");
        console.log("✅ Stats received on retry:", retryStats);
        return retryStats;
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError);
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
    }
  };

// ===== FUNCIONES DE MAESTROS =====

export const getAllTeachers = async (): Promise<Teacher[]> => {
  return await apiRequest<Teacher[]>("/teachers");
};

export const createTeacher = async (
  teacherData: Omit<
    Teacher,
    "id" | "personalCode" | "createdAt" | "updatedAt"
  >,
): Promise<Teacher> => {
  return await apiRequest<Teacher>("/teachers", {
    method: "POST",
    body: JSON.stringify(teacherData),
  });
};

export const authenticateTeacher = async (
  email: string,
  password: string,
): Promise<{ teacher: Teacher; token: string }> => {
  return await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getTeacherByEmail = async (
  email: string,
): Promise<Teacher | null> => {
  try {
    const teachers = await getAllTeachers();
    return teachers.find((t) => t.email === email) || null;
  } catch (error) {
    return null;
  }
};

export const getTeacherByPersonalCode = async (
  code: string,
): Promise<Teacher | null> => {
  try {
    return await apiRequest<Teacher>(
      `/teachers/by-code/${code}`,
    );
  } catch (error) {
    return null;
  }
};

export const getTeacherById = async (
  id: string,
): Promise<Teacher | null> => {
  try {
    const teachers = await getAllTeachers();
    return teachers.find((t) => t.id === id) || null;
  } catch (error) {
    return null;
  }
};

export const updateTeacher = async (
  id: string,
  updates: Partial<Teacher>,
): Promise<Teacher> => {
  // Esta funcionalidad requeriría una ruta PUT en el servidor
  throw new Error("updateTeacher no implementado aún");
};

export const deleteTeacher = async (
  id: string,
): Promise<void> => {
  // Esta funcionalidad requeriría una ruta DELETE en el servidor
  throw new Error("deleteTeacher no implementado aún");
};

// ===== FUNCIONES DE GRADOS =====

export const getAllGrades = async (): Promise<Grade[]> => {
  return await apiRequest<Grade[]>("/grades");
};

export const createGrade = async (
  gradeData: Omit<Grade, "id" | "createdAt" | "updatedAt">,
): Promise<Grade> => {
  return await apiRequest<Grade>("/grades", {
    method: "POST",
    body: JSON.stringify(gradeData),
  });
};

export const getGradeById = async (
  id: string,
): Promise<Grade | null> => {
  try {
    const grades = await getAllGrades();
    return grades.find((g) => g.id === id) || null;
  } catch (error) {
    return null;
  }
};

export const getGradeByName = async (
  name: string,
): Promise<Grade | null> => {
  try {
    const grades = await getAllGrades();
    return grades.find((g) => g.name === name) || null;
  } catch (error) {
    return null;
  }
};

export const getActiveGrades = async (): Promise<Grade[]> => {
  try {
    const grades = await getAllGrades();
    return grades.filter((g) => g.isActive);
  } catch (error) {
    return [];
  }
};

// ===== FUNCIONES DE MENÚS =====

export const getTodayMenu =
  async (): Promise<MenuEntry | null> => {
    try {
      return await apiRequest<MenuEntry | null>("/menu/today");
    } catch (error) {
      return null;
    }
  };

export const upsertMenu = async (
  menuData: Omit<MenuEntry, "id" | "createdAt" | "updatedAt">,
): Promise<MenuEntry> => {
  return await apiRequest<MenuEntry>("/menu", {
    method: "POST",
    body: JSON.stringify(menuData),
  });
};

export const getAllMenus = async (): Promise<MenuEntry[]> => {
  // Esta funcionalidad requeriría una ruta específica en el servidor
  return [];
};

// ===== FUNCIONES DE REGISTROS DE COMIDA =====

export const getTodayMealRecords = async (): Promise<
  MealRecord[]
> => {
  return await apiRequest<MealRecord[]>("/meal-records/today");
};

export const createMealRecord = async (
  recordData: Omit<MealRecord, "id" | "date" | "timestamp">,
): Promise<MealRecord> => {
  return await apiRequest<MealRecord>("/meal-records", {
    method: "POST",
    body: JSON.stringify(recordData),
  });
};

export const updateMealRecord = async (
  id: string,
  updates: Partial<MealRecord>,
): Promise<MealRecord> => {
  return await apiRequest<MealRecord>(`/meal-records/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const getMealRecordsByTeacherId = async (
  teacherId: string,
): Promise<MealRecord[]> => {
  // Para obtener estadísticas del maestro, necesitaríamos una ruta específica
  // Por ahora retornamos array vacío
  return [];
};

// ===== FUNCIONES DE UTILIDAD =====

// Re-exportamos las funciones de utilidad del archivo original
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
    case "especiales":
      return "Especiales";
    default:
      return "Sin categoría";
  }
};

export const getCategoryDescription = (
  category: Grade["category"],
): string => {
  switch (category) {
    case "ciclo1":
      return "1°, 2° y 3° Grado";
    case "ciclo2":
      return "4° y 5° Grado";
    case "ciclo3":
      return "6°, 7° y 8° Grado";
    case "ciclo4":
      return "9°, 10° y 11° Grado";
    case "especiales":
      return "Programas Especiales";
    default:
      return "Sin descripción";
  }
};

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
    return 20;
  }
};

export const calculateTeacherStatus = (
  record: MealRecord,
  grade: Grade | undefined,
  currentTime: Date,
): MealRecord["status"] => {
  try {
    if (!grade) {
      return record.enteredAt ? "eating" : "registered";
    }

    if (!record.enteredAt) {
      return "registered";
    }

    const enteredTime = new Date(record.enteredAt);
    const minutesEating = Math.floor(
      (currentTime.getTime() - enteredTime.getTime()) /
        (1000 * 60),
    );

    const gradeDuration = getGradeDurationInMinutes(grade);

    if (minutesEating >= gradeDuration) {
      return "finished";
    }

    return "eating";
  } catch (error) {
    console.error(
      "Error calculando estado del maestro:",
      error,
    );
    return record.enteredAt ? "eating" : "registered";
  }
};

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

export const getTeacherStats = async (
  teacherId: string,
): Promise<TeacherStats> => {
  // Por ahora retornamos estadísticas por defecto
  // Esto requeriría implementar una ruta específica en el servidor
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
};

// ===== FUNCIONES DE LIMPIEZA =====

export const cleanupOldRecords = async (): Promise<void> => {
  try {
    await apiRequest("/cleanup", { method: "POST" });
  } catch (error) {
    console.error("Error durante la limpieza:", error);
  }
};