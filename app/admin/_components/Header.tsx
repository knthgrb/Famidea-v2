import { MenuIcon } from "lucide-react";
import React from "react";

export default function Header({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <div className="h-[10vh] flex px-4 md:hidden items-center sticky top-0 bg-white border-b">
      <button className="md:hidden" onClick={() => setOpen(!open)}>
        <MenuIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
