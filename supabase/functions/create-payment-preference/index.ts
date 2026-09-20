// Creates a Mercado Pago Checkout Pro preference for an existing "demo" order.
// Requires a caller JWT (the storefront's authenticated user) and only ever
// reads server-side data: the order total is never trusted from the request.
import { createClient } from "npm:@supabase/supabase-js@2";
import { adminClient, corsHeaders, jsonResponse } from "../_shared/admin-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken) {
    return jsonResponse({ error: "not_configured", message: "Defina MERCADO_PAGO_ACCESS_TOKEN (sandbox) com supabase secrets set para habilitar pagamentos." }, 200);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  let orderId: string;
  try {
    ({ order_id: orderId } = await req.json());
  } catch {
    return jsonResponse({ error: "invalid_body" }, 400);
  }
  if (typeof orderId !== "string" || !orderId) return jsonResponse({ error: "invalid_body" }, 400);

  const { data: order, error } = await caller
    .from("orders")
    .select("id,user_id,items,total,payment_status,payment_reference")
    .eq("id", orderId)
    .single();
  if (error || !order || order.user_id !== user.id) return jsonResponse({ error: "order_not_found" }, 404);
  if (order.payment_status === "paid") return jsonResponse({ error: "already_paid" }, 409);

  const items = (order.items as Array<{ name: string; quantity: number; unit_price: number }>).map((item) => ({
    title: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    currency_id: "BRL",
  }));

  const storeUrl = Deno.env.get("STORE_URL");
  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      external_reference: order.id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      ...(storeUrl ? { back_urls: { success: storeUrl, pending: storeUrl, failure: storeUrl }, auto_return: "approved" } : {}),
    }),
  });
  if (!mpResponse.ok) {
    return jsonResponse({ error: "gateway_error", message: await mpResponse.text() }, 502);
  }
  const preference = await mpResponse.json();

  await adminClient().from("orders").update({ payment_provider: "mercado_pago", payment_reference: preference.id }).eq("id", order.id).is("payment_reference", null);

  const sandbox = accessToken.startsWith("TEST-");
  return jsonResponse({ init_point: sandbox ? preference.sandbox_init_point : preference.init_point, sandbox });
});
