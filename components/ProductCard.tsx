import type { Product } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ProductCard({ product, onAdd, onOpen }: { product: Product; onAdd: () => void; onOpen: () => void }) {
  const available = product.stock - product.reserved;
  return (
    <article className="product-card">
      <button className="visual-button" onClick={onOpen} aria-label={`Ver ${product.name}`}>
        <ProductVisual product={product} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="heart" aria-hidden="true">♡</span>
      </button>
      <div className="product-copy">
        <span className="product-brand">{product.brand}</span>
        <button className="product-title" onClick={onOpen}>{product.name}</button>
        <div className="price-row">
          <strong>{money.format(product.price)}</strong>
          {product.compareAt && <s>{money.format(product.compareAt)}</s>}
        </div>
        <span className="payment-copy">{product.installments}x de {money.format(product.price / product.installments)} sem juros</span>
        <span className="pix-copy">ou {money.format(product.pixPrice)} no PIX</span>
        <button className="add-button" onClick={onAdd} disabled={available <= 0}>
          {available <= 0 ? "Esgotado" : "Adicionar ao carrinho"}
        </button>
      </div>
    </article>
  );
}
