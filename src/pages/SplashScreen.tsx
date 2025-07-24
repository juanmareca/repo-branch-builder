import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/config/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import techBackground from '@/assets/tech-background.jpg';

interface SplashScreenProps {
  onLogin: (role: string, userData?: any) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'squad_lead' | 'operations'>('squad_lead');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSquadLead, setSelectedSquadLead] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [squadLeads, setSquadLeads] = useState<Array<{name: string, password: string}>>([]);
  const [operationsUsers, setOperationsUsers] = useState<Array<{name: string, password: string}>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Cargar usuarios desde la base de datos
  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, password, role')
        .in('role', ['squad_lead', 'operations'])
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const squads = data?.filter(user => user.role === 'squad_lead') || [];
      const ops = data?.filter(user => user.role === 'operations') || [];
      
      setSquadLeads(squads);
      setOperationsUsers(ops);
      
      console.log(`✅ Cargados ${squads.length} squad leads y ${ops.length} usuarios de operaciones`);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when role changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setSelectedSquadLead('');
    setEmployeeCode('');
  }, [selectedRole]);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogin = async () => {
    if (selectedRole === 'admin') {
      // Verificar si existe admin en base de datos
      try {
        const { data: adminFromDB, error } = await supabase
          .from('profiles')
          .select('name, password')
          .eq('role', 'admin')
          .eq('name', username)
          .single();

        if (!error && adminFromDB) {
          // Usar admin de base de datos
          if (password === adminFromDB.password) {
            localStorage.clear();
            localStorage.setItem('currentUser', JSON.stringify({
              id: 'admin',
              name: username,
              email: 'admin@stratesys.com',
              role: 'admin'
            }));
            onLogin('admin', { name: username });
            return;
          }
        }
      } catch (error) {
        console.log('Admin no encontrado en BD, usando hardcodeado');
      }

      // Fallback al admin hardcodeado
      if (username === 'admin' && password === 'admin123') {
        localStorage.clear();
        localStorage.setItem('currentUser', JSON.stringify({
          id: 'admin',
          name: 'admin',
          email: 'admin@stratesys.com',
          role: 'admin'
        }));
        onLogin('admin', { name: 'admin' });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive"
        });
      }
    } else if (selectedRole === 'squad_lead') {
      const selectedLead = squadLeads.find(lead => lead.name === selectedSquadLead);
      if (selectedLead && employeeCode === selectedLead.password) {
        localStorage.clear();
        localStorage.setItem('currentUser', JSON.stringify({
          id: selectedSquadLead,
          name: selectedSquadLead,
          email: `${selectedSquadLead}@stratesys.com`,
          role: 'squad_lead',
          squadName: selectedSquadLead
        }));
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_SQUAD_LEAD, selectedSquadLead);
        onLogin('squad_lead', { name: selectedSquadLead });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Squad Lead o contraseña incorrectos",
          variant: "destructive"
        });
      }
    } else if (selectedRole === 'operations') {
      const selectedUser = operationsUsers.find(user => user.name === username);
      if (selectedUser && password === selectedUser.password) {
        localStorage.clear();
        localStorage.setItem('currentUser', JSON.stringify({
          id: username,
          name: username,
          email: `${username}@stratesys.com`,
          role: 'operations'
        }));
        onLogin('operations', { name: username });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${techBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"></div>
      
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md p-8 bg-gray-900/95 backdrop-blur-md border-gray-700/50 shadow-2xl relative z-10 animate-fade-in">
        {/* Header with corporate logo styling */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-wide text-white mb-3 font-sans" style={{ letterSpacing: '2px' }}>
            Stratesys
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-3"></div>
          <p className="text-white text-sm mb-1 font-medium">Sistema de Gestión de Recursos</p>
          <p className="text-gray-300 text-xs">STAFFING CC05 - Finanzas</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('admin')}
              className={cn(
                "text-xs py-2 transition-all duration-300",
                selectedRole === 'admin' 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg" 
                  : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              Administrador
            </Button>
            <Button
              variant={selectedRole === 'squad_lead' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('squad_lead')}
              className={cn(
                "text-xs py-2 transition-all duration-300",
                selectedRole === 'squad_lead' 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg" 
                  : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              Squad Lead
            </Button>
            <Button
              variant={selectedRole === 'operations' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('operations')}
              className={cn(
                "text-xs py-2 transition-all duration-300",
                selectedRole === 'operations' 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg" 
                  : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              Operaciones
            </Button>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          {selectedRole === 'admin' && (
            <>
              <div>
                <label className="text-sm font-medium text-white">Usuario:</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese usuario"
                    className="pl-10 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white">Contraseña:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña"
                    className="pr-10 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {selectedRole === 'squad_lead' && (
            <>
              <div>
                <label className="text-sm font-medium text-white">Squad Lead:</label>
                <Select value={selectedSquadLead} onValueChange={setSelectedSquadLead}>
                  <SelectTrigger className="mt-1 bg-gray-800/80 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-300" />
                      <SelectValue placeholder="Seleccionar Squad Lead" className="text-gray-300" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white max-h-48">
                    {squadLeads.length > 0 ? squadLeads.map((lead) => (
                      <SelectItem 
                        key={lead.name} 
                        value={lead.name}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {lead.name}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-squad-leads" disabled className="text-gray-500">
                        No hay squad leads configurados
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-white">Contraseña:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Ingrese contraseña"
                    className="pr-10 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {selectedRole === 'operations' && (
            <>
              <div>
                <label className="text-sm font-medium text-white">Usuario:</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese usuario"
                    className="pl-10 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white">Contraseña:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña"
                    className="pr-10 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button 
            onClick={handleLogin} 
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            disabled={
              loading ||
              (selectedRole === 'admin' && (!username || !password)) ||
              (selectedRole === 'squad_lead' && (!selectedSquadLead || !employeeCode)) ||
              (selectedRole === 'operations' && (!username || !password))
            }
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </Button>

          {selectedRole === 'squad_lead' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              {squadLeads.length > 0 
                ? "Seleccione su nombre y use su contraseña asignada" 
                : "No hay squad leads configurados. Contacte al administrador."}
            </p>
          )}

          {selectedRole === 'admin' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              Usuario: admin • Contraseña: admin123 (por defecto)
            </p>
          )}

          {selectedRole === 'operations' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              {operationsUsers.length > 0 
                ? "Use sus credenciales asignadas por el administrador" 
                : "No hay usuarios de operaciones configurados."}
            </p>
          )}
        </div>

        {/* Footer with tech styling */}
        <div className="text-center mt-8">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-3"></div>
          <p className="text-xs text-gray-300">
            Versión 2.0 • <span className="text-blue-400">Tecnología de Vanguardia</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SplashScreen;