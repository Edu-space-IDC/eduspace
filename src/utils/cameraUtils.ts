import QrScanner from 'qr-scanner'

export interface CameraConfig {
  preferredCamera: 'user' | 'environment'
  highlightScanRegion: boolean
  highlightCodeOutline: boolean
  maxScansPerSecond: number
}

export interface CameraError {
  name: string
  message: string
  type: 'permission' | 'hardware' | 'browser' | 'unknown'
}

export class CameraManager {
  private videoElement: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private qrScanner: QrScanner | null = null
  private isActive = false

  constructor(private config: CameraConfig = {
    preferredCamera: 'environment',
    highlightScanRegion: true,
    highlightCodeOutline: true,
    maxScansPerSecond: 5
  }) {}

  async checkCameraSupport(): Promise<boolean> {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  async getCameraPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) {
      return 'prompt' // Asumir que necesita permiso si no hay API
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return result.state as 'granted' | 'denied' | 'prompt'
    } catch {
      return 'prompt'
    }
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('Error al obtener cámaras disponibles:', error)
      return []
    }
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    if (this.isActive) {
      throw new Error('La cámara ya está activa')
    }

    if (!await this.checkCameraSupport()) {
      const error: CameraError = {
        name: 'NotSupportedError',
        message: 'Tu navegador no soporta el acceso a la cámara',
        type: 'browser'
      }
      throw error
    }

    this.videoElement = videoElement

    try {
      // Configuración de constrains para la cámara
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.config.preferredCamera,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      }

      // Obtener acceso a la cámara
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Asignar el stream al video element
      videoElement.srcObject = this.stream
      
      // Esperar a que el video esté listo
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => {
              this.isActive = true
              resolve()
            })
            .catch(reject)
        }
        videoElement.onerror = reject
      })

    } catch (error: any) {
      console.error('Error al iniciar la cámara:', error)
      
      let cameraError: CameraError
      
      if (error.name === 'NotAllowedError') {
        cameraError = {
          name: error.name,
          message: 'Acceso a la cámara denegado. Por favor, permite el acceso a la cámara.',
          type: 'permission'
        }
      } else if (error.name === 'NotFoundError') {
        cameraError = {
          name: error.name,
          message: 'No se encontró ninguna cámara en tu dispositivo.',
          type: 'hardware'
        }
      } else if (error.name === 'NotReadableError') {
        cameraError = {
          name: error.name,
          message: 'La cámara está siendo utilizada por otra aplicación.',
          type: 'hardware'
        }
      } else if (error.name === 'OverconstrainedError') {
        cameraError = {
          name: error.name,
          message: 'La configuración de la cámara no es compatible.',
          type: 'hardware'
        }
      } else {
        cameraError = {
          name: error.name || 'UnknownError',
          message: error.message || 'Error desconocido al acceder a la cámara',
          type: 'unknown'
        }
      }
      
      throw cameraError
    }
  }

  async startQRScanning(onQRDetected: (result: string) => void): Promise<void> {
    if (!this.videoElement || !this.isActive) {
      throw new Error('La cámara debe estar activa antes de iniciar el escaneo QR')
    }

    try {
      this.qrScanner = new QrScanner(
        this.videoElement,
        (result) => {
          onQRDetected(result.data)
        },
        {
          highlightScanRegion: this.config.highlightScanRegion,
          highlightCodeOutline: this.config.highlightCodeOutline,
          preferredCamera: this.config.preferredCamera,
          maxScansPerSecond: this.config.maxScansPerSecond,
          calculateScanRegion: (video) => {
            // Crear una región de escaneo centrada
            const smallerDimension = Math.min(video.videoWidth, video.videoHeight)
            const scanRegionSize = Math.round(0.6 * smallerDimension)
            
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize
            }
          }
        }
      )

      await this.qrScanner.start()
    } catch (error) {
      console.error('Error al iniciar el escáner QR:', error)
      throw new Error('No se pudo iniciar el escáner QR')
    }
  }

  async hasFlashlight(): Promise<boolean> {
    if (!this.qrScanner) {
      return false
    }

    try {
      return await this.qrScanner.hasFlash()
    } catch {
      return false
    }
  }

  async toggleFlashlight(): Promise<boolean> {
    if (!this.qrScanner) {
      return false
    }

    try {
      const hasFlash = await this.qrScanner.hasFlash()
      if (!hasFlash) {
        return false
      }

      const isFlashOn = await this.qrScanner.isFlashOn()
      if (isFlashOn) {
        await this.qrScanner.turnFlashOff()
        return false
      } else {
        await this.qrScanner.turnFlashOn()
        return true
      }
    } catch (error) {
      console.error('Error al controlar la linterna:', error)
      return false
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.qrScanner) {
      throw new Error('El escáner QR no está activo')
    }

    try {
      const cameras = await this.getAvailableCameras()
      if (cameras.length <= 1) {
        throw new Error('No hay cámaras adicionales disponibles')
      }

      // Cambiar entre cámara frontal y trasera
      const newFacingMode = this.config.preferredCamera === 'environment' ? 'user' : 'environment'
      this.config.preferredCamera = newFacingMode

      await this.qrScanner.setCamera(newFacingMode)
    } catch (error) {
      console.error('Error al cambiar de cámara:', error)
      throw new Error('No se pudo cambiar la cámara')
    }
  }

  stopCamera(): void {
    if (this.qrScanner) {
      this.qrScanner.stop()
      this.qrScanner.destroy()
      this.qrScanner = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop()
      })
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    this.isActive = false
  }

  isActiveCameraRunning(): boolean {
    return this.isActive
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }

  async capturePhoto(): Promise<Blob> {
    if (!this.videoElement || !this.isActive) {
      throw new Error('La cámara debe estar activa para capturar una foto')
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'))
        return
      }

      canvas.width = this.videoElement!.videoWidth
      canvas.height = this.videoElement!.videoHeight

      ctx.drawImage(this.videoElement!, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('No se pudo generar la imagen'))
        }
      }, 'image/jpeg', 0.8)
    })
  }
}

// Función de utilidad para crear un manager de cámara
export const createCameraManager = (config?: Partial<CameraConfig>): CameraManager => {
  return new CameraManager(config)
}

// Función para verificar soporte de cámara
export const isCameraSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Función para obtener información del dispositivo
export const getDeviceInfo = (): { isMobile: boolean; isIOS: boolean; isAndroid: boolean } => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent)
  const isIOS = /iphone|ipad|ipod/i.test(userAgent)
  const isAndroid = /android/i.test(userAgent)

  return { isMobile, isIOS, isAndroid }
}