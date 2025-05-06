"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import DefaultAvatar from "@/components/common/DefaultAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

// Helper for time formatting
const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [birthCenterId, setBirthCenterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null
  );
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Fetch birth center id
  useEffect(() => {
    const fetchBirthCenter = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data } = await supabase
        .from("birth_centers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) setBirthCenterId(data.id);
    };
    fetchBirthCenter();
  }, []);

  // Fetch appointments with pagination
  useEffect(() => {
    if (!birthCenterId) return;
    const fetchAppointments = async () => {
      const supabase = createClient();

      // Get total count
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .eq("birth_center_id", birthCenterId);

      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Get paginated data
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("birth_center_id", birthCenterId)
        .order("appointment_date", { ascending: false })
        .range(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE - 1
        );

      setAppointments(appointments || []);
    };
    fetchAppointments();
  }, [birthCenterId, currentPage]);

  // Fetch patients and services
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [patientsResponse, servicesResponse] = await Promise.all([
        supabase.from("patients").select("*"),
        supabase.from("services").select("*"),
      ]);
      setPatients(patientsResponse.data || []);
      setServices(servicesResponse.data || []);
    };
    fetchData();
  }, []);

  const getPatient = (id: string) => patients.find((p) => p.id === id);
  const getService = (id: string) => services.find((s) => s.id === id);

  // Move handleStatusUpdate inside the component
  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: string,
    patientId: string
  ) => {
    const supabase = createClient();

    // Update appointment status
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (updateError) {
      alert("Failed to update status: " + updateError.message);
      return false;
    }

    // Create notification
    let notificationTitle = "";
    let notificationBody = "";

    switch (newStatus) {
      case "approved":
        notificationTitle = "Appointment Approved";
        notificationBody =
          "Your appointment has been approved by the birth center.";
        break;
      case "cancelled":
        notificationTitle = "Appointment Cancelled";
        notificationBody = "Your appointment has been cancelled.";
        break;
      case "completed":
        notificationTitle = "Appointment Completed";
        notificationBody = "Your appointment has been marked as completed.";
        break;
      case "rejected":
        notificationTitle = "Appointment Rejected";
        notificationBody =
          "Your appointment has been rejected by the birth center.";
        break;
      default:
        notificationTitle = "Appointment Status Updated";
        notificationBody = `Your appointment status has been updated to ${newStatus}.`;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "appointment_status",
        title: notificationTitle,
        body: notificationBody,
        patient_id: patientId,
        birth_center_id: birthCenterId,
        appointment_id: appointmentId,
        receiver_id: patientId,
        is_read: false,
      });

    if (notificationError) {
      alert("Failed to create notification: " + notificationError.message);
      return false;
    }

    return true;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">All Appointments</h1>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => {
              const patient = getPatient(appointment.patient_id);
              const service = getService(appointment.service_id);
              return (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {patient?.profile_picture_url ? (
                        <img
                          src={patient.profile_picture_url}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <DefaultAvatar
                          name={
                            patient
                              ? `${patient.first_name} ${patient.last_name}`
                              : "?"
                          }
                        />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient
                            ? `${patient.first_name} ${patient.last_name}`
                            : "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(
                        appointment.appointment_date
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(new Date(appointment.appointment_date))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {service?.description || "Unknown Service"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={appointment.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const success = await handleStatusUpdate(
                          appointment.id,
                          newStatus,
                          appointment.patient_id
                        );

                        if (success) {
                          setAppointments(
                            appointments.map((apt) =>
                              apt.id === appointment.id
                                ? { ...apt, status: newStatus }
                                : apt
                            )
                          );
                        }
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        appointment.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : appointment.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : appointment.status === "cancelled"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowAppointmentModal(true);
                      }}
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        <Button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="px-4 py-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>

      {/* Reuse the appointment modal from the main page */}
      <Dialog
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">
                    Patient
                  </h4>
                  <p className="text-base">
                    {getPatient(selectedAppointment.patient_id)
                      ? `${
                          getPatient(selectedAppointment.patient_id)?.first_name
                        } ${
                          getPatient(selectedAppointment.patient_id)?.last_name
                        }`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">
                    Service
                  </h4>
                  <p className="text-base">
                    {getService(selectedAppointment.service_id)?.description ||
                      "Unknown Service"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">Date</h4>
                  <p className="text-base">
                    {new Date(
                      selectedAppointment.appointment_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">Time</h4>
                  <p className="text-base">
                    {formatTime(new Date(selectedAppointment.appointment_date))}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">
                    Status
                  </h4>
                  <p className="text-base capitalize">
                    {selectedAppointment.status}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">Notes</h4>
                  <p className="text-base">
                    {selectedAppointment.notes || "No notes provided"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
              onClick={() => setShowAppointmentModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
