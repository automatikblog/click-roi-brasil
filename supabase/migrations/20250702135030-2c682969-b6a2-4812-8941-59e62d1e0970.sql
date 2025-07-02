-- Create usuarios table
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create empresas table
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessoes table
CREATE TABLE public.sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  gclid TEXT,
  fbclid TEXT,
  ip TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE
);

-- Create conversoes table
CREATE TABLE public.conversoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id TEXT REFERENCES public.sessoes(session_id),
  valor DECIMAL(10,2) NOT NULL,
  produto TEXT NOT NULL,
  webhook_source TEXT NOT NULL,
  data_conversao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE
);

-- Create campanhas table
CREATE TABLE public.campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  canal TEXT NOT NULL,
  investimento DECIMAL(10,2) NOT NULL,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

-- Create function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(user_id UUID)
RETURNS UUID AS $$
  SELECT e.id FROM public.empresas e 
  INNER JOIN public.usuarios u ON u.id = e.usuario_id 
  WHERE u.id = user_id
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for usuarios
CREATE POLICY "Users can view their own data" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for empresas
CREATE POLICY "Users can view their own company" ON public.empresas
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own company" ON public.empresas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own company" ON public.empresas
  FOR UPDATE USING (auth.uid() = usuario_id);

-- RLS Policies for sessoes
CREATE POLICY "Users can view their company sessions" ON public.sessoes
  FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Public can insert sessions" ON public.sessoes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for conversoes
CREATE POLICY "Users can view their company conversions" ON public.conversoes
  FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Public can insert conversions" ON public.conversoes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for campanhas
CREATE POLICY "Users can view their company campaigns" ON public.campanhas
  FOR SELECT USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert their company campaigns" ON public.campanhas
  FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update their company campaigns" ON public.campanhas
  FOR UPDATE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete their company campaigns" ON public.campanhas
  FOR DELETE USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sessoes_empresa_id ON public.sessoes(empresa_id);
CREATE INDEX idx_sessoes_session_id ON public.sessoes(session_id);
CREATE INDEX idx_sessoes_created_at ON public.sessoes(created_at);
CREATE INDEX idx_conversoes_empresa_id ON public.conversoes(empresa_id);
CREATE INDEX idx_conversoes_sessao_id ON public.conversoes(sessao_id);
CREATE INDEX idx_conversoes_data_conversao ON public.conversoes(data_conversao);
CREATE INDEX idx_campanhas_empresa_id ON public.campanhas(empresa_id);
CREATE INDEX idx_campanhas_periodo ON public.campanhas(periodo);