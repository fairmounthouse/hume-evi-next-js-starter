'use client'

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Skillflo's case coaching is impressively detailed and gave me instant insights that helped me improve. Anyone trying to get a consulting role needs to use Skillflo.",
      author: "Tyson C., INSEAD MBA '25"
    },
    {
      quote: "Shy about practicing with classmates so I started with Skillflo. It absolutely gave me an edge heading into recruiting season.",
      author: "Jennifer K., UCLA Econ BA '25"
    },
    {
      quote: "Skillflo sessions were spot-on and more helpful than peer mock interviews, not to mention much more affordable than $400/hr coaches.",
      author: "Josh C., MIT Sloan MBA '25"
    },
    {
      quote: "As an ex-McKinsey coach, Skillflo delivers pro-level cases with precise coaching and feedback. Perfect for newbies or experts.",
      author: "AC G., Ex-McKinsey/INSEAD '19"
    }
  ]

  return (
    <section id="testimonials" className="section-padding w-full overflow-x-hidden" style={{backgroundColor: '#FEBB69'}}>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-8 tracking-tight font-poppins">From Our Users</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="card-neubrutalist">
            <p className="text-lg text-black leading-relaxed mb-6 italic">
              "{testimonial.quote}"
            </p>
            <p className="font-semibold text-black">
              - {testimonial.author}
            </p>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <button 
          className="btn-neubrutalist btn-secondary text-lg px-8 py-4"
          onClick={() => window.open('https://app.skillflo.ai', '_blank')}
        >
          Join Them - Free Session Included
        </button>
      </div>
      </div>
    </section>
  )
}
