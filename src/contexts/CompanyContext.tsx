import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './AuthContext'

interface Company {
  id: string
  nome: string
  creator_id: string
  created_at: string
}

interface UserCompany extends Company {
  role: string
  permissions: string[]
  is_active: boolean
}

interface CompanyContextType {
  companies: UserCompany[]
  activeCompany: UserCompany | null
  loading: boolean
  setActiveCompany: (companyId: string) => Promise<void>
  createCompany: (name: string) => Promise<void>
  updateCompany: (id: string, name: string) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  inviteUser: (companyId: string, email: string, role: string) => Promise<void>
  removeUser: (companyId: string, userId: string) => Promise<void>
  refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<UserCompany[]>([])
  const [activeCompany, setActiveCompanyState] = useState<UserCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCompanies = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('usuarios_empresas')
        .select(`
          empresa_id,
          role,
          permissions,
          is_active,
          empresas!inner (
            id,
            nome,
            creator_id,
            created_at
          )
        `)
        .eq('usuario_id', user.id)

      if (error) throw error

      const userCompanies: UserCompany[] = data?.map(item => ({
        id: item.empresas.id,
        nome: item.empresas.nome,
        creator_id: item.empresas.creator_id,
        created_at: item.empresas.created_at,
        role: item.role,
        permissions: item.permissions,
        is_active: item.is_active
      })) || []

      setCompanies(userCompanies)

      // Set active company
      const active = userCompanies.find(c => c.is_active)
      if (active) {
        setActiveCompanyState(active)
        localStorage.setItem('activeCompanyId', active.id)
      } else if (userCompanies.length > 0) {
        // If no active company, set the first one as active
        await setActiveCompany(userCompanies[0].id)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const setActiveCompany = async (companyId: string) => {
    if (!user) return

    try {
      // Clear all active flags
      await supabase
        .from('usuarios_empresas')
        .update({ is_active: false })
        .eq('usuario_id', user.id)

      // Set new active company
      await supabase
        .from('usuarios_empresas')
        .update({ is_active: true })
        .eq('usuario_id', user.id)
        .eq('empresa_id', companyId)

      // Update local state
      const updatedCompanies = companies.map(c => ({
        ...c,
        is_active: c.id === companyId
      }))
      setCompanies(updatedCompanies)

      const newActive = updatedCompanies.find(c => c.id === companyId)
      setActiveCompanyState(newActive || null)
      localStorage.setItem('activeCompanyId', companyId)
    } catch (error) {
      console.error('Error setting active company:', error)
    }
  }

  const createCompany = async (name: string) => {
    if (!user) {
      console.error('❌ CompanyContext: No user found when trying to create company')
      throw new Error('Usuário não autenticado')
    }

    console.log('🏢 CompanyContext: Creating company:', name, 'for user:', user.id, user.email)

    try {
      // Verify user exists in usuarios table first
      const { data: userExists, error: userCheckError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (userCheckError) {
        console.error('❌ CompanyContext: Error checking user existence:', userCheckError)
        throw new Error('Erro ao verificar usuário: ' + userCheckError.message)
      }

      if (!userExists) {
        console.error('❌ CompanyContext: User not found in usuarios table')
        // Try to create user record
        const { error: createUserError } = await supabase
          .from('usuarios')
          .insert({
            id: user.id,
            email: user.email!
          })

        if (createUserError) {
          console.error('❌ CompanyContext: Error creating user record:', createUserError)
          throw new Error('Erro ao criar registro de usuário: ' + createUserError.message)
        }
        console.log('✅ CompanyContext: User record created')
      }

      console.log('👤 CompanyContext: User verified, proceeding with company creation')

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('empresas')
        .insert({
          nome: name,
          creator_id: user.id
        })
        .select()
        .single()

      if (companyError) {
        console.error('❌ CompanyContext: Error creating company:', companyError)
        throw new Error('Erro ao criar empresa: ' + companyError.message)
      }

      console.log('✅ CompanyContext: Company created successfully:', company)

      // Add user to company as owner
      const { error: relationError } = await supabase
        .from('usuarios_empresas')
        .insert({
          usuario_id: user.id,
          empresa_id: company.id,
          role: 'owner',
          permissions: ['read', 'write', 'delete', 'admin'],
          is_active: companies.length === 0 // Set as active if it's the first company
        })

      if (relationError) {
        console.error('❌ CompanyContext: Error creating user-company association:', relationError)
        throw new Error('Erro ao associar usuário à empresa: ' + relationError.message)
      }

      console.log('✅ CompanyContext: User-company association created successfully')

      await fetchCompanies()
      console.log('✅ CompanyContext: Company creation process completed')
    } catch (error: any) {
      console.error('❌ CompanyContext: Unexpected error in createCompany:', error)
      throw error
    }
  }

  const updateCompany = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ nome: name })
        .eq('id', id)

      if (error) throw error

      // Update local state
      const updatedCompanies = companies.map(c => 
        c.id === id ? { ...c, nome: name } : c
      )
      setCompanies(updatedCompanies)

      if (activeCompany?.id === id) {
        setActiveCompanyState({ ...activeCompany, nome: name })
      }
    } catch (error) {
      console.error('Error updating company:', error)
      throw error
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      const updatedCompanies = companies.filter(c => c.id !== id)
      setCompanies(updatedCompanies)

      // If deleted company was active, set first available as active
      if (activeCompany?.id === id) {
        if (updatedCompanies.length > 0) {
          await setActiveCompany(updatedCompanies[0].id)
        } else {
          setActiveCompanyState(null)
          localStorage.removeItem('activeCompanyId')
        }
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      throw error
    }
  }

  const inviteUser = async (companyId: string, email: string, role: string) => {
    // This would typically send an email invitation
    // For now, we'll just add the user if they exist
    try {
      const { data: targetUser, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single()

      if (userError) throw new Error('Usuário não encontrado')

      const { error } = await supabase
        .from('usuarios_empresas')
        .insert({
          usuario_id: targetUser.id,
          empresa_id: companyId,
          role,
          permissions: role === 'owner' ? ['read', 'write', 'delete', 'admin'] : ['read']
        })

      if (error) throw error
    } catch (error) {
      console.error('Error inviting user:', error)
      throw error
    }
  }

  const removeUser = async (companyId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('usuarios_empresas')
        .delete()
        .eq('empresa_id', companyId)
        .eq('usuario_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing user:', error)
      throw error
    }
  }

  const refreshCompanies = async () => {
    await fetchCompanies()
  }

  useEffect(() => {
    if (user) {
      fetchCompanies()
    } else {
      setCompanies([])
      setActiveCompanyState(null)
      setLoading(false)
    }
  }, [user])

  const value = {
    companies,
    activeCompany,
    loading,
    setActiveCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    inviteUser,
    removeUser,
    refreshCompanies
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}