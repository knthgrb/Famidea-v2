"use client";

import { BirthCenter } from "@/lib/types/birthcenter";

interface BirthCenterModalProps {
  center: BirthCenter | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (
    id: string,
    newStatus: "pending" | "approved" | "rejected" | "banned"
  ) => Promise<void>;
  currentTab: "pending" | "approved" | "rejected" | "banned";
}

export function BirthCenterModal({
  center,
  isOpen,
  onClose,
  onStatusUpdate,
  currentTab,
}: BirthCenterModalProps) {
  if (!isOpen || !center) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{center.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm text-gray-900">
              {center.description || "No description provided"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Address</h3>
            <p className="mt-1 text-sm text-gray-900">{center.address}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Contact Number
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {center.contact_number}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Registration Date
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(center.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            {currentTab === "pending" && (
              <>
                <button
                  onClick={() => onStatusUpdate(center.id, "approved")}
                  className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200"
                >
                  Approve
                </button>
                <button
                  onClick={() => onStatusUpdate(center.id, "rejected")}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                  Reject
                </button>
              </>
            )}
            {currentTab === "approved" && (
              <>
                <button
                  onClick={() => onStatusUpdate(center.id, "pending")}
                  className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200"
                >
                  Move to Pending
                </button>
                <button
                  onClick={() => onStatusUpdate(center.id, "banned")}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                  Ban
                </button>
              </>
            )}
            {currentTab === "rejected" && (
              <>
                <button
                  onClick={() => onStatusUpdate(center.id, "pending")}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200"
                >
                  Restore to Pending
                </button>
                <button
                  onClick={() => onStatusUpdate(center.id, "banned")}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                  Ban
                </button>
              </>
            )}
            {currentTab === "banned" && (
              <button
                onClick={() => onStatusUpdate(center.id, "pending")}
                className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200"
              >
                Unban to Pending
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
