import { Building2, Check, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCompany } from "@/contexts/CompanyContext"
import { useState } from "react"
import { CreateCompanyDialog } from "./CreateCompanyDialog"

export const CompanySelector = () => {
  const { companies, activeCompany, setActiveCompany, loading } = useCompany()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 text-foreground hover:text-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              {activeCompany?.nome || "Selecionar empresa"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Suas empresas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => setActiveCompany(company.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span>{company.nome}</span>
                <span className="text-xs text-muted-foreground">{company.role}</span>
              </div>
              {company.is_active && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova empresa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCompanyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  )
}