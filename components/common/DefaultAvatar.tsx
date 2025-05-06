import React from "react";

interface DefaultAvatarProps {
  name: string;
}

export default function DefaultAvatar({ name }: DefaultAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="w-10 h-10 border-yellow-300 rounded-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500 text-lg font-medium">{initial}</span>
    </div>
  );
}
