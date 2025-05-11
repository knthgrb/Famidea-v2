import React from "react";
import { getTotalPatients } from "@/app/services/birth-center/patient";
import { getTotalAppointments } from "@/app/services/birth-center/appointment";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUnreadMessages } from "@/app/services/birth-center/messages";
import Link from "next/link";
import { getPatientStatistic } from "@/app/services/patient/patients";

export default async function DashboardClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get birth center details
  const { data: birthCenter } = await supabase
    .from("birth_centers")
    .select("id, total_rooms, available_rooms")
    .eq("user_id", user.id)
    .single();

  // Now we know birthCenter is not null
  const totalPatients = await getTotalPatients(birthCenter?.id);
  const totalAppointments = await getTotalAppointments(birthCenter?.id);
  const unreadMessages = await getUnreadMessages(birthCenter?.id);

  // --- Fetch patient statistics ---
  const {
    totalPatients: statTotal,
    newPatients,
    oldPatients,
  } = await getPatientStatistic(birthCenter?.id);

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 p-12">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Link href="/birth-center/patients-list" className="block">
            <div className="rounded-xl bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] p-8 text-white shadow border-2 border-[#b3e6e0] flex flex-col gap-2 hover:scale-105 transition-transform">
              <span className="text-2xl">🧑‍⚕️</span>
              <span className="text-lg font-medium">Total Patients</span>
              <span className="text-4xl font-bold">{totalPatients}</span>
            </div>
          </Link>

          <Link href="/birth-center/appointments" className="block">
            <div className="rounded-xl bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] p-8 text-white shadow border-2 border-[#b3e6e0] flex flex-col gap-2 hover:scale-105 transition-transform">
              <span className="text-2xl">🔖</span>
              <span className="text-lg font-medium">Appointments</span>
              <span className="text-4xl font-bold">{totalAppointments}</span>
            </div>
          </Link>

          <Link href="/birth-center/messages" className="block">
            <div className="rounded-xl bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] p-8 text-white shadow border-2 border-[#b3e6e0] flex flex-col gap-2 hover:scale-105 transition-transform">
              <span className="text-2xl">✉️</span>
              <span className="text-lg font-medium">Unread Messages</span>
              <span className="text-4xl font-bold">{unreadMessages}</span>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="flex flex-col md:flex-row gap-20 items-center">
          {/* Room Stats */}
          <div className="flex flex-col gap-10">
            <div>
              <div className="text-2xl font-medium mb-2">Total Rooms</div>
              <div className="text-3xl font-bold text-[#3ba39c]">
                {birthCenter?.total_rooms}
              </div>
            </div>
            <div>
              <div className="text-2xl font-medium mb-2">Available Rooms</div>
              <div className="text-3xl font-bold text-[#3ba39c]">
                {birthCenter?.available_rooms}
              </div>
            </div>
          </div>

          {/* Patient Statistics */}
          <div className="flex-1">
            <div className="text-3xl font-medium mb-4">Patient Statistics</div>
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <svg
                width="120"
                height="120"
                viewBox="0 0 42 42"
                className="block"
              >
                {/* Total Patients */}
                <circle
                  r="16"
                  cx="21"
                  cy="21"
                  fill="transparent"
                  stroke="#444"
                  strokeWidth="6"
                  strokeDasharray="100 100"
                  strokeDashoffset="0"
                />
                {/* New Patients */}
                <circle
                  r="16"
                  cx="21"
                  cy="21"
                  fill="transparent"
                  stroke="#b0bfc3"
                  strokeWidth="6"
                  strokeDasharray={`${
                    statTotal ? (newPatients / statTotal) * 100 : 0
                  } 100`}
                  strokeDashoffset="-25"
                />
                {/* Old Patients */}
                <circle
                  r="16"
                  cx="21"
                  cy="21"
                  fill="transparent"
                  stroke="#e5eaea"
                  strokeWidth="6"
                  strokeDasharray={`${
                    statTotal ? (oldPatients / statTotal) * 100 : 0
                  } 100`}
                  strokeDashoffset="-50"
                />
              </svg>
              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#444] inline-block"></span>
                  <span>Total Patients: {statTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#b0bfc3] inline-block"></span>
                  <span>New Patients: {newPatients}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#e5eaea] inline-block"></span>
                  <span>Old Patients: {oldPatients}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
