"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, User, Crown, Star } from "lucide-react"

type DemoNode = {
  id: string
  name: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  totalEarnings: number
  leftChild?: DemoNode
  rightChild?: DemoNode
}

function getMembershipIcon(level: string) {
  switch (level) {
    case "gold":
      return <Crown className="w-3 h-3 text-yellow-600" />
    case "blue":
      return <Star className="w-3 h-3 text-blue-600" />
    default:
      return <User className="w-3 h-3 text-green-600" />
  }
}

function getMembershipColor(level: string) {
  switch (level) {
    case "gold":
      return "bg-yellow-500"
    case "blue":
      return "bg-blue-500"
    default:
      return "bg-green-500"
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(amount)
}

function NodeCard({ node }: { node: DemoNode }) {
  return (
    <Card className={`w-48 ${node.id === "u_root" ? "border-primary border-2" : "border-border"} ${!node.isActive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getMembershipIcon(node.membershipLevel)}
            <CardTitle className="text-sm truncate">{node.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`${getMembershipColor(node.membershipLevel)} text-white text-xs`}>
              {node.membershipLevel.toUpperCase()}
            </Badge>
            <Badge variant={node.isActive ? "default" : "destructive"} className="text-xs">
              {node.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Earnings: {formatCurrency(node.totalEarnings)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RenderDemoTree({ root }: { root: DemoNode }) {
  return (
    <div className="flex flex-col items-center">
      <NodeCard node={root} />
      <div className="mt-4">
        <div className="w-px h-4 bg-border mx-auto"></div>
        <div className="flex justify-center space-x-8">
          {/* Left */}
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-border"></div>
            <div className="w-16 h-px bg-border"></div>
            <div className="w-px h-4 bg-border"></div>
            <Badge variant="outline" className="mb-2 text-xs bg-green-50 text-green-700">Left</Badge>
            {root.leftChild ? (
              <NodeCard node={root.leftChild} />
            ) : (
              <Card className="w-48 border-dashed border-2 border-muted-foreground/30">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Empty Position</p>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Right */}
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-border"></div>
            <div className="w-16 h-px bg-border"></div>
            <div className="w-px h-4 bg-border"></div>
            <Badge variant="outline" className="mb-2 text-xs bg-blue-50 text-blue-700">Right</Badge>
            {root.rightChild ? (
              <NodeCard node={root.rightChild} />
            ) : (
              <Card className="w-48 border-dashed border-2 border-muted-foreground/30">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Empty Position</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BinaryTreeDemo() {
  // Example-only, no real data
  const demo: DemoNode = {
    id: "u_root",
    name: "You",
    membershipLevel: "blue",
    isActive: true,
    totalEarnings: 12500,
    leftChild: {
      id: "u_left",
      name: "Alice (L1)",
      membershipLevel: "green",
      isActive: true,
      totalEarnings: 1200,
    },
    rightChild: {
      id: "u_right",
      name: "Bob (L1)",
      membershipLevel: "gold",
      isActive: true,
      totalEarnings: 9800,
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Binary Tree (Example)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max p-4">
            <RenderDemoTree root={demo} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


