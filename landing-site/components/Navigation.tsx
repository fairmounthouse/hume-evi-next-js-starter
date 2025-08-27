'use client'

import Link from 'next/link'

export default function Navigation() {
  return (
    <header className="bg-white border-b-4 border-black fixed top-0 left-0 right-0 z-50 shadow-[0_4px_0_rgba(0,0,0,0.1)]">
      <nav className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-black">
          skillflo
        </Link>
        
        <ul className="hidden md:flex gap-8 list-none">
          <li><Link href="#features" className="text-black font-semibold hover:text-blue-accent transition-colors">Features</Link></li>
          <li><Link href="#pricing" className="text-black font-semibold hover:text-blue-accent transition-colors">Pricing</Link></li>
          <li><Link href="#testimonials" className="text-black font-semibold hover:text-blue-accent transition-colors">Testimonials</Link></li>
          <li><Link href="#team" className="text-black font-semibold hover:text-blue-accent transition-colors">Team</Link></li>
        </ul>
        
        <div className="flex gap-4">
          <button className="btn-neubrutalist btn-white">
            Log in
          </button>
          <button className="btn-neubrutalist btn-secondary">
            Start Free
          </button>
        </div>
      </nav>
    </header>
  )
}
