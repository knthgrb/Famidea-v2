import Logo from "@/components/common/Logo";
import Image from "next/image";
import React from "react";

export default function ConfirmEmailPage() {
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
        <div className="bg-white/20 rounded-2xl p-10 min-w-[320px] max-w-[400px] w-full shadow-lg flex flex-col gap-6 items-center">
          <h2 className="font-bold text-3xl mb-2 text-white text-center">
            Confirm Your Email
          </h2>
          <p className="text-white text-lg text-center">
            We&apos;ve sent a confirmation link to your email address.
            <br />
            Please check your inbox and click the link to complete your signup.
          </p>
        </div>
      </div>
    </div>
  );
}
