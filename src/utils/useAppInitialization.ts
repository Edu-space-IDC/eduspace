import { useEffect, useState } from 'react'
import { 
  initDatabase, 
  isFirstTimeInstall
} from './unifiedDatabase'
import { initDevTools } from './devTools'
import { isQRScanURL } from './scheduleUtils'
import { isDevelopment } from './types'

export function useAppInitialization() {
  const [state, setState] = useState({
    dbInitialized: false,
    initError: null as string | null,
    isFirstInstall: false
  })

  useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar herramientas de desarrollo
        if (isDevelopment()) {
          initDevTools()
        }

        // Timeout para evitar que la inicialización cuelgue
        const initPromise = Promise.race([
          initDatabase(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout en inicialización')), 15000)
          )
        ])

        await initPromise
        
        // Verificar si es primera instalación
        const firstInstall = await isFirstTimeInstall()
        
        if (firstInstall) {
          console.log('🎉 ¡Bienvenido! Primera instalación completada.')
        } else {
          console.log('👋 Aplicación inicializada')
        }
        
        setState({
          dbInitialized: true,
          initError: null,
          isFirstInstall: firstInstall
        })
        
      } catch (error) {
        console.error('Error al inicializar la aplicación:', error)
        setState({
          dbInitialized: false,
          initError: 'Error al inicializar la aplicación. Por favor recarga la página.',
          isFirstInstall: false
        })
      }
    }

    initialize()
  }, [])

  return {
    ...state,
    shouldShowQRLanding: isQRScanURL()
  }
}