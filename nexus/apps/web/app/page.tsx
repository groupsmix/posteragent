export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome to NEXUS
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your personal AI-powered business engine. Select a domain to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Domain cards will be rendered here */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="text-4xl">🎨</div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Print on Demand
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            T-shirts, mugs, posters, and custom merchandise
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="text-4xl">📦</div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Digital Products
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Templates, courses, ebooks, and digital downloads
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="text-4xl">📱</div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Content &amp; Media
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Social content, videos, podcasts, and media assets
          </p>
        </div>
      </div>
    </div>
  )
}
