import React from "react";
import PatientDetailsPage from "./_components/PatientDetailsClient";

export default function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PatientDetailsPage params={params} />;
}
