"use server";

// ==============================================
// Supabase CRUD操作（Server Actions）
// すべてのデータベース操作をこのファイルに集約
// ==============================================

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// シフト枠の型定義
export type ShiftSlot = {
  id?: string;
  day_of_week: number; // 0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日
  start_time: string; // "HH:MM" 形式
  end_time: string; // "HH:MM" 形式
  created_at?: string;
};

/**
 * シフト枠を一括挿入する
 * @param slots - 挿入するシフト枠の配列
 * @returns 挿入結果（成功時はデータ、失敗時はエラー）
 */
export async function insertShiftSlots(
  slots: Omit<ShiftSlot, "id" | "created_at">[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("shift_slots")
      .insert(slots)
      .select();

    if (error) {
      console.error("シフト枠の挿入エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length ?? 0 };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの保存中にエラーが発生しました" };
  }
}

/**
 * すべてのシフト枠を取得する
 * @returns シフト枠の配列
 */
export async function fetchShiftSlots(): Promise<{
  success: boolean;
  data?: ShiftSlot[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("shift_slots")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("シフト枠の取得エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ShiftSlot[] };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの取得中にエラーが発生しました" };
  }
}

/**
 * すべてのシフト枠を削除する（再生成用）
 * @returns 削除結果
 */
export async function deleteAllShiftSlots(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // gte で全行を対象にして削除
    const { error } = await supabase
      .from("shift_slots")
      .delete()
      .gte("day_of_week", 0);

    if (error) {
      // テーブルが存在しない場合（42P01）は無視して続行
      if (error.code === "42P01") {
        return { success: true };
      }
      console.error("シフト枠の削除エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの削除中にエラーが発生しました" };
  }
}

// ==============================================
// カレンダー予定オブジェクト
// ==============================================

export type CalendarObjectAttr = {
  name: string;
  value: string;
};

export type CalendarObject = {
  id?: string;
  name: string;
  attributes: CalendarObjectAttr[];
  created_at?: string;
};

/**
 * 予定オブジェクトを作成する
 */
export async function insertCalendarObject(
  obj: Omit<CalendarObject, "id" | "created_at">
): Promise<{ success: boolean; data?: CalendarObject; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("calendar_objects")
      .insert(obj)
      .select()
      .single();

    if (error) {
      console.error("オブジェクトの挿入エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CalendarObject };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの保存中にエラーが発生しました" };
  }
}

/**
 * すべての予定オブジェクトを取得する
 */
export async function fetchCalendarObjects(): Promise<{
  success: boolean;
  data?: CalendarObject[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("calendar_objects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("オブジェクトの取得エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CalendarObject[] };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの取得中にエラーが発生しました" };
  }
}

/**
 * 予定オブジェクトを更新する
 */
export async function updateCalendarObject(
  id: string,
  obj: Omit<CalendarObject, "id" | "created_at">
): Promise<{ success: boolean; data?: CalendarObject; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("calendar_objects")
      .update(obj)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("オブジェクトの更新エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CalendarObject };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの更新中にエラーが発生しました" };
  }
}

/**
 * 予定オブジェクトを削除する
 */
export async function deleteCalendarObject(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("calendar_objects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("オブジェクトの削除エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの削除中にエラーが発生しました" };
  }
}

// ==============================================
// シフト枠への予定割り当て (Shift Assignments)
// ==============================================

export type ShiftAssignment = {
  id?: string;
  shift_slot_id: string;
  calendar_object_id: string;
  created_at?: string;
};

/**
 * 予定を枠に割り当てる
 */
export async function insertShiftAssignment(
  assignment: Omit<ShiftAssignment, "id" | "created_at">
): Promise<{ success: boolean; data?: ShiftAssignment; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("shift_assignments")
      .insert(assignment)
      .select()
      .single();

    if (error) {
      console.error("割り当ての作成エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ShiftAssignment };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの保存中にエラーが発生しました" };
  }
}

/**
 * すべての割り当てを取得する
 */
export async function fetchShiftAssignments(): Promise<{
  success: boolean;
  data?: ShiftAssignment[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("shift_assignments")
      .select("*");

    if (error) {
      console.error("割り当ての取得エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ShiftAssignment[] };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの取得中にエラーが発生しました" };
  }
}

/**
 * 割り当てを削除する
 */
export async function deleteShiftAssignment(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("shift_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("割り当ての削除エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの削除中にエラーが発生しました" };
  }
}

/**
 * 指定した曜日・開始時間・終了時間に一致するシフト枠を検索し、
 * 見つからなければ新規作成して返す
 */
export async function findOrCreateShiftSlot(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): Promise<{ success: boolean; slotId?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 既存のslotを検索
    const { data: existing, error: fetchError } = await supabase
      .from("shift_slots")
      .select("id")
      .eq("day_of_week", dayOfWeek)
      .eq("start_time", startTime)
      .eq("end_time", endTime)
      .limit(1)
      .single();

    if (existing && !fetchError) {
      return { success: true, slotId: existing.id };
    }

    // 見つからなければ新規作成
    const { data: created, error: insertError } = await supabase
      .from("shift_slots")
      .insert({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime })
      .select("id")
      .single();

    if (insertError) {
      console.error("シフト枠の作成エラー:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, slotId: created.id };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "シフト枠の検索・作成中にエラーが発生しました" };
  }
}

// ==============================================
// スケジュール条件（Schedule Conditions）
// シフト枠への制約条件を管理
// ==============================================

export type ScheduleCondition = {
  id?: string;
  time_unit?: string;       // 'd' (1日), 'w' (1週間), 'm' (1ヶ月), 'y' (1年)
  condition_type?: string;  // "count" または "overlap"
  attribute_name: string;   // 対象の属性名 (e.g., "role")
  attribute_value: string;  // 属性の値 (e.g., "leader")
  attribute2_name?: string | null;  // overlap用の2つ目の属性名
  attribute2_value?: string | null; // overlap用の2つ目の属性値
  operator: string;         // 比較演算子 (e.g., ">=")
  required_count: number;   // 必要数 (e.g., 1)
  created_at?: string;
};

/**
 * スケジュール条件を作成する
 */
export async function insertScheduleCondition(
  condition: Omit<ScheduleCondition, "id" | "created_at">
): Promise<{ success: boolean; data?: ScheduleCondition; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("schedule_conditions")
      .insert(condition)
      .select()
      .single();

    if (error) {
      console.error("スケジュール条件の插入エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ScheduleCondition };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの保存中にエラーが発生しました" };
  }
}

/**
 * すべてのスケジュール条件を取得する
 */
export async function fetchScheduleConditions(): Promise<{
  success: boolean;
  data?: ScheduleCondition[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("schedule_conditions")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("スケジュール条件の取得エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ScheduleCondition[] };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの取得中にエラーが発生しました" };
  }
}

/**
 * スケジュール条件を削除する
 */
export async function deleteScheduleCondition(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("schedule_conditions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("スケジュール条件の削除エラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("予期しないエラー:", err);
    return { success: false, error: "データの削除中にエラーが発生しました" };
  }
}
