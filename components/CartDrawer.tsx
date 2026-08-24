import type { CartItem } from "@/lib/types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CartDrawer({ open, items, onClose, onChange, onCheckout }: {
  open: boolean; items: CartItem[]; onClose: () => void; onChange: (id: string, amount: number) => void; onCheckout: () => void;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const remaining = Math.max(0, 299 - subtotal);
  return (
    <>
      <button className={`overlay ${open ? "show" : ""}`} onClick={onClose} aria-label="Fechar carrinho" tabIndex={open ? 0 : -1} />
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open} aria-label="Carrinho de compras">
        <header className="drawer-header">
          <div><span className="eyebrow">Seu ritual</span><h2>Carrinho</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        {items.length === 0 ? (
          <div className="empty-cart"><span>♡</span><h3>Seu carrinho está tranquilo</h3><p>Escolha um cuidado para começar seu ritual.</p><button onClick={onClose}>Conhecer produtos</button></div>
        ) : (
          <>
            <div className="shipping-progress">
              <p>{remaining > 0 ? <>Faltam <strong>{money.format(remaining)}</strong> para o frete grátis</> : <strong>Você ganhou frete grátis ✦</strong>}</p>
              <div><span style={{ width: `${Math.min(100, subtotal / 2.99)}%` }} /></div>
            </div>
            <div className="cart-list">
              {items.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <div className={`cart-thumb ${product.color}`}><span>Fanny</span></div>
                  <div><small>{product.brand}</small><h3>{product.name}</h3><strong>{money.format(product.price)}</strong>
                    <div className="quantity"><button onClick={() => onChange(product.id, -1)} aria-label="Diminuir">−</button><span>{quantity}</span><button onClick={() => onChange(product.id, 1)} aria-label="Aumentar">+</button></div>
                  </div>
                </div>
              ))}
            </div>
            <footer className="cart-footer">
              <div><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div>
              <small>Frete e descontos calculados no checkout.</small>
              <button className="primary-button full" onClick={onCheckout}>Ir para o checkout</button>
              <button className="link-button" onClick={onClose}>Continuar comprando</button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
