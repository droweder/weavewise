# Instruções de Deploy no Netlify

## Configuração das Variáveis de Ambiente

Para o aplicativo funcionar corretamente no Netlify, você precisa configurar as variáveis de ambiente do Supabase:

### Passo a Passo:

1. **Acesse o painel do Netlify**
   - Entre em https://app.netlify.com
   - Selecione o site `weavewise`

2. **Configure as Variáveis de Ambiente**
   - Vá para `Site configuration` > `Environment variables`
   - Clique em `Add a variable`
   - Adicione as seguintes variáveis:

   ```
   VITE_SUPABASE_URL = https://qppfutmnmufjynsmmdxb.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZ1dG1ubXVmanluc21tZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjA5NzgsImV4cCI6MjA3MDQzNjk3OH0.BKgm-ak2rlZKvOmiSXIq7058y9QrIy5VDjWwkzrAUdE
   ```

3. **Redeploy o Site**
   - Após adicionar as variáveis, vá para `Deploys`
   - Clique em `Trigger deploy` > `Deploy site`

## Importante

- As variáveis DEVEM começar com `VITE_` para o Vite reconhecê-las
- Após adicionar as variáveis, é necessário fazer um novo deploy
- O aplicativo já tem fallback para essas credenciais, mas é melhor configurá-las no Netlify

## Verificação

Após o deploy, acesse https://weavewise.netlify.app e você deve conseguir fazer login normalmente.

## Credenciais de Teste

Use suas credenciais existentes do Supabase para fazer login.