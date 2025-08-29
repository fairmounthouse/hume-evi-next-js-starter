'use client'

export default function Team() {
  return (
    <section id="team" className="section-padding" style={{backgroundColor: '#F7F8FA'}}>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-8 tracking-tight font-poppins">Meet the Team Behind skillflo</h2>
      </div>
      
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xl lg:text-2xl text-black leading-relaxed mb-12">
          We're former hiring managers with degrees from MIT, UC Berkeley, and UCLA. We've secured roles at banks, hedge funds, consulting firms, and big tech through hard work and smart prep. Now, we're building skillflo to give you the same edge—because we've walked in your shoes.
        </p>
        
        <button 
          className="btn-neubrutalist btn-secondary text-lg px-8 py-4"
          onClick={() => window.open('https://app.skillflo.ai', '_blank')}
        >
          Get Started - Free Session Awaits
        </button>
      </div>
      </div>
    </section>
  )
}
