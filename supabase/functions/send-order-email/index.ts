// Sends transactional order emails through Resend. Called from the checkout
// flow (order received) and from the payment webhook (payment confirmed).
// No-ops with a clear message when RESEND_API_KEY is not configured yet, so
// the storefront keeps working without a production email provider.
import { adminClient, jsonResponse } from "../_shared/admin-client.ts";

const SUBJECTS: Record<string, string> = {
  order_received: "Recebemos seu pedido de teste — Fanny Cosméticos",
  payment_confirmed: "Pagamento confirmado — Fanny Cosméticos",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    return jsonResponse({ error: "not_configured", message: "Defina RESEND_API_KEY e RESEND_FROM_EMAIL com supabase secrets set para enviar e-mails." }, 200);
  }

  let orderId: string, template: string;
  try {
    ({ order_id: orderId, template } = await req.json());
  } catch {
    return jsonResponse({ error: "invalid_body" }, 400);
  }
  if (!SUBJECTS[template]) return jsonResponse({ error: "unknown_template" }, 400);

  const admin = adminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id,customer_name,total,status,user_id,payment_status")
    .eq("id", orderId)
    .single();
  if (error || !order) return jsonResponse({ error: "order_not_found" }, 404);

  const { data: authUser } = await admin.auth.admin.getUserById(order.user_id);
  const to = authUser?.user?.email;
  if (!to) return jsonResponse({ error: "no_recipient" }, 200);

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.total);
  const html = template === "payment_confirmed"
    ? `<p>Olá, ${order.customer_name}!</p><p>Seu pagamento do pedido <strong>${order.id}</strong> (${money}) foi confirmado.</p>`
    : `<p>Olá, ${order.customer_name}!</p><p>Recebemos seu pedido <strong>${order.id}</strong> no valor de ${money}. Ambiente de demonstração: nenhuma cobrança foi realizada ainda.</p>`;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: SUBJECTS[template], html }),
  });
  if (!resendResponse.ok) return jsonResponse({ error: "email_provider_error", message: await resendResponse.text() }, 502);

  return jsonResponse({ ok: true });
});
