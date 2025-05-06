"use client";
import { login } from "@/app/api/auth/login";
import Logo from "@/components/common/Logo";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function LoginPageClientComponent() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);
      const { success, user } = await login(formData);
      if (success) {
        if (user?.user_metadata?.user_type === "admin") {
          router.push("/admin");
        } else if (user?.user_metadata?.has_finished_onboarding === false) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (error: any) {
      console.log(error.message);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:flex-row flex-col bg-gradient-to-b from-[#2ecac8] to-[#338886]">
      <div className="flex-1 items-center justify-center flex flex-col">
        <Logo />
        <Image
          src="/images/cover-image.png"
          alt="Family"
          className="max-w-[80%] h-auto hidden lg:block"
          width={1000}
          height={1000}
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white/20 rounded-2xl p-10 min-w-[320px] max-w-[400px] w-full shadow-lg flex flex-col gap-6"
        >
          <h2 className="font-bold text-3xl mb-2 text-white text-center">
            Sign in to Your Account
          </h2>
          <div className="flex flex-col gap-6">
            <div className="relative">
              <p className="text-white mb-2">Email Address</p>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-2 bg-transparent border-b border-white text-white text-base focus:outline-none focus:border-b-2 placeholder:text-white/50 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
                placeholder="Enter your email"
              />
            </div>

            <div className="relative">
              <p className="text-white mb-2">Password</p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full p-2 bg-transparent border-b border-white text-white text-base focus:outline-none focus:border-b-2 placeholder:text-white/50 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex mt-8">
                <a
                  href="/forgot-password"
                  className="text-sm text-white underline hover:text-[#004aad] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#004aad] text-white font-bold text-lg rounded-lg py-3 mt-4 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="text-white text-center mt-4">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="underline text-[#004aad] font-semibold hover:text-[#003366] transition-colors"
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
