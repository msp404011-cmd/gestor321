# Especificação de Segurança e Regras do Firestore (RBAC & Hardening)

## 1. Visão Geral e Arquitetura de Permissões
O sistema Gestor opera com separação estrita de privilégios entre:
- **Usuários Comuns / Clientes (Tenants)**: Operam exclusivamente com SDK Client do Firebase, acessando apenas seu próprio perfil e seus próprios sub-recursos (pedidos, despesas, contas a receber).
- **Administrador Master**: Todas as ações administrativas sensíveis (criar conta, bloquear/desbloquear, alterar plano/valores/vencimento, excluir usuário, auditoria) são executadas **exclusivamente pelo backend protegido (`server.ts`)** utilizando o Firebase Admin SDK (`firebase-admin`) com autenticação criptográfica HMAC-SHA256.

## 2. Invariantes de Segurança por Coleção

### Coleção `/accounts/{accountId}`
1. **Leitura (Get)**:
   - Permitida apenas se o usuário autenticado for o dono do documento (`request.auth.uid == accountId` ou `request.auth.token.email == resource.data.email`).
   - Leitura ampla da coleção (List/Query em lote) é **bloqueada** para clientes comuns. Apenas o backend administrativo lista todas as contas.
2. **Criação (Create)**:
   - Realizada prioritariamente pelo backend administrativo.
   - Caso um usuário se auto-registre, o documento criado deve ter status estritamente restrito (não pode definir `bloqueado: false` para burlar ou definir valores de plano não autorizados).
3. **Atualização (Update)**:
   - Usuários comuns **NUNCA** podem alterar campos protegidos:
     - `bloqueado`, `blocked`
     - `status`, `userStatus`, `situacao`
     - `ativo`, `active`
     - `plano`, `planoId`, `planoNome`, `plan`, `planName`
     - `valorPlano`, `valorMensalidade`, `mensalidade`, `amount`
     - `dataVencimento`, `vencimento`, `dueDate`, `trialEndsAt`
     - `statusUpdatedAt`, `statusUpdatedBy`, `statusReason`
   - Usuários com conta bloqueada (`resource.data.bloqueado == true`) não podem realizar atualizações.
4. **Exclusão (Delete)**:
   - **Bloqueada** diretamente no Firestore para clientes comuns. Exclusão é realizada exclusivamente pelo endpoint administrativo seguro `/api/admin/delete-user`.

### Subcoleções de Tenant `/accounts/{accountId}/{subcollection}/{docId}`
- Subcoleções suportadas: `orders`, `receivables`, `expenses`, `products`, `customers`, `employees`.
- Permissões:
  - Leitura e Escrita permitidas **apenas** se o usuário autenticado for o dono da conta (`request.auth.uid == accountId` ou `request.auth.token.email == accountId`).
  - Nenhum usuário pode ler ou modificar dados de outras contas.

### Coleção `/audit_logs/{logId}`
- Acesso de leitura e escrita negado para todos os clientes comuns (`allow read, write: if false;`).
- Gerenciada e gravada exclusivamente pelo backend Node.js (`server.ts`) via Firebase Admin SDK.

### Default Deny Catch-All
- Todas as outras coleções ou caminhos não explicitados são bloqueados por padrão: `allow read, write: if false;`.

## 3. Matriz do "Dirty Dozen" (Testes de Tentativas de Burlar Segurança)
1. ❌ Cliente tenta alterar `bloqueado: false` no seu próprio doc -> **REJEITADO pelo Firestore Rules**.
2. ❌ Cliente tenta alterar `plano: 'COMPLETO_50'` ou `valorPlano: 0.00` -> **REJEITADO pelo Firestore Rules**.
3. ❌ Cliente tenta prorrogar `dataVencimento` -> **REJEITADO pelo Firestore Rules**.
4. ❌ Cliente tenta ler documento de outro cliente em `/accounts/{outroUid}` -> **REJEITADO pelo Firestore Rules**.
5. ❌ Cliente tenta listar toda a coleção `/accounts` sem autenticação master -> **REJEITADO pelo Firestore Rules**.
6. ❌ Cliente tenta deletar documento `/accounts/{outroUid}` -> **REJEITADO pelo Firestore Rules**.
7. ❌ Requisição sem token admin para `/api/admin/*` -> **REJEITADO (401 Unauthorized)**.
8. ❌ Token admin forjado ou expirado -> **REJEITADO (401 Unauthorized)**.
9. ❌ Leitura direta da coleção `/audit_logs` no cliente -> **REJEITADO pelo Firestore Rules**.
10. ❌ Modificação de dados de ordens de serviço de outro tenant -> **REJEITADO pelo Firestore Rules**.
11. ❌ Gravação em coleções fora da hierarquia permitida -> **REJEITADO pelo Firestore Rules**.
12. ❌ Chamada direta de exclusão de usuário sem autorização master -> **REJEITADO (401 Unauthorized)**.
