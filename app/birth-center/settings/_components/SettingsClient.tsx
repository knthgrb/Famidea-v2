"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";
import PageLoader from "@/components/common/PageLoader";

export default function BirthCenterSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [birthCenter, setBirthCenter] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchBirthCenterData();
  }, []);

  const fetchBirthCenterData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get birth center data
      const { data: birthCenterData, error: birthCenterError } = await supabase
        .from("birth_centers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (birthCenterError) throw birthCenterError;

      setBirthCenter(birthCenterData);
      setCurrentUserEmail(user.email || "");
      setFormData((prev) => ({
        ...prev,
        name: birthCenterData.name,
        email: user.email || "",
      }));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // First verify current password if email or password is being changed
      if (formData.email !== currentUserEmail || formData.newPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: currentUserEmail,
          password: formData.currentPassword,
        });

        if (signInError) {
          throw new Error("Current password is incorrect");
        }
      }

      // Update birth center name
      if (formData.name !== birthCenter.name) {
        const { error: nameError } = await supabase
          .from("birth_centers")
          .update({ name: formData.name })
          .eq("id", birthCenter.id);

        if (nameError) throw nameError;
        toast.success("Birth center name updated successfully");
      }

      // Update email if changed
      if (formData.email !== currentUserEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
        toast.success(
          "Verification email sent to your new email address. Please check your inbox."
        );
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("New passwords don't match");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (passwordError) throw passwordError;
        toast.success("Password updated successfully");
      }

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <p className="mb-8 text-gray-600">
        Change your basic account settings here.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Birth Center Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Center Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Site notifications will be sent here. Changing your email will
            require verification.
          </p>
        </div>

        {/* Password Update Section */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Update Password</h2>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword.current ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Required when changing email or password
              </p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword.new ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword.confirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setFormData({
                name: birthCenter.name,
                email: currentUserEmail,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
