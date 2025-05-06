import React from "react";
import PatientAppointmentsPage from "../_components/Appointments";

export default function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PatientAppointmentsPage params={params} />;
}
