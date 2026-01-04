# 🏨 Sistema de Gestão de Quartos e Reservas

Sistema completo de gestão de alojamento tipo "mini-Booking" com frontend público para clientes e backoffice para gestão interna.

## 📋 Funcionalidades

### 👥 Frontend Público (Clientes)
- ✅ **Homepage** com sistema de pesquisa (datas, hóspedes, filtros)
- ✅ **Listagem de quartos** com fotos, amenities, capacidade e preços
- ✅ **Página de detalhes** com galeria de imagens e calendário de disponibilidade
- ✅ **Sistema de checkout** completo com cálculo automático de taxas
- ✅ **Área do cliente** ("Minhas Reservas") para acompanhamento
- ✅ **Autenticação** segura (login/registro)
- ✅ **Confirmação de reserva** com todos os detalhes

### 🔐 Backoffice / Admin
- ✅ **Dashboard** com KPIs e estatísticas em tempo real
- ✅ **Gestão de Reservas** (criar, editar, confirmar, cancelar)
- ✅ **Gestão de Quartos** (CRUD completo)
- ✅ **Gestão de Despesas** com categorias e relatórios
- ✅ **Sistema de permissões** por role (admin/staff/guest)
- ✅ **Interface responsiva** com tema dark/light

## 🚀 Acesso ao Sistema

### 📍 URLs Principais

- **Homepage**: `/` - Página principal com pesquisa
- **Quartos**: `/rooms` - Listagem de quartos disponíveis
- **Login**: `/login` - Autenticação de usuários
- **Admin**: `/admin` - Painel de administração (requer login admin)
- **Teste Supabase**: `/test-supabase` - Página de diagnóstico de conexão

### 🔑 Como Aceder ao Backoffice

#### **IMPORTANTE: Teste a Conexão Primeiro**

Antes de tentar fazer login, aceda a `/test-supabase` para verificar se o Supabase está configurado corretamente. Esta página irá:
- ✅ Verificar se o cliente Supabase está inicializado
- ✅ Testar a conexão com o Auth
- ✅ Testar o acesso à base de dados
- ✅ Mostrar erros específicos se houver problemas

Se todos os testes passarem, pode proceder com o registo/login.

#### **Opção 1: Criar Nova Conta Admin**

1. **Registe-se na aplicação**:
   - Aceda a `/login`
   - Clique em "Registo"
   - Preencha: Nome, Email, Password
   - Clique em "Criar Conta"
   - **IMPORTANTE**: Abra o console do navegador (F12) e verifique os logs para ver se há erros

2. **Promova o utilizador a Admin**:
   - Abra o Supabase Dashboard
   - Vá a "SQL Editor"
   - Execute o seguinte comando substituindo `SEU_EMAIL@exemplo.com`:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'SEU_EMAIL@exemplo.com';
```

3. **Faça login novamente**:
   - Volte a `/login`
   - Entre com as suas credenciais
   - **IMPORTANTE**: Verifique o console do navegador para ver os logs de debug
   - Será redirecionado automaticamente para `/admin`

#### **Opção 2: Criar Utilizador Admin via SQL**

Se o registo não estiver a funcionar, crie o utilizador diretamente:

```sql
-- Passo 1: Insira o utilizador na tabela auth.users (Supabase Auth)
-- NOTA: Isto requer acesso ao Supabase Dashboard > Authentication > Users
-- Clique em "Add user" e crie manualmente com:
-- Email: admin@arroios.pt
-- Password: Admin123!
-- Confirme o email automaticamente

-- Passo 2: Depois de criar o utilizador no Auth, execute este SQL
-- Substitua 'UUID_DO_AUTH_USER' pelo ID que aparece em Authentication > Users
INSERT INTO users (id, email, full_name, role)
VALUES (
  'UUID_DO_AUTH_USER', -- Copie o UUID da tabela auth.users
  'admin@arroios.pt',
  'Administrador',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

### 🔍 Troubleshooting - Login não Funciona

Se o botão de login não responde ou não acontece nada:

1. **Verifique o Console do Navegador (F12)**:
   - Abra o console antes de clicar em "Entrar"
   - Procure por logs que começam com 🔵, 🟢 ou 🔴
   - Os logs mostrarão exatamente onde o processo está a falhar

2. **Teste a Conexão Supabase**:
   - Aceda a `/test-supabase`
   - Verifique se todos os testes passam (ícone verde ✓)
   - Se houver erros (ícone vermelho ✗), corrija-os primeiro

3. **Verifique as Variáveis de Ambiente**:
   - Abra `.env.local`
   - Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidos
   - Se alterou as variáveis, reinicie o servidor: `npm run dev`

4. **Verifique se o Email Existe na Base de Dados**:
```sql
-- Execute no Supabase SQL Editor
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'seu@email.com';
```

5. **Logs de Debug Comuns**:
   - `🔵 Login form submitted` - Formulário foi submetido
   - `🔵 Calling authService.signIn...` - A chamar serviço de autenticação
   - `🔵 Supabase signIn result:` - Resposta do Supabase
   - `🟢 Sign in successful!` - Login bem-sucedido
   - `🔴 Supabase auth error:` - Erro de autenticação (email/password incorretos)
   - `🔴 Error fetching user data:` - Utilizador existe no Auth mas não na tabela users

### 👤 Tipos de Utilizadores

| Role | Descrição | Acesso |
|------|-----------|--------|
| **guest** | Cliente normal | Frontend público, Minhas Reservas |
| **staff** | Funcionário | Admin Dashboard (acesso limitado) |
| **admin** | Administrador | Acesso total ao sistema |

## 🗄️ Estrutura da Base de Dados

### Tabelas Principais

```
users                 - Utilizadores e autenticação
properties            - Propriedades/Alojamentos
rooms                 - Quartos/Unidades
bookings              - Reservas
guests                - Dados dos hóspedes
payments              - Pagamentos e transações
expenses              - Despesas operacionais
expense_categories    - Categorias de despesas
availability_blocks   - Bloqueios de disponibilidade
dynamic_pricing       - Preços dinâmicos por dia
addons                - Extras/Serviços adicionais
booking_addons        - Extras associados a reservas
special_requests      - Pedidos especiais dos clientes
messages              - Sistema de mensagens
notifications         - Notificações do sistema
```

### 🔒 Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** ativado:
- Clientes só veem as suas próprias reservas
- Staff/Admin têm acesso completo
- Políticas configuradas para CRUD (Create, Read, Update, Delete)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** (Pages Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS v3**
- **Shadcn/UI** (componentes)
- **Lucide React** (ícones)
- **React Hook Form** (formulários)
- **Date-fns** (datas)

### Backend
- **Supabase** (PostgreSQL + API REST automática)
- **Supabase Auth** (autenticação)
- **Row Level Security** (segurança)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Conta Supabase (já configurada)

### Passos

1. **Clone e instale dependências**:
```bash
npm install
```

2. **Configure variáveis de ambiente**:
O ficheiro `.env.local` já está configurado com:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

3. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

4. **Aceda à aplicação**:
```
http://localhost:3000
```

5. **IMPORTANTE: Teste a conexão**:
```
http://localhost:3000/test-supabase
```

## 📊 Dados de Exemplo (Seed Data)

A base de dados já contém:
- ✅ 1 Propriedade ("Alojamento Arroios")
- ✅ 3 Quartos (Duplo Standard, Suite Deluxe, Studio)
- ✅ Categorias de despesas configuradas

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor dev
npm run build        # Build produção
npm run start        # Servidor produção
npm run lint         # Verificar código
```

### Supabase (via SQL Editor)

**Ver todas as reservas**:
```sql
SELECT b.*, r.name as room_name, g.full_name as guest_name
FROM bookings b
JOIN rooms r ON b.room_id = r.id
JOIN guests g ON b.guest_id = g.id
ORDER BY b.created_at DESC;
```

**Ver ocupação por mês**:
```sql
SELECT 
  DATE_TRUNC('month', check_in_date) as month,
  COUNT(*) as total_bookings,
  SUM(total_amount) as revenue
FROM bookings
WHERE status = 'confirmed'
GROUP BY month
ORDER BY month DESC;
```

**Listar utilizadores admin**:
```sql
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'admin';
```

**Debug: Ver se utilizador foi criado no registo**:
```sql
-- Ver utilizadores na tabela users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- Ver utilizadores no Auth (requer acesso ao Dashboard)
-- Vá a Authentication > Users no Supabase Dashboard
```

## 🎨 Personalização

### Cores do Tema
Edite `src/styles/globals.css`:
```css
:root {
  --brand-primary: #8B5CF6;    /* Cor principal */
  --brand-secondary: #EC4899;  /* Cor secundária */
}
```

### Dados da Propriedade
Edite na tabela `properties` via Supabase Dashboard.

## 🚧 Próximas Funcionalidades (Roadmap)

- [ ] Integração Stripe para pagamentos reais
- [ ] Sistema de mensagens em tempo real
- [ ] Upload de imagens para quartos
- [ ] Calendário com drag & drop para bloqueios
- [ ] Relatórios financeiros avançados (PDF/CSV)
- [ ] Sistema de preços dinâmicos
- [ ] Notificações por email
- [ ] Multi-idioma (i18n)
- [ ] Integração WhatsApp
- [ ] Sistema de cupões/descontos
- [ ] Dashboard de analytics

## 📝 Estrutura de Pastas

```
src/
├── components/
│   ├── Admin/           # Componentes admin
│   ├── Layout/          # Header, Footer, MainLayout
│   ├── ui/              # Shadcn components
│   ├── SEO.tsx
│   └── ThemeSwitch.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── BookingContext.tsx
├── hooks/
│   └── use-toast.ts
├── integrations/
│   └── supabase/        # Cliente e tipos Supabase
├── lib/
│   ├── utils.ts
│   └── mockData.ts      # Dados exemplo
├── pages/
│   ├── admin/           # Páginas admin
│   ├── rooms/           # Listagem e detalhes
│   ├── index.tsx        # Homepage
│   ├── checkout.tsx
│   ├── login.tsx
│   ├── test-supabase.tsx # Diagnóstico
│   └── my-bookings.tsx
├── services/            # API services
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── roomService.ts
│   ├── guestService.ts
│   └── expenseService.ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts         # Tipos TypeScript
```

## 🆘 Troubleshooting

### Problema: Login não funciona
**Solução**: 
1. Aceda a `/test-supabase` para verificar a conexão
2. Abra o console do navegador (F12) e procure por erros
3. Verifique se o utilizador existe na tabela `users`
4. Confirme se o Supabase Auth está ativo
5. Verifique as políticas RLS

### Problema: Registo não cria utilizador
**Solução**:
1. Verifique os logs no console (F12)
2. Procure por mensagens que começam com 🔴
3. Verifique se o email já existe: `SELECT * FROM users WHERE email = 'seu@email.com';`
4. Tente criar o utilizador manualmente via Supabase Dashboard

### Problema: Erro "payment_status does not exist"
**Solução**: 
```sql
-- As colunas já foram adicionadas, mas se precisar:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
```

### Problema: Quartos não aparecem
**Solução**:
```sql
-- Verificar se existem quartos ativos
SELECT * FROM rooms WHERE is_available = true;
```

### Problema: "Invalid API key" ou "Failed to fetch"
**Solução**:
1. Verifique `.env.local` - as variáveis estão corretas?
2. Reinicie o servidor: `Ctrl+C` e depois `npm run dev`
3. Verifique no Supabase Dashboard > Settings > API se as keys estão corretas

## 📞 Suporte

Para questões técnicas:
1. Verifique os logs do browser (F12 > Console)
2. Aceda a `/test-supabase` para diagnóstico
3. Verifique os logs do Supabase Dashboard
4. Consulte a documentação Supabase: https://supabase.com/docs

## 📄 Licença

Este projeto é proprietário e confidencial.

---

**Desenvolvido com ❤️ para Alojamento Arroios**