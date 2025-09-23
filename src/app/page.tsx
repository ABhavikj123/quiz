"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Brain,
  Mic,
  ImageIcon,
  Target,
  Play,
  BarChart3,
  Award,
  Trophy,
  Clock,
  Star,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Pacific University Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <div className="text-lg sm:text-xl font-bold text-foreground">Pacific University</div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {/* <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Home
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                Teams
              </a>
              <Button variant="ghost" size="sm" className="font-medium">
                <BarChart3 className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              <Button variant="ghost" size="sm" className="font-medium">
                <Award className="w-4 h-4 mr-2" />
                Results
              </Button> */}
              <Button
                size="sm"
                className="font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/quiz")}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Round
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                {/* <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                  Teams
                </a>
                <Button variant="ghost" size="sm" className="font-medium justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
                <Button variant="ghost" size="sm" className="font-medium justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Results
                </Button> */}
                <Button
                  size="sm"
                  className="font-medium bg-primary text-primary-foreground hover:bg-primary/90 justify-start"
                  onClick={() => (window.location.href = "/quiz")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Round
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-20">
            <Badge
              variant="secondary"
              className="mb-4 sm:mb-6 text-xs sm:text-sm font-medium px-4 py-2 bg-primary/10 text-primary border-primary/20"
            >
              🏆 Academic Excellence Competition 2024
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight text-balance leading-tight">
              Quiz Championship
              <span className="block bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mt-2">
                Battle of Minds
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-4xl mx-auto text-balance leading-relaxed px-4">
              The ultimate academic showdown where 16 elite teams clash across 3 intense rounds of knowledge, quick
              thinking, and strategic brilliance. Only the smartest will survive.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
              <Button
                size="lg"
                className="text-base px-6 sm:px-8 py-4 sm:py-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/quiz")}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Competition
              </Button>
              {/* <Button
                variant="outline"
                size="lg"
                className="text-base px-6 sm:px-8 py-4 sm:py-6 font-semibold hover:bg-primary/5 bg-transparent"
              >
                <BarChart3 className="w-5 h-4 mr-2" />
                Live Leaderboard
              </Button> */}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
              <div className="text-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow duration-200">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                  16
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Elite Teams</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow duration-200">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                  4
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Battle Groups</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow duration-200">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                  3
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Intense Rounds</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow duration-200">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                  30
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Total Questions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="outline" className="mb-4 sm:mb-6 text-xs sm:text-sm font-medium px-4 py-2">
              Competition Format
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
              Three Rounds of
              <span className="block bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Ultimate Challenge
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
              Each round tests different skills - from pure knowledge to quick recognition and strategic thinking
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            <Card className="p-6 sm:p-8 bg-card border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Round 1</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Knowledge Warfare</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Format</span>
                  <Badge variant="secondary" className="text-xs">
                    Multiple Choice
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Questions</span>
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">12 MCQ</Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Lightning-fast multiple choice questions testing fundamental knowledge across diverse academic
                  subjects.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 bg-card border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center">
                  <div className="flex gap-1">
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Round 2</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Sensory Challenge</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Format</span>
                  <Badge variant="secondary" className="text-xs">
                    Audio & Visual
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Questions</span>
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">8 Questions</Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Mind-bending audio and visual recognition challenges that test your ability to identify sounds,
                  voices, and images.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 bg-card border border-border hover:shadow-lg transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Round 3</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Final Showdown</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Format</span>
                  <Badge variant="secondary" className="text-xs">
                    Mixed Challenge
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-card-foreground font-semibold text-sm sm:text-base">Questions</span>
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">10 Questions</Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  The ultimate test combining all formats - only the most versatile and knowledgeable teams will
                  triumph.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="outline" className="mb-4 sm:mb-6 text-xs sm:text-sm font-medium px-4 py-2">
              <Trophy className="w-4 h-4 mr-2" />
              Tournament Structure
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
              Battle Groups &
              <span className="block bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Elimination Format
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
              16 elite teams divided into 4 intense battle groups. Only the strongest from each group advances to glory.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              { name: "Alpha", color: "border-red-200 bg-red-50", icon: "🔥" },
              { name: "Beta", color: "border-blue-200 bg-blue-50", icon: "⚡" },
              { name: "Gamma", color: "border-green-200 bg-green-50", icon: "🚀" },
              { name: "Delta", color: "border-purple-200 bg-purple-50", icon: "💎" },
            ].map((group) => (
              <Card
                key={group.name}
                className={`p-6 sm:p-8 ${group.color} border-2 hover:shadow-lg transition-shadow duration-200`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                    {group.icon}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-card-foreground">Group {group.name}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">4 Teams Battle</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {["Alpha", "Beta", "Gamma", "Delta"].map((school) => (
                    <div
                      key={school}
                      className="flex items-center justify-between p-3 sm:p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-card-foreground">School {school}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Winner Advances</span>
                    </div>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border max-w-4xl mx-auto mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-card-foreground mb-4">Competition Flow</h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                Each group battles through all 3 rounds simultaneously. The team with the highest combined score from
                all rounds advances to the championship finals. May the smartest minds prevail!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button variant="outline" size="lg" className="font-semibold hover:bg-primary/5 bg-transparent">
                  <Trophy className="w-5 h-5 mr-2" />
                  View Tournament Bracket
                </Button>
                <Button
                  size="lg"
                  className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => (window.location.href = "/quiz")}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Begin Competition
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
