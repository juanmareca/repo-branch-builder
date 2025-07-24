import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, UserPlus, Users, Key, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/constants';
import * as ExcelJS from 'exceljs';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'squad_lead' | 'operations';
  employee_code?: string;
  squad_name?: string;
  is_active: boolean;
  password?: string; // Para mostrar el password cuando está visible
}

interface NewUser {
  name: string;
  password: string;
  role: 'admin' | 'squad_lead' | 'operations';
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    password: '',
    role: 'operations'
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
      
      // Crear perfil directamente en la tabla profiles
      const userId = crypto.randomUUID();
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: newUser.name,
          role: newUser.role,
          password: newUser.password, // Agregar el password
          is_active: true
        });

      if (profileError) throw profileError;

      toast({
        title: "✅ Usuario creado",
        description: `Usuario ${newUser.name} creado correctamente`,
      });

      // Resetear formulario
      setNewUser({
        name: '',
        password: '',
        role: 'operations'
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

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el usuario "${userName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "✅ Usuario eliminado",
        description: `El usuario ${userName} ha sido eliminado correctamente`,
      });

      // Recargar la lista de usuarios
      loadUsers();
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      toast({
        title: "❌ Error al eliminar usuario",
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

  const uploadUsersFromExcel = async (file: File) => {
    try {
      setLoading(true);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.getWorksheet(1);
      const users: Array<{name: string, password: string, role: string}> = [];
      
      // Leer desde la fila 2 (asumiendo que la fila 1 tiene headers)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const name = row.getCell(1).value?.toString() || '';
          const password = row.getCell(2).value?.toString() || '';
          const role = row.getCell(3).value?.toString() || 'operations';
          
          if (name && password) {
            users.push({ name, password, role });
          }
        }
      });

      if (users.length === 0) {
        toast({
          title: "❌ Error",
          description: "No se encontraron usuarios válidos en el archivo",
          variant: "destructive"
        });
        return;
      }

      // Preguntar al usuario si quiere sustituir o añadir
      const shouldReplace = confirm(
        `Se encontraron ${users.length} usuarios en el archivo.\n\n` +
        "¿Quieres SUSTITUIR todos los usuarios existentes con estos nuevos?\n\n" +
        "• Sí = Eliminar todos los usuarios actuales y crear solo estos nuevos\n" +
        "• No = Añadir estos usuarios a los que ya existen"
      );

      if (shouldReplace) {
        // Eliminar todos los usuarios existentes
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos excepto un ID ficticio

        if (deleteError) {
          console.error('Error eliminando usuarios existentes:', deleteError);
          toast({
            title: "❌ Error",
            description: "Error al eliminar usuarios existentes",
            variant: "destructive"
          });
          return;
        }
      }

      let createdCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          // Verificar si ya existe (solo si no estamos reemplazando)
          if (!shouldReplace) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('name', user.name)
              .maybeSingle();

            if (existingUser) {
              console.log(`Usuario ${user.name} ya existe, saltando...`);
              continue;
            }
          }

          // Crear perfil directamente en la tabla profiles
          const userId = crypto.randomUUID();
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name: user.name,
              password: user.password, // Incluir el password del Excel
              role: user.role as any,
              is_active: true
            });

          if (profileError) {
            throw profileError;
          }

          createdCount++;
          
          // Reducir la carga del sistema con pausa más larga cada 10 usuarios
          if (createdCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (error) {
          errorCount++;
          console.error(`Error creando usuario ${user.name}:`, error);
        }
      }

      const successMessage = shouldReplace 
        ? `✅ Usuarios reemplazados correctamente. Creados: ${createdCount}${errorCount > 0 ? `, Errores: ${errorCount}` : ''}`
        : `✅ Usuarios añadidos correctamente. Creados: ${createdCount}${errorCount > 0 ? `, Errores: ${errorCount}` : ''}`;

      toast({
        title: "Carga completada",
        description: successMessage,
      });

      // Recargar usuarios sin causar problemas de sesión
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "❌ Error al procesar archivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAllUsers = async () => {
    const confirmed = confirm(
      "⚠️ ATENCIÓN: Esta acción eliminará TODOS los usuarios del sistema.\n\n" +
      "¿Estás completamente seguro de que quieres eliminar todos los usuarios?\n\n" +
      "Esta acción NO se puede deshacer."
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "🚨 ÚLTIMA CONFIRMACIÓN\n\n" +
      "Esto eliminará PERMANENTEMENTE todos los usuarios.\n\n" +
      "¿Confirmas que quieres proceder?"
    );

    if (!doubleConfirm) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Usuarios eliminados",
        description: "Todos los usuarios han sido eliminados del sistema",
      });

      await loadUsers();
    } catch (error: any) {
      console.error('Error eliminando todos los usuarios:', error);
      toast({
        title: "❌ Error",
        description: `Error al eliminar usuarios: ${error.message}`,
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
          <Button onClick={() => setShowNewUserForm(true)} disabled={loading} className="bg-white text-black border hover:bg-gray-50">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
          <Button 
            onClick={deleteAllUsers}
            disabled={loading}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Todos
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newName">Nombre</Label>
                <Input
                  id="newName"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords['new'] ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contraseña"
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
                <Label htmlFor="newRole">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="squad_lead">Squad Lead</SelectItem>
                    <SelectItem value="operations">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewUserForm(false)}>
                Cancelar
              </Button>
              <Button onClick={createUser} disabled={loading || !newUser.name || !newUser.password}>
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
          {users.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay usuarios registrados en el sistema.
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-4 gap-4 p-3 border rounded-lg items-center">
                  {/* Columna Nombre */}
                  <div className="border p-2 rounded bg-background">
                    <p style={{ fontFamily: 'Arial', fontSize: '12px', fontWeight: 'normal' }}>
                      {user.name}
                    </p>
                  </div>
                  
                  {/* Columna Password */}
                  <div className="border p-2 rounded bg-background flex items-center justify-between">
                    <p style={{ fontFamily: 'Arial', fontSize: '12px', fontWeight: 'normal' }}>
                      {showPasswords[user.id] ? (user.password || 'Sin password') : '••••••••'}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={() => togglePasswordVisibility(user.id)}
                    >
                      {showPasswords[user.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Columna Rol */}
                  <div className="border p-2 rounded bg-background">
                    <p style={{ fontFamily: 'Arial', fontSize: '12px', fontWeight: 'normal' }}>
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'squad_lead' ? 'Squad Lead' : 'Operaciones'}
                    </p>
                  </div>
                  
                  {/* Columna Acciones */}
                  <div className="flex items-center gap-2 justify-end">
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteUser(user.id, user.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Panel de edición */}
                  {editingUser === user.id && (
                    <div className="col-span-4 mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-3 gap-4">
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
                          <Label>Password</Label>
                          <Input
                            type="password"
                            placeholder="Dejar vacío para mantener actual"
                            onChange={(e) => setUsers(prev => prev.map(u => 
                              u.id === user.id ? { ...u, newPassword: e.target.value } : u
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
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="squad_lead">Squad Lead</SelectItem>
                              <SelectItem value="operations">Operaciones</SelectItem>
                            </SelectContent>
                          </Select>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}