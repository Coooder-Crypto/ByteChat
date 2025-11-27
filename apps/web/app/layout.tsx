import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ByteChat Web",
  description: "Web chat that works with the ByteChat backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
