import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Manage.kar - Smart Task & Life Management",
  description:
    "Modern task management, habit tracking, and productivity app with team collaboration features. Built with iOS 18 inspired design.",
  keywords: ["task management", "productivity", "habits", "collaboration", "notes", "focus"],
  authors: [{ name: "Manage.kar Team" }],
  creator: "Manage.kar",
  publisher: "Manage.kar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://manage-kar.vercel.app"),
  openGraph: {
    title: "Manage.kar - Smart Task & Life Management",
    description: "Modern task management, habit tracking, and productivity app with team collaboration features.",
    url: "https://manage-kar.vercel.app",
    siteName: "Manage.kar",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manage.kar - Smart Task & Life Management",
    description: "Modern task management, habit tracking, and productivity app with team collaboration features.",
    creator: "@managekar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Manage.kar" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
