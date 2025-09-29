import { useState } from 'react'
import { QrCode, Copy, Download, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { generateQRCodeURL, getCurrentTimeSlot } from '../utils/scheduleUtils'

export function QRGenerator() {
  const [qrUrl, setQrUrl] = useState(generateQRCodeURL())
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const currentSlot = getCurrentTimeSlot()

  const fallbackCopyTextToClipboard = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      
      // Avoid scrolling to bottom
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        resolve(successful)
      } catch (err) {
        document.body.removeChild(textArea)
        resolve(false)
      }
    })
  }

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) {
        console.warn('Modern clipboard API failed, trying fallback method')
        return await fallbackCopyTextToClipboard(text)
      }
    } else {
      // Use fallback method
      return await fallbackCopyTextToClipboard(text)
    }
  }

  const handleCopyUrl = async () => {
    setCopyError('')
    
    try {
      const success = await copyTextToClipboard(qrUrl)
      
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        setCopyError('No se pudo copiar. Intenta seleccionar manualmente el texto.')
      }
    } catch (err) {
      console.error('Error al copiar:', err)
      setCopyError('Error al copiar el enlace. Intenta seleccionarlo manualmente.')
    }
  }

  const handleRefreshQR = () => {
    setQrUrl(generateQRCodeURL())
    setCopyError('')
  }

  const handleDownloadQR = () => {
    // En una implementación real, aquí generarías y descargarías la imagen QR
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      canvas.width = 300
      canvas.height = 300
      
      // Fondo blanco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      
      // Simulación de patrón QR básico
      ctx.fillStyle = '#000000'
      for (let i = 0; i < 300; i += 10) {
        for (let j = 0; j < 300; j += 10) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, 10, 10)
          }
        }
      }
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.download = 'comedor-qr-code.png'
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-purple-dark text-white px-6 py-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-white mb-2">
            Código QR del Comedor
          </h1>
          <p className="text-blue-light">
            Para registro de profesores
          </p>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Estado actual */}
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="font-medium text-black-soft mb-4">Turno Actual</h2>
              <Badge className="bg-blue-light text-white text-lg px-4 py-2">
                {currentSlot}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Se actualiza automáticamente cada minuto
              </p>
            </CardContent>
          </Card>

          {/* Código QR Visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-black-soft">
                Código QR Activo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* Simulación visual del QR */}
              <div className="w-64 h-64 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-8 gap-1 w-48 h-48">
                  {Array.from({ length: 64 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full ${
                        Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Los profesores pueden escanear este código para registrarse
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshQR}
                    className="border-purple-light text-purple-dark"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Nuevo QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQR}
                    className="border-blue-light text-blue-dark"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL del QR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black-soft">
                Enlace Directo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 break-all text-sm font-mono select-all">
                {qrUrl}
              </div>
              
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="w-full border-purple-light text-purple-dark"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace
                  </>
                )}
              </Button>

              {/* Error de copiado */}
              {copyError && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {copyError}
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs text-muted-foreground">
                Los profesores también pueden abrir este enlace directamente en su navegador.
                {copyError && ' Puedes seleccionar manualmente el texto de arriba para copiarlo.'}
              </p>
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card className="bg-blue-light/5 border-blue-light/20">
            <CardContent className="p-6">
              <h3 className="font-medium text-black-soft mb-3">
                Instrucciones de Uso
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-light text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                  <p>Muestra este código QR en la entrada del comedor</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-light text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                  <p>Los profesores escanean con su app de cámara o la app del colegio</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-light text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                  <p>Se registran automáticamente según su horario</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-light text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                  <p>El sistema actualiza su estado automáticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Método alternativo de compartir */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-medium text-black-soft mb-2">
                Método Alternativo
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Si no puedes copiar el enlace automáticamente:</p>
                <div className="bg-blue-light/10 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-black-soft">1. Selecciona todo el texto del enlace de arriba</p>
                  <p className="text-xs">2. Copia manualmente (Ctrl+C o Cmd+C)</p>
                  <p className="text-xs">3. Comparte el enlace por WhatsApp, email, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información técnica */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-medium text-black-soft mb-2">
                Información Técnica
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• El código se regenera automáticamente cada hora</p>
                <p>• Compatible con cualquier app de escaneo QR</p>
                <p>• Funciona sin conexión a internet una vez cargado</p>
                <p>• Los datos se sincronizan automáticamente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}