# Fanny Cosméticos

MVP funcional de e-commerce de cosméticos coreanos, desenvolvido em Next.js, React e TypeScript.

## Incluído

- Vitrine responsiva com identidade original em rosa suave;
- Busca e filtros por categoria;
- Produto detalhado;
- Carrinho persistente em `localStorage`;
- Frete grátis progressivo;
- Checkout demonstrativo com PIX, cartão e boleto;
- Newsletter demonstrativa;
- Painel de estoque com SKU, reservas, lotes e validades;
- Dados fictícios e avisos regulatórios;
- SEO básico, acessibilidade e layout mobile.

## Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Escopo deste MVP

Pagamentos, frete, autenticação e banco de dados estão representados na interface, mas não realizam operações reais. Para produção, conecte a aplicação a uma API modular, PostgreSQL, Redis e gateways por adaptadores server-side.

## Evolução recomendada

1. Módulos `catalog`, `inventory`, `cart`, `checkout`, `orders`, `payments` e `shipping` no backend.
2. PostgreSQL com movimentações de estoque e reservas transacionais.
3. Webhooks idempotentes para PIX/cartão.
4. Integração de frete por CEP.
5. Autenticação e RBAC no painel administrativo.
6. Auditoria, observabilidade, backups e testes E2E.

Todos os produtos, marcas, preços, avaliações e alegações presentes no seed são demonstrativos.
