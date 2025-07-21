import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FolderKanban, 
  Calendar, 
  TrendingUp, 
  FileText, 
  LogOut,
  CalendarDays,
  GripVertical
} from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  bgColor: string;
  iconColor: string;
}

export default function SquadLeadDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Configuración por defecto de las tarjetas
  const defaultCards: DashboardCard[] = [
    {
      id: 'team',
      title: 'Mi Equipo',
      description: 'Gestiona los miembros de tu Squad',
      icon: Users,
      route: '/squad-team',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      id: 'projects',
      title: 'Proyectos',
      description: 'Visualiza los proyectos activos de tu equipo',
      icon: FolderKanban,
      route: '/squad-projects',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      id: 'assignments',
      title: 'Asignaciones',
      description: 'Gestiona asignaciones de proyectos y calendarios',
      icon: Calendar,
      route: '/squad-assignments',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500'
    },
    {
      id: 'holidays',
      title: 'Gestión de Festivos',
      description: 'Consulta los días festivos del calendario',
      icon: CalendarDays,
      route: '/squad-holidays',
      bgColor: 'bg-orange-600/10',
      iconColor: 'text-orange-600'
    },
    {
      id: 'availability',
      title: 'Disponibilidad',
      description: 'Analiza la carga de trabajo del equipo',
      icon: TrendingUp,
      route: '/squad-availability',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Genera informes de rendimiento del equipo',
      icon: FileText,
      route: '/squad-reports',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500'
    }
  ];

  const [cards, setCards] = useState<DashboardCard[]>(defaultCards);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  // Cargar preferencias guardadas
  useEffect(() => {
    loadSavedOrder();
  }, []);

  const loadSavedOrder = async () => {
    try {
      // Por ahora usaremos un nombre fijo del squad lead
      // En producción esto vendría del contexto de autenticación
      const squadLeadName = 'Demo Squad Lead';
      
      const { data, error } = await supabase
        .from('squad_lead_preferences')
        .select('card_order')
        .eq('squad_lead_name', squadLeadName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data && data.card_order && data.card_order.length > 0) {
        // Reordenar las tarjetas según el orden guardado
        const orderedCards = data.card_order
          .map(id => defaultCards.find(card => card.id === id))
          .filter(Boolean) as DashboardCard[];
        
        // Añadir tarjetas que no estén en el orden guardado
        const missingCards = defaultCards.filter(
          card => !data.card_order.includes(card.id)
        );
        
        setCards([...orderedCards, ...missingCards]);
      }
    } catch (error) {
      console.error('Error loading saved order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrder = async (newOrder: string[]) => {
    try {
      const squadLeadName = 'Demo Squad Lead';
      
      const { error } = await supabase
        .from('squad_lead_preferences')
        .upsert({
          squad_lead_name: squadLeadName,
          card_order: newOrder
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el orden de las tarjetas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    
    if (!draggedCard || draggedCard === targetCardId) {
      setDraggedCard(null);
      return;
    }

    const newCards = [...cards];
    const draggedIndex = newCards.findIndex(card => card.id === draggedCard);
    const targetIndex = newCards.findIndex(card => card.id === targetCardId);

    // Reordenar las tarjetas
    const [draggedItem] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, draggedItem);

    setCards(newCards);
    setDraggedCard(null);
    
    // Guardar el nuevo orden
    const newOrder = newCards.map(card => card.id);
    saveOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel Squad Lead</h1>
            <p className="text-muted-foreground mt-2">Gestiona tu equipo y proyectos - Arrastra las tarjetas para ordenarlas</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Dashboard Grid with Native Drag and Drop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, card.id)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 cursor-move ${
                  draggedCard === card.id ? 'opacity-50 scale-105' : ''
                }`}
              >
                <Card 
                  className="h-full hover:shadow-lg transition-shadow group relative"
                  onClick={() => !draggedCard && handleNavigation(card.route)}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto ${card.bgColor} w-16 h-16 rounded-full flex items-center justify-center mb-3`}>
                      <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground text-sm">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}