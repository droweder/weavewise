/*
  # Criação das tabelas para o Weavewise

  1. Novas Tabelas
    - `training_data`: Armazena dados de treinamento para o modelo ML
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `data` (jsonb, dados de treinamento)
      - `created_at` (timestamp)
    - `training_sessions`: Registra sessões de treinamento
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `examples_processed` (integer)
      - `error_message` (text)
      - `model_version` (text)
      - `created_at` (timestamp)
    - `optimization_logs`: Registra logs de otimização
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `timestamp` (timestamp)
      - `tolerance` (numeric)
      - `lines_processed` (integer)
      - `summary` (jsonb)
      - `created_at` (timestamp)
    - `model_weights`: Armazena pesos do modelo treinado
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `version` (text)
      - `weights` (jsonb)
      - `created_at` (timestamp)
      - `is_active` (boolean)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para usuários autenticados lerem/escreverem seus próprios dados
*/

-- Criar extensões necessárias (se ainda não existirem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de dados de treinamento
CREATE TABLE IF NOT EXISTS public.training_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de sessões de treinamento
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  examples_processed integer DEFAULT 0,
  error_message text,
  model_version text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de logs de otimização
CREATE TABLE IF NOT EXISTS public.optimization_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  tolerance numeric NOT NULL,
  lines_processed integer NOT NULL,
  summary jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de pesos do modelo
CREATE TABLE IF NOT EXISTS public.model_weights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL,
  weights jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT false
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_weights ENABLE ROW LEVEL SECURITY;

-- Criar políticas para training_data
CREATE POLICY "Users can insert their own training data" ON public.training_data
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own training data" ON public.training_data
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own training data" ON public.training_data
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training data" ON public.training_data
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Criar políticas para training_sessions
CREATE POLICY "Users can insert their own training sessions" ON public.training_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own training sessions" ON public.training_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own training sessions" ON public.training_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training sessions" ON public.training_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Criar políticas para optimization_logs
CREATE POLICY "Users can insert their own optimization logs" ON public.optimization_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own optimization logs" ON public.optimization_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization logs" ON public.optimization_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimization logs" ON public.optimization_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Criar políticas para model_weights
CREATE POLICY "Users can insert their own model weights" ON public.model_weights
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own model weights" ON public.model_weights
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own model weights" ON public.model_weights
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own model weights" ON public.model_weights
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Conceder permissões para a role authenticated
GRANT ALL ON TABLE public.training_data TO authenticated;
GRANT ALL ON TABLE public.training_sessions TO authenticated;
GRANT ALL ON TABLE public.optimization_logs TO authenticated;
GRANT ALL ON TABLE public.model_weights TO authenticated;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON public.training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_start_time ON public.training_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_user_id ON public.optimization_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_timestamp ON public.optimization_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_weights_user_id ON public.model_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_model_weights_is_active ON public.model_weights(is_active);
