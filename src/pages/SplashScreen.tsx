import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  const { toast } = useToast();

  // Lista de Squad Leads ordenada alfabéticamente con sus códigos
  const squadLeads = [
    { name: 'ACOSTA SERRANO, CARLOS ALBERTO', code: '4003314' },
    { name: 'AGUIRRE, FERNANDO LIONEL', code: '4002176' },
    { name: 'ALE MARTOS, ALBERTO', code: '4000220' },
    { name: 'BARRAGAN CARAMES, ALEJANDRO', code: '4001553' },
    { name: 'CARBAJO SAINZ ROZAS, MIGUEL', code: '4000226' },
    { name: 'CARBIA BOUZADA, YOLANDA', code: '4002088' },
    { name: 'CARRO GARCIA, HELENA', code: '4000021' },
    { name: 'CASTILLA JIMENEZ, JESUS', code: '4000128' },
    { name: 'CASTILLO IZQUIERDO, FRANCISCO', code: '4000085' },
    { name: 'CEBRIAN ARRABAL, RAFAEL', code: '4001029' },
    { name: 'CORCHUELO MAYO, MARIA VICTORIA', code: '4002598' },
    { name: 'CRUZ PEREZ, JORGE', code: '4001284' },
    { name: 'CUELLAR GOMEZ, JAVIER', code: '4000111' },
    { name: 'DE CRUCES RUANO, RAFAEL', code: '4001794' },
    { name: 'DE LA FUENTE GONZALEZ, ANDONI', code: '4002916' },
    { name: 'DE MESA GARCIA, MARIA DEL CARMEN', code: '4001855' },
    { name: 'DEL CORRAL PELLON, CARMEN LUCIA', code: '4000015' },
    { name: 'DOMINGUEZ HOLGADO, JOSE ANTONIO', code: '4002597' },
    { name: 'DURAN TORRERO, RAFAEL DAVID', code: '4002888' },
    { name: 'FERNANDEZ CUMACHE, RAMON ANDRES', code: '4000581' },
    { name: 'GARCIA CORDERO, CESAR', code: '4000439' },
    { name: 'GARCIA TABERNER, ADOLFO', code: '4002228' },
    { name: 'GONZALEZ RAFAEL, RAUL', code: '4000352' },
    { name: 'GONZALEZ SOMOANO, GREGORIO', code: '4000091' },
    { name: 'GUIJARRO ESCALADA, VIRGINIA', code: '4002614' },
    { name: 'GUTIERREZ BURGUILLO, ALBA', code: '4002206' },
    { name: 'JIMENEZ HERNANDEZ, JAVIER', code: '4000525' },
    { name: 'LANZOS HERNANDEZ, EDUARDO', code: '4000672' },
    { name: 'LAZARO SAN ANDRES, JOSE MARIA', code: '4002657' },
    { name: 'MARAIMA ALVAREZ, LEOMAR RAFAEL', code: '4000377' },
    { name: 'MARCUS CRISAN, IONUT ALEXANDRU', code: '4000316' },
    { name: 'MARTINEZ DE SORIA RUEDA, ANDER', code: '4001245' },
    { name: 'MARTINEZ MARTIN, FRANCISCO', code: '4000465' },
    { name: 'MELERO MILLAN, IVAN', code: '4001251' },
    { name: 'MIGUEL NIEVA, EDUARDO', code: '4001833' },
    { name: 'ORTEGA CUEVAS, ANGEL LUIS', code: '4000089' },
    { name: 'ORTEGA MUNTANE, LUIS JAVIER', code: '4000112' },
    { name: 'PORTEIRO EIROA, EZEQUIEL', code: '4000090' },
    { name: 'RABAGO TORRE, VALENTIN', code: '4002133' },
    { name: 'REVILLA MAILLO, JUAN MANUEL', code: '4002729' },
    { name: 'RODRIGUEZ FERNANDEZ, BELEN', code: '4001527' },
    { name: 'ROLDAN COSANO, EMILIO', code: '4000147' },
    { name: 'ROMERO SALINAS, ESTEFANIA', code: '4000535' },
    { name: 'ROQUE DIAZ, MANUEL', code: '4003058' },
    { name: 'SOLAZ TORRES, LUIS', code: '4001949' }
  ];

  // Reset form when role changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setSelectedSquadLead('');
    setEmployeeCode('');
  }, [selectedRole]);

  const handleLogin = () => {
    if (selectedRole === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        onLogin('admin', { username });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive"
        });
      }
    } else if (selectedRole === 'squad_lead') {
      const selectedLead = squadLeads.find(lead => lead.name === selectedSquadLead);
      if (selectedLead && employeeCode === selectedLead.code) {
        onLogin('squad_lead', { name: selectedSquadLead, code: employeeCode });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Squad Lead o número de empleado incorrectos",
          variant: "destructive"
        });
      }
    } else if (selectedRole === 'operations') {
      // Placeholder for operations login
      toast({
        title: "Función no disponible",
        description: "El login de Operaciones aún no está configurado",
        variant: "default"
      });
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
        {/* Header with glow effect */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">
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
                    {squadLeads.map((lead) => (
                      <SelectItem 
                        key={lead.code} 
                        value={lead.name}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-white">Número de Empleado:</label>
                <div className="relative mt-1">
                  <Input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Ingrese número de empleado"
                    className="bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-300 focus:border-blue-400 focus:ring-blue-400/20 focus:bg-gray-800"
                  />
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
              (selectedRole === 'admin' && (!username || !password)) ||
              (selectedRole === 'squad_lead' && (!selectedSquadLead || !employeeCode)) ||
              (selectedRole === 'operations' && (!username || !password))
            }
          >
            Iniciar Sesión
          </Button>

          {selectedRole === 'squad_lead' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              Seleccione su nombre y use su número de empleado como contraseña
            </p>
          )}

          {selectedRole === 'admin' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              Use sus credenciales de administrador para acceder al sistema
            </p>
          )}

          {selectedRole === 'operations' && (
            <p className="text-xs text-gray-300 text-center mt-4">
              Use sus credenciales de operaciones para acceder al sistema
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