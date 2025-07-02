import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, UserPlus } from "lucide-react"
import { useCompany } from "@/contexts/CompanyContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ManageUsersDialogProps {
  company: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CompanyUser {
  id: string
  email: string
  role: string
  permissions: string[]
  created_at: string
}

export const ManageUsersDialog = ({ company, open, onOpenChange }: ManageUsersDialogProps) => {
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const { inviteUser, removeUser } = useCompany()
  const { toast } = useToast()

  const fetchUsers = async () => {
    if (!company) return

    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('usuarios_empresas')
        .select(`
          role,
          permissions,
          created_at,
          usuarios!inner (
            id,
            email
          )
        `)
        .eq('empresa_id', company.id)

      if (error) throw error

      const companyUsers: CompanyUser[] = data?.map(item => ({
        id: item.usuarios.id,
        email: item.usuarios.email,
        role: item.role,
        permissions: item.permissions,
        created_at: item.created_at
      })) || []

      setUsers(companyUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (open && company) {
      fetchUsers()
    }
  }, [open, company])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      await inviteUser(company.id, inviteEmail.trim(), inviteRole)
      toast({
        title: "Usuário convidado",
        description: "O usuário foi adicionado à empresa com sucesso.",
      })
      setInviteEmail("")
      setInviteRole("viewer")
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível convidar o usuário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(company.id, userId)
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido da empresa.",
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'editor':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário'
      case 'admin':
        return 'Administrador'
      case 'editor':
        return 'Editor'
      case 'viewer':
        return 'Visualizador'
      default:
        return role
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar usuários - {company?.nome}</DialogTitle>
          <DialogDescription>
            Convide usuários e gerencie permissões da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Convidar usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Cargo</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Convidando..." : "Convidar usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membros da empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-muted-foreground">Carregando usuários...</p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Adicionado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}