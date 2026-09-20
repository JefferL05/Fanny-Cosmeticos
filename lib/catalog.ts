import { supabase } from "./supabase";
import type { Product } from "./types";

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("id,details,stock,reserved").eq("active", true).order("id");
  if (error) throw error;
  return (data || []).map(row => ({ ...row.details, id: row.id, stock: row.stock, reserved: row.reserved }));
}
