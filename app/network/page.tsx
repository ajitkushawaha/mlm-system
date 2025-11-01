"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BinaryTree } from "@/components/network/binary-tree"
import { NetworkAnalytics } from "@/components/network/network-analytics"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NetworkPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading network...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">Network Management</h1>
            <p className="text-neutral-400 max-w-lg">Visualize and analyze your binary tree network structure.</p>
          </div>

          {/* Network Analytics */}
          <NetworkAnalytics />

          {/* Binary Tree Visualization */}
          <BinaryTree />
        </div>
      </main>
      </div>
    </div>
  )
}
