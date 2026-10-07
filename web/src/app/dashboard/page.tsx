import type { Metadata } from "next";
import { BetDashboard } from "@/components/bet-dashboard";

export const metadata: Metadata = { title: "Mi panel de apuestas" };

export default function DashboardPage() { return <BetDashboard />; }
