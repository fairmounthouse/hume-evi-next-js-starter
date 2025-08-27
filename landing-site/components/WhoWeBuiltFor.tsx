'use client'

export default function WhoWeBuiltFor() {
  return (
    <section className="section-padding" style={{backgroundColor: '#94A4FF'}}>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-8 tracking-tight font-poppins">Built for You</h2>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <ul className="space-y-6 text-lg lg:text-xl text-black leading-relaxed">
          <li className="flex items-start gap-4">
            <div className="w-3 h-3 bg-yellow-primary border-2 border-black rounded-full mt-3 flex-shrink-0"></div>
            <span>Students and early pros leveling up interview skills.</span>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-3 h-3 bg-yellow-primary border-2 border-black rounded-full mt-3 flex-shrink-0"></div>
            <span>Ambitious learners seeking an edge in recruiting to secure internships or full-time offers.</span>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-3 h-3 bg-yellow-primary border-2 border-black rounded-full mt-3 flex-shrink-0"></div>
            <span>Those wanting reps and feedback without peer pressure or high coach fees.</span>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-3 h-3 bg-yellow-primary border-2 border-black rounded-full mt-3 flex-shrink-0"></div>
            <span>Anyone building confidence before mocks with friends or real company interviews.</span>
          </li>
        </ul>
        
        <div className="text-center mt-12">
          <button 
            className="btn-neubrutalist btn-secondary text-lg px-8 py-4"
            onClick={() => window.open('https://app.skillflo.ai', '_blank')}
          >
            Get Your Free Session
          </button>
        </div>
      </div>
      </div>
    </section>
  )
}
