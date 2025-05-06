"use client";
import { signup } from "@/app/api/auth/signup";
import Logo from "@/components/common/Logo";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const userTypes = [
  { value: "patient", label: "Patient" },
  { value: "birth_center", label: "Birth Center" },
];

export default function SignupPageClientComponent() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    userType: "patient",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const allowedUserTypes = ["patient", "birth_center"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!allowedUserTypes.includes(form.userType)) {
        throw new Error("Invalid user type");
      }

      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("userType", form.userType);

      const { success } = await signup(formData);
      if (success) {
        router.push("/confirm-email");
      }
    } catch (error: any) {
      if (
        error?.message &&
        error.message.toLowerCase().includes("user already exists")
      ) {
        toast.error("User already exists");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-[#2ecac8] to-[#338886]">
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
          <h2 className="font-bold text-3xl mb-2 text-white">
            Sign up for Your Account
          </h2>
          <label className="text-white font-semibold">
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-2 bg-transparent border-b-2 border-white text-white text-base mt-1 mb-4 focus:outline-none [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
            />
          </label>
          <label className="text-white font-semibold">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full p-2 bg-transparent border-b-2 border-white text-white text-base mt-1 mb-4 focus:outline-none [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
            />
          </label>
          <label className="text-white font-semibold">
            User Type
            <select
              name="userType"
              value={form.userType}
              onChange={handleChange}
              required
              className="w-full p-2 bg-transparent border-b-2 border-white text-white text-base mt-1 mb-4 focus:outline-none"
            >
              {userTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                  className="text-black"
                >
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#004aad] text-white font-bold text-lg rounded-lg py-3 mt-4 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
          <div className="text-center mt-4">
            <span className="text-white">Already have an account? </span>
            <a
              href="/login"
              className="text-[#004aad] font-semibold underline hover:text-[#002d6e] transition-colors"
            >
              Log in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
