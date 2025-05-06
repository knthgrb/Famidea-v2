"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DefaultAvatar from "@/components/common/DefaultAvatar";
import { useRouter } from "next/navigation";

// Helper for time formatting
const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Generate timeslots for a day
function generateTimeslots(start = 9, end = 18, interval = 30) {
  const slots = [];
  let current = new Date();
  current.setHours(start, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(end, 0, 0, 0);
  while (current < endTime) {
    const slotStart = new Date(current);
    current.setMinutes(current.getMinutes() + interval);
    const slotEnd = new Date(current);
    slots.push({
      start: new Date(slotStart),
      end: new Date(slotEnd),
      available: false,
    });
  }
  return slots;
}

function generateTimeslotsForDate(
  date: Date,
  start = 9,
  end = 18,
  interval = 30
) {
  const slots = [];
  let current = new Date(date);
  current.setHours(start, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(end, 0, 0, 0);
  while (current < endTime) {
    const slotStart = new Date(current);
    current.setMinutes(current.getMinutes() + interval);
    const slotEnd = new Date(current);
    slots.push({
      start: new Date(slotStart),
      end: new Date(slotEnd),
      available: false,
    });
  }
  return slots;
}

export default function AppointmentsPage() {
  // State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTimeslotModal, setShowTimeslotModal] = useState(false);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [interval, setInterval] = useState(30);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [activeTab, setActiveTab] = useState<"appointments" | "timeslots">(
    "appointments"
  );

  const [birthCenterId, setBirthCenterId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null
  );
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  // Add router to existing state declarations
  const router = useRouter();

  // Fetch patients (can be done independently)
  useEffect(() => {
    const fetchPatients = async () => {
      const supabase = createClient();
      const { data: patients } = await supabase.from("patients").select("*");
      setPatients(patients || []);
    };
    fetchPatients();
  }, []);

  // Fetch appointments for the specific birth center
  useEffect(() => {
    if (!birthCenterId) return;
    const fetchAppointments = async () => {
      const supabase = createClient();
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("birth_center_id", birthCenterId)
        .order("appointment_date", { ascending: true });
      setAppointments(appointments || []);
    };
    fetchAppointments();
  }, [birthCenterId]);

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

  // Fetch services as well
  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient();
      const { data: services } = await supabase.from("services").select("*");
      setServices(services || []);
    };
    fetchServices();
  }, []);

  // Get patient info by id
  const getPatient = (id: string) => patients.find((p) => p.id === id);

  // Helper to get service info
  const getService = (id: string) => services.find((s) => s.id === id);

  // Calendar logic
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();

  // Timeslot modal logic
  const openTimeslotModal = (date: Date) => {
    setSelectedDate(date);

    // Find appointments for this date
    const apptsForDate = appointments.filter((appt) => {
      const apptDate = new Date(appt.appointment_date);
      return (
        apptDate.getDate() === date.getDate() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getFullYear() === date.getFullYear()
      );
    });

    // Generate slots and mark as booked if overlapping with any appointment
    const slots = generateTimeslotsForDate(
      date,
      startHour,
      endHour,
      interval
    ).map((slot) => {
      const isBooked = apptsForDate.some((appt) => {
        const apptStart = new Date(appt.appointment_date);
        const apptEnd = new Date(apptStart.getTime() + 60 * 60 * 1000); // 1 hour appt
        // Check overlap
        return slot.start < apptEnd && slot.end > apptStart;
      });
      return { ...slot, booked: isBooked, available: !isBooked };
    });

    setTimeslots(slots);
    setActiveTab(isPastDate(date) ? "appointments" : "appointments");
    setShowTimeslotModal(true);
  };

  const toggleSlot = (idx: number) => {
    setTimeslots((slots) =>
      slots.map((slot, i) =>
        i === idx ? { ...slot, available: !slot.available } : slot
      )
    );
  };

  const markAll = (available: boolean) => {
    setTimeslots((slots) => slots.map((slot) => ({ ...slot, available })));
  };

  const saveTimeslots = async () => {
    if (!selectedDate || !birthCenterId) return;
    const supabase = createClient();

    // Only save available slots
    const availableSlots = timeslots
      .filter((slot) => slot.available)
      .map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }));

    // Upsert (insert or update) the timeslots for this date and birth_center
    const { error } = await supabase.from("timeslots").upsert(
      [
        {
          birth_center_id: birthCenterId,
          date: new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          ).toISOString(),
          slots: JSON.stringify(availableSlots),
        },
      ],
      { onConflict: "birth_center_id,date" }
    );

    if (error) {
      alert("Failed to save timeslots: " + error.message);
    } else {
      setShowTimeslotModal(false);
    }
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Add this function to handle messaging
  const handleMessagePatient = (patientId: string) => {
    router.push(`/birth-center/messages?patient=${patientId}`);
  };

  // Add this function to handle status update and notification
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
      <h1 className="text-3xl font-bold mb-4">Appointments</h1>
      <div className="flex gap-6 flex-col w-full lg:flex-row">
        {/* Appointment List */}
        <section className="bg-[#d6ecee] rounded-2xl p-6 w-full lg:w-80 flex flex-col">
          <h2 className="font-bold text-lg mb-4">Today's Appointments</h2>
          <div className="flex-1 flex flex-col gap-4">
            {appointments
              .filter((appt) => {
                const apptDate = new Date(appt.appointment_date);
                const today = new Date();
                return (
                  apptDate.getDate() === today.getDate() &&
                  apptDate.getMonth() === today.getMonth() &&
                  apptDate.getFullYear() === today.getFullYear()
                );
              })
              .map((appt) => {
                const patient = getPatient(appt.patient_id);
                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(appt);
                      setShowAppointmentModal(true);
                    }}
                  >
                    {patient?.profile_picture_url ? (
                      <img
                        src={patient.profile_picture_url}
                        alt="avatar"
                        className="w-12 h-12 rounded-full border-4 border-yellow-300"
                      />
                    ) : (
                      <div className="border-4 border-yellow-300 rounded-full">
                        <DefaultAvatar
                          name={
                            patient
                              ? `${patient.first_name} ${patient.last_name}`
                              : "?"
                          }
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-[#3ba39c]">
                        {patient
                          ? `${patient.first_name} ${patient.last_name}`
                          : "Unknown"}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {formatTime(new Date(appt.appointment_date))} -{" "}
                        {formatTime(
                          new Date(
                            new Date(appt.appointment_date).getTime() +
                              60 * 60 * 1000
                          )
                        )}
                      </div>
                      <div
                        className={`text-xs ${
                          appt.status === "approved"
                            ? "text-green-600"
                            : appt.status === "rejected"
                            ? "text-red-600"
                            : appt.status === "completed"
                            ? "text-blue-600"
                            : appt.status === "cancelled"
                            ? "text-gray-600"
                            : "text-yellow-600"
                        }`}
                      >
                        Status: {appt.status}
                      </div>
                    </div>
                    <span className="ml-auto text-xl">🕒</span>
                  </div>
                );
              })}
          </div>
          <Button
            className="mt-8 w-full bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] text-white"
            onClick={() => router.push("/birth-center/appointments/all")}
          >
            See All
          </Button>
        </section>

        {/* Appointment Calendar */}
        <section className="bg-[#d6ecee] rounded-2xl p-6 flex-1 flex flex-col">
          <h2 className="font-bold text-lg mb-4">Appointment Calendar</h2>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              onClick={() =>
                setCalendarMonth((m) =>
                  m === 0 ? (setCalendarYear((y) => y - 1), 11) : m - 1
                )
              }
            >
              &lt;
            </Button>
            <span className="text-2xl font-bold">
              {new Date(calendarYear, calendarMonth).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button
              variant="ghost"
              onClick={() =>
                setCalendarMonth((m) =>
                  m === 11 ? (setCalendarYear((y) => y + 1), 0) : m + 1
                )
              }
            >
              &gt;
            </Button>
          </div>
          <div className="overflow-auto border-4 rounded-xl border-black bg-[#eaf6f7]">
            <table className="w-full text-center">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <th key={d} className="bg-[#d6f5d6] py-2">
                        {d}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, weekIdx) => (
                  <tr key={weekIdx}>
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const day = weekIdx * 7 + dayIdx - firstDay + 1;
                      const date = new Date(calendarYear, calendarMonth, day);
                      const isCurrentMonth = day > 0 && day <= daysInMonth;
                      // Find appointment for this day
                      const appt = appointments.find((a) => {
                        const apptDate = new Date(a.appointment_date);
                        return (
                          apptDate.getDate() === day &&
                          apptDate.getMonth() === calendarMonth &&
                          apptDate.getFullYear() === calendarYear
                        );
                      });
                      return (
                        <td
                          key={dayIdx}
                          className={`h-20 w-32 border border-black align-top relative cursor-pointer ${
                            isCurrentMonth ? "" : "bg-gray-100"
                          }`}
                          onClick={() =>
                            isCurrentMonth && openTimeslotModal(date)
                          }
                        >
                          <div className="absolute top-1 left-1 font-bold">
                            {isCurrentMonth ? day : ""}
                          </div>
                          {isCurrentMonth && (
                            <div className="mt-6 mx-1 max-h-16 overflow-y-auto">
                              {appointments
                                .filter((a) => {
                                  const apptDate = new Date(a.appointment_date);
                                  return (
                                    apptDate.getDate() === day &&
                                    apptDate.getMonth() === calendarMonth &&
                                    apptDate.getFullYear() === calendarYear
                                  );
                                })
                                .map((appt, idx) => {
                                  const service = getService(appt.service_id);
                                  const patient = getPatient(appt.patient_id);
                                  return (
                                    <div
                                      key={idx}
                                      className="mb-1 p-1 text-xs rounded bg-blue-300 text-left"
                                    >
                                      <div className="font-semibold truncate">
                                        {patient?.profile_picture_url ? (
                                          <img
                                            src={patient.profile_picture_url}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full border-2 border-yellow-300"
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
                                      </div>
                                      <div className="text-blue-800 truncate">
                                        {service
                                          ? service.description
                                          : "Unknown Service"}
                                      </div>
                                      <div className="text-blue-900">
                                        {formatTime(
                                          new Date(appt.appointment_date)
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Timeslot Modal */}
      <Dialog open={showTimeslotModal} onOpenChange={setShowTimeslotModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
            </DialogTitle>
          </DialogHeader>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`flex-1 py-2 font-semibold ${
                activeTab === "appointments"
                  ? "border-b-2 border-[#3ba39c] text-[#3ba39c]"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("appointments")}
            >
              Appointments
            </button>
            {!selectedDate || !isPastDate(selectedDate) ? (
              <button
                className={`flex-1 py-2 font-semibold ${
                  activeTab === "timeslots"
                    ? "border-b-2 border-[#3ba39c] text-[#3ba39c]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("timeslots")}
              >
                Manage Timeslots
              </button>
            ) : null}
          </div>
          {/* Tab Content */}
          {activeTab === "appointments" ? (
            <div className="mb-4">
              {appointments
                .filter((appt) => {
                  const apptDate = new Date(appt.appointment_date);
                  return (
                    selectedDate &&
                    apptDate.getDate() === selectedDate.getDate() &&
                    apptDate.getMonth() === selectedDate.getMonth() &&
                    apptDate.getFullYear() === selectedDate.getFullYear()
                  );
                })
                .map((appt) => {
                  const patient = getPatient(appt.patient_id);
                  return (
                    <div key={appt.id} className="flex items-center gap-3 mb-2">
                      {patient?.profile_picture_url ? (
                        <img
                          src={patient.profile_picture_url}
                          alt="avatar"
                          className="w-10 h-10 rounded-full border-2 border-yellow-300"
                        />
                      ) : (
                        <div className="border-2 border-yellow-300 rounded-full">
                          <DefaultAvatar
                            name={
                              patient
                                ? `${patient.first_name} ${patient.last_name}`
                                : "?"
                            }
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[#3ba39c]">
                          {patient
                            ? `${patient.first_name} ${patient.last_name}`
                            : "Unknown"}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {formatTime(new Date(appt.appointment_date))}
                        </div>
                      </div>
                      <span className="ml-auto text-xl">🕒</span>
                    </div>
                  );
                })}
              {appointments.filter((appt) => {
                const apptDate = new Date(appt.appointment_date);
                return (
                  selectedDate &&
                  apptDate.getDate() === selectedDate.getDate() &&
                  apptDate.getMonth() === selectedDate.getMonth() &&
                  apptDate.getFullYear() === selectedDate.getFullYear()
                );
              }).length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No appointments for this date.
                </div>
              )}
            </div>
          ) : !selectedDate || !isPastDate(selectedDate) ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-4">
                <div className="flex flex-col flex-1">
                  <label className="text-xs mb-1">Start</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-full"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i % 12 === 0 ? 12 : i % 12;
                      const ampm = i < 12 ? "AM" : "PM";
                      return (
                        <option key={i} value={i}>
                          {hour}:00 {ampm}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs mb-1">End</label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-full"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i % 12 === 0 ? 12 : i % 12;
                      const ampm = i < 12 ? "AM" : "PM";
                      return (
                        <option key={i} value={i}>
                          {hour}:00 {ampm}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs mb-1">Interval</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-full"
                  >
                    {[15, 30, 45, 60].map((v) => (
                      <option key={v} value={v}>
                        {v} mins
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setTimeslots(
                        generateTimeslots(startHour, endHour, Number(interval))
                      )
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto mb-2">
                {timeslots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-center cursor-pointer
                        ${
                          slot.booked
                            ? "bg-red-300 border-red-600 cursor-not-allowed opacity-60"
                            : slot.available
                            ? "bg-green-300 border-green-600"
                            : "bg-gray-200 border-gray-400"
                        }`}
                    onClick={() => !slot.booked && toggleSlot(idx)}
                  >
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                    {slot.booked && (
                      <span className="ml-2 text-xs text-red-700 font-bold">
                        Booked
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  onClick={() => markAll(true)}
                  className="flex-1"
                >
                  Mark All Available
                </Button>
                <Button
                  variant="outline"
                  onClick={() => markAll(false)}
                  className="flex-1"
                >
                  Clear All
                </Button>
              </div>
            </>
          ) : null}
          <DialogFooter>
            {activeTab === "timeslots" && (
              <Button
                onClick={saveTimeslots}
                className="bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] text-white"
              >
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-2">
              {(() => {
                const patient = getPatient(selectedAppointment.patient_id);
                const service = getService(selectedAppointment.service_id);
                return (
                  <>
                    <div className="flex items-center gap-3">
                      {patient?.profile_picture_url ? (
                        <img
                          src={patient.profile_picture_url}
                          alt="avatar"
                          className="w-12 h-12 rounded-full border-4 border-yellow-300"
                        />
                      ) : (
                        <div className="border-4 border-yellow-300 rounded-full">
                          <DefaultAvatar
                            name={
                              patient
                                ? `${patient.first_name} ${patient.last_name}`
                                : "?"
                            }
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[#3ba39c]">
                          {patient
                            ? `${patient.first_name} ${patient.last_name}`
                            : "Unknown"}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {patient?.contact_number}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Date: </span>
                      {new Date(
                        selectedAppointment.appointment_date
                      ).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Status: </span>
                      <select
                        value={selectedAppointment.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const success = await handleStatusUpdate(
                            selectedAppointment.id,
                            newStatus,
                            selectedAppointment.patient_id
                          );

                          if (success) {
                            setAppointments(
                              appointments.map((apt) =>
                                apt.id === selectedAppointment.id
                                  ? { ...apt, status: newStatus }
                                  : apt
                              )
                            );
                            setSelectedAppointment({
                              ...selectedAppointment,
                              status: newStatus,
                            });
                          }
                        }}
                        className={`ml-2 border rounded px-2 py-1 ${
                          selectedAppointment.status === "approved"
                            ? "text-green-600"
                            : selectedAppointment.status === "rejected"
                            ? "text-red-600"
                            : selectedAppointment.status === "completed"
                            ? "text-blue-600"
                            : selectedAppointment.status === "cancelled"
                            ? "text-gray-600"
                            : "text-yellow-600"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <span className="font-semibold">Service: </span>
                      {service ? service.description : "Unknown"}
                    </div>
                    <div>
                      <span className="font-semibold">Price: </span>
                      {service ? `₱${service.price}` : "N/A"}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="bg-teal-500 text-white hover:bg-teal-600 hover:text-white flex-1"
                        onClick={() =>
                          handleMessagePatient(selectedAppointment.patient_id)
                        }
                      >
                        Message Patient
                      </Button>
                    </div>
                  </>
                );
              })()}
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
