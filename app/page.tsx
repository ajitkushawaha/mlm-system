import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, TrendingUp, Award, Shield } from "lucide-react"
import Link from "next/link"
import { BinaryTreeDemo } from "@/components/network/binary-tree-demo"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">MLM Pro</h1>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4" variant="secondary">
            Binary MLM System
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Binary MLM Compensation Plan</h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            A transparent, balanced growth plan designed to ensure fair earnings for all members through a binary system
            with Left and Right legs. Income is generated through direct joining, matching pairs, and ID upgrades across
            three membership levels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/compensation-plan">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                View Compensation Plan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Example Flow */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">How It Works (Example)</h2>
            <p className="text-muted-foreground">A simple example showing ROI, generation commission, and residual referral income.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>1) Staking ROI</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>You stake $5,000 → falls in 6% tier → you earn $300 monthly.</p>
                <p className="text-xs">Rounded to 2 decimals; handled automatically.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2) Generation Commission</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Your Level-1 joins with a package → you get $300 instantly.</p>
                <p className="text-xs">Levels 2–5 get $100, $80, $70, $60 respectively.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3) Residual Referral</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Your Level-1 earns $500 staking income this month → you get 20% = $100.</p>
                <p className="text-xs">Level 2 = 10%, Level 3 = 5% of staking income.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compensation Plan Overview */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Compensation Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparent staking returns, generation commissions, and residual referral income.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 1. Staking Income */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-600">Staking Income</CardTitle>
                  <Badge variant="secondary">Monthly ROI</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Passive income based on staked capital:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$100–$1,000 → 4% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$1,000–$4,000 → 5% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$4,000–$6,000 → 6% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$6,000–$10,000 → 7% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>Above $10,000 → 8% monthly</li>
                </ul>
                <div className="pt-2">
                  <Link href="/payouts">
                    <Button size="sm" variant="outline">View Payouts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 2. Generation Income */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-600">Generation Income</CardTitle>
                  <Badge>Per Join</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Fixed commission up to 5 generations on package purchase:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>1st Gen: $300</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>2nd Gen: $100</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>3rd Gen: $80</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>4th Gen: $70</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>5th Gen: $60</li>
                </ul>
                <div className="pt-2">
                  <Link href="/referrals">
                    <Button size="sm" variant="outline">Manage Referrals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 3. Staking Referral */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-600">Staking Referral</CardTitle>
                  <Badge variant="secondary">Residual</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Earn a percentage of your referrals’ monthly staking income:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 1: 20%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 2: 10%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 3: 5%</li>
                </ul>
                <p className="text-xs text-muted-foreground">Example: If a 1st-level referral earns $500 staking income → you get $100 (20%).</p>
                <div className="pt-2">
                  <Link href="/dashboard">
                    <Button size="sm">Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Our System?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Binary Structure</h3>
              <p className="text-sm text-muted-foreground">Simple left and right leg system for balanced growth</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Progressive Earnings</h3>
              <p className="text-sm text-muted-foreground">Increasing rewards as you advance through levels</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Rank Rewards</h3>
              <p className="text-sm text-muted-foreground">Physical rewards including mobile, laptop, bike, and car</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparent System</h3>
              <p className="text-sm text-muted-foreground">Clear rules and fair compensation for all members</p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Tree Preview (Example Only) */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Network (Preview)</h2>
            <p className="text-muted-foreground">Example visualization of a binary tree. This is sample data to explain the flow.</p>
          </div>
          <BinaryTreeDemo />
          <div className="text-center mt-6">
            <Link href="/network">
              <Button variant="outline">Open Full Network</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 MLM Pro. All rights reserved. Remember: Balance is key! Maintain equal growth in both Left and Right
            legs for continuous earnings.
          </p>
        </div>
      </footer>
    </div>
  )
}
