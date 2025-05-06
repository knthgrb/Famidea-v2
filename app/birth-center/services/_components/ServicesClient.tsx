"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import PageLoader from "@/components/common/PageLoader";
import { toast } from "react-toastify";

export default function ServicesPage() {
  const router = useRouter();
  const [birthCenterId, setBirthCenterId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Add this mapping object at the top of the component
  const serviceImageMap: { [key: string]: string } = {
    "Pre Natal": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//prenatal.png`,
    Panganak: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//panganak.png`,
    "Well Baby": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//well-baby.png`,
    Immunization: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//immunization.png`,
    "Family Planning": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//family-planning.png`,
  };

  // Fetch birth center id for current user
  useEffect(() => {
    const fetchBirthCenter = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data } = await supabase
        .from("birth_centers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) setBirthCenterId(data.id);
    };
    fetchBirthCenter();
  }, []);

  // Fetch available services for this birth center
  useEffect(() => {
    if (!birthCenterId) return;
    const fetchServices = async () => {
      setLoading(true);
      const supabase = createClient();
      // Only fetch active services for this birth center
      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("birth_center_id", birthCenterId)
        .eq("is_active", true);
      setServices(services || []);
      setSelectedServiceIds((services || []).map((s) => s.service_id));
      setLoading(false);
    };
    fetchServices();
  }, [birthCenterId]);

  // Fetch all possible services (for editing)
  useEffect(() => {
    const fetchServicesList = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("services_list").select("*");
      setServicesList(data || []);
    };
    fetchServicesList();
  }, []);

  // Toggle service selection in edit mode
  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Save changes (add/remove services)
  const saveServices = async () => {
    if (!birthCenterId) return;
    const supabase = createClient();

    try {
      setLoading(true);

      // 1. Delete existing services for this birth center
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("birth_center_id", birthCenterId);

      if (deleteError) throw deleteError;

      // 2. Insert new services
      if (selectedServiceIds.length > 0) {
        const inserts = selectedServiceIds.map((service_id) => ({
          birth_center_id: birthCenterId,
          service_id,
          is_active: true,
          created_at: new Date().toISOString(),
          description: "",
          price: 0,
          duration: "",
          picture_url: "",
        }));

        const { error: insertError } = await supabase
          .from("services")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      setEditMode(false);

      // Refresh services list
      const { data: updatedServices } = await supabase
        .from("services")
        .select("*")
        .eq("birth_center_id", birthCenterId)
        .eq("is_active", true);

      setServices(updatedServices || []);
    } catch (error) {
      console.error("Error saving services:", error);
      toast.error("Failed to save services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the handleServiceClick function
  const handleServiceClick = (serviceId: number) => {
    router.push(`/birth-center/services/${serviceId}`);
  };

  // UI
  return (
    <div className="p-4 sm:p-6">
      {/* Banner */}
      <div className="bg-teal-200 rounded-2xl p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex-1 pr-0 md:pr-8 text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-teal-800">
            Add your Birthing Services Here
          </h2>
          <p className="text-teal-700 text-base sm:text-lg">
            Customize and manage the services you offer at your birth center
          </p>
        </div>
        <div className="flex-shrink-0">
          <img
            src="/images/doctors.png"
            alt="Doctors"
            className="h-32 sm:h-48 w-auto object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Services Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Services</h2>
        <Button
          variant="outline"
          onClick={() => setEditMode((e) => !e)}
          className="bg-teal-500 hover:bg-teal-600 hover:text-white text-white text-sm sm:text-base"
        >
          {editMode ? "Cancel" : "Edit Services"}
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          <PageLoader />
        ) : editMode ? (
          // Edit mode: show all possible services with checkboxes
          servicesList.map((service) => (
            <div
              key={service.id}
              className={`p-4 rounded-xl border-2 flex flex-col items-center cursor-pointer ${
                selectedServiceIds.includes(service.id)
                  ? "border-teal-500 bg-teal-100"
                  : "border-gray-300"
              }`}
              onClick={() => toggleService(service.id)}
            >
              <img
                src={serviceImageMap[service.name] || service.picture_url}
                alt={service.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-2 mix-blend-multiply"
              />
              <div className="mb-2 text-center text-sm sm:text-base">
                {service.name}
              </div>
              <input
                type="checkbox"
                checked={selectedServiceIds.includes(service.id)}
                readOnly
              />
            </div>
          ))
        ) : (
          // View mode: Updated to be clickable and navigate to details page
          services.map((service) => {
            const serviceInfo = servicesList.find(
              (s) => s.id === service.service_id
            );
            return (
              <div
                key={service.id}
                className="p-4 rounded-xl border-2 border-teal-500 bg-teal-100 flex flex-col items-center cursor-pointer transform transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                onClick={() => handleServiceClick(service.service_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleServiceClick(service.service_id);
                  }
                }}
              >
                <img
                  src={
                    serviceInfo
                      ? serviceImageMap[serviceInfo.name] ||
                        serviceInfo.picture_url
                      : ""
                  }
                  alt={serviceInfo?.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-2 mix-blend-multiply"
                />
                <div className="mb-2 text-center text-sm sm:text-base">
                  {serviceInfo?.name}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save button in edit mode */}
      {editMode && (
        <div className="mt-6">
          <Button
            onClick={saveServices}
            className="bg-teal-500 text-white hover:bg-teal-600 hover:text-white w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
