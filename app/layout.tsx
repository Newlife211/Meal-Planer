import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { GoogleAnalytics } from '@/components/google-analytics';
import { VisitTracker } from '@/components/visit-tracker';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

// Canonical origin for all metadata (canonical tags, OG/Twitter URLs). Hardcoded
// to the single primary domain so every deployed alias canonicalizes here and
// the site never competes with itself in search results.
const SITE_URL = 'https://geteatwise.com';
const SITE_NAME = 'Eatwise';
const TITLE = 'Eatwise — AI Meal Planner: weekly menu, recipes & shopping list';
const DESCRIPTION =
  'Eatwise builds personalized weekly meal plans around your goals, diet and allergies — with recipes, calories & macros and an auto-generated grocery list. Start a 7-day free trial.';

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: '%s | Eatwise',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'meal planner',
    'AI meal planner',
    'weekly meal plan',
    'meal plan generator',
    'diet planner',
    'nutrition planner',
    'shopping list generator',
    'healthy eating',
    'keto meal plan',
    'vegetarian meal plan',
    'планировщик питания',
    'меню на неделю',
    'план питания',
    'список покупок',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'ru-RU': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    alternateLocale: ['ru_RU'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Eatwise — AI meal planning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <GoogleAnalytics />
        <VisitTracker />
        <Providers>
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
