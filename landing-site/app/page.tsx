import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import WhatWeOffer from '@/components/WhatWeOffer'
import WhoWeBuiltFor from '@/components/WhoWeBuiltFor'
import Testimonials from '@/components/Testimonials'
import Pricing from '@/components/Pricing'
import Team from '@/components/Team'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Stats />
      <WhatWeOffer />
      <WhoWeBuiltFor />
      <Testimonials />
      <Pricing />
      <Team />
      <Footer />
    </main>
  )
}
