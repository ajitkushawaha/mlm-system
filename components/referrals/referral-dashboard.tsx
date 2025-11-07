"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Share2, Users, TrendingUp, Gift, ExternalLink } from "lucide-react"
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
          title: "Join DreamStake",
          text: "Join our trading and staking platform and start earning today!",
          url: referralLink,
        })
      } catch (error) {
        // User cancelled sharing
        toast(error instanceof Error ? error.message : "Share cancelled or failed")
      }
    } else {
      copyReferralLink()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
      <Card className="border-neutral-800 bg-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Referral Link Section */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Your Referral Link</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Share this link to invite new members to your network</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={referralLink} readOnly className="flex-1 text-xs sm:text-sm" />
            <Button onClick={copyReferralLink} variant="outline" size="sm" className="text-xs sm:text-sm">
              <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button onClick={shareReferralLink} size="sm" className="text-xs sm:text-sm">
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            When someone registers using your link, they&apos;ll be added to your network and you&apos;ll earn direct bonuses.
          </p>
        </CardContent>
      </Card>

      {/* Referral Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.activeReferrals} active</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Direct Bonus Earned</CardTitle>
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(directBonusEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1">From direct referrals</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Connection Earnings</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalEarningsFromReferrals)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total by your referrals</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Direct Referrals Table */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Direct Referrals</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Members who joined directly through your referral link</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-3 sm:pb-6">
          {directReferrals.length > 0 ? (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Member</TableHead>
                      <TableHead className="text-xs sm:text-sm">Level</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Earnings</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directReferrals.map((referral) => (
                      <TableRow key={referral._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-xs sm:text-sm">{referral.name}</div>
                            <div className="text-xs text-muted-foreground">{referral.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getMembershipColor(referral.membershipLevel)} text-[10px] sm:text-xs`}>
                            {referral.membershipLevel.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={referral.isActive ? "default" : "destructive"} className="text-[10px] sm:text-xs">
                            {referral.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm hidden sm:table-cell">{formatCurrency(referral.totalEarnings)}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(referral.joinDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5 sm:mb-2">No Direct Referrals Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Start sharing your referral link to build your network and earn direct bonuses.
              </p>
              <Button onClick={shareReferralLink} size="sm" className="text-xs sm:text-sm">
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                Share Your Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Commission Info */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Generation Commission</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Unlock levels by connecting direct referrals to earn commission on downline purchases</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                <div className="text-xs sm:text-sm font-medium mb-1">Level 1</div>
                <div className="text-base sm:text-lg font-bold text-primary mb-1">$3.00</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Need 1+ direct</div>
              </div>
              <div className="p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                <div className="text-xs sm:text-sm font-medium mb-1">Level 2</div>
                <div className="text-base sm:text-lg font-bold text-primary mb-1">$1.00</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Need 2+ directs</div>
              </div>
              <div className="p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                <div className="text-xs sm:text-sm font-medium mb-1">Level 3</div>
                <div className="text-base sm:text-lg font-bold text-primary mb-1">$0.80</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Need 3+ directs</div>
              </div>
              <div className="p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                <div className="text-xs sm:text-sm font-medium mb-1">Level 4</div>
                <div className="text-base sm:text-lg font-bold text-primary mb-1">$0.70</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Need 4+ directs</div>
              </div>
              <div className="p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                <div className="text-xs sm:text-sm font-medium mb-1">Level 5</div>
                <div className="text-base sm:text-lg font-bold text-primary mb-1">$0.60</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Need 5+ directs</div>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> When someone in your downline network purchases a package, you earn commission based on your unlocked generation level. Connect more direct referrals to unlock higher levels and maximize your earnings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Tips */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Referral Tips</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Maximize your referral success with these strategies</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border border-neutral-800 rounded-lg">
              <h4 className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm">Share on Social Media</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Post your referral link on Facebook, Twitter, LinkedIn, and other social platforms to reach a wider
                audience.
              </p>
            </div>
            <div className="p-3 sm:p-4 border border-neutral-800 rounded-lg">
              <h4 className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm">Personal Connection</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start with friends and family who trust you. Personal recommendations have the highest conversion rates.
              </p>
            </div>
            <div className="p-3 sm:p-4 border border-neutral-800 rounded-lg">
              <h4 className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm">Explain the Benefits</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Help prospects understand the income streams and how they can benefit from joining your team.
              </p>
            </div>
            <div className="p-3 sm:p-4 border border-neutral-800 rounded-lg">
              <h4 className="font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm">Follow Up</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Stay in touch with prospects and provide support during their decision-making process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
