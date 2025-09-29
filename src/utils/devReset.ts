import { factoryReset } from './database'
import { forceIndexedDB } from './unifiedDatabase'
import { isDevelopment } from './types'

export async function handleDevReset(
  setResetInProgress: (value: boolean) => void,
  onResetComplete: () => void
): Promise<void> {
  if (!isDevelopment()) {
    alert('Esta función solo está disponible en modo desarrollo')
    return
  }

  const confirmed = window.confirm(
    '⚠️ ADVERTENCIA: Esto borrará TODOS los datos de la aplicación.\n\n' +
    'Se eliminarán:\n' +
    '• Todos los maestros y administradores registrados\n' +
    '• Todos los registros de comidas\n' +
    '• Configuraciones guardadas\n' +
    '• Datos en localStorage\n\n' +
    '¿Estás seguro de que quieres continuar?'
  )

  if (!confirmed) return

  const doubleConfirm = window.confirm(
    '🔴 ÚLTIMA CONFIRMACIÓN\n\n' +
    'Esta acción NO se puede deshacer.\n' +
    'La aplicación se reiniciará como si fuera la primera vez.\n\n' +
    '¿REALMENTE quieres borrar todo?'
  )

  if (!doubleConfirm) return

  try {
    setResetInProgress(true)
    console.log('🔄 Iniciando reset completo de desarrollo...')

    // Forzar el uso de IndexedDB para el reset
    forceIndexedDB()
    
    // Realizar factory reset
    await factoryReset()

    // Notificar completion
    onResetComplete()

    alert('✅ Reset completo exitoso!\n\nLa aplicación se recargará en 2 segundos.')

    // Recargar la página para asegurar estado limpio
    setTimeout(() => {
      window.location.reload()
    }, 2000)

  } catch (error) {
    console.error('Error durante el reset:', error)
    alert('❌ Error durante el reset. Revisa la consola para más detalles.')
  } finally {
    setResetInProgress(false)
  }
}