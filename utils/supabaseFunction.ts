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
