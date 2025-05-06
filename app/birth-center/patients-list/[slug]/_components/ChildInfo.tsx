"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Loader from "@/components/common/Loader";

interface ChildInfo {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string;
  birth_weight: string;
  birth_length: string;
  gender: string;
  blood_type: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  immunizations: string;
  developmental_milestones: string;
  restrictions: string;
  sleep_patterns: string;
  behavioral_concerns: string;
  family_medical_history: string;
  other_info: string;
  profile_picture_url: string;
  parent_id: string;
}

export default function ChildInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ChildInfo>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchChildren();
  }, [slug]);

  async function fetchChildren() {
    setLoading(true);
    const { data, error } = await supabase
      .from("child_info")
      .select("*")
      .eq("parent_id", slug);

    if (error) {
      console.error("Error fetching children:", error);
    } else {
      setChildren(data || []);
      setSelectedChild(null);
      setIsEditing(false);
    }
    setLoading(false);
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    let picture_url = formData.profile_picture_url;

    if (selectedFile) {
      // Upload new file
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

      picture_url = publicUrl;
    }

    const updatedData = {
      ...formData,
      profile_picture_url: picture_url,
    };

    if (selectedChild) {
      // Update existing record
      const { error } = await supabase
        .from("child_info")
        .update(updatedData)
        .eq("id", selectedChild.id);

      if (error) {
        console.error("Error updating child info:", error);
        return;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from("child_info")
        .insert([{ ...updatedData, parent_id: slug }]);

      if (error) {
        console.error("Error adding child info:", error);
        return;
      }
    }

    await fetchChildren();
    setIsEditing(false);
    setSelectedFile(null);
  };

  const handleAddChild = () => {
    setFormData({ parent_id: slug });
    setSelectedChild(null);
    setIsEditing(true);
  };

  const handleEditChild = (child: ChildInfo) => {
    setFormData(child);
    setSelectedChild(child);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const renderForm = () => (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white shadow-sm rounded-lg p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Section */}
        <div className="col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleInputChange}
                    className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name || ""}
                    onChange={handleInputChange}
                    className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                    className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
            <div className="ml-8 flex flex-col items-center">
              <div className="flex flex-col items-center space-y-3">
                {(formData.profile_picture_url || selectedFile) && (
                  <img
                    src={
                      selectedFile
                        ? URL.createObjectURL(selectedFile)
                        : formData.profile_picture_url
                    }
                    alt="Profile Preview"
                    className="h-32 w-32 object-cover rounded-full"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-48 text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Birth Information Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Birth Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birthdate
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate || ""}
                onChange={handleInputChange}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Weight
              </label>
              <input
                type="text"
                name="birth_weight"
                value={formData.birth_weight || ""}
                onChange={handleInputChange}
                placeholder="e.g., 7.5 lbs"
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birth Length
              </label>
              <input
                type="text"
                name="birth_length"
                value={formData.birth_length || ""}
                onChange={handleInputChange}
                placeholder="e.g., 20 inches"
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleInputChange}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Medical Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Blood Type
              </label>
              <select
                name="blood_type"
                value={formData.blood_type || ""}
                onChange={handleInputChange}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medical Conditions
              </label>
              <textarea
                name="medical_conditions"
                value={formData.medical_conditions || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medications
              </label>
              <textarea
                name="medications"
                value={formData.medications || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Development and Health Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Development and Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Immunizations
              </label>
              <textarea
                name="immunizations"
                value={formData.immunizations || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Developmental Milestones
              </label>
              <textarea
                name="developmental_milestones"
                value={formData.developmental_milestones || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Restrictions
              </label>
              <textarea
                name="restrictions"
                value={formData.restrictions || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sleep Patterns
              </label>
              <textarea
                name="sleep_patterns"
                value={formData.sleep_patterns || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Behavioral Concerns
              </label>
              <textarea
                name="behavioral_concerns"
                value={formData.behavioral_concerns || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Family Medical History
              </label>
              <textarea
                name="family_medical_history"
                value={formData.family_medical_history || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Other Information
              </label>
              <textarea
                name="other_info"
                value={formData.other_info || ""}
                onChange={handleInputChange}
                rows={3}
                className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          {selectedChild ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );

  const renderInfo = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedChild(null)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">
            Child Information
          </h2>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          Edit
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <div className="flex items-start justify-between mb-6">
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="First Name"
                  value={selectedChild?.first_name}
                />
                <InfoField
                  label="Middle Name"
                  value={selectedChild?.middle_name}
                />
                <InfoField label="Last Name" value={selectedChild?.last_name} />
              </div>
            </div>
            {selectedChild?.profile_picture_url && (
              <div className="ml-8 flex flex-col items-center">
                <img
                  src={selectedChild.profile_picture_url}
                  alt="Profile"
                  className="h-32 w-32 object-cover rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Birth Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Birth Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoField
              label="Birthdate"
              value={
                selectedChild?.birthdate
                  ? new Date(selectedChild.birthdate).toLocaleDateString()
                  : ""
              }
            />
            <InfoField
              label="Birth Weight"
              value={selectedChild?.birth_weight}
            />
            <InfoField
              label="Birth Length"
              value={selectedChild?.birth_length}
            />
            <InfoField label="Gender" value={selectedChild?.gender} />
          </div>
        </div>

        {/* Medical Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Medical Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Blood Type" value={selectedChild?.blood_type} />
            <InfoField
              label="Medical Conditions"
              value={selectedChild?.medical_conditions}
            />
            <InfoField label="Allergies" value={selectedChild?.allergies} />
            <InfoField label="Medications" value={selectedChild?.medications} />
          </div>
        </div>

        {/* Development and Health */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Development and Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Immunizations"
              value={selectedChild?.immunizations}
            />
            <InfoField
              label="Developmental Milestones"
              value={selectedChild?.developmental_milestones}
            />
            <InfoField
              label="Restrictions"
              value={selectedChild?.restrictions}
            />
            <InfoField
              label="Sleep Patterns"
              value={selectedChild?.sleep_patterns}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Behavioral Concerns"
              value={selectedChild?.behavioral_concerns}
            />
            <InfoField
              label="Family Medical History"
              value={selectedChild?.family_medical_history}
            />
            <InfoField
              label="Other Information"
              value={selectedChild?.other_info}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Helper component for displaying info fields
  const InfoField = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value || "Not provided"}</p>
    </div>
  );

  // Render list of children
  const renderChildrenList = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Children</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50"
            onClick={() => handleEditChild(child)}
          >
            <img
              src={child.profile_picture_url || "/default-avatar.png"}
              alt={child.first_name}
              className="h-12 w-12 rounded-full object-cover mr-4"
            />
            <div>
              <div className="font-medium">
                {child.first_name} {child.last_name}
              </div>
              <div className="text-sm text-gray-500">{child.birthdate}</div>
            </div>
          </div>
        ))}
        <button
          onClick={handleAddChild}
          className="border-dashed border-2 border-teal-400 rounded-lg p-4 flex flex-col items-center justify-center text-teal-600 hover:bg-teal-50"
        >
          <span className="text-2xl">+</span>
          <span>Add Child</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      ) : isEditing ? (
        renderForm()
      ) : selectedChild ? (
        renderInfo()
      ) : (
        renderChildrenList()
      )}
    </div>
  );
}
