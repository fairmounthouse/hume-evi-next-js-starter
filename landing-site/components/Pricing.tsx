export default function Pricing() {
  const plans = [
    {
      name: "Monthly",
      regular: "$50/mo",
      promo: "$37.50/mo",
      description: "120 mins (~4 sessions)",
      subtitle: "For casual preppers",
      isPopular: false
    },
    {
      name: "Quarterly", 
      regular: "$40/mo ($120)",
      promo: "$30/mo ($90)",
      description: "120 mins/mo (~4 sessions)",
      subtitle: "For seasonal users (3-mo. min.)",
      isPopular: true
    },
    {
      name: "Semi-Annually",
      regular: "$30/mo ($180)", 
      promo: "$22.50/mo ($135)",
      description: "120 mins/mo (~4 sessions)",
      subtitle: "For long-term builders (6-mo. min.)",
      isPopular: false
    }
  ]

  return (
    <section id="pricing" className="section-padding max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-6xl font-black mb-8 tracking-tight font-poppins">Straightforward Pricing</h2>
        <p className="text-xl font-semibold text-black mb-4">
          Not sure? Try one mock interview and coaching session now!
        </p>
        <p className="text-lg text-black opacity-80">
          All plans include access to tools & modules (coming soon). Sessions avg. 30 mins.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan, index) => (
          <div key={index} className={`card-neubrutalist relative ${plan.isPopular ? 'ring-4 ring-yellow-primary' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-primary border-2 border-black px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
            )}
            <h3 className="text-2xl font-bold mb-4 text-black">{plan.name}</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-through">Reg: {plan.regular}</p>
              <p className="text-3xl font-black text-blue-accent">Promo: {plan.promo}</p>
            </div>
            <p className="text-lg text-black mb-2">{plan.description}</p>
            <p className="text-base text-black opacity-80 mb-6">{plan.subtitle}</p>
            <button className="btn-neubrutalist btn-secondary w-full">
              Select
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        <p className="text-lg text-black mb-6">
          <strong>Top up:</strong> $10/60 mins or $100/660 mins.
        </p>
        <button className="btn-neubrutalist btn-primary text-lg px-8 py-4">
          Start Free - Get Your Session
        </button>
      </div>
    </section>
  )
}
