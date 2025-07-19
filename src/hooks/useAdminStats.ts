import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Obtener conteos de todas las tablas en paralelo
        const [
          { count: recursosCount },
          { count: proyectosCount },
          { count: capacidadesCount },
          { count: festivosCount }
        ] = await Promise.all([
          supabase.from('persons').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('capacities').select('*', { count: 'exact', head: true }),
          supabase.from('holidays').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          recursos: recursosCount || 0,
          proyectos: proyectosCount || 0,
          capacidades: capacidadesCount || 0,
          festivos: festivosCount || 0
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};