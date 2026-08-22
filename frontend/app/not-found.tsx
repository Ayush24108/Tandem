import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">404</h1>
      <p className="text-sm text-slate-500 mb-6">Page not found in Tandem workspace.</p>
      <Link
        href="/workspace"
        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
      >
        Back to Workspace
      </Link>
    </div>
  )
}
