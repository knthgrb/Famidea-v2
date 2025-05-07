"use server";
import { createClient } from "@/utils/supabase/server";

export async function getTotalMessages() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getUnreadMessages(birthCenterId: string) {
  const supabase = await createClient();

  console.log("Querying messages for birth center:", birthCenterId);

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .is("read_at", null)
    .eq("receiver_id", birthCenterId);

  if (error) {
    console.error("Error fetching unread messages:", error);
  }

  if (typeof count !== "number") {
    console.log("Count is not a number:", count);
    return 0;
  }

  return count;
}
