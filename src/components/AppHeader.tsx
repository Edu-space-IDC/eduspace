import { ArrowLeft, X, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { UserAvatar } from './UserAvatar'
import type { Teacher } from '../utils/database'

interface AppHeaderProps {
  teacher?: Teacher | null
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  showCloseButton?: boolean
  onClose?: () => void
  showRefreshButton?: boolean
  onRefresh?: () => void
  refreshLoading?: boolean
  children?: React.ReactNode
  backgroundColor?: string
}

export function AppHeader({
  teacher,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  showCloseButton = false,
  onClose,
  showRefreshButton = false,
  onRefresh,
  refreshLoading = false,
  children,
  backgroundColor = 'bg-[rgba(105,107,205,1)]'
}: AppHeaderProps) {
  return (
    <div className={`${backgroundColor} text-white px-6 py-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          {/* Botón de navegación */}
          {(showBackButton || showCloseButton) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={showBackButton ? onBack : onClose}
              className="text-white hover:bg-white/10 p-2 h-auto"
            >
              {showBackButton ? (
                <ArrowLeft className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Título y subtítulo */}
          <div className="flex-1">
            <h1 className="text-2xl font-medium text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-blue-light text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Avatar del usuario */}
          {teacher && (
            <UserAvatar teacher={teacher} size="md" />
          )}

          {/* Botón de refresh */}
          {showRefreshButton && onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={refreshLoading}
              className="text-white hover:bg-white/10 p-2 h-auto"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 ${refreshLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Contenido adicional del header */}
        {children}
      </div>
    </div>
  )
}