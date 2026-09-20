# Fanny Cosméticos

Loja Next.js/React/TypeScript integrada a um projeto Supabase exclusivo. Hospedagem atual: Sites; exportação estática também compatível com Vercel.

## Funcionalidades desta etapa

- Catálogo carregado do Supabase, com carregamento, erro e nova tentativa.
- Cadastro e login por e-mail/senha com Supabase Auth.
- Carrinho local contendo apenas identificadores e quantidades; os preços são reconsultados.
- Pedidos de **teste** persistidos por cliente. O banco calcula preços e frete, valida disponibilidade e impede alteração de totais pelo navegador.
- Painel restrito a membros de `store_admins`, atualização de estoque com controle de concorrência e trilha de auditoria.
- Políticas RLS em todas as tabelas públicas. Nenhuma chave privilegiada no navegador.

## Desenvolvimento

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

O build gera `out/` e o pacote Worker compatível em `dist/`. `next start` não serve uma exportação estática; use um servidor estático sobre `out/` para pré-visualizar o build.

## Configuração

Veja `.env.example`. Somente a URL e a chave **publishable** podem ser expostas ao navegador. Os valores públicos do projeto atual estão definidos como padrão em `lib/supabase.ts`; variáveis `NEXT_PUBLIC_*` permitem apontar outra instalação no build. Nunca inserir `service_role`, senha de banco ou chaves de pagamento no frontend.

Projeto Supabase: `ylcoubtyvfnoqmwkkmcn`, região São Paulo. Nenhuma tabela de outro projeto foi alterada.

## Banco e validação

- Migração: `supabase/migrations/20260920134549_store_foundation.sql`.
- Seed explicitamente demonstrativo: `supabase/seed.sql` (não substitui dados existentes).
- Testes transacionais: `supabase/tests/access_and_orders.sql`. Executar apenas no ambiente demonstrativo contendo os nove produtos originais. As fixtures são revertidas com ROLLBACK.
- Funções privilegiadas ficam no schema privado e só são executadas por triggers; validam o usuário e nunca aceitam um preço do cliente.
- Pedidos são limitados a cinco por usuário por minuto, com no máximo 30 itens distintos. O identificador do pedido evita duplicação em uma nova tentativa da mesma submissão.

## Primeiro acesso administrativo

1. Em Supabase → Authentication → URL Configuration, definir Site URL e Redirect URLs para o endereço publicado da loja.
2. Configurar SMTP próprio antes de liberar cadastros externos: o envio padrão tem restrições e não substitui um serviço de e-mail de produção.
3. Criar uma conta na loja e confirmar o e-mail, ou criar a conta pelo painel Authentication do Supabase.
4. Depois de verificar o UUID da conta correta, inserir esse UUID em `public.store_admins` pelo Table Editor do Supabase. Não conceder acesso com `user_metadata` e não criar uma política de autoatribuição de administrador.
5. Sair e entrar novamente: o botão Administrar ficará disponível.

## Limites atuais

**Ainda não é uma loja pronta para vendas reais.** Os nove produtos, preços e estoque são demonstrativos. Os pedidos têm status `demo`, não cobram, não reservam estoque e não geram entrega. Não há gateway, webhook, frete por CEP ou envio de newsletter. O formulário informa a indisponibilidade da newsletter sem fingir inscrição.

Antes do lançamento comercial: cadastrar produtos reais, configurar conta administrativa, confirmar fluxo de e-mail/SMTP, integrar pagamentos e frete, implementar reservas transacionais e expiração, políticas comerciais e privacidade. A publicação preserva o acesso restrito existente do Sites; liberar o público é uma ação separada.
