import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center px-4 py-16">
      <AuthForm mode="registro" />
    </div>
  );
}
