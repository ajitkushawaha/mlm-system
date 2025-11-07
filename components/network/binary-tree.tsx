"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ChevronDown, ChevronRight, User, Crown, Star } from "lucide-react"

interface TreeNode {
  id: string
  name: string
  email: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
  leftChild?: TreeNode
  rightChild?: TreeNode
  position?: "left" | "right"
  depth: number
}

interface BinaryTreeProps {
  maxDepth?: number
}

export function BinaryTree({ maxDepth = 3 }: BinaryTreeProps) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTree()
  }, [])

  const fetchTree = async () => {
    try {
      const response = await fetch("/api/connection/tree")
      if (response.ok) {
        const data = await response.json()
        setTree(data.tree)
        // Auto-expand root node
        if (data.tree) {
          setExpandedNodes(new Set([data.tree.id]))
        }
      }
    } catch (error) {
      console.error("Failed to fetch tree:", error)
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

  const renderNode = (node: TreeNode, isRoot = false) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.leftChild || node.rightChild
    const canExpand = hasChildren && node.depth < maxDepth

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <Card
          className={`w-[140px] sm:w-40 md:w-48 border-neutral-800 bg-transparent ${isRoot ? "border-primary border-2" : ""} ${
            !node.isActive ? "opacity-60" : ""
          }`}
        >
          <CardHeader className="pb-1.5 sm:pb-2 px-2 sm:px-3 md:px-6 pt-2 sm:pt-3 md:pt-6">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 min-w-0 flex-1">
                <div className="flex-shrink-0">{getMembershipIcon(node.membershipLevel)}</div>
                <CardTitle className="text-[10px] sm:text-xs md:text-sm truncate">{node.name}</CardTitle>
              </div>
              {canExpand && (
                <Button variant="ghost" size="sm" onClick={() => toggleNode(node.id)} className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 flex-shrink-0">
                  {isExpanded ? <ChevronDown className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" /> : <ChevronRight className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-2 sm:px-3 md:px-6 pb-2 sm:pb-3 md:pb-6">
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                <Badge className={`${getMembershipColor(node.membershipLevel)} text-white text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5`}>
                  {node.membershipLevel.toUpperCase()}
                </Badge>
                <Badge variant={node.isActive ? "default" : "destructive"} className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5">
                  {node.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                <p className="truncate">Earnings: {formatCurrency(node.totalEarnings)}</p>
                <p className="truncate">Joined: {new Date(node.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        {canExpand && isExpanded && (
          <div className="mt-2 sm:mt-3 md:mt-4">
            {/* Connection Line */}
            <div className="w-px h-2 sm:h-3 md:h-4 bg-border mx-auto"></div>
            <div className="flex justify-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
              {/* Left Child */}
              <div className="flex flex-col items-center">
                {node.leftChild ? (
                  <>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <div className="w-8 sm:w-12 md:w-16 h-px bg-border"></div>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <Badge variant="outline" className="mb-1 sm:mb-1.5 md:mb-2 text-[9px] sm:text-[10px] md:text-xs bg-green-50 text-green-700 px-1">
                      Left
                    </Badge>
                    {renderNode(node.leftChild)}
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <div className="w-8 sm:w-12 md:w-16 h-px bg-border"></div>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <Badge variant="outline" className="mb-1 sm:mb-1.5 md:mb-2 text-[9px] sm:text-[10px] md:text-xs bg-green-50 text-green-700 px-1">
                      Left
                    </Badge>
                    <Card className="w-[140px] sm:w-40 md:w-48 border-dashed border-2 border-neutral-700 bg-transparent">
                      <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                        <Users className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-muted-foreground mx-auto mb-1 sm:mb-1.5 md:mb-2" />
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Empty Position</p>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Add member here</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Right Child */}
              <div className="flex flex-col items-center">
                {node.rightChild ? (
                  <>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <div className="w-8 sm:w-12 md:w-16 h-px bg-border"></div>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <Badge variant="outline" className="mb-1 sm:mb-1.5 md:mb-2 text-[9px] sm:text-[10px] md:text-xs bg-blue-50 text-blue-700 px-1">
                      Right
                    </Badge>
                    {renderNode(node.rightChild)}
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <div className="w-8 sm:w-12 md:w-16 h-px bg-border"></div>
                    <div className="w-px h-2 sm:h-3 md:h-4 bg-border"></div>
                    <Badge variant="outline" className="mb-1 sm:mb-1.5 md:mb-2 text-[9px] sm:text-[10px] md:text-xs bg-blue-50 text-blue-700 px-1">
                      Right
                    </Badge>
                    <Card className="w-[140px] sm:w-40 md:w-48 border-dashed border-2 border-neutral-700 bg-transparent">
                      <CardContent className="p-2 sm:p-3 md:p-4 text-center">
                        <Users className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-muted-foreground mx-auto mb-1 sm:mb-1.5 md:mb-2" />
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Empty Position</p>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Add member here</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Connection Tree</CardTitle>
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
          <span>Connection Tree</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 pb-3 sm:pb-6">
        <div className="overflow-auto max-h-[500px] sm:max-h-[600px] md:max-h-[700px] lg:max-h-[800px] -mx-2 sm:mx-0 border border-neutral-800 rounded-lg">
          <div className="min-w-max p-2 sm:p-4">
            {tree ? renderNode(tree, true) : <p className="text-xs sm:text-sm text-center text-muted-foreground py-6 sm:py-8">No connection data</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
