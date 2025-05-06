"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { toast } from "react-toastify";

// Types based on the database schema
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

interface Service {
  id: string;
  description: string;
  services_list: {
    id: number;
    name: string;
  };
}

interface PatientDetails {
  patient: Patient;
  services: Service[];
}

// Service image mapping
const serviceImageMap: { [key: string]: string } = {
  "Pre Natal": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/prenatal.png`,
  Panganak: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/panganak.png`,
  "Well Baby": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/well-baby.png`,
  Immunization: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/immunization.png`,
  "Family Planning": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/service-images/family-planning.png`,
};

// Add interface for Prenatal form data
interface PrenatalFormData {
  id?: string;
  patient_id: string;
  estimated_due_date: string;
  height: number;
  weight: number;
  pulse_rate: number;
  body_temperature: number;
  fundal_height: number;
}

export default function PatientDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PrenatalFormData>({
    patient_id: "",
    estimated_due_date: "",
    height: 0,
    weight: 0,
    pulse_rate: 0,
    body_temperature: 0,
    fundal_height: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPrenatalRecord, setExistingPrenatalRecord] =
    useState<PrenatalFormData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    async function fetchPatientDetails() {
      const supabase = createClient();

      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select(
          `
          id,
          first_name,
          last_name,
          profile_picture_url
        `
        )
        .eq("id", slug)
        .single();

      if (patientError) {
        console.error("Error fetching patient:", patientError);
        return;
      }

      // Fetch patient's services through appointments
      const { data: servicesData, error: servicesError } = await supabase
        .from("appointments")
        .select(
          `
          service:services!service_id (
            id,
            description,
            services_list (
              id,
              name
            )
          )
        `
        )
        .eq("patient_id", slug);

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
        return;
      }

      // Extract unique services
      const uniqueServices = Array.from(
        new Set(servicesData.map((item) => JSON.stringify(item.service)))
      ).map((str) => JSON.parse(str));

      setPatientDetails({
        patient: patientData,
        services: uniqueServices,
      });
      setLoading(false);
    }

    fetchPatientDetails();
  }, [slug]);

  useEffect(() => {
    async function fetchPrenatalRecord() {
      if (!slug) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("prenatal-table")
        .select("*")
        .eq("patient_id", slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setExistingPrenatalRecord(data);
        setFormData({
          patient_id: data.patient_id,
          estimated_due_date: data.estimated_due_date,
          height: data.height,
          weight: data.weight,
          pulse_rate: data.pulse_rate,
          body_temperature: data.body_temperature,
          fundal_height: data.fundal_height,
        });
      }
    }

    fetchPrenatalRecord();
  }, [slug]);

  const handleViewAppointment = () => {
    // Navigate to appointments view
    router.push(`/birth-center/patients-list/${slug}/appointments`);
  };

  const handleViewBabyInfo = () => {
    // Navigate to baby's information view
    router.push(`/birth-center/patients-list/${slug}/child-info`);
  };

  const handleOpenPrenatalForm = () => {
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();
    const submitData = {
      ...formData,
      patient_id: slug,
    };

    try {
      let result;
      if (existingPrenatalRecord?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("prenatal-table")
          .update({
            estimated_due_date: submitData.estimated_due_date,
            height: submitData.height,
            weight: submitData.weight,
            pulse_rate: submitData.pulse_rate,
            body_temperature: submitData.body_temperature,
            fundal_height: submitData.fundal_height,
          })
          .eq("id", existingPrenatalRecord.id)
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("prenatal-table")
          .insert([
            {
              patient_id: submitData.patient_id,
              estimated_due_date: submitData.estimated_due_date,
              height: submitData.height,
              weight: submitData.weight,
              pulse_rate: submitData.pulse_rate,
              body_temperature: submitData.body_temperature,
              fundal_height: submitData.fundal_height,
            },
          ])
          .select();

        if (error) throw error;
        result = data;
      }

      // Update the existing record state with the new data
      if (result?.[0]) {
        setExistingPrenatalRecord(result[0]);
      }

      // Close modal and show success message
      setIsModalOpen(false);
      toast.success("Prenatal record saved successfully!");
    } catch (error) {
      console.error("Error saving prenatal record:", error);
      toast.error("Failed to save prenatal record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !patientDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Patient Profile Card */}
      <div className="bg-teal-500 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 sm:gap-0">
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-6 capitalize">
            {`${patientDetails.patient.first_name} ${patientDetails.patient.last_name}`}
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleViewAppointment}
              className="w-full sm:w-auto bg-white text-teal-600 px-6 py-2 rounded-full hover:bg-teal-50 transition-colors"
            >
              View Appointment
            </button>
            <button
              onClick={handleViewBabyInfo}
              className="w-full sm:w-auto bg-white text-teal-600 px-6 py-2 rounded-full hover:bg-teal-50 transition-colors"
            >
              View Baby's Info
            </button>
            <button
              onClick={handleOpenPrenatalForm}
              className="w-full sm:w-auto bg-white text-teal-600 px-6 py-2 rounded-full hover:bg-teal-50 transition-colors"
            >
              Prenatal Form
            </button>
          </div>
        </div>

        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <Image
            src={
              patientDetails.patient.profile_picture_url ||
              "/placeholder-profile.jpg"
            }
            alt={`${patientDetails.patient.first_name} ${patientDetails.patient.last_name}`}
            fill
            className="rounded-full object-cover border-4 border-white"
          />
        </div>
      </div>

      {/* Services Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">Services Acquired</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {patientDetails.services.map((service) => (
            <div
              key={service.id}
              className="bg-teal-500 rounded-xl p-4 text-center text-white"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2">
                <Image
                  src={
                    serviceImageMap[service.services_list.name] ||
                    "/placeholder-service.jpg"
                  }
                  alt={service.services_list.name}
                  width={64}
                  height={64}
                />
              </div>
              <p className="font-medium text-sm sm:text-base">
                {service.services_list.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prenatal Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {!existingPrenatalRecord
                  ? "New Prenatal Record"
                  : isEditMode
                  ? "Edit Prenatal Record"
                  : "Prenatal Record Details"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {existingPrenatalRecord && !isEditMode ? (
              // View Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Estimated Due Date
                    </p>
                    <p className="mt-1 text-lg">
                      {formData.estimated_due_date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Height</p>
                    <p className="mt-1 text-lg">{formData.height} cm</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Weight</p>
                    <p className="mt-1 text-lg">{formData.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Pulse Rate
                    </p>
                    <p className="mt-1 text-lg">{formData.pulse_rate} bpm</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Body Temperature
                    </p>
                    <p className="mt-1 text-lg">
                      {formData.body_temperature} °C
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Fundal Height
                    </p>
                    <p className="mt-1 text-lg">{formData.fundal_height} cm</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
                  >
                    Edit Record
                  </button>
                </div>
              </div>
            ) : (
              // Edit/Create Mode - Keep your existing form code here
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Due Date
                    </label>
                    <input
                      type="date"
                      name="estimated_due_date"
                      value={formData.estimated_due_date}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pulse Rate (bpm)
                    </label>
                    <input
                      type="number"
                      name="pulse_rate"
                      value={formData.pulse_rate}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Body Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="body_temperature"
                      value={formData.body_temperature}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fundal Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="fundal_height"
                      value={formData.fundal_height}
                      onChange={handleInputChange}
                      className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
