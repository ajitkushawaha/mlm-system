import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, TrendingUp, Award, Shield } from "lucide-react"
import Link from "next/link"

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
          <div className="flex space-x-4">
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

      {/* Membership Levels */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Membership Levels</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Progress through three distinct levels, each offering increased earning potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Green ID */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-600">Green ID</CardTitle>
                  <Badge variant="secondary">Entry Level</Badge>
                </div>
                <CardDescription>Perfect for beginners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-foreground">₹760</div>
                <p className="text-sm text-muted-foreground">per pair (after 5% TDS)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>1 Pair (Left + Right) = ₹800
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Auto upgrade after 6 payouts
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>2 cycle timings daily
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Blue ID */}
            <Card className="relative overflow-hidden border-primary">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-blue-600">Blue ID</CardTitle>
                  <Badge>Intermediate</Badge>
                </div>
                <CardDescription>10-step progression system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-foreground">₹5.39Cr</div>
                <p className="text-sm text-muted-foreground">maximum earning potential</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Step 1: 9+9 pairs = ₹13,300
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Step 10: 90,000+90,000 pairs
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Progressive earning structure
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Gold ID */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-yellow-600">Gold ID</CardTitle>
                  <Badge variant="secondary">Elite Level</Badge>
                </div>
                <CardDescription>Exclusive rewards for leaders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-foreground">Unlimited</div>
                <p className="text-sm text-muted-foreground">earning potential</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    Leadership bonuses
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    Global sharing bonus
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    Company profit sharing
                  </li>
                </ul>
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
