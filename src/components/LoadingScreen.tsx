interface LoadingScreenProps {
  isFirstInstall: boolean
  isDevelopment: boolean
  onDevReset: () => void
  resetInProgress: boolean
}

export function LoadingScreen({ isFirstInstall, isDevelopment, onDevReset, resetInProgress }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark to-blue-dark flex items-center justify-center p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-purple-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-black-soft mb-2">
            {isFirstInstall ? 'Configurando Primera Instalación' : 'Inicializando Aplicación'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isFirstInstall ? 'Preparando la aplicación por primera vez...' : 'Preparando la base de datos local...'}
          </p>
          
          {isFirstInstall && (
            <div className="text-xs text-blue-600 mb-4">
              🔧 Creando usuario administrador por defecto...
            </div>
          )}
          
          {isDevelopment && (
            <div className="text-xs text-muted-foreground mb-4">
              💡 Modo desarrollo activo
              <br />
              Consola: devTools.help()
            </div>
          )}
          
          {isDevelopment && (
            <button
              onClick={onDevReset}
              disabled={resetInProgress}
              className="mt-4 text-xs text-red-600 hover:text-red-800 underline"
            >
              {resetInProgress ? 'Reseteando...' : 'Reset de Emergencia (Dev)'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}