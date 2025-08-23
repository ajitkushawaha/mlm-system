"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Share2, Users, TrendingUp, UserPlus, Gift, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  greenReferrals: number
  blueReferrals: number
  goldReferrals: number
  totalEarningsFromReferrals: number
}

interface DirectReferral {
  _id: string
  name: string
  email: string
  phone: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
}

export function ReferralDashboard() {
  const [referralLink, setReferralLink] = useState("")
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [directReferrals, setDirectReferrals] = useState<DirectReferral[]>([])
  const [directBonusEarnings, setDirectBonusEarnings] = useState(0)
  const [loading, setLoading] = useState(true)
 

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      // Fetch referral link
      const linkResponse = await fetch("/api/referrals/generate-link")
      if (linkResponse.ok) {
        const linkData = await linkResponse.json()
        setReferralLink(linkData.referralLink)
      }

      // Fetch referral stats
      const statsResponse = await fetch("/api/referrals/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setDirectReferrals(statsData.directReferrals)
        setDirectBonusEarnings(statsData.directBonusEarnings)
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast( "Referral link copied to clipboard",
      )
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to copy referral link")
    }
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join MLM Pro",
          text: "Join our MLM system and start earning today!",
          url: referralLink,
        })
      } catch (error) {
        // User cancelled sharing
        console.log("Share cancelled or failed:", error)
        toast(error instanceof Error ? error.message : "Share cancelled or failed")
      }
    } else {
      copyReferralLink()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "gold":
        return "bg-yellow-500 text-white"
      case "blue":
        return "bg-blue-500 text-white"
      default:
        return "bg-green-500 text-white"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Your Referral Link</span>
          </CardTitle>
          <CardDescription>Share this link to invite new members to your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input value={referralLink} readOnly className="flex-1" />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={shareReferralLink}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When someone registers using your link, they ll be added to your network and you&apos;ll earn direct bonuses.
          </p>
        </CardContent>
      </Card>

      {/* Referral Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">{stats.activeReferrals} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Direct Bonus Earned</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(directBonusEarnings)}</div>
              <p className="text-xs text-muted-foreground">From direct referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarningsFromReferrals)}</div>
              <p className="text-xs text-muted-foreground">Total by your referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advanced Members</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blueReferrals + stats.goldReferrals}</div>
              <p className="text-xs text-muted-foreground">Blue + Gold referrals</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Direct Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Referrals</CardTitle>
          <CardDescription>Members who joined directly through your referral link</CardDescription>
        </CardHeader>
        <CardContent>
          {directReferrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directReferrals.map((referral) => (
                  <TableRow key={referral._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referral.name}</div>
                        <div className="text-sm text-muted-foreground">{referral.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMembershipColor(referral.membershipLevel)}>
                        {referral.membershipLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={referral.isActive ? "default" : "destructive"}>
                        {referral.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(referral.totalEarnings)}</TableCell>
                    <TableCell className="text-sm">{new Date(referral.joinDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Direct Referrals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing your referral link to build your network and earn direct bonuses.
              </p>
              <Button onClick={shareReferralLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Tips</CardTitle>
          <CardDescription>Maximize your referral success with these strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Share on Social Media</h4>
              <p className="text-sm text-muted-foreground">
                Post your referral link on Facebook, Twitter, LinkedIn, and other social platforms to reach a wider
                audience.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Personal Network</h4>
              <p className="text-sm text-muted-foreground">
                Start with friends and family who trust you. Personal recommendations have the highest conversion rates.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Explain the Benefits</h4>
              <p className="text-sm text-muted-foreground">
                Help prospects understand the MLM compensation plan and how they can benefit from joining your network.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Follow Up</h4>
              <p className="text-sm text-muted-foreground">
                Stay in touch with prospects and provide support during their decision-making process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
