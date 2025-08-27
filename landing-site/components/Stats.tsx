export default function Stats() {
  return (
    <section className="bg-white border-t-4 border-b-4 border-black py-16 my-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-4 bg-yellow-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-blue-accent block">50K+</span>
            <span className="text-base font-semibold text-black mt-2">Mock Interviews</span>
          </div>
          <div className="text-center p-4 bg-yellow-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-blue-accent block">92%</span>
            <span className="text-base font-semibold text-black mt-2">Success Rate</span>
          </div>
          <div className="text-center p-4 bg-yellow-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-blue-accent block">500+</span>
            <span className="text-base font-semibold text-black mt-2">Companies</span>
          </div>
          <div className="text-center p-4 bg-yellow-light border-3 border-black rounded-2xl transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[-2deg] hover:shadow-[5px_5px_0_#000] hover:bg-yellow-primary">
            <span className="text-5xl font-black text-blue-accent block">24/7</span>
            <span className="text-base font-semibold text-black mt-2">Available</span>
          </div>
        </div>
      </div>
    </section>
  )
}
