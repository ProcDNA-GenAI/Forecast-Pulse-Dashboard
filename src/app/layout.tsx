import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";

export const metadata: Metadata = {
  title: "NAP · Pre-Launch Market Intelligence",
  description: "Forecast pulse dashboard for pre-launch LDL-C market intelligence.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DashboardProvider>
          <DashboardHeader />
          <main className="mx-auto max-w-[1340px] px-4 pb-16 pt-5 sm:px-6">{children}</main>
        </DashboardProvider>
      </body>
    </html>
  );
}
