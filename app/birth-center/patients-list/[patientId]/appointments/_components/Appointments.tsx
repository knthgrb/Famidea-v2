"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  appointment_date: string;
  status: "approved" | "pending" | "cancelled" | "completed" | "rejected";
  service: {
    id: string;
    description: string;
    services_list: {
      id: string;
      name: string;
    };
  };
}

// Helper functions for date/time formatting
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "pending":
    case "approved":
      return "bg-yellow-500";
    case "cancelled":
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function PatientAppointmentsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const router = useRouter();
  const { patientId } = React.use(params);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    async function fetchAppointments() {
      const supabase = createClient();

      // Fetch patient name
      const { data: patientData } = await supabase
        .from("patients")
        .select("first_name, last_name")
        .eq("id", patientId)
        .single();

      if (patientData) {
        setPatientName(`${patientData.first_name} ${patientData.last_name}`);
      }

      // Fetch appointments with service details
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          status,
          service:services!service_id (
            id,
            description,
            services_list (
              id,
              name
            )
          )
        `
        )
        .eq("patient_id", patientId)
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      setAppointments(data as unknown as Appointment[]);
      setLoading(false);
    }

    fetchAppointments();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold capitalize">
          {patientName}'s Appointments
        </h1>
      </div>
      <p className="text-gray-600 mb-6">
        Showing all appointments from most recent
      </p>

      <div className="bg-[#d6ecee] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-[#b8e3e6] p-4 font-semibold">
          <div>Service</div>
          <div>Status</div>
          <div>Date</div>
          <div>Time</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#b8e3e6]">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="grid grid-cols-4 p-4 items-center hover:bg-[#c8e8ea] transition-colors"
              >
                <div>{appointment.service.services_list.name}</div>
                <div>
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${getStatusColor(
                      appointment.status
                    )} mr-2`}
                  ></span>
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </div>
                <div>{formatDate(appointment.appointment_date)}</div>
                <div>{formatTime(appointment.appointment_date)}</div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No appointments found for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
