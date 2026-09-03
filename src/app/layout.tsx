import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth/AuthGate";
import { ApplicationShell } from "@/components/dashboard/ApplicationShell";
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
              <ApplicationShell>{children}</ApplicationShell>
            </AuthGate>
          </ChatBootstrapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
