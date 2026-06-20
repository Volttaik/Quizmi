import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import CreateQuizPage from "@/pages/CreateQuizPage";
import QuizPage from "@/pages/QuizPage";
import QuizzesListPage from "@/pages/QuizzesListPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import SummaryPage from "@/pages/SummaryPage";
import BuyCreditsPage from "@/pages/BuyCreditsPage";
import ProfilePage from "@/pages/ProfilePage";
import HistoryPage from "@/pages/HistoryPage";
import AccountDetailsPage from "@/pages/settings/AccountDetailsPage";
import NotificationsPage from "@/pages/settings/NotificationsPage";
import PrivacySecurityPage from "@/pages/settings/PrivacySecurityPage";
import HelpSupportPage from "@/pages/settings/HelpSupportPage";
import TermsPrivacyPage from "@/pages/settings/TermsPrivacyPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
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

function ClerkSignInPage() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-purple-800/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-white/40 text-sm">Sign in to continue studying</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
        <p className="text-center text-xs text-white/20 mt-4">
          <a href={`${basePath}/sign-up`} className="hover:text-white/40 transition-colors">
            Create free account →
          </a>
        </p>
      </div>
    </div>
  );
}

function ClerkSignUpPage() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-purple-800/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-white/40 text-sm">Start studying smarter today</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
        />
      </div>
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to continue studying" } },
        signUp: { start: { title: "Create your account", subtitle: "Start studying smarter today" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRoute} />
          <Route path="/sign-in/*?" component={ClerkSignInPage} />
          <Route path="/sign-up/*?" component={ClerkSignUpPage} />
          <Route path="/demo">{() => <Redirect to="/sign-in" />}</Route>
          <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
          <Route path="/quizzes">{() => <ProtectedRoute component={QuizzesListPage} />}</Route>
          <Route path="/create-quiz">{() => <ProtectedRoute component={CreateQuizPage} />}</Route>
          <Route path="/quiz/:id" component={QuizPage} />
          <Route path="/flashcards">{() => <ProtectedRoute component={FlashcardsPage} />}</Route>
          <Route path="/summary">{() => <ProtectedRoute component={SummaryPage} />}</Route>
          <Route path="/buy-credits">{() => <ProtectedRoute component={BuyCreditsPage} />}</Route>
          <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
          <Route path="/history">{() => <ProtectedRoute component={HistoryPage} />}</Route>
          <Route path="/settings/account">{() => <ProtectedRoute component={AccountDetailsPage} />}</Route>
          <Route path="/settings/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
          <Route path="/settings/privacy">{() => <ProtectedRoute component={PrivacySecurityPage} />}</Route>
          <Route path="/settings/help">{() => <ProtectedRoute component={HelpSupportPage} />}</Route>
          <Route path="/settings/terms">{() => <ProtectedRoute component={TermsPrivacyPage} />}</Route>
          <Route>{() => <Redirect to="/" />}</Route>
        </Switch>
        <Toaster position="bottom-center" richColors />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
