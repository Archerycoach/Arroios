import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userService } from "@/services/userService";
import { Users, Search, Shield, UserCog, User, Loader2, Mail, Phone, Calendar, Plus, Edit, Eye, EyeOff, Trash2, Key } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

export default function UtilizadoresPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [stats, setStats] = useState({ total: 0, admins: 0, staff: 0, guests: 0 });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "guest" as UserRole,
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    role: "guest" as UserRole,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      alert("Por favor preencha todos os campos obrigatórios");
      return;
    }

    // Prevent double submissions
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("A criar utilizador...");
      
      await userService.createUser(createForm);
      
      setSubmitMessage("Utilizador criado! A atualizar lista...");
      await loadUsers();
      await loadStats();
      
      setCreateDialogOpen(false);
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "guest",
      });
      setSubmitMessage("");
      alert("Utilizador criado com sucesso!");
    } catch (error: any) {
      console.error("Error creating user:", error);
      setSubmitMessage("");
      
      // Special handling for rate limit errors
      if (error.message?.includes("Limite de requisições") || error.message?.includes("Demasiadas tentativas")) {
        alert("⚠️ " + error.message + "\n\nSugestão: Aguarde 60 segundos antes de criar outro utilizador.");
      } else {
        alert(error.message || "Erro ao criar utilizador");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!editForm.full_name) {
      alert("Por favor preencha o nome completo");
      return;
    }

    try {
      setSubmitting(true);
      await userService.updateUser(selectedUser.id, editForm);
      await loadUsers();
      await loadStats();
      setEditDialogOpen(false);
      alert("Utilizador atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Erro ao atualizar utilizador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await userService.deleteUser(selectedUser.id);
      await loadUsers();
      await loadStats();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      alert("Utilizador eliminado com sucesso!");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.message || "Erro ao eliminar utilizador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowNewPassword(false);
    setPasswordDialogOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return;

    if (!newPassword || newPassword.length < 6) {
      alert("A password deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setSubmitting(true);
      await userService.updateUserPassword(selectedUser.id, newPassword);
      setPasswordDialogOpen(false);
      setNewPassword("");
      alert("Password atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error updating password:", error);
      alert(error.message || "Erro ao atualizar password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, { variant: "default" | "secondary" | "destructive" | "outline", icon: JSX.Element }> = {
      admin: { variant: "destructive", icon: <Shield className="w-3 h-3 mr-1" /> },
      staff: { variant: "default", icon: <UserCog className="w-3 h-3 mr-1" /> },
      guest: { variant: "secondary", icon: <User className="w-3 h-3 mr-1" /> },
    };

    const { variant, icon } = variants[role];

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {role === "admin" ? "Administrador" : role === "staff" ? "Staff" : "Hóspede"}
      </Badge>
    );
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      <ProtectedAdminPage>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
              <p className="text-muted-foreground">
                Gerir utilizadores e permissões da aplicação
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Utilizador
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Utilizadores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Total de contas registadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admins}</div>
                <p className="text-xs text-muted-foreground">
                  Acesso total ao sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <UserCog className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.staff}</div>
                <p className="text-xs text-muted-foreground">
                  Colaboradores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hóspedes</CardTitle>
                <User className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.guests}</div>
                <p className="text-xs text-muted-foreground">
                  Clientes registados
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Lista de Utilizadores</CardTitle>
                  <CardDescription>
                    Gerir permissões e visualizar informações dos utilizadores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Pesquisar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="guest">Hóspedes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum utilizador encontrado</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilizador</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Data de Registo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.full_name || "Sem nome"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(user.created_at), "dd/MM/yyyy", { locale: pt })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPasswordDialog(user)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Utilizador</DialogTitle>
                <DialogDescription>
                  Adicionar um novo utilizador ao sistema
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    placeholder="Nome do utilizador"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    type="tel"
                    placeholder="+351 900 000 000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Hóspede</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          <span>Staff</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {createForm.role === "admin" && "Acesso total ao painel administrativo"}
                    {createForm.role === "staff" && "Acesso limitado ao painel administrativo"}
                    {createForm.role === "guest" && "Acesso apenas ao frontend da aplicação"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {submitMessage || "A criar..."}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Utilizador
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Utilizador</DialogTitle>
                <DialogDescription>
                  Alterar as informações do utilizador {selectedUser?.full_name || selectedUser?.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    placeholder="Nome do utilizador"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedUser?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    type="tel"
                    placeholder="+351 900 000 000"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Hóspede</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          <span>Staff</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {editForm.role === "admin" && "Acesso total ao painel administrativo"}
                    {editForm.role === "staff" && "Acesso limitado ao painel administrativo"}
                    {editForm.role === "guest" && "Acesso apenas ao frontend da aplicação"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateUser} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    "Guardar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Alterar Password</DialogTitle>
                <DialogDescription>
                  Definir nova password para {selectedUser?.full_name || selectedUser?.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nova Password *</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A password será atualizada imediatamente
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePassword} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A atualizar...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Alterar Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Eliminar Utilizador</DialogTitle>
                <DialogDescription>
                  Tem a certeza que deseja eliminar {selectedUser?.full_name || selectedUser?.email}?
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Esta ação não pode ser revertida!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        O utilizador será permanentemente removido do sistema.
                        Todas as reservas e dados associados permanecerão no sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteUser} 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A eliminar...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Utilizador
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedAdminPage>
    </AdminLayout>
  );
}