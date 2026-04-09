import type { Metadata } from 'next'
import { Encode_Sans_Expanded, Mulish } from 'next/font/google'
import './globals.css'
import GlobalFooter from '@/components/GlobalFooter'

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  variable: '--font-encode',
  weight: ['700', '800', '900'],
  display: 'swap',
})

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-mulish',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vid Converts — Video Conversion Audit',
  description: 'Evidence-based video conversion audits for coaches, consultants, and service providers. Know exactly what to fix and why.',
  keywords: 'video audit, conversion optimization, marketing video, video analysis',
  verification: {
    google: 'DPGm-DK5xeu74cee5ph-3AkZX_fPdq7GYQFqg6f5Gv0',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${encodeSansExpanded.variable} ${mulish.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <GlobalFooter />
      </body>
    </html>
  )
}
