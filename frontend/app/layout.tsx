import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tandem — Your team\'s AI memory',
  description: 'Turn team conversations into persistent project intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-[#fcfcfd] text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
