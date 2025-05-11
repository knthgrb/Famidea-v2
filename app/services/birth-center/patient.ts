"use server";
import { createClient } from "@/utils/supabase/server";

export async function getTotalPatients(birthCenterId: string) {
  const supabase = await createClient();

  // Get all patients associated with this birth center through appointments
  const { data: patients, error } = await supabase
    .from("patients")
    .select("id")
    .in(
      "id",
      (
        await supabase
          .from("appointments")
          .select("patient_id")
          .eq("birth_center_id", birthCenterId)
      ).data?.map((a) => a.patient_id) || []
    );

  if (error) {
    throw new Error(error.message);
  }

  return patients?.length || 0;
}
