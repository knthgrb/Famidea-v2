"use server";

import { createClient } from "@/utils/supabase/server";

export async function getPatientStatistic(birthCenterId: string) {
  const supabase = await createClient();

  // Get all patients associated with this birth center
  const { data: patients, error } = await supabase
    .from("patients")
    .select("id, created_at")
    .in(
      "id",
      (
        await supabase
          .from("appointments")
          .select("patient_id")
          .eq("birth_center_id", birthCenterId)
      ).data?.map((a) => a.patient_id) || []
    );

  if (error) throw error;

  const totalPatients = patients?.length || 0;

  // Define "new" as patients created in the last 30 days
  const THIRTY_DAYS_AGO = new Date();
  THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

  const newPatients =
    patients?.filter(
      (patient) => new Date(patient.created_at) >= THIRTY_DAYS_AGO
    ).length || 0;

  const oldPatients = totalPatients - newPatients;

  return {
    totalPatients,
    oldPatients,
    newPatients,
  };
}
