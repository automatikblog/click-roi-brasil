import { useState } from "react"
import { Building2, Users, Settings, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCompany } from "@/contexts/CompanyContext"
import { CreateCompanyDialog } from "./CreateCompanyDialog"
import { EditCompanyDialog } from "./EditCompanyDialog"
import { ManageUsersDialog } from "./ManageUsersDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

export const CompanyManagement = () => {
  const { companies, activeCompany, deleteCompany, setActiveCompany } = useCompany()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [usersDialogOpen, setUsersDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const { toast } = useToast()

  const handleDelete = async (companyId: string) => {
    try {
      await deleteCompany(companyId)
      toast({
        title: "Empresa excluída",
        description: "A empresa foi excluída com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a empresa.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setEditDialogOpen(true)
  }

  const handleManageUsers = (company: any) => {
    setSelectedCompany(company)
    setUsersDialogOpen(true)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie suas empresas e convide membros para colaborar
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Building2 className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid gap-4">
        {companies.map((company) => (
          <Card key={company.id} className={company.is_active ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {company.nome}
                      {company.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Ativa
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant={getRoleBadgeVariant(company.role)}>
                        {getRoleLabel(company.role)}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!company.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveCompany(company.id)}
                    >
                      Ativar
                    </Button>
                  )}
                  {(company.role === 'owner' || company.role === 'admin') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageUsers(company)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {company.role === 'owner' && companies.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todos os dados da empresa serão permanentemente excluídos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(company.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Criada em {new Date(company.created_at).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateCompanyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {selectedCompany && (
        <>
          <EditCompanyDialog
            company={selectedCompany}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <ManageUsersDialog
            company={selectedCompany}
            open={usersDialogOpen}
            onOpenChange={setUsersDialogOpen}
          />
        </>
      )}
    </div>
  )
}