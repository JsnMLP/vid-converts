import type { Metadata } from 'next'
import { Encode_Sans_Expanded, Mulish } from 'next/font/google'
import './globals.css'
import GlobalFooter from '@/components/GlobalFooter'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'

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
  description: 'Upload any marketing video and get an AI-powered audit across 8 conversion factors — hook, offer, CTA, trust signals & more. Free to start.',
  keywords: 'video audit, conversion optimization, marketing video, video analysis',
  verification: {
    google: 'DPGm-DK5xeu74cee5ph-3AkZX_fPdq7GYQFqg6f5Gv0',
  },
  metadataBase: new URL('https://www.vidconverts.com'),
  openGraph: {
    title: 'Is your video actually converting?',
    description: 'Upload any marketing video. Get an AI-powered audit across 8 conversion factors — hook, offer, CTA, trust signals & more. Free to start.',
    url: 'https://www.vidconverts.com',
    siteName: 'Vid Converts',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vid Converts – AI Video Conversion Audit',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Is your video actually converting?',
    description: 'Upload any marketing video. Get an AI-powered audit across 8 conversion factors — free.',
    images: ['/og-image.png'],
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1HSX2KBKS3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1HSX2KBKS3');
          `}
        </Script>
        {children}
        <GlobalFooter />
        <Analytics />
      </body>
    </html>
  )
}
