import { supabase } from "@/lib/supabase";
import { useState } from "react";
import type { CartItem } from "@/lib/types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CheckoutModal({ open, items, onClose, onSuccess }: { open: boolean; items: CartItem[]; onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const [payment, setPayment] = useState("pix");
  const [done, setDone] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 299 ? 0 : 18.9;
  const total = payment === "pix" ? items.reduce((s, i) => s + i.product.pixPrice * i.quantity, 0) + shipping : subtotal + shipping;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !items.length) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sua sessão expirou. Entre novamente."); return; }
      const { data, error: saveError } = await supabase.from("orders").insert({
        id: requestId, user_id: user.id, customer_name: form.get("name"),
        payment_method: payment, requested_items: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
      }).select("id").single();
      if (saveError) {
        if (saveError.code === "23505") {
          const { data: existing } = await supabase.from("orders").select("id").eq("id", requestId).single();
          if (existing) { setOrderId(existing.id); setDone(true); onSuccess(); return; }
        }
        setError("Não foi possível registrar. Confira a disponibilidade dos produtos ou aguarde um minuto antes de tentar novamente."); return;
      }
      setOrderId(data.id); setDone(true); onSuccess();
    } catch { setError("Falha de conexão. Tente novamente; o pedido não será duplicado."); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label="Checkout demonstrativo">
      <button className="modal-backdrop" onClick={onClose} aria-label="Fechar checkout" />
      <div className="checkout-modal">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">×</button>
        {done ? (
          <div className="success-state"><span>✓</span><p className="eyebrow">Pedido demonstrativo</p><h2>Pedido de teste registrado.</h2><p>Seu pedido foi salvo. Nenhuma cobrança ou reserva de estoque foi realizada. Pagamento e entrega ainda não estão disponíveis.</p><p>Identificador: {orderId}</p><button className="primary-button" onClick={() => { setDone(false); onClose(); }}>Voltar à loja</button></div>
        ) : (
          <div className="checkout-grid">
            <form onSubmit={submit}>
              <span className="eyebrow">Checkout seguro · demonstração</span><h2>Quase lá</h2>
              <div className="form-grid"><label>Nome completo<input name="name" required minLength={2} maxLength={120} placeholder="Seu nome" /></label></div><p>Pedido de teste vinculado à sua conta. Frete e pagamento são apenas estimativas; não haverá cobrança.</p>
              <h3>Forma de pagamento</h3>
              <div className="payment-options">
                {[["pix", "PIX", "5% de desconto"], ["card", "Cartão", "até 6x sem juros"], ["boleto", "Boleto", "vence em 2 dias"]].map(([id, title, subtitle]) => (
                  <label key={id} className={payment === id ? "selected" : ""}><input type="radio" name="payment" value={id} checked={payment === id} onChange={() => setPayment(id)} /><span><strong>{title}</strong><small>{subtitle}</small></span></label>
                ))}
              </div>
              <p role="alert">{error}</p><button className="primary-button full" type="submit" disabled={busy || !items.length}>{busy ? "Salvando…" : "Registrar pedido de teste"}</button>
            </form>
            <aside className="order-summary"><h3>Resumo</h3>{items.map(i => <div className="summary-item" key={i.product.id}><span>{i.quantity}× {i.product.name}</span><strong>{money.format((payment === "pix" ? i.product.pixPrice : i.product.price) * i.quantity)}</strong></div>)}<hr/><div><span>Frete</span><strong>{shipping ? money.format(shipping) : "Grátis"}</strong></div><div className="summary-total"><span>Total</span><strong>{money.format(total)}</strong></div></aside>
          </div>
        )}
      </div>
    </div>
  );
}
