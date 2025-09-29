import { useState, useEffect } from 'react'
import { ArrowLeft, Book, Clock, Users, Search, CheckCircle, GraduationCap } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { AppHeader } from './AppHeader'
import { getAllGrades, getCategoryDisplayName, getCategoryDescription, formatTimeWithAmPm, type Grade, getTeacherById, type Teacher } from '../utils/unifiedDatabase'

interface GroupSelectorProps {
  currentGroup: string
  onGroupSelect: (group: string) => void
  onBack: () => void
  teacherId?: string // Agregar el ID del teacher para mostrar su avatar
}

export function GroupSelector({ currentGroup, onGroupSelect, onBack, teacherId }: GroupSelectorProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGradeId, setSelectedGradeId] = useState<string>('')
  const [teacher, setTeacher] = useState<Teacher | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar grados y teacher en paralelo
      const promises = [
        getAllGrades()
      ]
      
      if (teacherId) {
        promises.push(getTeacherById(teacherId))
      }
      
      const results = await Promise.all(promises)
      const allGrades = results[0] as Grade[]
      const teacherData = results[1] as Teacher | undefined
      
      const activeGrades = allGrades.filter(grade => grade.isActive)
      setGrades(activeGrades)
      
      if (teacherData) {
        setTeacher(teacherData)
      }
      
      // Si hay un grupo seleccionado actualmente, encontrarlo
      if (currentGroup) {
        const currentGrade = activeGrades.find(g => g.name === currentGroup)
        if (currentGrade) {
          setSelectedGradeId(currentGrade.id)
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      setGrades([]) // Asegurar que grades siempre sea un array
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSelect = (grade: Grade) => {
    setSelectedGradeId(grade.id)
    // Selección automática - llamar directamente a onGroupSelect
    onGroupSelect(grade.name)
  }

  const handleConfirmSelection = () => {
    const selectedGrade = grades.find(g => g.id === selectedGradeId)
    if (selectedGrade) {
      onGroupSelect(selectedGrade.name)
    }
  }

  const getCurrentTimeInfo = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime
  }

  const isCurrentlyActive = (grade: Grade) => {
    const currentTime = getCurrentTimeInfo()
    return currentTime >= grade.scheduleStart && currentTime <= grade.scheduleEnd
  }

  const formatTime = (timeString: string) => {
    return formatTimeWithAmPm(timeString)
  }

  const getGradeDuration = (grade: Grade) => {
    const start = new Date(`2000-01-01T${grade.scheduleStart}:00`)
    const end = new Date(`2000-01-01T${grade.scheduleEnd}:00`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    return Math.round(duration)
  }

  // Filtrar grados por búsqueda - asegurar que grades sea un array válido
  const filteredGrades = Array.isArray(grades) 
    ? grades.filter(grade =>
        grade.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryDisplayName(grade.category).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Agrupar grados por categoría - agregar verificaciones de seguridad
  const gradesByCategory = filteredGrades.reduce((acc, grade) => {
    if (!acc[grade.category]) {
      acc[grade.category] = []
    }
    acc[grade.category].push(grade)
    return acc
  }, {} as Record<Grade['category'], Grade[]>)

  const selectedGrade = grades.find(g => g.id === selectedGradeId)

  // Orden de categorías para mostrar (ACTUALIZADO: incluye ciclo4)
  const categoryOrder: Grade['category'][] = ['ciclo1', 'ciclo2', 'ciclo3', 'ciclo4', 'modalidad_tecnica']

  // Íconos para cada categoría (ACTUALIZADO: incluye ciclo4)
  const getCategoryIcon = (category: Grade['category']) => {
    switch (category) {
      case 'ciclo1': return <GraduationCap className="w-5 h-5 text-green-600" />
      case 'ciclo2': return <GraduationCap className="w-5 h-5 text-blue-600" />
      case 'ciclo3': return <GraduationCap className="w-5 h-5 text-purple-600" />
      case 'ciclo4': return <GraduationCap className="w-5 h-5 text-red-600" />
      case 'modalidad_tecnica': return <Book className="w-5 h-5 text-orange-600" />
      default: return <Book className="w-5 h-5 text-gray-600" />
    }
  }

  // Colores para cada categoría (ACTUALIZADO: incluye ciclo4 con rojo)
  const getCategoryColor = (category: Grade['category']) => {
    switch (category) {
      case 'ciclo1': return 'bg-green-100 border-green-200'
      case 'ciclo2': return 'bg-blue-100 border-blue-200'
      case 'ciclo3': return 'bg-purple-100 border-purple-200'
      case 'ciclo4': return 'bg-red-100 border-red-200'
      case 'modalidad_tecnica': return 'bg-orange-100 border-orange-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grados disponibles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        teacher={teacher}
        title="Seleccionar Grado"
        subtitle="Elige el grado que tienes asignado (4 ciclos + modalidad técnica)"
        showBackButton={true}
        onBack={onBack}
        backgroundColor="bg-purple-dark"
      >
        {currentGroup && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white">Grado actual: <strong>{currentGroup}</strong></span>
            </div>
          </div>
        )}
      </AppHeader>

      <div className="px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Buscador */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, descripción o ciclo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>



          {/* Lista de grados agrupados por categoría (ACTUALIZADO: incluye ciclo4) */}
          {!selectedGradeId && filteredGrades.length > 0 && (
            <Alert className="mb-6 border-purple-light/20 bg-purple-light/5">
              <Book className="h-4 w-4 text-purple-dark" />
              <AlertDescription className="text-purple-dark">
                <strong>Selección rápida:</strong> Haz clic directamente en cualquier grado para seleccionarlo automáticamente.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {categoryOrder.map(category => {
              const categoryGrades = gradesByCategory[category]
              
              // Verificación de seguridad adicional
              if (!Array.isArray(categoryGrades) || categoryGrades.length === 0) {
                return null
              }
              
              return (
                <Card key={category} className={getCategoryColor(category)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getCategoryDisplayName(category)}</span>
                          <Badge variant="outline" className="text-xs">
                            {categoryGrades.length} grado{categoryGrades.length !== 1 ? 's' : ''}
                          </Badge>
                          {category === 'ciclo4' && (
                            <Badge className="bg-red-600 text-white text-xs">
                              NUEVO
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          {getCategoryDescription(category)}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {categoryGrades.map((grade) => (
                        <div
                          key={grade.id}
                          onClick={() => handleGradeSelect(grade)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                            selectedGradeId === grade.id
                              ? 'border-purple-light bg-purple-light/5 shadow-md'
                              : 'border-border hover:border-purple-light/50 hover:bg-muted/50 hover:shadow-sm'
                          } ${
                            grade.name === currentGroup
                              ? 'border-green-200 bg-green-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-medium text-black-soft">{grade.name}</p>
                                {grade.name === currentGroup && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    Actual
                                  </Badge>
                                )}
                                {isCurrentlyActive(grade) && (
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    Activo Ahora
                                  </Badge>
                                )}
                                {selectedGradeId === grade.id && (
                                  <CheckCircle className="w-4 h-4 text-purple-dark" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{grade.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {formatTime(grade.scheduleStart)} - {formatTime(grade.scheduleEnd)}
                                  </span>
                                </div>
                                <span className="text-muted-foreground">
                                  ({getGradeDuration(grade)} min)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredGrades.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm ? 'No se encontraron grados que coincidan con tu búsqueda' : 'No hay grados disponibles'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-2"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  )
}