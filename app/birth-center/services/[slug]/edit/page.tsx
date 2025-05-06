import React from "react";
import EditServicePage from "../_components/EditServicePage";

export default function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <EditServicePage params={params} />;
}
