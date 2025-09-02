import { PricingTable } from '@clerk/nextjs'
import { CheckCircle, Star, Zap, Shield, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PricingPage() {
  const features = [
    {
      icon: <Zap className="h-5 w-5 text-primary" />,
      title: "AI-Powered Interviews",
      description: "Advanced AI coaching with real-time feedback"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      title: "Detailed Analytics",
      description: "Track your progress with comprehensive insights"
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Secure & Private",
      description: "Enterprise-grade security for your data"
    },
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: "Expert Support",
      description: "Get help from our interview coaching experts"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "Interview AI helped me land my dream job at Google. The AI feedback was incredibly accurate and helped me improve my technical communication.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager at Meta",
      content: "The detailed analysis feature is game-changing. I could see exactly where I needed to improve and track my progress over time.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Data Scientist at Netflix",
      content: "The realistic interview scenarios prepared me for every type of question. I felt confident going into my interviews.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            ✨ Most Popular Choice for Interview Prep
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Choose Your
            <span className="text-primary"> Success </span>
            Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of professionals who've landed their dream jobs with Interview AI. 
            Start with our free plan and upgrade as you grow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>30-day money back</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <PricingTable />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform combines cutting-edge AI technology with proven interview strategies 
            to give you the competitive edge you need.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Top Professionals</h2>
          <p className="text-muted-foreground">
            See what our users say about their Interview AI experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Everything you need to know about Interview AI
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change my plan anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                Changes take effect at your next billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's included in the free plan?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The free plan includes 2 minutes of interview practice per month and 1 interview session per day. 
                Perfect for getting started and trying out our platform.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is my data secure?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely. We use enterprise-grade encryption and security measures to protect your data. 
                Your interview sessions and personal information are always kept private and secure.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of professionals who've transformed their interview skills with Interview AI.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Start your free trial today • No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>
    </div>
  )
}