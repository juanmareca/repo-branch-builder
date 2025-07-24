import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, UserPlus, Users, Key, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/constants';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'squad_lead' | 'operations';
  employee_code?: string;
  squad_name?: string;
  is_active: boolean;
}

interface NewUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'squad_lead' | 'operations';
  employee_code?: string;
  squad_name?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    name: '',
    role: 'operations',
    employee_code: '',
    squad_name: ''
  });
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando usuarios desde la base de datos...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error al cargar usuarios:', error);
        throw error;
      }
      
      console.log('📋 Usuarios cargados:', data?.length || 0, data);
      setUsers(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "✅ Usuarios cargados",
          description: `Se cargaron ${data.length} usuarios del sistema`,
        });
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      toast({
        title: "❌ Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            employee_code: newUser.employee_code
          }
        }
      });

      if (authError) throw authError;

      // Actualizar perfil con rol y datos adicionales
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: newUser.role,
            squad_name: newUser.squad_name,
            employee_code: newUser.employee_code
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "✅ Usuario creado",
        description: `Usuario ${newUser.name} creado correctamente`,
      });

      // Resetear formulario
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'operations',
        employee_code: '',
        squad_name: ''
      });
      setShowNewUserForm(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "❌ Error al crear usuario",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "✅ Usuario actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "❌ Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const initializeDefaultUsers = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniciando creación de usuarios...');

      const defaultUsers = [
        {
          email: 'admin@empresa.com',
          password: 'Admin123!',
          name: 'Administrador',
          role: 'admin' as const,
          employee_code: 'ADMIN001'
        },
        {
          email: 'operaciones@empresa.com',
          password: 'Operations123!',
          name: 'Operaciones',
          role: 'operations' as const,
          employee_code: 'OPR001'
        }
      ];

      // Solo agregar los primeros 5 squad leads para evitar rate limit
      const squadLeadUsers = APP_CONFIG.SQUAD_LEADS.slice(0, 5).map(sl => ({
        email: `${sl.code}@empresa.com`,
        password: `Squad${sl.code}!`,
        name: sl.name,
        role: 'squad_lead' as const,
        employee_code: sl.code
      }));

      const allUsers = [...defaultUsers, ...squadLeadUsers];
      console.log('👥 Total usuarios a crear:', allUsers.length);
      
      let createdCount = 0;
      let existingCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < allUsers.length; i++) {
        const user = allUsers[i];
        console.log(`🔍 [${i+1}/${allUsers.length}] Procesando: ${user.name}`);
        
        // Verificar si ya existe
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('email, role')
          .eq('email', user.email)
          .maybeSingle();

        if (checkError) {
          console.error('Error verificando usuario:', checkError);
          errors.push(`Error verificando ${user.name}: ${checkError.message}`);
          continue;
        }

        if (existing) {
          console.log(`✅ Usuario ya existe: ${user.name}`);
          existingCount++;
          continue;
        }

        console.log(`➕ Creando usuario: ${user.name}`);

        // Crear en Auth con retry para rate limits
        let authSuccess = false;
        let retries = 0;
        const maxRetries = 3;

        while (!authSuccess && retries < maxRetries) {
          try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: user.email,
              password: user.password,
              options: {
                data: {
                  name: user.name,
                  employee_code: user.employee_code
                }
              }
            });

            if (authError) {
              if (authError.code === 'over_request_rate_limit') {
                console.log(`⏳ Rate limit alcanzado, esperando 10 segundos... (intento ${retries + 1})`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                retries++;
                continue;
              } else if (authError.message.includes('already registered')) {
                console.log(`✅ Usuario ya registrado: ${user.name}`);
                existingCount++;
                authSuccess = true;
                break;
              } else {
                throw authError;
              }
            } else {
              console.log(`✅ Usuario creado en Auth: ${user.name}`);
              
              // Esperar para que se ejecute el trigger
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Actualizar el rol en el perfil
              if (authData?.user) {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ 
                    role: user.role,
                    employee_code: user.employee_code
                  })
                  .eq('id', authData.user.id);

                if (updateError) {
                  console.error(`❌ Error actualizando perfil ${user.name}:`, updateError);
                  errors.push(`Error perfil ${user.name}: ${updateError.message}`);
                } else {
                  console.log(`✅ Perfil actualizado: ${user.name} → ${user.role}`);
                  createdCount++;
                }
              }
              authSuccess = true;
            }
          } catch (error: any) {
            console.error(`❌ Error creando ${user.name}:`, error);
            errors.push(`Error ${user.name}: ${error.message}`);
            break;
          }
        }

        if (!authSuccess && retries >= maxRetries) {
          errors.push(`${user.name}: Máximo de reintentos alcanzado`);
        }

        // Esperar entre usuarios para evitar rate limit
        if (i < allUsers.length - 1) {
          console.log('⏳ Esperando 3 segundos antes del siguiente usuario...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log(`📊 Resumen: ${createdCount} creados, ${existingCount} existían, ${errors.length} errores`);

      if (errors.length > 0) {
        console.error('❌ Errores encontrados:', errors);
        toast({
          title: "⚠️ Inicialización parcial",
          description: `Creados: ${createdCount}, Existían: ${existingCount}, Errores: ${errors.length}. Revisa la consola para detalles.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Usuarios inicializados",
          description: `Creados: ${createdCount}, Ya existían: ${existingCount}`,
        });
      }

      await loadUsers();
    } catch (error: any) {
      console.error('💥 Error general:', error);
      toast({
        title: "❌ Error al inicializar usuarios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header y acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            <p className="text-sm text-muted-foreground">
              Administra los usuarios del sistema y sus roles
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={initializeDefaultUsers} disabled={loading}>
            <Key className="h-4 w-4 mr-2" />
            Inicializar Usuarios
          </Button>
          <Button onClick={() => setShowNewUserForm(true)} disabled={loading}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Formulario nuevo usuario */}
      {showNewUserForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Crear Nuevo Usuario</span>
              <Button variant="ghost" size="icon" onClick={() => setShowNewUserForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords['new'] ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords['new'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newName">Nombre Completo</Label>
                <Input
                  id="newName"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre y apellidos"
                />
              </div>
              <div>
                <Label htmlFor="newRole">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="squad_lead">Squad Lead</SelectItem>
                    <SelectItem value="operations">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newEmployeeCode">Código Empleado</Label>
                <Input
                  id="newEmployeeCode"
                  value={newUser.employee_code}
                  onChange={(e) => setNewUser(prev => ({ ...prev, employee_code: e.target.value }))}
                  placeholder="4000001"
                />
              </div>
              <div>
                <Label htmlFor="newSquadName">Squad (opcional)</Label>
                <Input
                  id="newSquadName"
                  value={newUser.squad_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, squad_name: e.target.value }))}
                  placeholder="Nombre del squad"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewUserForm(false)}>
                Cancelar
              </Button>
              <Button onClick={createUser} disabled={loading || !newUser.email || !newUser.password || !newUser.name}>
                <Save className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'squad_lead' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'squad_lead' ? 'Squad Lead' : 'Operaciones'}
                        </Badge>
                        {!user.is_active && <Badge variant="outline">Inactivo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.employee_code && (
                        <p className="text-xs text-muted-foreground">Código: {user.employee_code}</p>
                      )}
                      {user.squad_name && (
                        <p className="text-xs text-muted-foreground">Squad: {user.squad_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${user.id}`} className="text-sm">Activo</Label>
                      <Switch
                        id={`active-${user.id}`}
                        checked={user.is_active}
                        onCheckedChange={(checked) => updateUser(user.id, { is_active: checked })}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingUser === user.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={user.name}
                          onChange={(e) => setUsers(prev => prev.map(u => 
                            u.id === user.id ? { ...u, name: e.target.value } : u
                          ))}
                        />
                      </div>
                      <div>
                        <Label>Rol</Label>
                        <Select 
                          value={user.role} 
                          onValueChange={(value: any) => setUsers(prev => prev.map(u => 
                            u.id === user.id ? { ...u, role: value } : u
                          ))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="squad_lead">Squad Lead</SelectItem>
                            <SelectItem value="operations">Operaciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Código Empleado</Label>
                        <Input
                          value={user.employee_code || ''}
                          onChange={(e) => setUsers(prev => prev.map(u => 
                            u.id === user.id ? { ...u, employee_code: e.target.value } : u
                          ))}
                        />
                      </div>
                      <div>
                        <Label>Squad</Label>
                        <Input
                          value={user.squad_name || ''}
                          onChange={(e) => setUsers(prev => prev.map(u => 
                            u.id === user.id ? { ...u, squad_name: e.target.value } : u
                          ))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingUser(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => updateUser(user.id, user)}>
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {users.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No hay usuarios registrados. Haz clic en "Inicializar Usuarios" para crear los usuarios por defecto.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}