# 🏦 Monopoly Bank

Banco digital para substituir a máquina de cartão do Monopoly. Cada jogador acessa pelo celular e faz transferências tipo Pix.

## Como usar

### Instalar dependências
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### Rodar em desenvolvimento
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Para jogar em rede local (celulares)
Descubra o IP da máquina (`ipconfig`) e acesse `http://<SEU_IP>:5173` nos celulares.

## Funcionalidades (V1)
- ✅ Criar/entrar em sala com código de 6 dígitos
- ✅ Saldo inicial configurável
- ✅ Transferências entre jogadores (estilo Pix)
- ✅ Pagamentos ao Banco / receber do Banco
- ✅ QR Code para identificar jogador
- ✅ Histórico de transações
- ✅ Interface mobile (estilo app de banco)
- ✅ Atualização em tempo real

## Tecnologias
- **Backend**: Node.js, Express, Socket.IO, MySQL
- **Frontend**: React, Vite, TypeScript