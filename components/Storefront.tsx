"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, products } from "@/lib/products";
import type { CartItem, Category, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { ProductModal } from "./ProductModal";
import { InventoryPanel } from "./InventoryPanel";

export function Storefront() {
  const [category, setCategory] = useState<Category>("Todos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("fanny-cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fanny-cart", JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => products.filter(p => {
    const matchesCategory = category === "Todos" || p.category === category;
    const haystack = `${p.name} ${p.brand} ${p.concern} ${p.skinTypes.join(" ")}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [category, query]);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function notify(message: string) {
    setToast(message); window.setTimeout(() => setToast(""), 2400);
  }

  function add(product: Product) {
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) return current.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock - product.reserved) } : item);
      return [...current, { product, quantity: 1 }];
    });
    setActiveProduct(null); notify(`${product.name} foi adicionado ao carrinho`);
  }

  function change(id: string, amount: number) {
    setCart(current => current.map(item => item.product.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0));
  }

  if (adminOpen) return <InventoryPanel open onClose={() => setAdminOpen(false)} />;

  return <>
    <div className="announcement">10% de carinho na primeira compra com <strong>BEMVINDA10</strong><span>•</span>Frete grátis acima de R$ 299</div>
    <header className="site-header"><a className="brand" href="#top" aria-label="Fanny Cosméticos, início"><strong>Fanny</strong><span>COSMÉTICOS</span></a><nav><a href="#catalogo">Novidades</a><a href="#catalogo">Skincare</a><a href="#catalogo">Maquiagem</a><a href="#ritual">Seu ritual</a><button onClick={() => setAdminOpen(true)}>Painel demo</button></nav><div className="header-actions"><label className="search-box"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar seu cuidado" aria-label="Buscar produtos" /></label><button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Carrinho com ${count} itens`}>Sacola <span>{count}</span></button></div></header>

    <main id="top">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">K-beauty escolhida com calma</span><h1>Uma rotina que faz você se sentir <em>bem.</em></h1><p>Cosméticos coreanos selecionados para transformar pequenos cuidados em momentos de pausa, conforto e confiança.</p><div className="hero-actions"><a className="primary-button" href="#catalogo">Encontrar meu cuidado</a><a className="secondary-button" href="#ritual">Montar uma rotina</a></div><div className="hero-proof"><span>✦ Curadoria especializada</span><span>✦ Produtos regularizados</span><span>✦ Compra protegida</span></div></div><div className="hero-art" aria-label="Composição decorativa de cosméticos"><span className="petal petal-one"/><span className="petal petal-two"/><div className="hero-pack hero-tube"><span>Fanny</span><small>DAILY DEW</small></div><div className="hero-pack hero-dropper"><i/><span>Fanny</span><small>CALM GLOW</small></div><div className="hero-pack hero-jar"><i/><span>Fanny</span><small>BARRIER CLOUD</small></div><div className="hero-stamp">Korean<br/>beauty<br/><strong>edit</strong></div></div></section>

      <section className="catalog" id="catalogo"><div className="section-heading"><div><span className="eyebrow">Escolhas para o seu momento</span><h2>Cuidados que combinam com você</h2></div><p>Explore por categoria, necessidade ou textura. Sem pressa — sua rotina pode ser simples.</p></div><div className="category-row">{categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>{filtered.length ? <div className="product-grid">{filtered.map(product => <ProductCard key={product.id} product={product} onAdd={() => add(product)} onOpen={() => setActiveProduct(product)} />)}</div> : <div className="no-results"><h3>Nenhum cuidado encontrado</h3><p>Tente outro termo ou explore todas as categorias.</p><button onClick={() => { setQuery(""); setCategory("Todos"); }}>Limpar busca</button></div>}</section>

      <section className="ritual" id="ritual"><div className="ritual-card"><span className="eyebrow">Seu primeiro ritual coreano</span><h2>Três passos. Alguns minutos. Um cuidado só seu.</h2><div className="steps"><article><span>01</span><h3>Limpar</h3><p>Uma textura gentil para começar sem sensação de repuxamento.</p></article><article><span>02</span><h3>Tratar</h3><p>Escolha uma necessidade principal e mantenha a rotina consistente.</p></article><article><span>03</span><h3>Proteger</h3><p>Finalize a manhã com proteção solar adequada à sua pele.</p></article></div><button className="secondary-button" onClick={() => { setCategory("Kits"); document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" }); }}>Ver kits essenciais</button></div><aside className="newsletter"><span className="eyebrow">Cartas da Fanny</span><h2>Beleza sem excesso, direto na sua caixa de entrada.</h2><p>Guias curtos, novidades e condições especiais — no seu ritmo.</p><form onSubmit={e => { e.preventDefault(); notify("Você entrou para as Cartas da Fanny"); }}><input type="email" required placeholder="Seu melhor e-mail" aria-label="Seu e-mail"/><button>Quero receber</button></form><small>Sem spam. Você pode sair quando quiser.</small></aside></section>
    </main>

    <footer><div className="footer-brand"><strong>Fanny</strong><span>Rituais de beleza que acolhem você.</span></div><div><strong>Comprar</strong><a href="#catalogo">Novidades</a><a href="#catalogo">Best-sellers</a><a href="#catalogo">Kits</a></div><div><strong>Ajuda</strong><a href="#">Entrega e rastreio</a><a href="#">Trocas e devoluções</a><a href="#">Fale com a gente</a></div><div><strong>Segurança</strong><span>Checkout protegido</span><span>Privacidade e LGPD</span><span>Produtos verificados</span></div><p>© 2026 Fanny Cosméticos · Experiência demonstrativa. Produtos, preços e avaliações são fictícios.</p></footer>

    <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChange={change} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
    <CheckoutModal open={checkoutOpen} items={cart} onClose={() => setCheckoutOpen(false)} onSuccess={() => setCart([])} />
    <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={() => activeProduct && add(activeProduct)} />
    <div className={`toast ${toast ? "show" : ""}`} role="status">{toast}</div>
  </>;
}
