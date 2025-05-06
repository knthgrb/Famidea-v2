"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<"birth_center" | "patient" | null>(
    null
  );

  // Days of the week for available_days
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Birth center form state
  const [birthCenterFormData, setBirthCenterFormData] = useState({
    name: "",
    barangay: "",
    municipality: "",
    province: "",
    zipCode: "",
    contact_numb: "",
    description: "",
    picture_url: "",
    total_rooms: "",
    opening_time: "",
    closing_time: "",
    available_days: [] as string[],
  });

  // Patient form state
  const [patientFormData, setPatientFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    contact_number: "",
    age: "",
    birthday: "",
    sex: "",
    barangay: "",
    municipality: "",
    province: "",
    zipCode: "",
    emergency_contact: "",
    emergency_contact_number: "",
    blood_type: "",
    allergies: "",
    // medical_conditions: "",
    // previous_pregnancies: "",
    // complications: "",
    // medications: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [birthCenterId, setBirthCenterId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setUserType(user.user_metadata.user_type);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchServiceList = async () => {
      const { data } = await supabase.from("services_list").select("*");
      setServiceList(data || []);
    };
    fetchServiceList();
  }, []);

  const handleBirthCenterInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value ?? ""; // Ensure value is never undefined
    setBirthCenterFormData({
      ...birthCenterFormData,
      [e.target.name]: value,
    });
  };

  const handleAvailableDayToggle = (day: string) => {
    setBirthCenterFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const handlePatientInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const value = e.target.value ?? ""; // Ensure value is never undefined
    setPatientFormData({
      ...patientFormData,
      [e.target.name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    toast[type](message, {
      duration: 4000,
      position: "top-center",
    });
  };

  const handleBirthCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const complete_address = `${birthCenterFormData.barangay}, ${birthCenterFormData.municipality}, ${birthCenterFormData.province} ${birthCenterFormData.zipCode}, Philippines`;
      const formatted_address = `Brgy. ${birthCenterFormData.barangay}, ${birthCenterFormData.municipality}, ${birthCenterFormData.province} ${birthCenterFormData.zipCode}`;

      let picture_url = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

        picture_url = publicUrl;
      }

      const response = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(
          complete_address
        )}&api_key=${process.env.NEXT_PUBLIC_GEO_CODE_API_KEY}`
      );

      if (!response.ok) throw new Error("Error fetching geocode data");

      const geocodeData = await response.json();
      if (!geocodeData.length) {
        showToast(
          "Unable to find the location. Please check the address details.",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      const { lat, lon } = geocodeData[0];

      const opening_time = `${birthCenterFormData.opening_time}:00+08`;
      const closing_time = `${birthCenterFormData.closing_time}:00+08`;

      const { data, error: insertError } = await supabase
        .from("birth_centers")
        .insert({
          name: birthCenterFormData.name,
          address: formatted_address,
          contact_number: birthCenterFormData.contact_numb,
          description: birthCenterFormData.description || null,
          picture_url: picture_url,
          total_rooms: parseInt(birthCenterFormData.total_rooms),
          available_rooms: parseInt(birthCenterFormData.total_rooms),
          latitude: lat.toString(),
          longitude: lon.toString(),
          status: "pending",
          user_id: user.id,
          opening_time,
          closing_time,
          available_days: birthCenterFormData.available_days,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      setBirthCenterId(data.id);

      // Save selected services for this birth center
      if (selectedServiceIds.length > 0) {
        const newServices = selectedServiceIds.map((service_id) => ({
          birth_center_id: data.id,
          service_id,
          is_active: true,
        }));
        const { error: servicesError } = await supabase
          .from("services")
          .insert(newServices);
        if (servicesError) throw servicesError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          has_finished_onboarding: true,
        },
      });
      if (updateError) throw updateError;

      showToast("Birth center profile created successfully!", "success");
      router.push("/pending-approval");
    } catch (error: any) {
      showToast(error.message || "An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const complete_address = `${patientFormData.barangay}, ${patientFormData.municipality}, ${patientFormData.province} ${patientFormData.zipCode}, Philippines`;
      const formatted_address = `Brgy. ${patientFormData.barangay}, ${patientFormData.municipality}, ${patientFormData.province} ${patientFormData.zipCode}`;

      let picture_url = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

        picture_url = publicUrl;
      }

      const response = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(
          complete_address
        )}&api_key=${process.env.NEXT_PUBLIC_GEO_CODE_API_KEY}`
      );

      if (!response.ok) throw new Error("Error fetching geocode data");

      const geocodeData = await response.json();
      if (!geocodeData.length) {
        showToast(
          "Unable to find the location. Please check the address details.",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      const { lat, lon } = geocodeData[0];

      const { error: insertError } = await supabase.from("patients").insert({
        id: user.id,
        first_name: patientFormData.first_name,
        last_name: patientFormData.last_name,
        middle_name: patientFormData.middle_name,
        contact_number: patientFormData.contact_number,
        age: parseInt(patientFormData.age),
        birthday: patientFormData.birthday,
        sex: patientFormData.sex,
        address: formatted_address,
        latitude: lat.toString(),
        longitude: lon.toString(),
        emergency_contact: patientFormData.emergency_contact,
        emergency_contact_number: patientFormData.emergency_contact_number,
        profile_picture_url: picture_url,
        blood_type: patientFormData.blood_type || null,
        allergies: patientFormData.allergies || null,
        // medical_conditions: patientFormData.medical_conditions || null,
        // previous_pregnancies:
        //   parseInt(patientFormData.previous_pregnancies) || null,
        // complications: patientFormData.complications || null,
        // medications: patientFormData.medications || null,
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          has_finished_onboarding: true,
        },
      });
      if (updateError) throw updateError;

      showToast("Patient profile created successfully!", "success");
      router.push("/patient");
    } catch (error: any) {
      showToast(error.message || "An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Render loading state or redirect if no user type
  if (!userType) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {userType === "birth_center"
              ? "Complete Your Birth Center Registration"
              : "Complete Your Patient Profile"}
          </h1>
        </div>

        {userType === "birth_center" ? (
          // Birth Center Form
          <form
            onSubmit={handleBirthCenterSubmit}
            className="space-y-6 bg-white p-8 rounded-lg shadow"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Center Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.name}
                onChange={handleBirthCenterInputChange}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address Details</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay *
                </label>
                <input
                  type="text"
                  name="barangay"
                  required
                  placeholder="Enter barangay"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={birthCenterFormData.barangay}
                  onChange={handleBirthCenterInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Municipality/City *
                </label>
                <input
                  type="text"
                  name="municipality"
                  required
                  placeholder="Enter municipality or city"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={birthCenterFormData.municipality}
                  onChange={handleBirthCenterInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province *
                </label>
                <input
                  type="text"
                  name="province"
                  required
                  placeholder="Enter province"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={birthCenterFormData.province}
                  onChange={handleBirthCenterInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  placeholder="Enter ZIP code"
                  pattern="[0-9]*"
                  maxLength={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={birthCenterFormData.zipCode}
                  onChange={handleBirthCenterInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <input
                type="tel"
                name="contact_numb"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.contact_numb}
                onChange={handleBirthCenterInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.description}
                onChange={handleBirthCenterInputChange}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Picture (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Rooms *
              </label>
              <input
                type="number"
                name="total_rooms"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.total_rooms}
                onChange={handleBirthCenterInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Opening Time *
              </label>
              <input
                type="time"
                name="opening_time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.opening_time}
                onChange={handleBirthCenterInputChange}
                step="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Closing Time *
              </label>
              <input
                type="time"
                name="closing_time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={birthCenterFormData.closing_time}
                onChange={handleBirthCenterInputChange}
                step="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={birthCenterFormData.available_days.includes(day)}
                      onChange={() => handleAvailableDayToggle(day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold mb-2 text-lg">
                Select Services Offered
              </h2>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
                {serviceList.length === 0 ? (
                  <div className="text-gray-500">Loading services...</div>
                ) : (
                  serviceList.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-teal-50 rounded px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="accent-teal-500"
                      />
                      <span className="text-gray-800">{service.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
              disabled={
                isSubmitting ||
                selectedServiceIds.length === 0 ||
                birthCenterFormData.available_days.length === 0
              }
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </button>
          </form>
        ) : (
          // Patient Form
          <form
            onSubmit={handlePatientSubmit}
            className="space-y-6 bg-white p-8 rounded-lg shadow"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.first_name}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.last_name}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                name="middle_name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.middle_name}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <input
                type="tel"
                name="contact_number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.contact_number}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age *
              </label>
              <input
                type="text"
                name="age"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.age}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birthday *
              </label>
              <input
                type="date"
                name="birthday"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.birthday}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sex *
              </label>
              <select
                name="sex"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.sex}
                onChange={handlePatientInputChange}
              >
                <option value="">Select sex</option>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address Details</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay *
                </label>
                <input
                  type="text"
                  name="barangay"
                  required
                  placeholder="Enter barangay"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={patientFormData.barangay}
                  onChange={handlePatientInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Municipality/City *
                </label>
                <input
                  type="text"
                  name="municipality"
                  required
                  placeholder="Enter municipality or city"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={patientFormData.municipality}
                  onChange={handlePatientInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province *
                </label>
                <input
                  type="text"
                  name="province"
                  required
                  placeholder="Enter province"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={patientFormData.province}
                  onChange={handlePatientInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  placeholder="Enter ZIP code"
                  pattern="[0-9]*"
                  maxLength={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  value={patientFormData.zipCode}
                  onChange={handlePatientInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emergency Contact *
              </label>
              <input
                type="text"
                name="emergency_contact"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.emergency_contact}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emergency Contact Number *
              </label>
              <input
                type="tel"
                name="emergency_contact_number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.emergency_contact_number}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Picture (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Blood Type (Optional)
              </label>
              <input
                type="text"
                name="blood_type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.blood_type}
                onChange={handlePatientInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allergies (Optional)
              </label>
              <textarea
                name="allergies"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                value={patientFormData.allergies}
                onChange={handlePatientInputChange}
                rows={3}
              />
            </div>

            {/* ...optional medical fields... */}

            <div>
              <button
                type="submit"
                className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"
              >
                {isSubmitting ? "Submitting..." : "Complete Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
