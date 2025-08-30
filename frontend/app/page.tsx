import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Globe, Star, TrendingUp, Users, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[64rem] flex-col items-center space-y-4 text-center">
          <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Learn Languages Through
            <span className="text-primary"> Stories</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Discover a world of multilingual stories designed to help you learn English and Turkish 
            through contextual reading. Read side-by-side translations or focus on one language at a time.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/stories">Start Reading</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            Why Choose Story Library?
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Our platform is designed specifically for language learners who want to improve through reading.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Globe className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Bilingual Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Read stories in Turkish and English side-by-side, or focus on one language with 
                paragraph-by-paragraph translations available on demand.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your reading progress, mark completed stories, and see your language 
                learning journey unfold over time.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Star className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Quality Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Carefully curated stories from professional writers and translators, 
                rated and reviewed by our community.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            Featured Stories
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Start your language learning journey with these popular stories.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {/* Placeholder for featured stories */}
          <Card className="story-card">
            <CardHeader className="story-card-header">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Fiction</Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.5</span>
                </div>
              </div>
              <CardTitle className="story-card-title">The Coffee Shop</CardTitle>
              <CardDescription className="story-card-description">
                A magical story about a small coffee shop that changes people&apos;s lives.
              </CardDescription>
            </CardHeader>
            <CardContent className="story-card-content">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Beginner Level</span>
                <span>5 min read</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="story-card">
            <CardHeader className="story-card-header">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Technology</Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.2</span>
                </div>
              </div>
              <CardTitle className="story-card-title">Introduction to AI</CardTitle>
              <CardDescription className="story-card-description">
                Learn about artificial intelligence through this engaging introductory story.
              </CardDescription>
            </CardHeader>
            <CardContent className="story-card-content">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Intermediate Level</span>
                <span>8 min read</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="story-card">
            <CardHeader className="story-card-header">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Business</Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.7</span>
                </div>
              </div>
              <CardTitle className="story-card-title">Startup Journey</CardTitle>
              <CardDescription className="story-card-description">
                Follow the adventures of a young entrepreneur building her first company.
              </CardDescription>
            </CardHeader>
            <CardContent className="story-card-content">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Advanced Level</span>
                <span>12 min read</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/stories">View All Stories</Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-8 md:py-12">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-3 md:max-w-[64rem]">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold">500+</h3>
              <p className="text-sm text-muted-foreground">Stories Available</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold">10K+</h3>
              <p className="text-sm text-muted-foreground">Active Learners</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold">99%</h3>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <BookOpen className="h-6 w-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              Built for language learners, by language learners.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}