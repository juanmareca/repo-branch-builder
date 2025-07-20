import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  recursos: number;
  proyectos: number;
  capacidades: number;
  festivos: number;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    recursos: 0,
    proyectos: 0,
    capacidades: 0,
    festivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para manejar el debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener conteos de todas las tablas en paralelo
      console.log('🔄 Fetching admin stats...');
      
      const [
        { count: recursosCount, error: recursosError },
        { count: proyectosCount, error: proyectosError },
        { count: capacidadesCount, error: capacidadesError },
        { count: festivosCount, error: festivosError }
      ] = await Promise.all([
        supabase.from('persons').select('*', { count: 'exact', head: true }).limit(50000),
        supabase.from('projects').select('*', { count: 'exact', head: true }).limit(50000),
        supabase.from('capacities').select('*', { count: 'exact', head: true }).limit(50000),
        supabase.from('holidays').select('*', { count: 'exact', head: true }).limit(50000)
      ]);

      // Debug individual counts
      console.log('📊 Counts fetched:', {
        recursos: recursosCount,
        proyectos: proyectosCount,
        capacidades: capacidadesCount,
        festivos: festivosCount
      });

      // Check for individual errors
      if (recursosError) console.error('❌ Recursos error:', recursosError);
      if (proyectosError) console.error('❌ Proyectos error:', proyectosError);
      if (capacidadesError) console.error('❌ Capacidades error:', capacidadesError);
      if (festivosError) console.error('❌ Festivos error:', festivosError);

      const newStats = {
        recursos: recursosCount || 0,
        proyectos: proyectosCount || 0,
        capacidades: capacidadesCount || 0,
        festivos: festivosCount || 0
      };

      console.log('✅ Setting new stats:', newStats);
      setStats(newStats);
      
    } catch (err) {
      console.error('❌ Error fetching admin stats:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función con debounce para evitar actualizaciones excesivas
  const debouncedFetchStats = useCallback(() => {
    // Limpiar timeout anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Establecer nuevo timeout para actualizar stats después de 1.5 segundos
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('Updating stats after debounce...');
      fetchStats();
    }, 1500);
  }, [fetchStats]);

  useEffect(() => {
    // Cargar estadísticas iniciales
    fetchStats();

    // Configurar escuchas en tiempo real para todas las tablas
    const channel = supabase
      .channel('admin-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'holidays'
        },
        () => {
          console.log('Holidays table changed, debouncing stats refresh...');
          debouncedFetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'persons'
        },
        () => {
          console.log('Persons table changed, debouncing stats refresh...');
          debouncedFetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          console.log('Projects table changed, debouncing stats refresh...');
          debouncedFetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'capacities'
        },
        () => {
          console.log('Capacities table changed, debouncing stats refresh...');
          debouncedFetchStats();
        }
      )
      .subscribe();

    // Cleanup al desmontar el componente
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchStats, debouncedFetchStats]);

  return { stats, loading, error };
};