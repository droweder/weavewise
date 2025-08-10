/*
  # Criação das tabelas de autenticação

  1. Novas Tabelas
    - `auth.users`: Tabela de usuários do Supabase Auth
    - `auth.identities`: Tabela de identidades do Supabase Auth
    - `auth.sessions`: Tabela de sessões do Supabase Auth
    - `auth.refresh_tokens`: Tabela de refresh tokens do Supabase Auth

  2. Segurança
    - Configuração padrão do Supabase Auth
*/

-- Esta migração é apenas para documentação, pois as tabelas de autenticação são criadas automaticamente pelo Supabase
-- Incluímos aqui para referência completa do esquema

/*
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin bool,
  created_at timestamptz,
  updated_at timestamptz,
  phone text UNIQUE,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current text GENERATED ALWAYS AS (COALESCE(NULLIF(email_change_token_new, ''), NULLIF(confirmation_token, ''))) STORED,
  email_change_confirm_status smallint DEFAULT 0 CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2)
);

CREATE TABLE IF NOT EXISTS auth.identities (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  email text GENERATED ALWAYS AS (identity_data ->> 'email') STORED
);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  ip inet,
  user_agent text,
  payload json,
  last_sign_in_at timestamptz,
  expires_at timestamptz GENERATED ALWAYS AS (created_at + INTERVAL '7 days') STORED
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
);
*/
