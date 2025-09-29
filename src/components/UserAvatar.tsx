import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import type { Teacher } from '../utils/database'

interface UserAvatarProps {
  teacher?: Teacher
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ teacher, name, size = 'md', className = '' }: UserAvatarProps) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  useEffect(() => {
    if (teacher?.id) {
      const savedPhoto = localStorage.getItem(`profile_photo_${teacher.id}`)
      if (savedPhoto) {
        setProfilePhoto(savedPhoto)
      }
    }
  }, [teacher?.id])

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm'
      case 'lg':
        return 'w-16 h-16 text-2xl'
      default:
        return 'w-12 h-12 text-lg'
    }
  }

  return (
    <div className={`${getSizeClasses()} bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {profilePhoto ? (
        <img 
          src={profilePhoto} 
          alt={`Foto de ${teacher?.name || name || 'Usuario'}`} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
          <span className="font-medium text-white">
            {getInitials(teacher?.name || name || 'U')}
          </span>
        </div>
      )}
    </div>
  )
}