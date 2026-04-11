"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductFormEntry, Profile, UserRole } from "@/lib/types";
import {
  hashPassword,
  setSession,
  getSessionUserId,
  clearSession,
} from "@/lib/auth";

// ============================================
// Yetkilendirme Yardımcıları
// ============================================

export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}

async function requireRole(role: UserRole) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Oturum açmanız gerekiyor.");
  if (role === "admin" && profile.role !== "admin") {
    throw new Error("Bu işlem için admin yetkisi gerekiyor.");
  }
  return profile;
}

// ============================================
// Oturum İşlemleri
// ============================================

export async function signIn(username: string, password: string) {
  const supabase = await createClient();
  const hash = await hashPassword(password);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("password_hash", hash)
    .single();

  if (error || !data) {
    throw new Error("Kullanıcı adı veya şifre hatalı.");
  }

  await setSession(data.id);
  return data as Profile;
}

export async function signOut() {
  await clearSession();
  revalidatePath("/", "layout");
}

// ============================================
// Kullanıcı Yönetimi (Sadece Admin)
// ============================================

export async function getProfiles() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  if (error) throw new Error(error.message);
  return data as Profile[];
}

export async function createUser(
  username: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  await requireRole("admin");

  if (password.length < 4) {
    throw new Error("Şifre en az 4 karakter olmalıdır.");
  }

  const supabase = await createClient();
  const hash = await hashPassword(password);

  const { error } = await supabase.from("profiles").insert({
    username: username.trim(),
    password_hash: hash,
    full_name: fullName.trim(),
    role,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("Bu kullanıcı adı zaten mevcut.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/kullanicilar");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/kullanicilar");
}

export async function deleteUser(userId: string) {
  await requireRole("admin");
  const profile = await getCurrentProfile();
  if (profile!.id === userId) {
    throw new Error("Kendi hesabınızı silemezsiniz.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/kullanicilar");
}

// ============================================
// Ürün İşlemleri
// ============================================

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  return data;
}

export async function updateProduct(id: string, name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/gecmis");
  revalidatePath("/dashboard");
}

export async function deleteProduct(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
}

// ============================================
// Makine İşlemleri
// ============================================

export async function getMachines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function createMachine(name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/makineler");
  return data;
}

export async function updateMachine(id: string, name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("machines")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/makineler");
  revalidatePath("/gecmis");
  revalidatePath("/dashboard");
}

export async function deleteMachine(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("machines").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/makineler");
}

// ============================================
// Üretim Kayıt İşlemleri
// ============================================

export async function saveProductionLogs(
  entries: ProductFormEntry[],
  date: string
) {
  await requireRole("admin");
  const supabase = await createClient();

  const rows = entries
    .filter((e) => e.good_quantity > 0 || e.scrap_quantity > 0)
    .map((e) => ({
      product_id: e.product_id,
      machine_id: e.machine_id || null,
      date,
      good_quantity: e.good_quantity,
      scrap_quantity: e.scrap_quantity,
    }));

  if (rows.length === 0) {
    throw new Error("En az bir kayıt için miktar girilmelidir.");
  }

  // NULL machine_id ile upsert sorun çıkardığı için sil+ekle kullanıyoruz
  for (const row of rows) {
    let deleteQuery = supabase
      .from("production_logs")
      .delete()
      .eq("product_id", row.product_id)
      .eq("date", row.date);

    if (row.machine_id) {
      deleteQuery = deleteQuery.eq("machine_id", row.machine_id);
    } else {
      deleteQuery = deleteQuery.is("machine_id", null);
    }

    const { error: delError } = await deleteQuery;
    if (delError) throw new Error(delError.message);
  }

  const { error } = await supabase.from("production_logs").insert(rows);

  if (error) throw new Error(error.message);
  revalidatePath("/uretim");
  revalidatePath("/dashboard");
  revalidatePath("/gecmis");
  return { success: true, count: rows.length };
}

export async function updateProductionLog(
  id: string,
  data: {
    product_id?: string;
    machine_id?: string | null;
    good_quantity?: number;
    scrap_quantity?: number;
    date?: string;
  }
) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("production_logs")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gecmis");
  revalidatePath("/dashboard");
  revalidatePath("/uretim");
}

export async function deleteProductionLog(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("production_logs")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/gecmis");
  revalidatePath("/dashboard");
  revalidatePath("/uretim");
}

// ============================================
// Dashboard Veri Çekme
// ============================================

export async function getComparisonData(
  productId: string,
  currentDate: string,
  machineId: string | null
) {
  const supabase = await createClient();

  let currentQuery = supabase
    .from("production_logs")
    .select("total_quantity")
    .eq("product_id", productId)
    .eq("date", currentDate);

  let previousQuery = supabase
    .from("production_logs")
    .select("total_quantity, date")
    .eq("product_id", productId)
    .lt("date", currentDate)
    .order("date", { ascending: false })
    .limit(1);

  if (machineId) {
    currentQuery = currentQuery.eq("machine_id", machineId);
    previousQuery = previousQuery.eq("machine_id", machineId);
  } else {
    currentQuery = currentQuery.is("machine_id", null);
    previousQuery = previousQuery.is("machine_id", null);
  }

  const { data: current } = await currentQuery.single();
  const { data: previous } = await previousQuery.single();

  if (!current) return null;

  const currentTotal = current.total_quantity;
  const previousTotal = previous?.total_quantity ?? null;
  const previousDate = previous?.date ?? null;

  let changePercent: number | null = null;
  if (previousTotal !== null && previousTotal > 0) {
    changePercent =
      ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  return {
    current_total: currentTotal,
    previous_total: previousTotal ?? 0,
    previous_date: previousDate,
    change_percent: changePercent,
  };
}

export async function getDashboardData(date: string) {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("production_logs")
    .select("*, products(id, name), machines(id, name)")
    .eq("date", date)
    .order("created_at");

  if (error) throw new Error(error.message);

  const logsWithComparison = await Promise.all(
    (logs ?? []).map(async (log) => {
      const comparison = await getComparisonData(
        log.product_id,
        date,
        log.machine_id
      );
      return { ...log, comparison };
    })
  );

  return logsWithComparison;
}

export async function getAvailableDates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_logs")
    .select("date")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);

  const uniqueDates = [...new Set(data?.map((d) => d.date))];
  return uniqueDates;
}

// ============================================
// Geçmiş Veriler
// ============================================

export async function getHistoricalLogs(limit = 100) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_logs")
    .select("*, products(id, name), machines(id, name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================
// Rapor Verisi
// ============================================

export async function getReportData(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_logs")
    .select("*, products(id, name), machines(id, name)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
