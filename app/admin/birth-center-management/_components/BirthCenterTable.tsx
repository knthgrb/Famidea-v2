"use client";

import { BirthCenter } from "@/lib/types/birthcenter";

interface BirthCenterTableProps {
  birthCenters: BirthCenter[];
  isLoading: boolean;
  activeTab: "pending" | "approved" | "rejected" | "banned";
  onStatusUpdate: (
    id: string,
    newStatus: "pending" | "approved" | "rejected" | "banned"
  ) => Promise<void>;
  onViewDetails: (center: BirthCenter) => void;
}

export function BirthCenterTable({
  birthCenters,
  isLoading,
  activeTab,
  onStatusUpdate,
  onViewDetails,
}: BirthCenterTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (birthCenters.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No {activeTab} birth centers found
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {birthCenters.map((center) => (
                <tr key={center.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {center.name}
                    </div>
                    {center.description && (
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {center.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate">
                    {center.address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate">
                    {center.contact_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(center.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewDetails(center)}
                        className="bg-blue-100 whitespace-nowrap text-blue-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200"
                      >
                        View Details
                      </button>
                      {activeTab === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              onStatusUpdate(center.id, "approved")
                            }
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              onStatusUpdate(center.id, "rejected")
                            }
                            className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(activeTab === "approved" ||
                        activeTab === "rejected") && (
                        <button
                          onClick={() => onStatusUpdate(center.id, "banned")}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-200"
                        >
                          Ban
                        </button>
                      )}
                      {activeTab === "approved" && (
                        <button
                          onClick={() => onStatusUpdate(center.id, "pending")}
                          className="bg-yellow-100 whitespace-nowrap text-yellow-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-yellow-200"
                        >
                          Move to Pending
                        </button>
                      )}
                      {activeTab === "banned" && (
                        <button
                          onClick={() => onStatusUpdate(center.id, "pending")}
                          className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-yellow-200"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
