import Image from "next/image";
import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="/images/logo.png"
        alt="Family"
        className="w-8 h-8"
        width={300}
        height={300}
      />
      <h1 className="text-[#252525] text-2xl font-bold">FAMIDEA</h1>
    </div>
  );
}
