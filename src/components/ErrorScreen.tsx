interface ErrorScreenProps {
  error: string
  isDevelopment: boolean
  onDevReset: () => void
  resetInProgress: boolean
}

export function ErrorScreen({ error, isDevelopment, onDevReset, resetInProgress }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark to-blue-dark flex items-center justify-center p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-medium text-black-soft mb-4">Error de Inicialización</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-purple-dark hover:bg-purple-dark/90 text-white py-3 px-4 rounded-lg font-medium"
            >
              Recargar Página
            </button>
            
            {isDevelopment && (
              <button
                onClick={onDevReset}
                disabled={resetInProgress}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
              >
                {resetInProgress ? 'Reseteando...' : '🔧 Reset de Emergencia (Dev)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}