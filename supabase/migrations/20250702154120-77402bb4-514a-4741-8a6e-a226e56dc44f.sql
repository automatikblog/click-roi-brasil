-- Fix immediate issues and implement N:N relationship

-- Add missing INSERT policy for usuarios table
CREATE POLICY "Users can insert their own data" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- First, drop the policies that depend on usuario_id column
DROP POLICY IF EXISTS "Users can view their own company" ON public.empresas;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.empresas; 
DROP POLICY IF EXISTS "Users can update their own company" ON public.empresas;

-- Create junction table for many-to-many relationship between users and companies
CREATE TABLE public.usuarios_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  permissions TEXT[] DEFAULT ARRAY['read', 'write', 'delete'],
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, empresa_id)
);

-- Add creator_id to track who created the company
ALTER TABLE public.empresas ADD COLUMN creator_id UUID REFERENCES public.usuarios(id);

-- Now remove usuario_id from empresas table
ALTER TABLE public.empresas DROP COLUMN usuario_id;

-- Enable RLS on the junction table
ALTER TABLE public.usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Create function to get user's companies
CREATE OR REPLACE FUNCTION public.get_user_empresas(user_id UUID)
RETURNS TABLE(empresa_id UUID) AS $$
  SELECT ue.empresa_id FROM public.usuarios_empresas ue 
  WHERE ue.usuario_id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user has access to company
CREATE OR REPLACE FUNCTION public.user_has_empresa_access(user_id UUID, empresa_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.usuarios_empresas ue 
    WHERE ue.usuario_id = user_id AND ue.empresa_id = empresa_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update existing get_user_empresa_id function to work with active company
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(user_id UUID)
RETURNS UUID AS $$
  SELECT ue.empresa_id FROM public.usuarios_empresas ue 
  WHERE ue.usuario_id = user_id AND ue.is_active = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for usuarios_empresas
CREATE POLICY "Users can view their company associations" ON public.usuarios_empresas
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their company associations" ON public.usuarios_empresas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their company associations" ON public.usuarios_empresas
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their company associations" ON public.usuarios_empresas
  FOR DELETE USING (auth.uid() = usuario_id);

-- Create new RLS policies for empresas using new structure
CREATE POLICY "Users can view companies they belong to" ON public.empresas
  FOR SELECT USING (
    id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY "Users can insert companies" ON public.empresas
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Company owners can update their companies" ON public.empresas
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM public.usuarios_empresas ue 
      WHERE ue.empresa_id = id AND ue.usuario_id = auth.uid() 
      AND (ue.role = 'owner' OR ue.role = 'admin')
    )
  );

CREATE POLICY "Company owners can delete their companies" ON public.empresas
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM public.usuarios_empresas ue 
      WHERE ue.empresa_id = id AND ue.usuario_id = auth.uid() 
      AND ue.role = 'owner'
    )
  );

-- Update RLS policies for other tables to use new structure
DROP POLICY IF EXISTS "Users can view their company sessions" ON public.sessoes;
DROP POLICY IF EXISTS "Users can view their company conversions" ON public.conversoes;
DROP POLICY IF EXISTS "Users can view their company campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can insert their company campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can update their company campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Users can delete their company campaigns" ON public.campanhas;

CREATE POLICY "Users can view sessions from their companies" ON public.sessoes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY "Users can view conversions from their companies" ON public.conversoes
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY "Users can view campaigns from their companies" ON public.campanhas
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY "Users can insert campaigns for their companies" ON public.campanhas
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT ue.empresa_id FROM public.usuarios_empresas ue 
      WHERE ue.usuario_id = auth.uid() 
      AND (ue.role = 'owner' OR ue.role = 'admin' OR ue.role = 'editor')
    )
  );

CREATE POLICY "Users can update campaigns from their companies" ON public.campanhas
  FOR UPDATE USING (
    empresa_id IN (
      SELECT ue.empresa_id FROM public.usuarios_empresas ue 
      WHERE ue.usuario_id = auth.uid() 
      AND (ue.role = 'owner' OR ue.role = 'admin' OR ue.role = 'editor')
    )
  );

CREATE POLICY "Users can delete campaigns from their companies" ON public.campanhas
  FOR DELETE USING (
    empresa_id IN (
      SELECT ue.empresa_id FROM public.usuarios_empresas ue 
      WHERE ue.usuario_id = auth.uid() 
      AND (ue.role = 'owner' OR ue.role = 'admin' OR ue.role = 'editor')
    )
  );

-- Add trigger for automatic timestamp updates on usuarios_empresas
CREATE TRIGGER update_usuarios_empresas_updated_at
  BEFORE UPDATE ON public.usuarios_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_usuarios_empresas_usuario_id ON public.usuarios_empresas(usuario_id);
CREATE INDEX idx_usuarios_empresas_empresa_id ON public.usuarios_empresas(empresa_id);
CREATE INDEX idx_usuarios_empresas_active ON public.usuarios_empresas(usuario_id, is_active);
CREATE INDEX idx_empresas_creator_id ON public.empresas(creator_id);