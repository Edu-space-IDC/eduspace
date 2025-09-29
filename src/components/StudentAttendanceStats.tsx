import { useState } from 'react'
import { FileText, Users, CheckCircle, X, BarChart3, PieChart, TrendingUp, Eye, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { formatDateTimeWithAmPm, getCategoryDisplayName, type StudentAttendanceRecord } from '../utils/unifiedDatabase'

interface StudentAttendanceStatsProps {
  attendanceRecords: StudentAttendanceRecord[]
}

interface AttendanceStats {
  totalGrades: number
  totalPresent: number
  totalEating: number
  totalNotEating: number
  totalReinforcements: number
  overallPercentage: number
  byCategory: {
    [category: string]: {
      grades: number
      present: number
      eating: number
      notEating: number
      reinforcements: number
      percentage: number
    }
  }
}

export function StudentAttendanceStats({ attendanceRecords }: StudentAttendanceStatsProps) {
  const [viewMode, setViewMode] = useState<'individual' | 'summary'>('individual')

  const calculateStats = (): AttendanceStats => {
    const stats: AttendanceStats = {
      totalGrades: attendanceRecords.length,
      totalPresent: 0,
      totalEating: 0,
      totalNotEating: 0,
      totalReinforcements: 0,
      overallPercentage: 0,
      byCategory: {}
    }

    // Debug: Log de registros para verificar datos
    console.log('StudentAttendanceStats - Registros recibidos:', attendanceRecords)

    // Calcular totales generales
    attendanceRecords.forEach(record => {
      console.log(`Registro ${record.gradeName}:`, {
        studentsPresent: record.studentsPresent,
        studentsEating: record.studentsEating,
        studentsNotEating: record.studentsNotEating,
        reinforcementsUsed: record.reinforcementsUsed
      })
      stats.totalPresent += record.studentsPresent
      stats.totalEating += record.studentsEating
      stats.totalNotEating += record.studentsNotEating
      stats.totalReinforcements += record.reinforcementsUsed || 0
    })

    stats.overallPercentage = stats.totalPresent > 0 ? Math.round((stats.totalEating / stats.totalPresent) * 100) : 0

    // Calcular estadísticas por categoría (simular categorías basadas en grado)
    attendanceRecords.forEach(record => {
      // Determinar categoría basada en el nombre del grado
      let category = 'otros'
      const gradeName = record.gradeName.toLowerCase()
      
      if (gradeName.includes('transición') || gradeName.includes('1°') || gradeName.includes('2°') || gradeName.includes('3°') || gradeName.includes('brújula')) {
        category = 'ciclo1'
      } else if (gradeName.includes('4°') || gradeName.includes('5°') || gradeName.includes('aceleración')) {
        category = 'ciclo2'
      } else if (gradeName.includes('6°') || gradeName.includes('7°') || gradeName.includes('8°') || gradeName.includes('cs1')) {
        category = 'ciclo3'
      } else if (gradeName.includes('9°') || gradeName.includes('10°') || gradeName.includes('11°') || gradeName.includes('cs2')) {
        category = 'ciclo4'
      } else if (gradeName.includes('técnica') || gradeName.includes('tecnica')) {
        category = 'modalidad_tecnica'
      }

      if (!stats.byCategory[category]) {
        stats.byCategory[category] = {
          grades: 0,
          present: 0,
          eating: 0,
          notEating: 0,
          reinforcements: 0,
          percentage: 0
        }
      }

      stats.byCategory[category].grades += 1
      stats.byCategory[category].present += record.studentsPresent
      stats.byCategory[category].eating += record.studentsEating
      stats.byCategory[category].notEating += record.studentsNotEating
      stats.byCategory[category].reinforcements += record.reinforcementsUsed || 0
      stats.byCategory[category].percentage = stats.byCategory[category].present > 0 
        ? Math.round((stats.byCategory[category].eating / stats.byCategory[category].present) * 100) 
        : 0
    })

    return stats
  }

  const stats = calculateStats()

  const formatDateTime = (dateString: string) => {
    try {
      return formatDateTimeWithAmPm(dateString)
    } catch (error) {
      console.error('Error formateando fecha y hora:', error)
      return new Date(dateString).toLocaleString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace('AM', 'a.m.').replace('PM', 'p.m.')
    }
  }

  if (attendanceRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Estadísticas de Asistencia Estudiantil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No hay registros de asistencia estudiantil para hoy
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Los maestros pueden registrar la asistencia desde el dashboard principal
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Estadísticas de Asistencia Estudiantil
            <Badge variant="secondary">{attendanceRecords.length} grados</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('individual')}
              className="h-8 px-3"
            >
              <Eye className="w-4 h-4 mr-1" />
              Por Grado
            </Button>
            <Button
              variant={viewMode === 'summary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('summary')}
              className="h-8 px-3"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Resumen
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'individual' | 'summary')} className="w-full">
          <TabsContent value="individual" className="space-y-4 mt-0">
            {attendanceRecords.map((record) => {
              const percentage = record.studentsPresent > 0 
                ? Math.round((record.studentsEating / record.studentsPresent) * 100) 
                : 0
              
              return (
                <div key={record.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50/30 to-blue-50/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-primary text-white px-3 py-1">
                          {record.gradeName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          por <span className="font-medium text-black-soft">{record.teacherName}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{percentage}%</p>
                        <p className="text-xs text-muted-foreground">comieron</p>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-blue-600">{record.studentsPresent}</p>
                        <p className="text-xs text-muted-foreground">Presentes</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-green-600">{record.studentsEating}</p>
                        <p className="text-xs text-muted-foreground">Comieron</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <X className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-lg font-bold text-red-600">{record.studentsNotEating}</p>
                        <p className="text-xs text-muted-foreground">No comieron</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Gift className="w-4 h-4 text-purple-600" />
                        </div>
                        <p className="text-lg font-bold text-purple-600">{record.reinforcementsUsed || 0}</p>
                        <p className="text-xs text-muted-foreground">Refuerzos</p>
                      </div>
                    </div>

                    {/* Barra de progreso visual */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span className="font-medium text-green-600">{percentage}% comieron</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <span>Registrado: {formatDateTime(record.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6 mt-0">
            {/* Resumen General */}
            <div className="bg-gradient-to-r from-purple-primary/5 to-blue-primary/5 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-primary" />
                <h3 className="text-lg font-medium text-black-soft">Resumen General del Día</h3>
              </div>
              
              <div className="grid gap-4 mb-4 grid-cols-2 md:grid-cols-5">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-purple-primary">{stats.totalGrades}</p>
                  <p className="text-sm text-muted-foreground">Grados Registrados</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPresent}</p>
                  <p className="text-sm text-muted-foreground">Total Presentes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-green-600">{stats.totalEating}</p>
                  <p className="text-sm text-muted-foreground">Total Comieron</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-red-600">{stats.totalNotEating}</p>
                  <p className="text-sm text-muted-foreground">Total No Comieron</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalReinforcements}</p>
                  <p className="text-sm text-muted-foreground">Total Refuerzos</p>
                </div>
              </div>

              {/* Barra de progreso general */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-black-soft">Porcentaje General de Alimentación</span>
                  <span className="text-2xl font-bold text-green-600">{stats.overallPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.overallPercentage}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {stats.totalEating} de {stats.totalPresent} estudiantes presentes comieron hoy • {stats.totalReinforcements} refuerzos utilizados
                </p>
              </div>
            </div>

            {/* Estadísticas por Ciclo */}
            {Object.keys(stats.byCategory).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-black-soft">Estadísticas por Ciclo Educativo</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats.byCategory).map(([category, categoryStats]) => (
                    <div key={category} className="border rounded-lg p-4 bg-white">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-light text-white px-3 py-1">
                            {getCategoryDisplayName(category as any)}
                          </Badge>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">{categoryStats.percentage}%</p>
                            <p className="text-xs text-muted-foreground">comieron</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-center text-xs grid-cols-4">
                          <div className="p-2 bg-blue-50 rounded">
                            <p className="font-bold text-blue-600">{categoryStats.present}</p>
                            <p className="text-muted-foreground">Presentes</p>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <p className="font-bold text-green-600">{categoryStats.eating}</p>
                            <p className="text-muted-foreground">Comieron</p>
                          </div>
                          <div className="p-2 bg-red-50 rounded">
                            <p className="font-bold text-red-600">{categoryStats.notEating}</p>
                            <p className="text-muted-foreground">No comieron</p>
                          </div>
                          <div className="p-2 bg-purple-50 rounded">
                            <p className="font-bold text-purple-600">{categoryStats.reinforcements}</p>
                            <p className="text-muted-foreground">Refuerzos</p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${categoryStats.percentage}%` }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {categoryStats.grades} grado{categoryStats.grades !== 1 ? 's' : ''} registrado{categoryStats.grades !== 1 ? 's' : ''} • {categoryStats.reinforcements} refuerzos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}