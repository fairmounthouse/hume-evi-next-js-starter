"use client";

export default function FooterNewsletter() {
  return (
    <div className="py-8 border-t border-gray-200 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Get interview tips & updates
          </h3>
          <p className="text-gray-600">Join 20,000+ subscribers getting weekly insights</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 md:w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}


