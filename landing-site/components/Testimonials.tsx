'use client'

export default function Testimonials() {
  const testimonials = [
    {
      quote: "skillflo's case coaching felt lifelike from day one. It boosted my confidence for peer mocks and nailed McKinsey.",
      author: "Tyson C., INSEAD MBA '25"
    },
    {
      quote: "Shy about practicing with classmates, I started with skillflo. The real interview feel gave me a big head start for Bain.",
      author: "Jennifer K., UCLA Econ BA '25"
    },
    {
      quote: "Mocks were spot-on and more useful than peers—cheaper than $400/hr coaches.",
      author: "Josh C., MIT Sloan MBA '25"
    },
    {
      quote: "As an ex-McKinsey coach, skillflo delivers pro-level cases with precise feedback. Perfect for newbies or experts.",
      author: "A.C.G., Ex-McKinsey/INSEAD '19"
    }
  ]

  return (
    <section id="testimonials" className="section-padding" style={{backgroundColor: '#FEBB69'}}>
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
