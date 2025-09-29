// FUNCIONES FALTANTES PARA COMPLETAR database.ts

// Generar código personal único
const generateUniquePersonalCode = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('No se pudo generar un código único');
    }

    // Verificar si el código ya existe
    const existingTeacher = await getTeacherByPersonalCode(code);
    if (!existingTeacher) {
      break;
    }
  } while (true);

  return code;
};

// Función para crear grado
export const createGrade = async (gradeData: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>): Promise<Grade> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const now = getLocalISOString();
  const newGrade: Grade = {
    id: crypto.randomUUID(),
    ...gradeData,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readwrite");
    const store = transaction.objectStore("grades");
    const request = store.add(newGrade);

    request.onsuccess = () => {
      console.log('✅ Grado creado:', newGrade.name);
      resolve(newGrade);
    };

    request.onerror = () => {
      if (request.error?.name === 'ConstraintError') {
        reject(new Error('Ya existe un grado con este nombre'));
      } else {
        reject(request.error);
      }
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para actualizar grado
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

    request.onsuccess = () => {
      console.log('✅ Grado actualizado:', updatedGrade.name);
      resolve(updatedGrade);
    };

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para eliminar grado
export const deleteGrade = async (gradeId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readwrite");
    const store = transaction.objectStore("grades");
    const request = store.delete(gradeId);

    request.onsuccess = () => {
      console.log('✅ Grado eliminado:', gradeId);
      resolve();
    };

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para obtener grado por ID
export const getGradeById = async (id: string): Promise<Grade | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para obtener grado por nombre
export const getGradeByName = async (name: string): Promise<Grade | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const index = store.index("name");
    const request = index.get(name);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para obtener grados activos
export const getActiveGrades = async (): Promise<Grade[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["grades"], "readonly");
    const store = transaction.objectStore("grades");
    const index = store.index("isActive");
    const request = index.getAll(true);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para crear menú
export const createMenu = async (menuData: Omit<MenuEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuEntry> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const now = getLocalISOString();
  const newMenu: MenuEntry = {
    id: crypto.randomUUID(),
    ...menuData,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readwrite");
    const store = transaction.objectStore("menus");
    const request = store.add(newMenu);

    request.onsuccess = () => {
      console.log('✅ Menú creado:', newMenu.date);
      resolve(newMenu);
    };

    request.onerror = () => {
      if (request.error?.name === 'ConstraintError') {
        reject(new Error('Ya existe un menú para esta fecha'));
      } else {
        reject(request.error);
      }
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para actualizar menú
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

    request.onsuccess = () => {
      console.log('✅ Menú actualizado:', updatedMenu.date);
      resolve(updatedMenu);
    };

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para eliminar menú
export const deleteMenu = async (menuId: string): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["menus"], "readwrite");
    const store = transaction.objectStore("menus");
    const request = store.delete(menuId);

    request.onsuccess = () => {
      console.log('✅ Menú eliminado:', menuId);
      resolve();
    };

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para crear o actualizar menú (upsert)
export const upsertMenu = async (menuData: Omit<MenuEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuEntry & { wasUpdated?: boolean }> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise(async (resolve, reject) => {
    try {
      // Verificar si ya existe un menú para esta fecha
      const transaction = db!.transaction(["menus"], "readwrite");
      const store = transaction.objectStore("menus");
      const index = store.index("date");
      const getRequest = index.get(menuData.date);

      getRequest.onsuccess = () => {
        const existingMenu = getRequest.result;
        const now = getLocalISOString();

        if (existingMenu) {
          // Actualizar menú existente
          const updatedMenu = {
            ...existingMenu,
            ...menuData,
            updatedAt: now
          };

          const putRequest = store.put(updatedMenu);
          putRequest.onsuccess = () => {
            console.log('✅ Menú actualizado (upsert):', updatedMenu.date);
            resolve({ ...updatedMenu, wasUpdated: true });
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // Crear nuevo menú
          const newMenu: MenuEntry = {
            id: crypto.randomUUID(),
            ...menuData,
            createdAt: now,
            updatedAt: now,
          };

          const addRequest = store.add(newMenu);
          addRequest.onsuccess = () => {
            console.log('✅ Menú creado (upsert):', newMenu.date);
            resolve({ ...newMenu, wasUpdated: false });
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
      transaction.onerror = () => reject(transaction.error);
    } catch (error) {
      reject(error);
    }
  });
};

// Función para obtener maestro por email
export const getTeacherByEmail = async (email: string): Promise<Teacher | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const index = store.index("email");
    const request = index.get(email);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para obtener maestro por ID
export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readonly");
    const store = transaction.objectStore("teachers");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para actualizar maestro
export const updateTeacher = async (updates: Partial<Teacher> & { id: string }): Promise<Teacher> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readwrite");
    const store = transaction.objectStore("teachers");

    // Primero obtener el maestro actual
    const getRequest = store.get(updates.id);

    getRequest.onsuccess = () => {
      const existingTeacher = getRequest.result;
      if (!existingTeacher) {
        reject(new Error("Maestro no encontrado"));
        return;
      }

      // Crear el maestro actualizado
      const updatedTeacher: Teacher = {
        ...existingTeacher,
        ...updates,
        updatedAt: getLocalISOString()
      };

      // Guardar el maestro actualizado
      const putRequest = store.put(updatedTeacher);

      putRequest.onsuccess = () => {
        console.log('✅ Maestro actualizado:', updatedTeacher.name);
        resolve(updatedTeacher);
      };

      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para crear maestro con código aleatorio
export const createTeacher = async (teacherData: Omit<Teacher, 'id' | 'personalCode' | 'createdAt' | 'updatedAt'>): Promise<Teacher> => {
  if (!db) throw new Error("Base de datos no inicializada");

  // Generar código personal único
  const personalCode = await generateUniquePersonalCode();
  
  // Hash de la contraseña
  const hashedPassword = await hashPassword(teacherData.password);
  
  const now = getLocalISOString();
  const newTeacher: Teacher = {
    id: crypto.randomUUID(),
    ...teacherData,
    password: hashedPassword,
    personalCode,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["teachers"], "readwrite");
    const store = transaction.objectStore("teachers");
    const request = store.add(newTeacher);

    request.onsuccess = () => {
      console.log('✅ Maestro creado:', newTeacher.name, 'Código:', newTeacher.personalCode);
      resolve(newTeacher);
    };

    request.onerror = () => {
      if (request.error?.name === 'ConstraintError') {
        reject(new Error('El email ya está registrado'));
      } else {
        reject(request.error);
      }
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

// Función para obtener registros de comida por maestro
export const getMealRecordsByTeacherId = async (teacherId: string): Promise<MealRecord[]> => {
  if (!db) throw new Error("Base de datos no inicializada");

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readonly");
    const store = transaction.objectStore("mealRecords");
    const index = store.index("teacherId");
    const request = index.getAll(teacherId);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
};

// Función para limpiar registros antiguos
export const cleanupOldRecords = async (): Promise<void> => {
  if (!db) throw new Error("Base de datos no inicializada");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Mantener solo últimos 30 días
  const cutoffString = getLocalDateString(cutoffDate);

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(["mealRecords"], "readwrite");
    const store = transaction.objectStore("mealRecords");
    const index = store.index("date");
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffString, true));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log(`✅ ${deletedCount} registros antiguos eliminados`);
        localStorage.setItem('lastAutoCleanup', getLocalISOString());
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};