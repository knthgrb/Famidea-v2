"use client";
import Loader from "@/components/common/Loader";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { LuUsers, LuHospital, LuUserCheck, LuUserX } from "react-icons/lu";

interface DashboardStats {
  totalPatients: number;
  birthCenterStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    banned: number;
  };
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: any;
  description?: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <div className="p-3 bg-blue-50 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
    <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
    <p className="text-sm font-medium text-gray-600">{title}</p>
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    birthCenterStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      banned: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from("users")
        .select("*", { count: "exact" });

      // Fetch patients count
      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", { count: "exact" });

      // Fetch birth centers with status
      const { data: birthCenters } = await supabase
        .from("birth_centers")
        .select("status");

      const birthCenterStats = birthCenters?.reduce(
        (
          acc,
          center: { status: "pending" | "approved" | "rejected" | "banned" }
        ) => {
          acc[center.status]++;
          acc.total++;
          return acc;
        },
        {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          banned: 0,
        }
      ) || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        banned: 0,
      };

      setStats({
        totalPatients: patientsCount || 0,
        birthCenterStats,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={LuUserCheck}
          description="Total registered patients"
        />
        <StatCard
          title="Total Birth Centers"
          value={stats.birthCenterStats.total}
          icon={LuHospital}
          description="All registered birth centers"
        />
        <StatCard
          title="Pending Registrations"
          value={stats.birthCenterStats.pending}
          icon={LuUserX}
          description="Birth centers awaiting approval"
        />
      </div>

      {/* Birth Center Status Breakdown */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Birth Center Status Breakdown
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Approved Centers"
          value={stats.birthCenterStats.approved}
          icon={LuUserCheck}
        />
        <StatCard
          title="Pending Centers"
          value={stats.birthCenterStats.pending}
          icon={LuUsers}
        />
        <StatCard
          title="Rejected Centers"
          value={stats.birthCenterStats.rejected}
          icon={LuUserX}
        />
        <StatCard
          title="Banned Centers"
          value={stats.birthCenterStats.banned}
          icon={LuUserX}
        />
      </div>
    </div>
  );
}
