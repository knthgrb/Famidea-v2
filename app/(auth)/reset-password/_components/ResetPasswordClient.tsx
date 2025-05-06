"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message);
        }
        console.log("Session set");
      });
    } else {
      setError("Reset code is missing from the URL.");
    }
  }, []);

  // Simple password strength check
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return "Too short";
    if (pwd.length < 8) return "Weak";
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    setLoading(true);
    setError(null);

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="max-w-[400px] mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
      {success ? (
        <p className="text-green-600 font-bold">
          Password updated! Redirecting to login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} aria-label="Reset Password Form">
          <label htmlFor="new-password" className="font-bold block">
            New Password
          </label>
          <div className="relative mt-2">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-required="true"
              aria-describedby="password-strength"
              className="block w-full pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-sm text-blue-600"
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div
            id="password-strength"
            className={`mt-1 text-xs ${
              passwordStrength === "Strong"
                ? "text-green-600"
                : passwordStrength === "Medium"
                ? "text-orange-500"
                : "text-red-600"
            }`}
          >
            {password && `Strength: ${passwordStrength}`}
          </div>
          <button
            type="submit"
            disabled={loading || password.length < 6}
            className={`mt-4 w-full bg-teal-500 text-white border-none py-2 rounded font-bold transition-opacity ${
              loading || password.length < 6
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-teal-700"
            }`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
