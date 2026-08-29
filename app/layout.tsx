import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0053fd",
}

export const metadata: Metadata = {
  title: "Manage.kar — Hermes companion",
  description:
    "Companion for a paired Hermes machine. Chats, tasks, notes, and habits stay on this device unless you export.",
  keywords: ["hermes", "companion", "tasks", "notes", "habits", "local-first"],
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
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} antialiased`}>
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
