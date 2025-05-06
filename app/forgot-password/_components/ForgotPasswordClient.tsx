"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";

export default function ForgotPasswordClientComponent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(
          error.message || "Failed to send reset email. Please try again."
        );
      } else {
        toast.success("Password reset email sent! Please check your inbox.");
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm mx-auto mt-20"
    >
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="p-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-teal-500 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
