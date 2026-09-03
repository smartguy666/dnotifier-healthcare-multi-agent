import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Healthcare Assistant",
  description: "Multi-agent healthcare orchestration demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}