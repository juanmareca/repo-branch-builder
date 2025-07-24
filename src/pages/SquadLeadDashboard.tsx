import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
import { APP_CONFIG } from '@/config/constants';

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
  const { currentUser } = useCurrentUser();
  
  // Debug del usuario actual
  console.log('🔍 SquadLeadDashboard - currentUser:', currentUser);
  
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // Cargar preferencias guardadas
  useEffect(() => {
    if (currentUser) {
      loadSavedOrder();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const loadSavedOrder = async () => {
    try {
      // Intentar cargar desde localStorage primero como respaldo
      const localOrder = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SQUAD_DASHBOARD_ORDER);
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
      // El código de empleado está en el campo password del currentUser
      const employeeCode = (currentUser as any)?.password;
      if (!employeeCode) return;
      
      const { data, error } = await supabase
        .from('squad_lead_preferences')
        .select('card_order')
        .eq('squad_lead_name', employeeCode)
        .maybeSingle();

      if (!error && data && data.card_order && data.card_order.length > 0) {
        const orderedCards = data.card_order
          .map(id => defaultCards.find(card => card.id === id))
          .filter(Boolean) as DashboardCard[];
        
        const missingCards = defaultCards.filter(
          card => !data.card_order.includes(card.id)
        );
        
        setCards([...orderedCards, ...missingCards]);
        // También guardar en localStorage
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SQUAD_DASHBOARD_ORDER, JSON.stringify(data.card_order));
      }
    } catch (error) {
      console.log('Error loading saved order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrder = async (newOrder: string[]) => {
    // Siempre guardar en localStorage primero (siempre funciona)
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SQUAD_DASHBOARD_ORDER, JSON.stringify(newOrder));
    
    // Intentar guardar en Supabase sin mostrar errores al usuario
    try {
      // El código de empleado está en el campo password del currentUser
      const employeeCode = (currentUser as any)?.password;
      
      // Solo guardar si tenemos el código de empleado
      if (!employeeCode) {
        console.log('Info: No se puede guardar en Supabase - falta código de empleado');
        return;
      }
      
      const { error } = await supabase
        .from('squad_lead_preferences')
        .upsert({
          squad_lead_name: employeeCode,
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

  // Handlers para el sistema de drag manual con botón derecho
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    if (e.button === 2) { // Botón derecho
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setIsRightMouseDown(true);
      setIsDragMode(true);
      setDragModeCard(cardId);
      setDraggedCard(cardId);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setDragPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isRightMouseDown && draggedCard && dragModeCard) {
      e.preventDefault();
      setDragPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2 && isRightMouseDown && draggedCard) { // Botón derecho
      // Encontrar la tarjeta sobre la que se soltó
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const cardElement = elementBelow?.closest('[data-card-id]');
      
      if (cardElement) {
        const targetCardId = cardElement.getAttribute('data-card-id');
        if (targetCardId && targetCardId !== draggedCard) {
          const newCards = [...cards];
          const draggedIndex = newCards.findIndex(card => card.id === draggedCard);
          const targetIndex = newCards.findIndex(card => card.id === targetCardId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Reordenar las tarjetas
            const [draggedItem] = newCards.splice(draggedIndex, 1);
            newCards.splice(targetIndex, 0, draggedItem);

            setCards(newCards);
            
            // Guardar el nuevo orden
            const newOrder = newCards.map(card => card.id);
            saveOrder(newOrder);
          }
        }
      }

      // Resetear estados
      setIsRightMouseDown(false);
      setIsDragMode(false);
      setDragModeCard(null);
      setDraggedCard(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar menú contextual siempre
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
    window.location.href = '/';
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
            <h1 className="text-3xl font-bold text-foreground">
              Panel de Squad Lead - {currentUser?.name || currentUser?.squadName || 'Cargando...'}
            </h1>
            <p className="text-muted-foreground mt-2">Gestiona tu equipo y proyectos</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Dashboard Grid with Manual Drag */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          onMouseMove={handleMouseMove}
        >
          {cards.map((card) => {
            const IconComponent = card.icon;
            const isDragging = draggedCard === card.id;
            return (
              <div
                key={card.id}
                data-card-id={card.id}
                onContextMenu={handleContextMenu}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
                onMouseUp={handleMouseUp}
                className={`transition-all duration-200 ${
                  isDragMode && dragModeCard === card.id && isRightMouseDown
                    ? 'cursor-move bg-yellow-400/20 ring-2 ring-yellow-400/70 scale-[1.03] shadow-xl shadow-yellow-400/30' 
                    : 'cursor-pointer hover:scale-[1.01]'
                } ${
                  isDragging ? 'opacity-70 scale-105 z-50' : ''
                }`}
                style={isDragging ? {
                  position: 'fixed',
                  left: dragPosition.x - dragOffset.x,
                  top: dragPosition.y - dragOffset.y,
                  pointerEvents: 'none',
                  width: '320px'
                } : {}}
              >
                <Card 
                  className={`h-full hover:shadow-lg transition-all duration-200 ${
                    isDragMode && dragModeCard === card.id && isRightMouseDown
                      ? 'shadow-xl shadow-yellow-400/40 border-yellow-400/80 border bg-gradient-to-br from-yellow-100/20 to-orange-100/20' 
                      : ''
                  }`}
                  onClick={() => !draggedCard && !isDragMode && handleNavigation(card.route)}
                >
                  
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

        {/* Instrucciones de uso */}
        <p className="text-muted-foreground text-sm italic mt-6">
          Mantén presionado el botón derecho del ratón sobre una tarjeta para arrastrarla
        </p>
      </div>
    </div>
  );
}