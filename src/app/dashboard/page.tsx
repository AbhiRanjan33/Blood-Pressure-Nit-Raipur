import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default async function Dashboard() {
  const role = await getUserRole();

  if (role === "patient") redirect("/dashboard/patient");
  if (role === "doctor") redirect("/dashboard/doctor");

  redirect("/select-role");
}