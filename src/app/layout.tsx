import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnX AI — World's First Fully AI-Powered School ERP Platform",
  description:
    "Complete school management ERP with 30+ AI-powered modules including admissions, attendance, fees, exams, transport, HRMS, safety alerts, career counselling, and RAG-powered AI assistant.",
  keywords: [
    "School ERP", "AI School Management", "LearnX AI", "RAG",
    "Education ERP", "CBSE", "ICSE", "IB", "School Software",
  ],
  authors: [{ name: "LearnX AI" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "LearnX AI — Fully AI-Powered School ERP",
    description: "30+ AI modules · RAG-powered assistant · Built for schools of the future.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-geist-sans), var(--font-jakarta), system-ui, sans-serif' }}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
