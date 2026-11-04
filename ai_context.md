# AngelisTV - Contexto do Projeto

## Objetivo
Criar um servidor local que transmite canais de TV usando streams públicos do repositório Ramys/Iptv-Brasil-2026.

## Arquitetura

### Servidor (Node.js)
- **Porta**: 3000
- **Framework**: Express.js
- **Funções**:
  - Servir interface web (HTML/CSS/JS)
  - Proxy para streams M3U/M3U8
  - API REST para gerenciar canais
  - Controle de "lock" para permitir que apenas um canal seja transmitido por vez

### Interface Web
- **Tecnologia**: HTML5 + CSS + JavaScript (vanilla)
- **Funcionalidades**:
  - Lista de canais organizados por categoria
  - Player de vídeo com controles básicos
  - Botão "Liberar" para desbloquear o canal atual
  - Interface responsiva

## Estrutura de Arquivos

```
iptv-local/
├── server.js          # Servidor principal
├── package.json       # Dependências
├── public/
│   ├── index.html     # Interface principal
│   ├── style.css      # Estilos
│   └── app.js         # Lógica do cliente
└── ai_context.md      # Este arquivo
```

## Funcionalidades
- [x] Lista de canais organizados por categoria
- [x] Player de vídeo com controles básicos
- [x] Sistema de lock/unlock
- [x] Integração com streams M3U8
- [ ] Testes finais

## Como Usar

1. Iniciar servidor: `node server.js`
2. Acessar: `http://localhost:3000`

## Status Atual
- [x] Servidor implementado
- [x] Interface implementada
- [x] Sistema de lock implementado
- [x] Proxy para streams implementado
- [x] Canais carregados (21391 canais)
