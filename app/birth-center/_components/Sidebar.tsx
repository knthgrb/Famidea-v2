"use client";
import { logout } from "@/app/services/auth/logout";
import Logo from "@/components/common/Logo";
import React, { useState } from "react";
import LogoutComponent from "./LogoutComponent";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    icon: "grid",
    href: "/birth-center/dashboard",
  },
  {
    label: "Appointments",
    icon: "calendar",
    href: "/birth-center/appointments",
  },
  { label: "Services", icon: "heart", href: "/birth-center/services" },
  { label: "Patients", icon: "user", href: "/birth-center/patients-list" },
  { label: "Messages", icon: "mail", href: "/birth-center/messages" },
  { label: "Settings", icon: "settings", href: "/birth-center/settings" },
];

const icons = {
  grid: <span className="text-xl">▦</span>,
  calendar: <span className="text-xl">🗓️</span>,
  heart: <span className="text-xl">❤️</span>,
  user: <span className="text-xl">👤</span>,
  "credit-card": <span className="text-xl">💳</span>,
  mail: <span className="text-xl">✉️</span>,
  settings: <span className="text-xl">⚙️</span>,
};

export default function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full bg-white min-h-screen w-60 flex flex-col py-8
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex
        `}
      >
        <div className="flex flex-col items-center gap-10">
          <Logo />
          <nav className="w-full flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 rounded-r-full font-semibold cursor-pointer transition
                  ${
                    pathname.startsWith(item.href)
                      ? "bg-gradient-to-r from-[#6fd6c5] to-[#3ba39c] text-white shadow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                  }`}
                onClick={() => setOpen(false)}
              >
                {icons[item.icon as keyof typeof icons]}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <LogoutComponent logoutAction={logout} />
      </aside>
    </>
  );
}
