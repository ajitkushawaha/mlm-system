"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Users, User, Crown, Star } from "lucide-react"

interface ReferralTreeNode {
  id: string
  name: string
  email: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
  position: "left" | "right"
  level: number
  children: ReferralTreeNode[]
}

export function ReferralTree() {
  const [tree, setTree] = useState<ReferralTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchReferralTree()
  }, [])

  const fetchReferralTree = async () => {
    try {
      const response = await fetch("/api/referrals/tree")
      if (response.ok) {
        const data = await response.json()
        setTree(data.tree)
        // Auto-expand first level
        const firstLevelIds = data.tree.map((node: ReferralTreeNode) => node.id)
        setExpandedNodes(new Set(firstLevelIds))
      }
    } catch (error) {
      console.error("Failed to fetch referral tree:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case "gold":
        return <Crown className="w-3 h-3 text-yellow-600" />
      case "blue":
        return <Star className="w-3 h-3 text-blue-600" />
      default:
        return <User className="w-3 h-3 text-green-600" />
    }
  }

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "gold":
        return "bg-yellow-500"
      case "blue":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount)
  }

  const renderNode = (node: ReferralTreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const indentClass = `ml-${Math.min(depth * 4, 16)}`

    return (
      <div key={node.id} className={`${depth > 0 ? indentClass : ""}`}>
        {/* Node Card */}
        <Card className={`mb-2 border-neutral-800 bg-transparent ${!node.isActive ? "opacity-60" : ""}`}>
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                {hasChildren && (
                  <Button variant="ghost" size="sm" onClick={() => toggleNode(node.id)} className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-5 sm:w-6" />}

                <div className="flex-shrink-0">{getMembershipIcon(node.membershipLevel)}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-medium text-xs sm:text-sm truncate">{node.name}</span>
                    <Badge className={`${getMembershipColor(node.membershipLevel)} text-white text-[10px] sm:text-xs`}>
                      {node.membershipLevel.toUpperCase()}
                    </Badge>
                    <Badge variant={node.isActive ? "default" : "destructive"} className="text-[10px] sm:text-xs">
                      {node.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{node.email}</div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-auto sm:ml-0">
                <div className="text-xs sm:text-sm font-medium">{formatCurrency(node.totalEarnings)}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Level {node.level}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 sm:ml-4 border-l-2 border-neutral-800 pl-2 sm:pl-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Referral Tree</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-neutral-800 bg-transparent">
      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Referral Tree</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your complete referral network hierarchy (up to 5 levels)</CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto border border-neutral-800 rounded-lg p-2 sm:p-4">
          {tree.length > 0 ? (
            <div className="space-y-2">{tree.map((node) => renderNode(node))}</div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5 sm:mb-2">No Referrals Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start building your referral network by sharing your referral link with others.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
