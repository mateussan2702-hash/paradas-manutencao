# Sistema de Controle de Paradas de Equipamentos

Sistema completo para acompanhamento de paradas programadas de equipamentos, com controle de Ordens de Serviço (OSs), progresso, caminho crítico e exportação para Power BI.

## Sites publicados

| Área | URL |
|------|-----|
| HME | https://paradas-hme.surge.sh |
| Mina | https://paradas-mina.surge.sh |
| Industrial | https://paradas-industrial.surge.sh |

## Backend (API)

URL permanente: `https://eq-downtime-g6sptjwk.manus.space`

## Estrutura do repositório

```
paradas-hme/         ← Frontend do site HME (React + Vite + Tailwind)
paradas-mina/        ← Frontend do site Mina
paradas-industrial/  ← Frontend do site Industrial
backend/             ← Servidor Node.js com tRPC + MySQL (Drizzle ORM)
```

## Como republicar os sites

```bash
# 1. Instalar dependências (primeira vez)
cd paradas-hme && npm install

# 2. Build
npm run build

# 3. Deploy no Surge
SURGE_LOGIN=paradas-hme@manus.space SURGE_TOKEN=5488ff9e797cbbef4aa1f84d846ce798 npx surge dist paradas-hme.surge.sh
```

Repita para `paradas-mina` e `paradas-industrial`.

## Funcionalidades

- Cadastro de paradas por equipamento com datas e horários
- Ordens de Serviço com peso, progresso, caminho crítico e especialidade
- Importação de OSs via planilha (colar do Excel)
- Exportação para Power BI (Excel, CSV, JSON)
- Curva S de progresso
- Compartilhamento via WhatsApp e e-mail
