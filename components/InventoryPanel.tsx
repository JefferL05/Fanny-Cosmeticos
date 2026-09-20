"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { loadProducts } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

type Order = { id: string; customer_name: string; total: number; created_at: string; status: string };
export function InventoryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      setProducts(await loadProducts());
      const { data, error } = await supabase.from("orders").select("id,customer_name,total,created_at,status").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      setOrders(data || []);
    } catch { setMessage("Não foi possível carregar o painel. Confira sua sessão e tente novamente."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function createProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setBusy(true);
    const form = new FormData(e.currentTarget);
    const id = String(form.get("id")).trim();
    const price = Number(form.get("price"));
    const pixPrice = Number(form.get("pixPrice"));
    const stock = Number(form.get("stock"));
    if (!id || !Number.isFinite(price) || !Number.isFinite(pixPrice) || pixPrice > price || !Number.isInteger(stock) || stock < 0) {
      setMessage("Confira o identificador, os preços e o estoque informados.");
      setBusy(false);
      return;
    }
    const details = {
      sku: String(form.get("sku")).trim(), brand: String(form.get("brand")).trim(), name: String(form.get("name")).trim(),
      category: String(form.get("category")), concern: "", skinTypes: [] as string[], price, pixPrice,
      installments: Math.max(1, Number(form.get("installments")) || 1), lot: "", expiresAt: "", color: "mint", form: "pump",
      description: String(form.get("description")).trim(), benefits: [] as string[], ingredients: "",
    };
    try {
      const { error } = await supabase.from("products").insert({ id, details, stock });
      if (error) { setMessage("Não foi possível cadastrar. Confira sua permissão de administrador e se o identificador já existe."); return; }
      setMessage("Produto cadastrado."); (e.target as HTMLFormElement).reset(); await refresh();
    } catch { setMessage("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function updateStock(e: React.FormEvent<HTMLFormElement>, product: Product) {
    e.preventDefault(); setMessage(""); setBusy(true);
    const stock = Number(new FormData(e.currentTarget).get("stock"));
    if (!Number.isInteger(stock) || stock < product.reserved) { setMessage("Quantidade inválida."); setBusy(false); return; }
    try {
      const { data, error } = await supabase.from("products").update({ stock }).eq("id", product.id).eq("stock", product.stock).select("id");
      if (error || !data?.length) { setMessage("Não foi possível salvar. Confira sua permissão ou atualize o painel: o estoque pode ter mudado."); return; }
      setMessage("Estoque atualizado e movimentação registrada."); await refresh();
    } catch { setMessage("Falha de conexão. Atualize o painel antes de tentar novamente."); }
    finally { setBusy(false); }
  }
  if (!open) return null;
  const filtered = products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="admin-shell"><header className="admin-header"><div><span className="admin-logo">Fanny</span><span>Administração</span></div><button onClick={onClose}>Voltar à loja ×</button></header>
    <main className="admin-main"><h1>Estoque e pedidos</h1><p>Catálogo demonstrativo. Ajustes de estoque ficam registrados para auditoria.</p><p role="status">{busy ? "Atualizando…" : message}</p>
      <section className="inventory-card"><div className="inventory-title"><h2>Novo produto</h2></div>
        <form className="form-grid" style={{ padding: "0 20px 20px" }} onSubmit={e => void createProduct(e)}>
          <label>Identificador (id)<input name="id" required maxLength={40} placeholder="p10" /></label>
          <label>SKU<input name="sku" required maxLength={40} /></label>
          <label>Marca<input name="brand" required maxLength={60} /></label>
          <label>Nome<input name="name" required maxLength={120} /></label>
          <label>Categoria<select name="category" required defaultValue="Skincare"><option>Skincare</option><option>Maquiagem</option><option>Cabelos</option><option>Kits</option></select></label>
          <label>Preço (R$)<input name="price" type="number" min={0} step="0.01" required /></label>
          <label>Preço PIX (R$)<input name="pixPrice" type="number" min={0} step="0.01" required /></label>
          <label>Parcelas<input name="installments" type="number" min={1} max={12} defaultValue={1} /></label>
          <label>Estoque inicial<input name="stock" type="number" min={0} step="1" required /></label>
          <label style={{ gridColumn: "1 / -1" }}>Descrição<input name="description" maxLength={280} /></label>
          <button className="primary-button" disabled={busy} style={{ gridColumn: "1 / -1" }}>Cadastrar produto</button>
        </form>
      </section>
      <section className="inventory-card"><div className="inventory-title"><h2>Estoque</h2><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar SKU ou produto" aria-label="Buscar no estoque"/><button disabled={busy} onClick={() => void refresh()}>Atualizar</button></div>
      <div className="table-wrap"><table><thead><tr><th>Produto</th><th>SKU</th><th>Físico</th><th>Reservado</th><th>Disponível</th><th>Ajustar estoque físico</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td>{p.stock}</td><td>{p.reserved}</td><td>{p.stock-p.reserved}</td><td><form className="stock-form" onSubmit={e => void updateStock(e,p)}><input key={`${p.id}-${p.stock}`} name="stock" type="number" min={p.reserved} max={1000000} step="1" defaultValue={p.stock} aria-label={`Estoque de ${p.name}`} required/><button disabled={busy}>Salvar</button></form></td></tr>)}</tbody></table></div></section>
      <section className="inventory-card"><h2>Últimos pedidos de teste</h2><p>Não houve cobrança nem reserva de estoque.</p>{orders.length ? <div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Estimativa</th><th>Data</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.customer_name}</td><td>{new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(o.total)}</td><td>{new Date(o.created_at).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div> : <p>Nenhum pedido registrado.</p>}</section>
    </main></div>;
}
