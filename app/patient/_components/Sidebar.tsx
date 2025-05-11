"use client";
import { logout } from "@/app/services/auth/logout";
import Logo from "@/components/common/Logo";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutComponent from "./LogoutComponent";
const navItems = [
  {
    label: "Birth Centers",
    icon: "calendar",
    href: "/patient/birth-centers",
  },
  {
    label: "Appointments",
    icon: "calendar",
    href: "/patient/appointments",
  },
  { label: "Messages", icon: "mail", href: "/patient/messages" },
  { label: "Profile", icon: "user", href: "/patient/profile" },
  { label: "Settings", icon: "settings", href: "/patient/settings" },
];

const icons = {
  grid: <span className="text-xl">▦</span>,
  calendar: <span className="text-xl">🗓️</span>,
  file: <span className="text-xl">📄</span>,
  user: <span className="text-xl">👤</span>,
  mail: <span className="text-xl">✉️</span>,
  settings: <span className="text-xl">⚙️</span>,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <span className="text-2xl">☰</span>
      </button>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full min-h-screen w-60 bg-white flex flex-col py-8
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
