# Sincronizações

Monorepo com **backend (Go)** e **frontend (Next.js)** para orquestrar chamadas a serviços externos (n8n) e entregar uma camada de API própria.

## 1. Estrutura

```text
.
├── backend/          # API em Go
│   ├── cmd/api       # entrypoint
│   ├── internal/     # regras de negócio / serviços
│   ├── .env          # uso local (ignorado no git)
│   └── .env.example  # modelo de variáveis
└── frontend/         # aplicação web (Next)
    ├── app/
    ├── components/
    └── ...
```
