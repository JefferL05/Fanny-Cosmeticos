// Receives Mercado Pago payment notifications and reconciles order status.
// Never trusts the webhook payload's amount; it re-fetches the payment from
// Mercado Pago's API using the server-side access token before writing.
import { adminClient, jsonResponse } from "../_shared/admin-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken) return jsonResponse({ error: "not_configured" }, 200);

  const url = new URL(req.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (!paymentId && req.method === "POST") {
    try {
      const body = await req.json();
      paymentId = body?.data?.id ?? null;
      topic = body?.type ?? body?.topic ?? topic;
    } catch { /* no JSON body: keep query-param values */ }
  }
  if (!paymentId || (topic && topic !== "payment")) return jsonResponse({ ok: true });

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!paymentResponse.ok) return jsonResponse({ error: "payment_lookup_failed" }, 502);
  const payment = await paymentResponse.json();

  const orderId: string | undefined = payment.external_reference;
  if (!orderId) return jsonResponse({ ok: true });

  const status = payment.status === "approved" ? "paid" : payment.status === "rejected" ? "failed" : payment.status === "refunded" || payment.status === "charged_back" ? "refunded" : "pending";

  const admin = adminClient();
  await admin
    .from("orders")
    .update({ payment_status: status, payment_provider: "mercado_pago", payment_reference: String(payment.id) })
    .eq("id", orderId);

  if (status === "paid") {
    await admin.functions.invoke("send-order-email", { body: { order_id: orderId, template: "payment_confirmed" } }).catch(() => {});
  }

  return jsonResponse({ ok: true });
});
