"use server";
import { createClient } from "@/utils/supabase/server";

export async function getBirthCenterRegistrationStatus(user_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("birth_centers")
    .select("status")
    .eq("user_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
