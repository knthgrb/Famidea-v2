"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    contact_number?: string;
    address?: string;
    profile_picture_url?: string;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", userId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function uploadProfilePicture(userId: string, file: File) {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("profile-pictures")
    .upload(fileName, file);

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

  await updateProfile(userId, { profile_picture_url: publicUrl });
  return publicUrl;
}
