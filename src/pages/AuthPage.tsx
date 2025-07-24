import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Intentando login para:', name);
      
      // Buscar usuario en la tabla profiles por nombre y password
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', name)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error en consulta:', error);
        throw error;
      }

      if (!user) {
        console.log('❌ Usuario no encontrado o credenciales incorrectas');
        toast({
          title: "❌ Error de acceso",
          description: "Nombre de usuario o contraseña incorrectos",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Usuario encontrado:', user);

      // Guardar usuario en localStorage
      const userData = {
        id: user.id,
        name: user.name, // Usar el nombre exacto de la base de datos
        email: user.email || '',
        role: user.role,
        squadName: user.name, // Para squad leads, usar el mismo nombre
        employeeCode: user.employee_code
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));

      toast({
        title: "✅ Acceso concedido",
        description: `Bienvenido, ${user.name}`,
      });

      // Redirigir según el rol
      console.log('🔄 Redirigiendo según rol:', user.role);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'squad_lead') {
        navigate('/squad-dashboard');
      } else {
        navigate('/');
      }

    } catch (error: any) {
      console.error('❌ Error durante login:', error);
      toast({
        title: "❌ Error",
        description: "Error al intentar acceder al sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Acceso al Sistema
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ingresa tus credenciales para acceder
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de usuario</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>Usa los usuarios creados en el sistema</strong>
            </p>
            <div className="text-xs space-y-1">
              <div>
                Nombre: El nombre completo del usuario en el sistema
              </div>
              <div>
                Contraseña: La contraseña asignada al usuario
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;