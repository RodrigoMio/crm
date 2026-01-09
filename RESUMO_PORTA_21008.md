# ⚡ Resumo Rápido - Porta 21008

## ✅ ONDE CONFIGURAR

**Apenas no arquivo `.env` no servidor:**

```env
PORT_SERVER=21008
```

**Localização:** `/apps_nodejs/crm/.env`

---

## ✅ COMO ESTÁ CONFIGURADO

### `server.js` ✅
- Já lê `PORT_SERVER` do `.env`
- Converte para `PORT` automaticamente
- **Não precisa modificar**

### `main.ts` ✅
- Já lê `PORT_SERVER` ou `PORT`
- Usa 3001 como fallback
- **Não precisa modificar**

---

## ❌ NÃO FAZER

```env
# ❌ ERRADO
PORT=21008
PORT_SERVER = 21008
PORT_SERVER="21008"
```

```env
# ✅ CORRETO
PORT_SERVER=21008
```

---

## 🔍 VERIFICAR

```bash
# Verificar .env
cat /apps_nodejs/crm/.env | grep PORT

# Verificar logs
pm2 logs crm | grep Porta
```

**Deve mostrar:**
```
PORT_SERVER=21008
🌐 Porta: 21008
🚀 Backend rodando na porta 21008
```

---

## 📋 RESUMO

| Arquivo | Ação |
|---------|------|
| `.env` | ✅ Adicionar `PORT_SERVER=21008` |
| `server.js` | ✅ Já configurado - não mexer |
| `main.ts` | ✅ Já configurado - não mexer |

**Conclusão:** Configure apenas no `.env`! 🎉



