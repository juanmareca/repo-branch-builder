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
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragModeCard, setDragModeCard] = useState<string | null>(null);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);

  // Cargar preferencias guardadas
  useEffect(() => {
    loadSavedOrder();
  }, []);

  const loadSavedOrder = async () => {
    try {
      // Intentar cargar desde localStorage primero como respaldo
      const localOrder = localStorage.getItem('squad-dashboard-order');
      if (localOrder) {
        try {
          const savedOrder = JSON.parse(localOrder);
          if (Array.isArray(savedOrder) && savedOrder.length > 0) {
            const orderedCards = savedOrder
              .map(id => defaultCards.find(card => card.id === id))
              .filter(Boolean) as DashboardCard[];
            
            const missingCards = defaultCards.filter(
              card => !savedOrder.includes(card.id)
            );
            
            setCards([...orderedCards, ...missingCards]);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log('Error parsing localStorage:', e);
        }
      }

      // Intentar cargar desde Supabase como secundario
      const squadLeadName = 'Demo Squad Lead';
      
      const { data, error } = await supabase
        .from('squad_lead_preferences')
        .select('card_order')
        .eq('squad_lead_name', squadLeadName)
        .single();

      if (!error && data && data.card_order && data.card_order.length > 0) {
        const orderedCards = data.card_order
          .map(id => defaultCards.find(card => card.id === id))
          .filter(Boolean) as DashboardCard[];
        
        const missingCards = defaultCards.filter(
          card => !data.card_order.includes(card.id)
        );
        
        setCards([...orderedCards, ...missingCards]);
        // También guardar en localStorage
        localStorage.setItem('squad-dashboard-order', JSON.stringify(data.card_order));
      }
    } catch (error) {
      console.log('Error loading saved order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrder = async (newOrder: string[]) => {
    // Siempre guardar en localStorage primero (siempre funciona)
    localStorage.setItem('squad-dashboard-order', JSON.stringify(newOrder));
    
    // Intentar guardar en Supabase sin mostrar errores al usuario
    try {
      const squadLeadName = 'Demo Squad Lead';
      
      const { error } = await supabase
        .from('squad_lead_preferences')
        .upsert({
          squad_lead_name: squadLeadName,
          card_order: newOrder
        });

      if (error) {
        console.log('Info: Guardado en localStorage exitoso. Supabase no disponible:', error.message);
      } else {
        console.log('✅ Orden guardado exitosamente en Supabase y localStorage');
      }
    } catch (error) {
      console.log('Info: Guardado en localStorage exitoso. Supabase no disponible:', error);
    }
  };

  // Handlers para el sistema de drag con botón derecho mantenido presionado
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    if (e.button === 2) { // Botón derecho
      e.preventDefault();
      setIsRightMouseDown(true);
      setIsDragMode(true);
      setDragModeCard(cardId);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) { // Botón derecho
      setIsRightMouseDown(false);
      setIsDragMode(false);
      setDragModeCard(null);
      setDraggedCard(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar menú contextual siempre
  };

  const handleMouseLeave = () => {
    // Solo resetear si no estamos arrastrando
    if (!draggedCard && !isRightMouseDown) {
      setIsDragMode(false);
      setDragModeCard(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    if (!isDragMode || !isRightMouseDown || dragModeCard !== cardId) {
      e.preventDefault();
      return;
    }
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragMode || !isRightMouseDown) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    
    if (!draggedCard || draggedCard === targetCardId || !isDragMode || !isRightMouseDown) {
      return;
    }

    const newCards = [...cards];
    const draggedIndex = newCards.findIndex(card => card.id === draggedCard);
    const targetIndex = newCards.findIndex(card => card.id === targetCardId);

    // Reordenar las tarjetas
    const [draggedItem] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, draggedItem);

    setCards(newCards);
    
    // Guardar el nuevo orden
    const newOrder = newCards.map(card => card.id);
    saveOrder(newOrder);
  };

  const handleDragEnd = () => {
    // Solo limpiar el draggedCard, mantener el modo si aún tiene botón derecho presionado
    setDraggedCard(null);
  };

  // Listener global para detectar cuando suelta el botón derecho fuera de la tarjeta
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 2) { // Botón derecho
        setIsRightMouseDown(false);
        setIsDragMode(false);
        setDragModeCard(null);
        setDraggedCard(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

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
            <p className="text-muted-foreground mt-2">Gestiona tu equipo y proyectos - Mantén presionado el botón derecho del ratón sobre una tarjeta para arrastrarla</p>
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
                draggable={true}
                onContextMenu={handleContextMenu}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDragStart={(e) => handleDragStart(e, card.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, card.id)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 ${
                  isDragMode && dragModeCard === card.id && isRightMouseDown
                    ? 'cursor-move bg-yellow-400/30 ring-4 ring-yellow-400 scale-[1.05] shadow-2xl shadow-yellow-400/50 animate-pulse' 
                    : 'cursor-pointer hover:scale-[1.01]'
                } ${
                  draggedCard === card.id ? 'opacity-70 scale-105' : ''
                }`}
              >
                <Card 
                  className={`h-full hover:shadow-lg transition-all duration-200 ${
                    isDragMode && dragModeCard === card.id && isRightMouseDown
                      ? 'shadow-2xl shadow-yellow-400/60 border-yellow-400 border-2 bg-gradient-to-br from-yellow-200/20 to-red-200/20' 
                      : ''
                  }`}
                  onClick={() => !draggedCard && !isDragMode && handleNavigation(card.route)}
                >
                  {/* Indicador de modo drag */}
                  {isDragMode && dragModeCard === card.id && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <GripVertical className="h-3 w-3" />
                        Arrastrar
                      </div>
                    </div>
                  )}
                  
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