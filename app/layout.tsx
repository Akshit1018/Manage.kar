import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3b82f6",
}

export const metadata: Metadata = {
  title: "Manage.kar — local tasks, notes, and habits",
  description:
    "Personal local-first workspace. Your data stays in this browser unless you export it.",
  keywords: ["task management", "habits", "notes", "local-first"],
  authors: [{ name: "Manage.kar" }],
  creator: "Manage.kar",
  publisher: "Manage.kar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Manage.kar" />
      </head>
      <body className="min-h-screen">
        {children}
        <ServiceWorkerRegister />
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
