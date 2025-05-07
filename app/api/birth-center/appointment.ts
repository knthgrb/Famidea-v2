"use server";
import { createClient } from "@/utils/supabase/server";

export async function getTotalAppointments(birthCenterId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("birth_center_id", birthCenterId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
