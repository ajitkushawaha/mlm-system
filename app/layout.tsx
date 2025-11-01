import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { AuthProvider } from "@/hooks/use-auth"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { BottomTabBar } from "@/components/ui/bottom-tab-bar"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "MLM Pro - Binary Compensation Plan",
  description: "Professional MLM compensation plan with binary structure and progressive earnings",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={`${dmSans.variable} antialiased`}>
        <body className={`font-sans ${dmSans.variable}`}>
          <Toaster position="top-right" />
          {children}
          <BottomTabBar />
        </body>
      </html>
    </AuthProvider>
  )
}
