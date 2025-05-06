"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BirthCenter } from "@/lib/types/birthcenter";
import { StatusTabs } from "../../_components/StatusTabs";
import { BirthCenterTable } from "./BirthCenterTable";
import { BirthCenterModal } from "./BirthCenterModal";

export default function BirthCenterManagementClient() {
  const [birthCenters, setBirthCenters] = useState<BirthCenter[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "banned"
  >("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<BirthCenter | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const supabase = createClient();

  useEffect(() => {
    fetchBirthCenters();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, birthCenters.length]);

  const fetchBirthCenters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("birth_centers")
        .select("*")
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBirthCenters(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    newStatus: "pending" | "approved" | "rejected" | "banned"
  ) => {
    try {
      const { error } = await supabase
        .from("birth_centers")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Birth center ${newStatus} successfully`);
      setSelectedCenter(null);
      fetchBirthCenters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPages = Math.ceil(birthCenters.length / itemsPerPage);
  const paginatedCenters = birthCenters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Birth Center Management
      </h1>

      <StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="relative w-full">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto">
            <BirthCenterTable
              birthCenters={paginatedCenters}
              isLoading={isLoading}
              activeTab={activeTab}
              onStatusUpdate={handleStatusUpdate}
              onViewDetails={setSelectedCenter}
            />
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <BirthCenterModal
        center={selectedCenter}
        isOpen={!!selectedCenter}
        onClose={() => setSelectedCenter(null)}
        onStatusUpdate={handleStatusUpdate}
        currentTab={activeTab}
      />
    </div>
  );
}
