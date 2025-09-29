import { useState, useEffect } from 'react'
import { updateTeacher, type Teacher } from './unifiedDatabase'
import { clearQRParams } from './scheduleUtils'
import type { AuthState } from './types'

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>('login')
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null)

  // Recuperar teacher guardado del localStorage al inicializar
  useEffect(() => {
    const savedTeacher = localStorage.getItem('currentTeacher')
    if (savedTeacher) {
      try {
        const teacher = JSON.parse(savedTeacher)
        // Verificar que el teacher tiene los campos necesarios (incluyendo role)
        if (teacher.id && teacher.name && teacher.email && teacher.personalCode && teacher.role) {
          setCurrentTeacher(teacher)
          setAuthState('authenticated')
        } else {
          // Limpiar datos corruptos o desactualizados
          localStorage.removeItem('currentTeacher')
        }
      } catch (error) {
        console.error('Error al parsear teacher guardado:', error)
        localStorage.removeItem('currentTeacher')
      }
    }
  }, [])

  const handleLogin = async (teacher: Teacher) => {
    try {
      setCurrentTeacher(teacher)
      setAuthState('authenticated')
      // Guardar también en localStorage como respaldo
      localStorage.setItem('currentTeacher', JSON.stringify(teacher))
      
      // Mostrar mensaje de bienvenida según el rol
      if (teacher.role === 'admin') {
        console.log(`👑 Administrador autenticado: ${teacher.name}`)
      } else {
        console.log(`👨‍🏫 Maestro autenticado: ${teacher.name}`)
      }
    } catch (error) {
      console.error('Error al hacer login:', error)
    }
  }

  const handleLogout = () => {
    setCurrentTeacher(null)
    setAuthState('login')
    localStorage.removeItem('currentTeacher')
  }

  const handleGroupSelect = async (group: string) => {
    if (currentTeacher) {
      try {
        const updatedTeacher = { ...currentTeacher, selectedGroup: group }
        
        // Actualizar en la base de datos
        await updateTeacher(updatedTeacher)
        
        // Actualizar el estado local
        setCurrentTeacher(updatedTeacher)
        localStorage.setItem('currentTeacher', JSON.stringify(updatedTeacher))
      } catch (error) {
        console.error('Error al actualizar grupo:', error)
        // Aún así actualizar localmente si falla la BD
        const updatedTeacher = { ...currentTeacher, selectedGroup: group }
        setCurrentTeacher(updatedTeacher)
        localStorage.setItem('currentTeacher', JSON.stringify(updatedTeacher))
      }
    }
  }

  const updateCurrentTeacher = (teacher: Teacher) => {
    setCurrentTeacher(teacher)
    localStorage.setItem('currentTeacher', JSON.stringify(teacher))
  }

  return {
    authState,
    currentTeacher,
    setAuthState,
    handleLogin,
    handleLogout,
    handleGroupSelect,
    updateCurrentTeacher
  }
}