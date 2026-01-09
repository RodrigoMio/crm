# Instruções para Deploy na KingHost

## ✅ Compilação Concluída

Os arquivos foram compilados com sucesso:
- **Frontend**: `frontend/dist/`
- **Backend**: `backend/dist/`

## 📦 Arquivos para Upload na KingHost

### 1. Backend (apps_nodejs/crm)

Faça upload dos seguintes arquivos/pastas:
```
backend/
├── dist/              (toda a pasta)
├── server.js          (arquivo de inicialização)
├── package.json       (dependências)
└── .env               (variáveis de ambiente - NÃO compartilhe publicamente)
```

### 2. Frontend

**Opção A - Servir pelo Backend (Recomendado):**
- Faça upload da pasta `frontend/dist/` para o mesmo diretório do backend
- O backend já está configurado para servir automaticamente os arquivos do frontend

**Opção B - Servir pelo Servidor Web:**
- Faça upload do conteúdo de `frontend/dist/` para `public_html/` ou `www/`
- Configure o servidor web (nginx/apache) para fazer proxy reverso para o backend na porta do Node.js

## 🔧 Configuração do .env

Certifique-se de que o arquivo `.env` no diretório do backend contenha:

```env
# Banco de Dados
DB_HOST=seu_host
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=nome_do_banco
DB_SSL=true

# JWT
JWT_SECRET=sua_chave_secreta_jwt

# Porta (KingHost define automaticamente PORT_SERVER)
PORT_SERVER=3001

# Frontend (opcional - se o frontend estiver em local diferente)
FRONTEND_DIST_PATH=/caminho/absoluto/para/frontend/dist

# CORS (opcional - URLs permitidas)
FRONTEND_URL=https://crmcc.kinghost.net
```

## 🚀 Passos para Deploy

1. **Upload dos arquivos via FTP/SFTP:**
   - Backend: `apps_nodejs/crm/`
   - Frontend: mesmo diretório do backend ou `public_html/`

2. **Instalar dependências do backend:**
   ```bash
   cd apps_nodejs/crm
   npm install --production
   ```

3. **Verificar estrutura:**
   ```
   apps_nodejs/crm/
   ├── dist/
   │   └── main.js
   ├── frontend/
   │   └── dist/
   │       ├── index.html
   │       └── assets/
   ├── server.js
   ├── package.json
   └── .env
   ```

4. **Reiniciar a aplicação Node.js na KingHost**

## 🔍 Verificação

Após o deploy, acesse:
- **Frontend**: `https://crmcc.kinghost.net/`
- **API**: `https://crmcc.kinghost.net/api/`

## ⚠️ Troubleshooting

### Erro 404 no Frontend

Se o frontend não for encontrado, o backend tentará automaticamente os seguintes caminhos:
1. `../frontend/dist` (relativo ao dist/)
2. `frontend/dist` (no mesmo diretório)
3. `process.cwd()/frontend/dist` (diretório de trabalho)
4. Variável de ambiente `FRONTEND_DIST_PATH`

**Solução**: Defina `FRONTEND_DIST_PATH` no `.env` com o caminho absoluto:
```env
FRONTEND_DIST_PATH=/home/usuario/apps_nodejs/crm/frontend/dist
```

### Erro de CORS

Se houver erro de CORS, adicione a URL do frontend no `.env`:
```env
FRONTEND_URL=https://crmcc.kinghost.net
```

### Verificar Logs

Os logs do backend mostrarão:
- ✅ Se o frontend foi encontrado e onde
- ⚠️ Se o frontend não foi encontrado e quais caminhos foram verificados

## 📝 Notas Importantes

1. O backend serve automaticamente o frontend se estiver no mesmo diretório ou em caminhos relativos
2. Todas as rotas da API têm o prefixo `/api`
3. O React Router funciona corretamente com o fallback para `index.html`
4. Certifique-se de que o arquivo `.env` não seja acessível publicamente




