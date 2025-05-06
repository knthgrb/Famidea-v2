import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getBirthCenterRegistrationStatus } from "./api/birth-center/birth-center";

export default async function page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userType = user?.user_metadata?.user_type;

  switch (userType) {
    case "admin":
      redirect("/admin");
    case "patient":
      redirect("/patient");
    case "birth_center":
      const registrationData = await getBirthCenterRegistrationStatus(
        user?.id || ""
      );
      const status = registrationData?.[0]?.status;
      if (status === "pending") {
        redirect("/pending-approval");
      } else if (status === "rejected") {
        redirect("/registration-rejected");
      } else if (status === "banned") {
        redirect("/banned");
      } else if (status !== "approved") {
        redirect("/birth-center/dashboard");
      }
    default:
      redirect("/login");
  }
}
