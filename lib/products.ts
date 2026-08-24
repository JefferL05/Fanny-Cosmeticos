import type { Product } from "./types";

export const products: Product[] = [
  {
    id: "p1", sku: "FAN-SER-001", brand: "Fanny Lab", name: "Sérum Calm Glow Centella", category: "Skincare",
    concern: "Sensibilidade", skinTypes: ["Sensível", "Mista"], price: 149.9, compareAt: 169.9, pixPrice: 142.4,
    installments: 5, stock: 18, reserved: 2, lot: "FG2408A", expiresAt: "2027-11-30", color: "mint", form: "dropper",
    badge: "Mais amado", description: "Sérum leve para uma rotina confortável, com acabamento luminoso e sem sensação pegajosa.",
    benefits: ["Textura leve", "Conforto para a pele", "Luminosidade suave"], ingredients: "Centella asiatica, pantenol, beta-glucana e ácido hialurônico."
  },
  {
    id: "p2", sku: "FAN-CRE-002", brand: "Mellow Seoul", name: "Creme Barrier Cloud", category: "Skincare",
    concern: "Barreira da pele", skinTypes: ["Seca", "Sensível"], price: 129.9, pixPrice: 123.4,
    installments: 4, stock: 7, reserved: 1, lot: "MS2407C", expiresAt: "2027-08-20", color: "rose", form: "jar",
    badge: "Novidade", description: "Creme macio com toque aveludado para finalizar o ritual noturno.",
    benefits: ["Hidratação duradoura", "Toque confortável", "Sem fragrância intensa"], ingredients: "Ceramidas, esqualano vegetal, glicerina e madecassoside."
  },
  {
    id: "p3", sku: "FAN-CLN-003", brand: "Dew & Rice", name: "Espuma Rice Milk Cleanser", category: "Skincare",
    concern: "Limpeza", skinTypes: ["Todos os tipos"], price: 89.9, pixPrice: 85.4,
    installments: 3, stock: 24, reserved: 3, lot: "DR2405B", expiresAt: "2027-05-18", color: "cream", form: "tube",
    description: "Limpador cremoso para remover impurezas sem deixar sensação de repuxamento.",
    benefits: ["Limpeza gentil", "Espuma cremosa", "Uso diário"], ingredients: "Água de arroz, glicerina, alantoína e surfactantes suaves."
  },
  {
    id: "p4", sku: "FAN-TON-004", brand: "Haneul Skin", name: "Tônico Heartleaf Balance", category: "Skincare",
    concern: "Oleosidade", skinTypes: ["Oleosa", "Mista"], price: 119.9, compareAt: 139.9, pixPrice: 113.9,
    installments: 4, stock: 12, reserved: 0, lot: "HS2406F", expiresAt: "2027-06-12", color: "sage", form: "pump",
    badge: "-14%", description: "Tônico aquoso para equilibrar a rotina e preparar a pele para as próximas etapas.",
    benefits: ["Sensação refrescante", "Textura aquosa", "Rápida absorção"], ingredients: "Heartleaf, hamamélis sem álcool, pantenol e betaína."
  },
  {
    id: "p5", sku: "FAN-SUN-005", brand: "Mori Beauty", name: "Protetor Daily Dew FPS 50", category: "Skincare",
    concern: "Proteção solar", skinTypes: ["Todos os tipos"], price: 109.9, pixPrice: 104.4,
    installments: 3, stock: 4, reserved: 1, lot: "MB2409P", expiresAt: "2027-09-28", color: "sky", form: "tube",
    badge: "Últimas unidades", description: "Protetor de textura fluida e acabamento confortável para uso cotidiano.",
    benefits: ["FPS 50", "Acabamento natural", "Sem resíduo branco aparente"], ingredients: "Filtros UV, niacinamida, arroz fermentado e vitamina E."
  },
  {
    id: "p6", sku: "FAN-LIP-006", brand: "Peach Han", name: "Lip Tint Soft Fig", category: "Maquiagem",
    concern: "Lábios", skinTypes: ["Todos os tipos"], price: 69.9, pixPrice: 66.4,
    installments: 2, stock: 20, reserved: 2, lot: "PH2410L", expiresAt: "2028-01-10", color: "berry", form: "pump",
    badge: "Best-seller", description: "Tint labial confortável, construível e com cor de figo suave.",
    benefits: ["Cor construível", "Toque confortável", "Acabamento translúcido"], ingredients: "Pigmentos cosméticos, óleo de jojoba e vitamina E."
  },
  {
    id: "p7", sku: "FAN-CUS-007", brand: "Mellow Seoul", name: "Cushion Skin Veil 21N", category: "Maquiagem",
    concern: "Cobertura leve", skinTypes: ["Normal", "Mista"], price: 179.9, pixPrice: 170.9,
    installments: 6, stock: 9, reserved: 2, lot: "MS2411K", expiresAt: "2028-02-14", color: "nude", form: "jar",
    description: "Base cushion de cobertura leve a média e acabamento natural luminoso.",
    benefits: ["Cobertura modulável", "Aplicação prática", "Acabamento natural"], ingredients: "Pigmentos minerais, niacinamida, glicerina e vitamina E."
  },
  {
    id: "p8", sku: "FAN-HAI-008", brand: "Root Seoul", name: "Máscara Capilar Camellia Silk", category: "Cabelos",
    concern: "Nutrição capilar", skinTypes: ["Todos os cabelos"], price: 119.9, pixPrice: 113.9,
    installments: 4, stock: 11, reserved: 1, lot: "RS2404M", expiresAt: "2027-04-30", color: "amber", form: "jar",
    description: "Máscara de textura rica para uma pausa de cuidado e maciez nos fios.",
    benefits: ["Maciez", "Brilho", "Desembaraço"], ingredients: "Óleo de camélia, aminoácidos, pantenol e manteiga de karité."
  },
  {
    id: "p9", sku: "FAN-KIT-009", brand: "Fanny Lab", name: "Kit Ritual Essencial", category: "Kits",
    concern: "Rotina completa", skinTypes: ["Todos os tipos"], price: 289.9, compareAt: 329.7, pixPrice: 275.4,
    installments: 6, stock: 6, reserved: 1, lot: "FL2412R", expiresAt: "2027-10-30", color: "lilac", form: "pump",
    badge: "Economize R$ 39,80", description: "Três passos para começar: limpeza gentil, hidratação e proteção diária.",
    benefits: ["Rotina simplificada", "Três produtos", "Presenteável"], ingredients: "Consulte a composição individual de cada item do kit."
  }
];

export const categories = ["Todos", "Skincare", "Maquiagem", "Cabelos", "Kits"] as const;
