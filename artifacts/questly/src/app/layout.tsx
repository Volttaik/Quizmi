import type { Metadata } from "next";
import { Providers } from "./providers";
import AppToaster from "@/components/AppToaster";
import ClerkThemeProvider from "@/components/ClerkThemeProvider";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const DESCRIPTION =
  "Find your courses, practise with computer-based test questions, and track your progress with saved results and performance reports.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "QUIZMI — Course-based CBT practice",
  description: DESCRIPTION,
  applicationName: "QUIZMI",
  openGraph: {
    type: "website",
    siteName: "QUIZMI",
    title: "QUIZMI — Course-based CBT practice",
    description: DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "QUIZMI — course-based CBT practice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QUIZMI — Course-based CBT practice",
    description: DESCRIPTION,
    images: ["/opengraph.jpg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QUIZMI",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#7c3aed",
    "msapplication-TileImage": "/icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('quizmi-theme');
                  var dark = stored === 'dark' || ((!stored || stored === 'system') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.add(dark ? 'dark' : 'light');
                  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                } catch (error) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <ClerkThemeProvider>
            {children}
            <AppToaster />
          </ClerkThemeProvider>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          });
                        }
                      });
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
