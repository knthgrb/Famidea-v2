"use client";
import { Toaster } from "@/components/ui/sonner";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
