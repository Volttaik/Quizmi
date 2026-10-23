import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import ClerkThemeProvider from "@/components/ClerkThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quizmi — Practice Tests & CBT Exams",
  description:
    "A focused quiz platform for practice tests and computer-based examinations. Timed exams, instant scoring and detailed performance reports.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizmi",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#7c3aed",
    "msapplication-TileImage": "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>
          <ClerkThemeProvider>
            {children}
            <Toaster position="bottom-center" richColors />
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
