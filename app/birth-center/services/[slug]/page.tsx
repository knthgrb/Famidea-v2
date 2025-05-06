import React from "react";
import ServiceDetailsPage from "./_components/ServiceDetailsClient";

export default function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ServiceDetailsPage params={params} />;
}
