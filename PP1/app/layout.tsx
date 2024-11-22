import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ThemeRegistry from "@/app/providers/ThemeRegistry";

export const metadata: Metadata = {
  title: "Scriptorium",
  description: "The new way of writing codes!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <ThemeRegistry>
              {children}
            </ThemeRegistry>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
