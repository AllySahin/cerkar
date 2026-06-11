// ============================================
// Cerkar Makina - Tip Tanımları
// ============================================

export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  cycle_time: number | null; // saniye/parça
  created_at: string;
}

export interface Machine {
  id: string;
  name: string;
  created_at: string;
}

export interface Personnel {
  id: string;
  name: string;
  created_at: string;
}

export interface ScrapReason {
  id: string;
  reason: string;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  product_id: string;
  machine_id: string | null;
  date: string;
  good_quantity: number;
  scrap_quantity: number;
  scrap_reason_id: string | null;
  total_quantity: number;
  start_time: string | null;  // "HH:MM:SS"
  end_time: string | null;    // "HH:MM:SS"
  break_duration: number;     // dakika
  created_at: string;
}

export interface ProductionLogWithRelations extends ProductionLog {
  products: Product;
  machines: Machine | null;
  scrap_reasons: ScrapReason | null;
  production_log_operators?: {
    personnel: {
      id: string;
      name: string;
    };
  }[];
}

// Form tipleri
export interface ProductFormEntry {
  product_id: string;
  machine_id: string;
  good_quantity: number;
  scrap_quantity: number;
  scrap_reason_id: string | null;
  cycle_time: number | null;   // saniye/parça (ürünün güncel değeri veya değiştirilmiş)
  start_time: string;          // "HH:MM"
  end_time: string;            // "HH:MM"
  break_duration: number;      // dakika
  personnel_ids: string[];     // seçilen operatörlerin ID listesi
}

// Kıyaslama tipleri
export interface ComparisonData {
  current_total: number;
  previous_total: number;
  previous_date: string | null;
  change_percent: number | null;
}

// Verim hesaplama
export interface EfficiencyData {
  available_minutes: number;   // (bitiş - başlangıç) - mola
  expected_output: number;     // kullanılabilir süre / çevrim süresi
  efficiency_percent: number;  // (sağlam / beklenen) * 100
}
