import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Create user and company records if new user
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(async () => {
          try {
            console.log('🔐 AuthContext: Creating user record for:', session.user.id, session.user.email)
            
            // Insert user record
            const { error: userError } = await supabase.from('usuarios').upsert({
              id: session.user.id,
              email: session.user.email!
            })
            
            if (userError) {
              console.error('❌ AuthContext: Error creating user record:', userError)
              return
            }
            console.log('✅ AuthContext: User record created successfully')
            
            // Check if user has any company associations, if not create a default company
            const { data: existingAssociation, error: associationError } = await supabase
              .from('usuarios_empresas')
              .select('id')
              .eq('usuario_id', session.user.id)
              .maybeSingle()
            
            if (associationError) {
              console.error('❌ AuthContext: Error checking associations:', associationError)
              return
            }
            
            if (!existingAssociation) {
              console.log('🏢 AuthContext: No existing company, creating default...')
              
              // Create a default company
              const { data: newCompany, error: companyError } = await supabase
                .from('empresas')
                .insert({
                  nome: `Empresa de ${session.user.email?.split('@')[0]}`,
                  creator_id: session.user.id
                })
                .select()
                .single()

              if (companyError) {
                console.error('❌ AuthContext: Error creating company:', companyError)
                return
              }
              
              console.log('✅ AuthContext: Company created:', newCompany)

              if (newCompany) {
                // Associate user with the new company
                const { error: relationError } = await supabase.from('usuarios_empresas').insert({
                  usuario_id: session.user.id,
                  empresa_id: newCompany.id,
                  role: 'owner',
                  permissions: ['read', 'write', 'delete', 'admin'],
                  is_active: true
                })
                
                if (relationError) {
                  console.error('❌ AuthContext: Error creating association:', relationError)
                } else {
                  console.log('✅ AuthContext: User-company association created')
                }
              }
            } else {
              console.log('👍 AuthContext: User already has company associations')
            }
          } catch (error) {
            console.error('❌ AuthContext: Unexpected error in user/company setup:', error)
          }
        }, 0)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}