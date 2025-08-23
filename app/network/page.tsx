"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BinaryTree } from "@/components/network/binary-tree"
import { NetworkAnalytics } from "@/components/network/network-analytics"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Network Management</h1>
            <p className="text-muted-foreground">Visualize and analyze your binary tree network structure.</p>
          </div>

          {/* Network Analytics */}
          <NetworkAnalytics />

          {/* Binary Tree Visualization */}
          <BinaryTree />
        </div>
      </main>
    </div>
  )
}
