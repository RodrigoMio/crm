# ⚡ Correção Rápida - Frontend Não Encontrado

## 🔍 O PROBLEMA

O frontend está em `/apps_nodejs/crm/frontend/` mas o código procura em `/apps_nodejs/crm/frontend/dist/`.

---

## ✅ SOLUÇÃO RÁPIDA (2 Passos)

### 1️⃣ Mover Arquivos para `dist/`

Via SSH ou gerenciador de arquivos:

```bash
# Criar pasta dist
mkdir -p /apps_nodejs/crm/frontend/dist

# Mover arquivos
mv /apps_nodejs/crm/frontend/index.html /apps_nodejs/crm/frontend/dist/
mv /apps_nodejs/crm/frontend/assets /apps_nodejs/crm/frontend/dist/
```

**Estrutura final:**
```
/apps_nodejs/crm/frontend/dist/
├── index.html
└── assets/
```

### 2️⃣ Atualizar `.env`

Edite `/apps_nodejs/crm/.env`:

```env
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
```

**OU use caminho absoluto completo:**
```env
FRONTEND_DIST_PATH=/home/crmcc/apps_nodejs/crm/frontend/dist
```

### 3️⃣ Reiniciar

```bash
pm2 restart crm
```

---

## 🔍 VERIFICAR

```bash
# Verificar estrutura
ls -la /apps_nodejs/crm/frontend/dist/

# Verificar .env
cat /apps_nodejs/crm/.env | grep FRONTEND_DIST_PATH

# Verificar logs
pm2 logs crm | grep "Frontend encontrado"
```

**Deve mostrar:**
```
✅ Frontend encontrado em: /apps_nodejs/crm/frontend/dist
```

---

## 📋 CHECKLIST

- [ ] Pasta `dist/` criada dentro de `frontend/`
- [ ] Arquivos movidos para `frontend/dist/`
- [ ] `.env` atualizado com `FRONTEND_DIST_PATH`
- [ ] Backend reiniciado
- [ ] Logs mostram "Frontend encontrado"

---

## 💡 ALTERNATIVA (Sem criar dist/)

Se preferir não criar a pasta `dist/`, configure:

```env
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend
```

Mas é recomendado usar `dist/` para manter a estrutura padrão.

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`CORRECAO_CONFIGURACAO_COMPLETA.md`**






