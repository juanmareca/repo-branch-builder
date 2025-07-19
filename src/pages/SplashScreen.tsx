import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Stratesys</h1>
          <p className="text-muted-foreground text-sm mb-1">Sistema de Gestión de Recursos</p>
          <p className="text-muted-foreground text-xs">STAFFING CC05 - Finanzas</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('admin')}
              className="text-xs py-2"
            >
              Administrador
            </Button>
            <Button
              variant={selectedRole === 'squad_lead' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('squad_lead')}
              className="text-xs py-2"
            >
              Squad Lead
            </Button>
            <Button
              variant={selectedRole === 'operations' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('operations')}
              className="text-xs py-2"
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
                <label className="text-sm font-medium text-foreground">Usuario:</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese usuario"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Contraseña:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <label className="text-sm font-medium text-foreground">Squad Lead:</label>
                <Select value={selectedSquadLead} onValueChange={setSelectedSquadLead}>
                  <SelectTrigger className="mt-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Seleccionar Squad Lead" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {squadLeads.map((lead) => (
                      <SelectItem key={lead.code} value={lead.name}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Número de Empleado:</label>
                <div className="relative mt-1">
                  <Input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Ingrese número de empleado"
                  />
                </div>
              </div>
            </>
          )}

          {selectedRole === 'operations' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Usuario:</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese usuario"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Contraseña:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button 
            onClick={handleLogin} 
            className="w-full mt-6"
            disabled={
              (selectedRole === 'admin' && (!username || !password)) ||
              (selectedRole === 'squad_lead' && (!selectedSquadLead || !employeeCode)) ||
              (selectedRole === 'operations' && (!username || !password))
            }
          >
            Iniciar Sesión
          </Button>

          {selectedRole === 'squad_lead' && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Seleccione su nombre y use su número de empleado como contraseña
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Versión 2.0 • Tecnología de Vanguardia
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SplashScreen;