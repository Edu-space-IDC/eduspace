import { useState } from 'react'
// TEMPORALMENTE DESACTIVADO
// import { useTheme } from '../utils/useTheme'

interface DevToolsPanelProps {
  isFirstInstall: boolean
  currentTeacher: any | null
  authState: string
  onDevReset: () => void
  resetInProgress: boolean
}

export function DevToolsPanel({ isFirstInstall, currentTeacher, authState, onDevReset, resetInProgress }: DevToolsPanelProps) {
  const [showDevReset, setShowDevReset] = useState(false)
  // TEMPORALMENTE DESACTIVADO
  // const { theme, toggleTheme } = useTheme()

  if (authState !== 'authenticated') {
    return (
      <>
        <button
          onClick={() => setShowDevReset(!showDevReset)}
          className="fixed bottom-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity z-40"
        >
          🔧 DEV
        </button>
        
        {showDevReset && (
          <div className="fixed bottom-16 left-4 bg-white p-4 rounded-lg shadow-lg border-2 border-red-200 z-50 max-w-xs">
            <h3 className="font-bold text-sm text-red-600 mb-2">Herramientas de Desarrollo</h3>
            <div className="space-y-2 text-xs">
              <p><strong>Estado:</strong> {isFirstInstall ? 'Primera instalación' : 'Con datos'}</p>
              {/* TEMPORALMENTE DESACTIVADO */}
              {/* <p><strong>Tema:</strong> {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}</p> */}
              <p><strong>Consola:</strong> devTools.help()</p>
              {isFirstInstall && (
                <p className="text-blue-600"><strong>Admin por defecto:</strong> admin@colegio.edu</p>
              )}
              <button
                onClick={onDevReset}
                disabled={resetInProgress}
                className="w-full bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600 disabled:opacity-50"
              >
                {resetInProgress ? '🔄 Reseteando...' : '🗑️ Reset Completo'}
              </button>
              <button
                onClick={() => setShowDevReset(false)}
                className="w-full bg-gray-500 text-white px-3 py-2 rounded text-xs hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowDevReset(!showDevReset)}
        className="fixed top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-30 hover:opacity-100 transition-opacity z-40"
        title="Herramientas de desarrollo"
      >
        🔧
      </button>
      
      {showDevReset && (
        <div className="fixed top-12 left-4 bg-white p-3 rounded-lg shadow-lg border-2 border-red-200 z-50 max-w-xs">
          <h3 className="font-bold text-sm text-red-600 mb-2">Dev Tools</h3>
          <div className="space-y-2 text-xs">
            <p><strong>Usuario:</strong> {currentTeacher?.name}</p>
            <p><strong>Rol:</strong> {currentTeacher?.role === 'admin' ? '👑 Admin' : '👨‍🏫 Maestro'}</p>
            <p><strong>Código:</strong> {currentTeacher?.personalCode}</p>
            <p><strong>Consola:</strong> devTools.help()</p>
            <button
              onClick={onDevReset}
              disabled={resetInProgress}
              className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
            >
              {resetInProgress ? 'Reseteando...' : 'Reset Completo'}
            </button>
            <button
              onClick={() => setShowDevReset(false)}
              className="w-full bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}