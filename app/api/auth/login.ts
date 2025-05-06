"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { data: user, error } = await supabase.auth.signInWithPassword(data);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
  return { success: true, user: user?.user };
}
