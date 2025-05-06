"use client";
import React from "react";

export default function LogoutComponent({
  logoutAction,
}: {
  logoutAction: () => void;
}) {
  return (
    <form action={logoutAction} className="mt-auto">
      <button
        type="submit"
        className="flex items-center gap-2 px-6 py-3 text-muted-foreground font-semibold cursor-pointer"
      >
        <span className="text-xl">⎋</span>
        <span>Sign Out</span>
      </button>
    </form>
  );
}
