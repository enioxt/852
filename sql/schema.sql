-- Tabela para armazenar os chats de forma anônima
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_id TEXT NOT NULL, -- Para ligar os relatos de um mesmo usuario anônimo numa sessao
  device_type TEXT,
  total_messages INTEGER DEFAULT 0
);

-- Tabela para armazenar as mensagens do chat
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  -- Campos de IA (extraidos)
  is_processed BOOLEAN DEFAULT false,
  extracted_category TEXT,
  extracted_priority TEXT
);

-- Tabela de Insights (Dashboard) alimentada pelos Agentes após processar as mensagens
CREATE TABLE public.insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  region TEXT,
  snippet TEXT NOT NULL,
  action_suggested TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Politicas para inserção anônima (Apenas inserção, leitura via painel autenticado futuramente)
CREATE POLICY "Permitir inserção anônima em chats" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção anônima em mensagens" ON public.messages FOR INSERT WITH CHECK (true);

-- Futuro: Politicas de leitura apenas para o Sindicato (admin)
-- CREATE POLICY "Permitir leitura apenas para admin" ON public.chats FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));
