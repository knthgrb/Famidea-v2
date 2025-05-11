"use server";
import { createClient } from "@/utils/supabase/server";

export async function getPatientAppointments(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      birth_centers (
        name,
        address
      )
    `
    )
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAvailableTimeslots(
  birthCenterId: string,
  date: string
) {
  const supabase = await createClient();

  // Get all appointments for the selected date
  const { data: existingAppointments, error } = await supabase
    .from("appointments")
    .select("timeslot")
    .eq("birth_center_id", birthCenterId)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  // Generate available timeslots (9 AM to 5 PM, 1-hour intervals)
  const allTimeslots = Array.from({ length: 8 }, (_, i) => `${i + 9}:00`);
  const bookedTimeslots = existingAppointments.map((app) => app.timeslot);

  return allTimeslots.filter((slot) => !bookedTimeslots.includes(slot));
}
