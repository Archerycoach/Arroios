# Security Policy

## 🔒 Políticas de Segurança da Aplicação

### Variáveis de Ambiente
- **NUNCA** commit ficheiros `.env.local` ou `.env` para o repositório
- Todas as chaves sensíveis devem estar em variáveis de ambiente
- Use `.env.example` como template (sem valores reais)

### Autenticação e Autorização
- Todas as passwords são hasheadas pelo Supabase Auth
- Tokens de sessão expiram automaticamente
- Rate limiting aplicado pelo Supabase
- Role-based access control (RBAC) implementado:
  - `guest`: Acesso apenas ao frontend público
  - `staff`: Acesso a operações diárias
  - `admin`: Acesso total

### Proteção de Dados
- Queries parametrizadas (prevenção de SQL injection)
- Validação de input em todos os formulários
- Sanitização de mensagens de erro (não expõe detalhes internos)
- UUID validation para IDs de utilizadores
- Email validation com regex

### Row Level Security (RLS)
- Todas as tabelas têm RLS ativado
- Utilizadores só acedem aos seus próprios dados
- Policies específicas para cada role

### Headers de Segurança
- CORS configurado adequadamente
- Content Security Policy (CSP) implementado via Next.js
- X-Frame-Options para prevenir clickjacking

### Logs e Monitorização
- Logs detalhados apenas em desenvolvimento
- Produção: logs sanitizados sem informações sensíveis
- Não logamos passwords, tokens ou dados pessoais

### Boas Práticas
1. Manter dependências atualizadas (`npm audit`)
2. Usar HTTPS em produção (obrigatório)
3. Validar todos os inputs do utilizador
4. Não expor stack traces em produção
5. Rate limiting nas operações críticas

## Reportar Vulnerabilidades

Se descobrir uma vulnerabilidade de segurança, por favor:
1. **NÃO** abra uma issue pública
2. Envie email para: security@gestaoarroios.com
3. Inclua detalhes da vulnerabilidade
4. Aguarde resposta em 48h

## Atualizações de Segurança

- Última revisão: 2026-01-04
- Próxima revisão agendada: 2026-02-04