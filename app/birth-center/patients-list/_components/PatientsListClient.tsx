"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";

// Types based on the database schema
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

interface Service {
  id: string;
  description: string;
  services_list: {
    id: number;
    name: string;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: "approved" | "pending" | "cancelled" | "completed" | "rejected";
  patient: Patient;
  service: Service;
}

export default function PatientsListPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [birthCenterId, setBirthCenterId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBirthCenterId() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get birth center ID for current user
      const { data: birthCenterData, error: birthCenterError } = await supabase
        .from("birth_centers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (birthCenterError) {
        console.error("Error fetching birth center:", birthCenterError);
        return;
      }

      setBirthCenterId(birthCenterData.id);
    }

    fetchBirthCenterId();
  }, []);

  useEffect(() => {
    async function fetchPatients() {
      if (!birthCenterId) return;

      const supabase = createClient();

      // Fetch appointments with patient and service details, filtered by birth center
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          status,
          patient:patients!patient_id (
            id,
            first_name,
            last_name,
            profile_picture_url
          ),
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
        .eq("birth_center_id", birthCenterId)
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        return;
      }

      setAppointments(data as any);
      setLoading(false);
    }

    if (birthCenterId) {
      fetchPatients();
    }
  }, [birthCenterId]);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
      case "approved": // keeping approved with same color as pending
        return "bg-yellow-500";
      case "cancelled":
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Function to format the status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Add this function to handle patient click
  const handlePatientClick = (patientId: string, appointmentId: string) => {
    router.push(
      `/birth-center/patients-list/${patientId}?appointmentId=${appointmentId}&service=${
        appointments.find((appointment) => appointment.id === appointmentId)
          ?.service.services_list.name
      }`
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Patients</h1>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Patients Yet
          </h3>
          <p className="text-gray-500">
            You haven't received any patient appointments yet. They will appear
            here once patients book appointments with your birth center.
          </p>
        </div>
      ) : (
        <div className="bg-[#d6ecee] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 bg-[#b8e3e6] p-4 font-semibold">
            <div>Name</div>
            <div>Service</div>
            <div>Status</div>
            <div>Date</div>
            <div>Time</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#b8e3e6]">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="grid grid-cols-5 p-4 items-center hover:bg-[#c8e8ea] cursor-pointer transition-colors"
                onClick={() =>
                  handlePatientClick(appointment.patient.id, appointment.id)
                }
              >
                <div className="text-[#3ba39c] font-medium capitalize">
                  {`${appointment.patient.first_name} ${appointment.patient.last_name}`}
                </div>
                <div>{appointment.service.services_list.name}</div>
                <div>
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${getStatusColor(
                      appointment.status
                    )} mr-2`}
                  ></span>
                  {formatStatus(appointment.status)}
                </div>
                <div>{formatDate(appointment.appointment_date)}</div>
                <div>{formatTime(appointment.appointment_date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend - Only show if there are appointments */}
      {appointments.length > 0 && (
        <div className="mt-6 flex gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span>Cancelled/Rejected</span>
          </div>
        </div>
      )}
    </div>
  );
}
