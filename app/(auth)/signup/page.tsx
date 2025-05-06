import React from "react";
import SignupPageClientComponent from "./_components/SignupPageClientComponent";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userType = user.user_metadata?.user_type;
    const hasFinishedOnboarding = user.user_metadata?.has_finished_onboarding;

    if (!hasFinishedOnboarding) {
      redirect("/onboarding");
    }

    switch (userType) {
      case "admin":
        redirect("/admin");
      case "patient":
        redirect("/patient");
      case "birth_center":
        const { data: registrationData } = await supabase
          .from("birth_center_registrations")
          .select("status")
          .eq("id", user.id)
          .single();

        const status = registrationData?.status;
        if (status === "pending") {
          redirect("/pending-approval");
        } else if (status === "rejected") {
          redirect("/registration-rejected");
        } else {
          redirect("/birth-center/dashboard");
        }
      default:
        redirect("/");
    }
  }

  return <SignupPageClientComponent />;
}
