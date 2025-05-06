"use server";

import { createClient } from "@/utils/supabase/server";

export async function getPatientStatistic() {
  const supabase = await createClient();

  // Get all patients
  const { data: allPatients, error } = await supabase
    .from("patients")
    .select("id, created_at");

  if (error) throw error;

  const totalPatients = allPatients.length;

  // Define "new" as patients created in the last 30 days
  const THIRTY_DAYS_AGO = new Date();
  THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

  const newPatients = allPatients.filter(
    (patient) => new Date(patient.created_at) >= THIRTY_DAYS_AGO
  ).length;

  const oldPatients = totalPatients - newPatients;

  return {
    totalPatients,
    oldPatients,
    newPatients,
  };
}
