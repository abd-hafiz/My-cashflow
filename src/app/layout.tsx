import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MyCashflow — De la discipline financière à la liberté',
  description: 'Gérez vos finances personnelles avec MyCashflow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}