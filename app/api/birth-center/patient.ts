"use server";
import { createClient } from "@/utils/supabase/server";

export async function getTotalPatients() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
