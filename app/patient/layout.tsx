import React from "react";
import Sidebar from "./_components/Sidebar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#fafbfb]">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
