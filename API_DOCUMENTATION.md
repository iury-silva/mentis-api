# 📚 Documentação da API Mentis

## 🚀 Visão Geral

A API Mentis é uma plataforma completa para gerenciamento de bem-estar mental, oferecendo funcionalidades para autenticação, questionários, análise de dados e dashboard analítico.

## 📖 Documentação Swagger

A documentação completa da API está disponível através do Swagger UI. Após iniciar a aplicação, acesse:

**URL da Documentação:** `http://localhost:3000/api/docs`

## 🔐 Autenticação

A API utiliza dois métodos de autenticação:

### JWT (JSON Web Token)

- **Endpoint:** `POST /login`
- **Descrição:** Autenticação tradicional com email e senha
- **Headers:** `Authorization: Bearer <token>`

### Google OAuth 2.0

- **Endpoint:** `GET /auth/google`
- **Callback:** `GET /auth/google/redirect`
- **Descrição:** Autenticação via conta Google

## 📋 Módulos da API

### 🏠 Application

- `GET /` - Endpoint básico de boas-vindas
- `GET /hello` - Health check da aplicação

### 🔑 Authentication

- `POST /login` - Login com email/senha
- `GET /auth/google` - Iniciar autenticação Google
- `GET /auth/google/redirect` - Callback Google OAuth
- `GET /me` - Obter perfil do usuário logado

### 👥 Users

- `POST /users` - Criar novo usuário (público)
- `GET /users` - Listar todos os usuários (requer auth)
- `DELETE /users/:id` - Remover usuário (requer auth)

### 📝 Questionnaires

- `POST /questionnaire` - Criar questionário
- `GET /questionnaire` - Listar questionários
- `GET /questionnaire/:id` - Obter questionário específico
- `PATCH /questionnaire/:id` - Atualizar questionário
- `DELETE /questionnaire/:id` - Remover questionário
- `GET /questionnaire/blocks/:id` - Obter questões por bloco
- `POST /questionnaire/responses` - Salvar respostas do bloco
- `GET /questionnaire/responses/:userId/:blockId` - Obter respostas do usuário

### 📊 Dashboard

- `GET /dashboard` - Estatísticas gerais (admin)
- `GET /dashboard/question/:id/analysis` - Análise de questão específica
- `GET /dashboard/user/` - Dashboard personalizado do usuário

## 🛡️ Segurança

### Proteção de Rotas

- **Rotas Públicas:** Marcadas com `@IsPublic()`
  - `POST /users` (registro)
  - `POST /login` (autenticação)
  - `GET /auth/google` (OAuth)
  - `GET /auth/google/redirect` (callback)
  - `GET /` (boas-vindas)
  - `GET /hello` (health check)

- **Rotas Protegidas:** Requerem token JWT válido
  - Todas as outras rotas

### Validação de Dados

- **Email:** Formato válido obrigatório
- **Senha:** Mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número
- **Nome:** Mínimo 2 caracteres
- **IDs:** Formato UUID válido

## 📄 Exemplos de Uso

### 1. Registro de Usuário

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "MinhaSenh@123",
    "role": "user"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "MinhaSenh@123"
  }'
```

### 3. Acessar Perfil (com token)

```bash
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Salvar Respostas de Questionário

```bash
curl -X POST http://localhost:3000/questionnaire/responses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "responses": [
      {
        "questionId": "123e4567-e89b-12d3-a456-426614174001",
        "value": "Muito bem"
      },
      {
        "questionId": "123e4567-e89b-12d3-a456-426614174002",
        "value": "8"
      }
    ]
  }'
```

## 🎯 Códigos de Status HTTP

### Sucessos (2xx)

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso

### Erros do Cliente (4xx)

- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido ou não fornecido
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email já existe)

### Erros do Servidor (5xx)

- `500 Internal Server Error` - Erro interno do servidor

## 🔧 Configuração de Desenvolvimento

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar banco de dados:**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Iniciar aplicação:**

   ```bash
   npm run start:dev
   ```

4. **Acessar documentação:**
   ```
   http://localhost:3000/api/docs
   ```

## 📱 Integração com Frontend

### Headers Recomendados

```javascript
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`, // Para rotas protegidas
};
```

### Tratamento de Erros

```javascript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro da API:', error.message);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('Erro de rede:', error);
}
```

## 🤝 Contribuição

Para contribuir com a API:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Documente novas rotas no Swagger
4. Teste thoroughly
5. Submeta um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, consulte:

- **Documentação Swagger:** `http://localhost:3000/api/docs`
- **Repositório:** [GitHub](https://github.com/iury-silva/mentis-api)

---

**Versão da API:** 1.0  
**Última atualização:** Setembro 2024
