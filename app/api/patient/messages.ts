"use server";
import { createClient } from "@/utils/supabase/server";

export async function getMessages(patientId: string, birthCenterId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select()
    .or(`sender_id.eq.${patientId},receiver_id.eq.${patientId}`)
    .eq("birth_center_id", birthCenterId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  birthCenterId: string,
  content: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      birth_center_id: birthCenterId,
      content,
    })
    .select();

  if (error) throw new Error(error.message);
  return data;
}
