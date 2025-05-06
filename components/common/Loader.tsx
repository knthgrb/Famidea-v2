import React from "react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent border-blue-600" />
    </div>
  );
}
