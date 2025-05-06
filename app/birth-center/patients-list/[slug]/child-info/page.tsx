import React from "react";
import ChildInfoPage from "../_components/ChildInfo";

export default function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ChildInfoPage params={params} />;
}
