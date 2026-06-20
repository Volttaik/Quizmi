import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quizmi — Study Reimagined",
  description: "AI-powered study platform. Generate quizzes, flashcards, and summaries instantly.",
};

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: "/",
    logoImageUrl: "/logo.png",
  },
  variables: {
    colorPrimary: "hsl(262, 72%, 55%)",
    colorForeground: "hsl(222, 47%, 11%)",
    colorMutedForeground: "hsl(220, 9%, 46%)",
    colorDanger: "hsl(0, 72%, 51%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(220, 13%, 97%)",
    colorInputForeground: "hsl(222, 47%, 11%)",
    colorNeutral: "hsl(220, 13%, 91%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-black/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold text-2xl",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium text-sm",
    footerActionLink: "text-purple-600 font-semibold hover:text-purple-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-purple-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "flex justify-center mb-1",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 rounded-xl",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold shadow-lg shadow-purple-500/25",
    formFieldInput: "border-gray-200 rounded-xl bg-gray-50 focus:border-purple-400 focus:ring-purple-400/20",
    footerAction: "bg-gray-50 border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "rounded-xl",
    otpCodeFieldInput: "border-gray-200 rounded-lg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <Providers>
            {children}
            <Toaster position="bottom-center" richColors />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
