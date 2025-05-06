import React from "react";

export default function PageLoader() {
  return (
    <div className="absolute inset-0 bg-white/100 z-[100] flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent border-blue-600" />
    </div>
  );
}
