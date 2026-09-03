import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth/AuthGate";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ChatBootstrapProvider } from "@/context/ChatBootstrapContext";

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
        <AuthProvider>
          <ChatBootstrapProvider>
            <AuthGate>
              <DashboardProvider>
                <ChatAssistant>
                  <DashboardHeader />
                  <main className="mx-auto max-w-[1340px] px-4 pb-16 pt-5 sm:px-6">{children}</main>
                </ChatAssistant>
              </DashboardProvider>
            </AuthGate>
          </ChatBootstrapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
