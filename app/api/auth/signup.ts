"use server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const userType = formData.get("userType") as string; // Get userType from form

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        user_type: userType,
        has_finished_onboarding: false,
      },
    },
  };

  const { data: signupData, error } = await supabase.auth.signUp(data);
  console.log(error);
  if (error) {
    // Show error to user
    if (error.message.includes("already registered")) {
      return { error: "User already exists" };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
