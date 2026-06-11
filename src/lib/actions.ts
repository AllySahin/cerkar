"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductFormEntry, Profile, UserRole, ScrapReason } from "@/lib/types";
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
  try {
    const userId = await getSessionUserId();
    if (!userId) return null;

    // Fallback admin user
    if (userId === "admin-fallback-user-id") {
      return {
        id: userId,
        username: "admin",
        full_name: "Admin",
        role: "admin",
        created_at: new Date().toISOString(),
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[AUTH] getCurrentProfile error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[AUTH] getCurrentProfile exception:", err);
    return null;
  }
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
  try {
    // Fallback: Hardcoded admin user (development)
    if (username === "admin" && password === "admin") {
      console.log("[AUTH] Using fallback admin user");
      const adminProfile: Profile = {
        id: "admin-fallback-user-id",
        username: "admin",
        full_name: "Admin",
        role: "admin",
        created_at: new Date().toISOString(),
      };
      await setSession(adminProfile.id);
      return adminProfile;
    }

    const supabase = await createClient();
    const hash = await hashPassword(password);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("password_hash", hash)
      .single();

    if (error) {
      console.error("[AUTH] Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error("Kullanıcı adı veya şifre hatalı.");
    }

    if (!data) {
      console.warn("[AUTH] User not found:", username);
      throw new Error("Kullanıcı adı veya şifre hatalı.");
    }

    await setSession(data.id);
    return data as Profile;
  } catch (err) {
    console.error("[AUTH] SignIn error:", err);
    throw err;
  }
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error("[DB] getProducts error:", error);
      // Fallback test data
      return [
        { id: "test-1", name: "Test Ürün 1", created_at: new Date().toISOString() },
        { id: "test-2", name: "Test Ürün 2", created_at: new Date().toISOString() },
      ];
    }
    return data || [];
  } catch (err) {
    console.error("[DB] getProducts exception:", err);
    return [];
  }
}

export async function createProduct(name: string, cycleTime?: number | null) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ name: name.trim(), cycle_time: cycleTime ?? null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  return data;
}

export async function updateProduct(id: string, name: string, cycleTime?: number | null) {
  await requireRole("admin");
  const supabase = await createClient();
  const updateData: { name: string; cycle_time?: number | null } = { name: name.trim() };
  if (cycleTime !== undefined) updateData.cycle_time = cycleTime;
  const { error } = await supabase
    .from("products")
    .update(updateData)
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .order("name");

    if (error) {
      console.error("[DB] getMachines error:", error);
      // Fallback test data
      return [
        { id: "mach-1", name: "Makine 1", created_at: new Date().toISOString() },
        { id: "mach-2", name: "Makine 2", created_at: new Date().toISOString() },
      ];
    }
    return data || [];
  } catch (err) {
    console.error("[DB] getMachines exception:", err);
    return [];
  }
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
    .filter((e) => (Number(e.good_quantity) || 0) > 0 || (Number(e.scrap_quantity) || 0) > 0)
    .map((e) => {
      const scrapQty = Number(e.scrap_quantity) || 0;
      return {
        product_id: e.product_id,
        machine_id: e.machine_id || null,
        date,
        good_quantity: Number(e.good_quantity) || 0,
        scrap_quantity: scrapQty,
        scrap_reason_id: scrapQty > 0 ? (e.scrap_reason_id || null) : null,
        start_time: e.start_time || "08:00",
        end_time: e.end_time || "18:00",
        break_duration: Number(e.break_duration) || 0,
      };
    });

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

  const { data: insertedLogs, error } = await supabase
    .from("production_logs")
    .insert(rows)
    .select("id, product_id, machine_id");
    
  if (error) throw new Error(error.message);

  // İlişkili operatörleri (personnel_ids) kaydet
  if (insertedLogs && insertedLogs.length > 0) {
    const operatorRelations: { production_log_id: string; personnel_id: string }[] = [];
    
    for (const insertedLog of insertedLogs) {
      const matchedEntry = entries.find(
        (e) =>
          e.product_id === insertedLog.product_id &&
          (e.machine_id || null) === (insertedLog.machine_id || null)
      );
      
      if (matchedEntry && matchedEntry.personnel_ids && matchedEntry.personnel_ids.length > 0) {
        for (const pid of matchedEntry.personnel_ids) {
          operatorRelations.push({
            production_log_id: insertedLog.id,
            personnel_id: pid,
          });
        }
      }
    }
    
    if (operatorRelations.length > 0) {
      const { error: relError } = await supabase
        .from("production_log_operators")
        .insert(operatorRelations);
      if (relError) throw new Error(relError.message);
    }
  }

  // Çevrim süresi değiştiyse ürünleri güncelle
  const cycleTimeUpdates = entries
    .filter((e) => e.product_id && e.cycle_time !== null && e.cycle_time !== undefined)
    .reduce((acc, e) => {
      // Her ürün için son girilen cycle_time'ı al
      acc[e.product_id] = e.cycle_time as number;
      return acc;
    }, {} as Record<string, number>);

  for (const [productId, cycleTime] of Object.entries(cycleTimeUpdates)) {
    await supabase
      .from("products")
      .update({ cycle_time: cycleTime })
      .eq("id", productId);
  }

  revalidatePath("/uretim");
  revalidatePath("/dashboard");
  revalidatePath("/gecmis");
  revalidatePath("/urunler");
  return { success: true, count: rows.length };
}

export async function updateProductionLog(
  id: string,
  data: {
    product_id?: string;
    machine_id?: string | null;
    good_quantity?: number;
    scrap_quantity?: number;
    scrap_reason_id?: string | null;
    date?: string;
    personnel_ids?: string[];
  }
) {
  await requireRole("admin");
  const supabase = await createClient();
  let { personnel_ids, ...logData } = data;

  if (logData.scrap_quantity === 0) {
    logData.scrap_reason_id = null;
  }

  if (Object.keys(logData).length > 0) {
    const { error } = await supabase
      .from("production_logs")
      .update(logData)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (personnel_ids !== undefined) {
    // Mevcut ilişkileri temizle
    const { error: delError } = await supabase
      .from("production_log_operators")
      .delete()
      .eq("production_log_id", id);
    if (delError) throw new Error(delError.message);

    // Yeni ilişkileri ekle
    if (personnel_ids.length > 0) {
      const relationRows = personnel_ids.map((pid) => ({
        production_log_id: id,
        personnel_id: pid,
      }));
      const { error: insError } = await supabase
        .from("production_log_operators")
        .insert(relationRows);
      if (insError) throw new Error(insError.message);
    }
  }

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
    .select("*, products(id, name), machines(id, name), scrap_reasons(id, reason), production_log_operators(personnel(id, name))")
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
    .select("*, products(id, name), machines(id, name), scrap_reasons(id, reason), production_log_operators(personnel(id, name))")
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
    .select("*, products(id, name, cycle_time), machines(id, name), scrap_reasons(id, reason), production_log_operators(personnel(id, name))")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================
// Personel (Operatör) İşlemleri
// ============================================

export async function getPersonnel() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("personnel")
      .select("*")
      .order("name");

    if (error) {
      console.error("[DB] getPersonnel error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[DB] getPersonnel exception:", err);
    return [];
  }
}

export async function createPersonnel(name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personnel")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/personel");
  return data;
}

export async function updatePersonnel(id: string, name: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("personnel")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/personel");
  revalidatePath("/gecmis");
  revalidatePath("/dashboard");
}

export async function deletePersonnel(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("personnel").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/personel");
}

// ============================================
// Hurda Sebepleri İşlemleri
// ============================================

export async function getScrapReasons(): Promise<ScrapReason[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scrap_reasons")
      .select("*")
      .order("reason");

    if (error) {
      console.error("[DB] getScrapReasons error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[DB] getScrapReasons exception:", err);
    return [];
  }
}

export async function createScrapReason(reason: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scrap_reasons")
    .insert({ reason: reason.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/hurda-sebepleri");
  revalidatePath("/uretim");
  return data;
}

export async function updateScrapReason(id: string, reason: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("scrap_reasons")
    .update({ reason: reason.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/hurda-sebepleri");
  revalidatePath("/uretim");
  revalidatePath("/gecmis");
  revalidatePath("/rapor");
}

export async function deleteScrapReason(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("scrap_reasons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/hurda-sebepleri");
  revalidatePath("/uretim");
  revalidatePath("/gecmis");
  revalidatePath("/rapor");
}

// ============================================
// Verim İstatistikleri
// ============================================

/** Bir production_log kaydından verim % hesaplar. NULL ise null döner. */
function calcEfficiency(log: {
  good_quantity: number;
  start_time: string | null;
  end_time: string | null;
  break_duration: number;
  cycle_time: number | null; // saniye
}): number | null {
  const { good_quantity, start_time, end_time, break_duration, cycle_time } = log;
  if (!start_time || !end_time || !cycle_time || cycle_time <= 0) return null;

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const available = toMinutes(end_time) - toMinutes(start_time) - (break_duration ?? 0);
  if (available <= 0) return null;

  const expectedOutput = (available * 60) / cycle_time;
  if (expectedOutput <= 0) return null;

  return Math.round((good_quantity / expectedOutput) * 100);
}

export interface MachineLogSummary {
  date: string;
  product_name: string;
  start_time: string | null;
  end_time: string | null;
  break_duration: number;
  good_quantity: number;
  efficiency_percent: number | null;
  working_minutes: number | null;
}

export interface MachineStat {
  id: string;
  name: string;
  avg_efficiency: number | null;
  total_working_minutes: number;
  log_count: number;
  logs: MachineLogSummary[];
}

export async function getMachineStats(startDate?: string, endDate?: string): Promise<MachineStat[]> {
  const supabase = await createClient();

  const { data: machines, error: mErr } = await supabase
    .from("machines")
    .select("id, name")
    .order("name");

  if (mErr || !machines) return [];

  let query = supabase
    .from("production_logs")
    .select(
      "id, machine_id, date, good_quantity, start_time, end_time, break_duration, products(name, cycle_time)"
    );

  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data: logs, error: lErr } = await query.order("date", { ascending: false });

  if (lErr || !logs) {
    return machines.map((m) => ({
      id: m.id,
      name: m.name,
      avg_efficiency: null,
      total_working_minutes: 0,
      log_count: 0,
      logs: [],
    }));
  }

  return machines.map((machine) => {
    const machineLogs = logs.filter((l) => l.machine_id === machine.id);

    const summaries: MachineLogSummary[] = machineLogs.map((l) => {
      const product = l.products as unknown as { name: string; cycle_time: number | null } | null;
      const toMin = (t: string | null) => {
        if (!t) return null;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const startMin = toMin(l.start_time);
      const endMin = toMin(l.end_time);
      const working = startMin !== null && endMin !== null
        ? endMin - startMin - (l.break_duration ?? 0)
        : null;

      return {
        date: l.date,
        product_name: product?.name ?? "—",
        start_time: l.start_time,
        end_time: l.end_time,
        break_duration: l.break_duration ?? 0,
        good_quantity: l.good_quantity,
        working_minutes: working && working > 0 ? working : null,
        efficiency_percent: calcEfficiency({
          good_quantity: l.good_quantity,
          start_time: l.start_time,
          end_time: l.end_time,
          break_duration: l.break_duration ?? 0,
          cycle_time: product?.cycle_time ?? null,
        }),
      };
    });

    const withEff = summaries.filter((s) => s.efficiency_percent !== null);
    const avg =
      withEff.length > 0
        ? Math.round(withEff.reduce((acc, s) => acc + s.efficiency_percent!, 0) / withEff.length)
        : null;

    const totalWorking = summaries.reduce((acc, s) => acc + (s.working_minutes ?? 0), 0);

    return {
      id: machine.id,
      name: machine.name,
      avg_efficiency: avg,
      total_working_minutes: totalWorking,
      log_count: machineLogs.length,
      logs: summaries,
    };
  });
}

export interface PersonnelLogSummary {
  date: string;
  product_name: string;
  machine_name: string;
  good_quantity: number;
  efficiency_percent: number | null;
}

export interface PersonnelStat {
  id: string;
  name: string;
  avg_efficiency: number | null;
  log_count: number;
  logs: PersonnelLogSummary[];
}

export async function getPersonnelStats(startDate?: string, endDate?: string): Promise<PersonnelStat[]> {
  const supabase = await createClient();

  const { data: personnelList, error: pErr } = await supabase
    .from("personnel")
    .select("id, name")
    .order("name");

  if (pErr || !personnelList) return [];

  let query = supabase
    .from("production_log_operators")
    .select(
      "personnel_id, production_logs!inner(id, date, good_quantity, start_time, end_time, break_duration, products(name, cycle_time), machines(name))"
    );

  if (startDate) {
    query = query.gte("production_logs.date", startDate);
  }
  if (endDate) {
    query = query.lte("production_logs.date", endDate);
  }

  const { data: relations, error: rErr } = await query;

  if (rErr || !relations) {
    return personnelList.map((p) => ({
      id: p.id,
      name: p.name,
      avg_efficiency: null,
      log_count: 0,
      logs: [],
    }));
  }

  return personnelList.map((person) => {
    const personRelations = relations.filter((r) => r.personnel_id === person.id);

    const summaries: PersonnelLogSummary[] = personRelations.map((r) => {
      const log = r.production_logs as unknown as {
        id: string;
        date: string;
        good_quantity: number;
        start_time: string | null;
        end_time: string | null;
        break_duration: number;
        products: { name: string; cycle_time: number | null } | null;
        machines: { name: string } | null;
      } | null;

      if (!log) {
        return { date: "", product_name: "—", machine_name: "—", good_quantity: 0, efficiency_percent: null };
      }

      return {
        date: log.date,
        product_name: log.products?.name ?? "—",
        machine_name: log.machines?.name ?? "—",
        good_quantity: log.good_quantity,
        efficiency_percent: calcEfficiency({
          good_quantity: log.good_quantity,
          start_time: log.start_time,
          end_time: log.end_time,
          break_duration: log.break_duration ?? 0,
          cycle_time: log.products?.cycle_time ?? null,
        }),
      };
    });

    const withEff = summaries.filter((s) => s.efficiency_percent !== null);
    const avg =
      withEff.length > 0
        ? Math.round(withEff.reduce((acc, s) => acc + s.efficiency_percent!, 0) / withEff.length)
        : null;

    return {
      id: person.id,
      name: person.name,
      avg_efficiency: avg,
      log_count: personRelations.length,
      logs: summaries.sort((a, b) => b.date.localeCompare(a.date)),
    };
  });
}
