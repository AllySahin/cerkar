// ============================================
// Cerkar Makina - Tip Tanımları
// ============================================

export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  created_at: string;
}

export interface Machine {
  id: string;
  name: string;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  product_id: string;
  machine_id: string | null;
  date: string;
  good_quantity: number;
  scrap_quantity: number;
  total_quantity: number;
  created_at: string;
}

export interface ProductionLogWithRelations extends ProductionLog {
  products: Product;
  machines: Machine | null;
}

// Form tipleri
export interface ProductFormEntry {
  product_id: string;
  machine_id: string;
  good_quantity: number;
  scrap_quantity: number;
}

// Kıyaslama tipleri
export interface ComparisonData {
  current_total: number;
  previous_total: number;
  previous_date: string | null;
  change_percent: number | null;
}
