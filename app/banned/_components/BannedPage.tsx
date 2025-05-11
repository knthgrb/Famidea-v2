"use client";
import { logout } from "@/app/services/auth/logout";
import React from "react";
import { FaBan } from "react-icons/fa";

export default function BannedPage() {
  const handleSignOut = async () => {
    await logout();
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <FaBan className="text-red-500 text-6xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Account Banned
        </h1>
        <p className="text-gray-600 mb-6">
          Your account has been suspended due to violation of our community
          guidelines. If you believe this is a mistake, please contact our
          support team.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
          >
            Sign Out
          </button>
          <a
            href="/support"
            className="block w-full py-2 px-4 bg-red-500 hover:bg-red-600 rounded-md text-white transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
