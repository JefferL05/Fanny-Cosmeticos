import { useState } from "react";
import type { CartItem } from "@/lib/types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CheckoutModal({ open, items, onClose, onSuccess }: { open: boolean; items: CartItem[]; onClose: () => void; onSuccess: () => void }) {
  const [payment, setPayment] = useState("pix");
  const [done, setDone] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 299 ? 0 : 18.9;
  const total = payment === "pix" ? items.reduce((s, i) => s + i.product.pixPrice * i.quantity, 0) + shipping : subtotal + shipping;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setDone(true);
    onSuccess();
  }

  if (!open) return null;
  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label="Checkout demonstrativo">
      <button className="modal-backdrop" onClick={onClose} aria-label="Fechar checkout" />
      <div className="checkout-modal">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">×</button>
        {done ? (
          <div className="success-state"><span>✓</span><p className="eyebrow">Pedido demonstrativo</p><h2>Seu ritual foi reservado.</h2><p>Esta experiência não realizou cobrança. A integração real de pagamentos será conectada por gateway seguro.</p><button className="primary-button" onClick={() => { setDone(false); onClose(); }}>Voltar à loja</button></div>
        ) : (
          <div className="checkout-grid">
            <form onSubmit={submit}>
              <span className="eyebrow">Checkout seguro · demonstração</span><h2>Quase lá</h2>
              <div className="form-grid"><label>Nome completo<input required placeholder="Seu nome" /></label><label>E-mail<input required type="email" placeholder="voce@email.com" /></label><label>CEP<input required inputMode="numeric" placeholder="00000-000" /></label><label>Telefone<input required inputMode="tel" placeholder="(00) 00000-0000" /></label></div>
              <h3>Forma de pagamento</h3>
              <div className="payment-options">
                {[["pix", "PIX", "5% de desconto"], ["card", "Cartão", "até 6x sem juros"], ["boleto", "Boleto", "vence em 2 dias"]].map(([id, title, subtitle]) => (
                  <label key={id} className={payment === id ? "selected" : ""}><input type="radio" name="payment" value={id} checked={payment === id} onChange={() => setPayment(id)} /><span><strong>{title}</strong><small>{subtitle}</small></span></label>
                ))}
              </div>
              <button className="primary-button full" type="submit">Confirmar pedido demonstrativo</button>
            </form>
            <aside className="order-summary"><h3>Resumo</h3>{items.map(i => <div className="summary-item" key={i.product.id}><span>{i.quantity}× {i.product.name}</span><strong>{money.format((payment === "pix" ? i.product.pixPrice : i.product.price) * i.quantity)}</strong></div>)}<hr/><div><span>Frete</span><strong>{shipping ? money.format(shipping) : "Grátis"}</strong></div><div className="summary-total"><span>Total</span><strong>{money.format(total)}</strong></div></aside>
          </div>
        )}
      </div>
    </div>
  );
}
