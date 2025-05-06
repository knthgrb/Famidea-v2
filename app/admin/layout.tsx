"use client";
import React, { useState } from "react";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#fafbfb] overflow-hidden">
      <Sidebar open={open} setOpen={setOpen} />
      <main className="flex-1 overflow-auto">
        <Header open={open} setOpen={setOpen} />
        {children}
      </main>
    </div>
  );
}
