import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface Menu {
  id: string
  date: string
  meal: string
  name: string
  description: string
  allergens: string[]
  price: number
}

export function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([
    {
      id: '1',
      date: '2025-01-30',
      meal: 'Desayuno',
      name: 'Desayuno Completo',
      description: 'Cereales con leche, tostadas integrales con mermelada, zumo de naranja natural',
      allergens: ['gluten', 'lactosa'],
      price: 3.50
    },
    {
      id: '2',
      date: '2025-01-30',
      meal: 'Almuerzo',
      name: 'Menú del Día',
      description: 'Pollo asado con patatas y verduras, ensalada mixta, pan integral, postre del día',
      allergens: ['gluten'],
      price: 6.80
    },
    {
      id: '3',
      date: '2025-01-31',
      meal: 'Almuerzo',
      name: 'Menú Vegetariano',
      description: 'Pasta con verduras salteadas, ensalada de quinoa, pan integral, fruta fresca',
      allergens: ['gluten'],
      price: 6.20
    }
  ])

  const [newMenu, setNewMenu] = useState<Partial<Menu>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const meals = ['Desayuno', 'Almuerzo', 'Cena']
  const allergenOptions = ['gluten', 'lactosa', 'huevos', 'frutos secos', 'pescado', 'soja']

  const handleAddMenu = () => {
    if (newMenu.date && newMenu.meal && newMenu.name && newMenu.description) {
      const menu: Menu = {
        id: Date.now().toString(),
        date: newMenu.date,
        meal: newMenu.meal,
        name: newMenu.name,
        description: newMenu.description,
        allergens: newMenu.allergens || [],
        price: newMenu.price || 0
      }
      setMenus([...menus, menu])
      setNewMenu({})
      setIsDialogOpen(false)
    }
  }

  const handleDeleteMenu = (id: string) => {
    setMenus(menus.filter(m => m.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const groupedMenus = menus.reduce((acc, menu) => {
    if (!acc[menu.date]) acc[menu.date] = []
    acc[menu.date].push(menu)
    return acc
  }, {} as Record<string, Menu[]>)

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1>Gestión de Menús</h1>
          <p className="text-muted-foreground">
            Administra los menús diarios del restaurante
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Menú
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Menú</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={newMenu.date || ''}
                  onChange={(e) => setNewMenu({...newMenu, date: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Comida</Label>
                <Select onValueChange={(value) => setNewMenu({...newMenu, meal: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comida" />
                  </SelectTrigger>
                  <SelectContent>
                    {meals.map(meal => (
                      <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Nombre del Menú</Label>
                <Input
                  placeholder="Ej: Menú del día"
                  value={newMenu.name || ''}
                  onChange={(e) => setNewMenu({...newMenu, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe el menú completo..."
                  value={newMenu.description || ''}
                  onChange={(e) => setNewMenu({...newMenu, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Precio (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newMenu.price || ''}
                  onChange={(e) => setNewMenu({...newMenu, price: parseFloat(e.target.value)})}
                />
              </div>
              
              <Button onClick={handleAddMenu} className="w-full">
                Agregar Menú
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedMenus).sort().map(date => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {formatDate(date)}
                <Badge variant="outline">
                  {groupedMenus[date].length} menús
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMenus[date].map(menu => (
                  <div key={menu.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant={
                          menu.meal === 'Desayuno' ? 'default' :
                          menu.meal === 'Almuerzo' ? 'secondary' : 'outline'
                        }>
                          {menu.meal}
                        </Badge>
                        <h3 className="font-medium">{menu.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteMenu(menu.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {menu.description}
                    </p>
                    
                    {menu.allergens.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Alérgenos:</p>
                        <div className="flex flex-wrap gap-1">
                          {menu.allergens.map(allergen => (
                            <Badge key={allergen} variant="destructive" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="font-medium text-lg">{menu.price.toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {Object.keys(groupedMenus).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No hay menús programados</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Menú
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}