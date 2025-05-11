"use server";
import { createClient } from "@/utils/supabase/server";

export async function getNearbyBirthCenters(
  latitude: number,
  longitude: number,
  radius: number = 50 // radius in kilometers
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("nearby_birth_centers", {
    lat: latitude,
    long: longitude,
    radius_km: radius,
  });

  if (error) throw new Error(error.message);
  return data;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function addPreferredCenter(
  patientId: string,
  birthCenterId: string,
  note?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("preferred_centers")
    .insert({
      patient_id: patientId,
      birth_center_id: birthCenterId,
      note,
    })
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPreferredCenters(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("preferred_centers")
    .select(
      `
      id,
      note,
      birth_center:birth_centers!inner (
        id,
        name,
        address,
        contact_number,
        status,
        description,
        latitude,
        longitude,
        total_rooms,
        available_rooms,
        opening_time,
        closing_time,
        available_days,
        user_id
      )
    `
    )
    .eq("patient_id", patientId);

  if (error) throw new Error(error.message);
  return data;
}
