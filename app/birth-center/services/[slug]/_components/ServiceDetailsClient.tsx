"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";

interface Service {
  id: number;
  birth_center_id: string;
  service_id: number;
  description: string;
  price: number;
  duration: string;
  is_active: boolean;
  created_at: string;
}

interface ServiceList {
  id: number;
  name: string;
}

export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const [service, setService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const serviceImageMap: { [key: string]: string } = {
    "Pre Natal": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//prenatal.png`,
    Panganak: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//panganak.png`,
    "Well Baby": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//well-baby.png`,
    Immunization: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//immunization.png`,
    "Family Planning": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images//family-planning.png`,
  };

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!slug) return;

      setLoading(true);
      const supabase = createClient();

      try {
        // Get the current user's birth center id first
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data: birthCenterData } = await supabase
          .from("birth_centers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (birthCenterData) {
          // Get service details with a join to services_list
          const { data: serviceData, error } = await supabase
            .from("services")
            .select(
              `
              *,
              services_list (
                id,
                name
              )
            `
            )
            .eq("service_id", slug)
            .eq("birth_center_id", birthCenterData.id)
            .eq("is_active", true)
            .single();

          console.log("Service Data:", serviceData);
          console.log("Error:", error);

          if (serviceData) {
            setService(serviceData);
            // @ts-ignore - we know services_list exists in the response
            setServiceName(serviceData.services_list.name);
          }
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Service not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Service Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-teal-100 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/3">
                <img
                  src={serviceImageMap[serviceName] || ""}
                  alt={serviceName}
                  className="w-full h-48 sm:h-64 object-contain rounded-lg bg-white p-4"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex justify-between items-start">
                  <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-3">
                    {serviceName}
                  </h1>
                  <Link
                    href={`/birth-center/services/${slug}/edit`}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Edit Service
                  </Link>
                </div>
                <p className="text-teal-600 text-lg mb-4">
                  {service.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Price</h3>
                <p className="text-2xl font-bold text-teal-600">
                  ₱{service.price.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Duration</h3>
                <p className="text-2xl font-bold text-teal-600">
                  {service.duration || "Not specified"}
                </p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                Service Description
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {service.description || "No description available."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
