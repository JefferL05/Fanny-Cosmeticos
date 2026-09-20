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

- Migrações: `supabase/migrations/20260920134549_store_foundation.sql` e `supabase/migrations/20260921090000_commerce_integrations.sql` (frete por estado, status de pagamento e catálogo administrável).
- Seed explicitamente demonstrativo: `supabase/seed.sql` (não substitui dados existentes).
- Testes transacionais: `supabase/tests/access_and_orders.sql`. Executar apenas no ambiente demonstrativo contendo os nove produtos originais. As fixtures são revertidas com ROLLBACK.
- Funções privilegiadas ficam no schema privado e só são executadas por triggers; validam o usuário e nunca aceitam um preço do cliente.
- Pedidos são limitados a cinco por usuário por minuto, com no máximo 30 itens distintos. O identificador do pedido evita duplicação em uma nova tentativa da mesma submissão.

## Integrações desta etapa (sandbox)

Estas integrações ficam prontas em código, desligadas por padrão até que os segredos sejam configurados no projeto Supabase (nunca no frontend):

- **Frete por CEP**: o checkout consulta a API pública ViaCEP (sem chave) para descobrir o estado a partir do CEP. O preço do frete é calculado no banco pela tabela `public.shipping_zones` (uma tarifa demonstrativa por UF) dentro do mesmo gatilho `prepare_order`, então o navegador nunca decide o valor cobrado. Ajuste os valores de `shipping_zones` para tarifas reais (Correios/Melhor Envio) quando estiver pronto para produção.
- **Pagamento (Mercado Pago, sandbox)**: `supabase/functions/create-payment-preference` cria uma preferência de Checkout Pro após o pedido ser salvo, e `supabase/functions/mercadopago-webhook` recebe a notificação e reconcilia `orders.payment_status` (`pending`/`paid`/`failed`/`refunded`) consultando a API do Mercado Pago (nunca confia no valor do webhook). Sem as credenciais configuradas, o checkout continua funcionando apenas como pedido de teste, sem cobrança.
- **E-mail transacional (Resend)**: `supabase/functions/send-order-email` envia confirmação de pedido e de pagamento. Sem `RESEND_API_KEY`, a função responde `not_configured` e a loja segue funcionando normalmente.
- **Catálogo administrativo**: administradores agora podem cadastrar novos produtos pelo painel (`Administrar → Novo produto`), além de ajustar estoque. Uma nova política de RLS (`admin_catalog_insert`) permite `insert` na tabela `products` somente para membros de `store_admins`.

### Configurar as credenciais (quando tiver as contas)

```sh
supabase link --project-ref ylcoubtyvfnoqmwkkmcn
supabase functions deploy create-payment-preference mercadopago-webhook send-order-email
supabase secrets set --env-file supabase/functions/.env   # copie de supabase/functions/.env.example, nunca versione o .env real
```

Configure a URL de notificação do Mercado Pago (`.../functions/v1/mercadopago-webhook`) no aplicativo de sandbox e use um token de teste (`TEST-...`) até validar o fluxo ponta a ponta.

## Primeiro acesso administrativo

1. Em Supabase → Authentication → URL Configuration, definir Site URL e Redirect URLs para o endereço publicado da loja.
2. Configurar SMTP próprio antes de liberar cadastros externos: o envio padrão tem restrições e não substitui um serviço de e-mail de produção.
3. Criar uma conta na loja e confirmar o e-mail, ou criar a conta pelo painel Authentication do Supabase.
4. Depois de verificar o UUID da conta correta, inserir esse UUID em `public.store_admins` pelo Table Editor do Supabase. Não conceder acesso com `user_metadata` e não criar uma política de autoatribuição de administrador.
5. Sair e entrar novamente: o botão Administrar ficará disponível.

## Limites atuais

**Ainda não é uma loja pronta para vendas reais.** Os nove produtos-base, preços e estoque seguem demonstrativos. Os pedidos continuam com status `demo` (não reservam estoque, não geram entrega), mas agora têm `payment_status` e podem ser pagos de verdade em sandbox se as credenciais do Mercado Pago forem configuradas — nenhuma cobrança de produção ocorre sem chaves de produção explícitas. Frete agora é calculado por estado (ainda tarifas demonstrativas, não uma cotação real de transportadora). Não há envio de newsletter; o formulário informa a indisponibilidade sem fingir inscrição.

Antes do lançamento comercial: cadastrar produtos reais completos (o formulário do painel cobre os campos essenciais; dados como benefícios/ingredientes/lote ainda exigem o Table Editor do Supabase), trocar as credenciais de sandbox por chaves de produção do Mercado Pago e do Resend, contratar tarifas reais de frete (Correios/Melhor Envio) em vez da tabela demonstrativa por UF, implementar reservas transacionais e expiração de estoque, e revisar políticas comerciais e de privacidade. A publicação preserva o acesso restrito existente do Sites; liberar o público é uma ação separada.
