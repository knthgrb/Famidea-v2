import React from "react";
import PatientAppointmentsPage from "./_components/Appointments";

export default function page({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  return <PatientAppointmentsPage params={params} />;
}
