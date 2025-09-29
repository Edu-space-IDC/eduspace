import { useState } from 'react'
import { Database, Info } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { isDevelopment } from '../utils/types'

export function BackendStatus() {
  const [showInfo, setShowInfo] = useState(false)

  // Esta aplicación siempre usa IndexedDB local
  const backend = 'indexeddb'

  if (!isDevelopment()) {
    // Solo mostrar un indicador pequeño en producción
    return (
      <div className="fixed bottom-4 right-4 z-30">
        <Badge 
          variant="outline" 
          className="text-xs bg-blue-50 border-blue-200 text-blue-800"
        >
          <Database className="w-3 h-3 mr-1" />
          Local
        </Badge>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
        >
          <Database className="w-3 h-3 mr-1" />
          IndexedDB
        </Button>
      </div>

      {showInfo && (
        <div className="fixed bottom-16 right-4 bg-white p-4 rounded-lg shadow-lg border z-40 max-w-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Almacenamiento Local</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Usando IndexedDB (Local)</span>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-xs">
                  💾 Aplicación completamente offline<br/>
                  🔒 Datos seguros en tu navegador<br/>
                  ⚡ Funciona sin conexión a internet
                </AlertDescription>
              </Alert>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>Nota:</strong> Esta aplicación funciona completamente sin servidor.
              Todos los datos se almacenan localmente en tu navegador.
            </div>
          </div>
        </div>
      )}
    </>
  )
}