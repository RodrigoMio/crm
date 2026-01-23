# 🌐 Como Permitir Acesso na Rede Local

Este guia explica como permitir que outros usuários na mesma rede acessem a aplicação CRM.

## 📋 Pré-requisitos

- Ambos os dispositivos devem estar na mesma rede Wi-Fi/Ethernet
- Firewall do Windows deve permitir conexões nas portas 3000 e 3001

## 🔧 Configuração

### 1. Descobrir seu IP na rede local

**No Windows (PowerShell):**
```powershell
ipconfig
```

Procure por "IPv4 Address" na seção do adaptador de rede que você está usando (Wi-Fi ou Ethernet). Exemplo: `192.168.1.100`

**No Windows (CMD):**
```cmd
ipconfig | findstr IPv4
```

### 2. Configurar Firewall do Windows

Permitir conexões nas portas 3000 e 3001:

**Opção A: Via Interface Gráfica**
1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações Avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → Próximo
5. Selecione "TCP" e "Portas locais específicas": `3000, 3001`
6. Selecione "Permitir a conexão"
7. Marque todos os perfis (Domínio, Privado, Público)
8. Dê um nome: "CRM - Portas 3000 e 3001"

**Opção B: Via PowerShell (como Administrador)**
```powershell
New-NetFirewallRule -DisplayName "CRM - Porta 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "CRM - Porta 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 3. Iniciar os Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Acessar de Outro Dispositivo

No outro dispositivo (celular, tablet, outro computador), acesse:

```
http://[SEU_IP]:3000
```

**Exemplo:** Se seu IP for `192.168.1.100`, acesse:
```
http://192.168.1.100:3000
```

## ⚠️ Importante

1. **Segurança**: Esta configuração permite acesso apenas na rede local. Para acesso externo, use um túnel (ngrok, Cloudflare Tunnel) ou configure um servidor adequado.

2. **IP Dinâmico**: Se o IP mudar, você precisará informar o novo IP aos outros usuários.

3. **Firewall**: Certifique-se de que o firewall permite conexões nas portas 3000 e 3001.

4. **Backend**: O backend está configurado para aceitar conexões de qualquer IP na rede local (0.0.0.0).

5. **CORS**: O CORS está configurado para aceitar requisições de IPs da rede local (192.168.x.x, 10.x.x.x, 172.x.x.x).

## 🔍 Verificar se está funcionando

1. No servidor, você verá mensagens como:
   ```
   🚀 Backend rodando na porta 3001
   📡 API disponível em http://localhost:3001/api
   🌐 Acessível na rede em http://[SEU_IP]:3001/api
   ```

2. No outro dispositivo, tente acessar `http://[SEU_IP]:3000` no navegador.

3. Se não funcionar, verifique:
   - Firewall do Windows
   - Se ambos estão na mesma rede
   - Se o IP está correto
   - Se os servidores estão rodando

## 🛠️ Solução de Problemas

### Erro: "Não é possível acessar este site"

- Verifique se o firewall permite as portas
- Verifique se ambos os dispositivos estão na mesma rede
- Tente desabilitar temporariamente o firewall para testar

### Erro: "CORS policy"

- O backend já está configurado para aceitar IPs da rede local
- Verifique se o IP está no formato correto (192.168.x.x, 10.x.x.x, 172.x.x.x)

### Backend não responde

- Verifique se o backend está rodando
- Verifique se está escutando em `0.0.0.0` (não apenas localhost)
- Verifique os logs do backend para erros












