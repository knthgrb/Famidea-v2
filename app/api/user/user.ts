"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateUser(data: any) {
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.updateUser({
    data: data,
  });
  if (error) {
    throw new Error(error.message);
  }
  return { success: true, user: user?.user };
}

export const getUsers = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("auth.users")
    .select("count", { count: "exact" });

  if (error) {
    throw new Error(error.message);
  }
  return { data: data[0].count };
};
