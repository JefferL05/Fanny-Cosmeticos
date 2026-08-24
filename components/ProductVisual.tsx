import type { Product } from "@/lib/types";

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-visual ${product.color} ${large ? "large" : ""}`} aria-hidden="true">
      <span className="visual-orb orb-one" />
      <span className="visual-orb orb-two" />
      <div className={`pack pack-${product.form}`}>
        <span className="pack-cap" />
        <span className="pack-label">Fanny</span>
        <span className="pack-kind">{product.category}</span>
      </div>
    </div>
  );
}
