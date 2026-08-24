export type Category = "Todos" | "Skincare" | "Maquiagem" | "Cabelos" | "Kits";

export type Product = {
  id: string;
  sku: string;
  brand: string;
  name: string;
  category: Exclude<Category, "Todos">;
  concern: string;
  skinTypes: string[];
  price: number;
  compareAt?: number;
  pixPrice: number;
  installments: number;
  stock: number;
  reserved: number;
  lot: string;
  expiresAt: string;
  color: string;
  form: "pump" | "tube" | "jar" | "dropper";
  badge?: string;
  description: string;
  benefits: string[];
  ingredients: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
