import type { Product } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ProductModal({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: () => void }) {
  if (!product) return null;
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-label={product.name}><button className="modal-backdrop" onClick={onClose} aria-label="Fechar produto"/><div className="product-modal"><button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">×</button><ProductVisual product={product} large/><div className="product-detail"><span className="eyebrow">{product.brand} · {product.category}</span><h2>{product.name}</h2><div className="rating">★★★★★ <span>4,9 · 86 avaliações verificadas</span></div><p>{product.description}</p><ul>{product.benefits.map(b => <li key={b}>✓ {b}</li>)}</ul><div className="ingredient-box"><strong>Ingredientes em destaque</strong><p>{product.ingredients}</p></div><div className="detail-price"><span>{money.format(product.price)}</span><small>ou {money.format(product.pixPrice)} no PIX</small></div><button className="primary-button full" onClick={onAdd}>Adicionar ao carrinho</button><small className="regulatory-note">Produto demonstrativo. Informações regulatórias e alegações devem ser verificadas antes da publicação.</small></div></div></div>;
}
