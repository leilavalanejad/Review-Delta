import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review Delta | ChatGPT vs. Claude",
  description: "Recurring customer problems, product hypotheses, and opportunities synthesized from ChatGPT and Claude reviews.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
