import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import DemoPage from "@/pages/DemoPage";
import CreateQuizPage from "@/pages/CreateQuizPage";
import QuizPage from "@/pages/QuizPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import SummaryPage from "@/pages/SummaryPage";
import BuyCreditsPage from "@/pages/BuyCreditsPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/create-quiz" component={CreateQuizPage} />
      <Route path="/quiz/:id" component={QuizPage} />
      <Route path="/flashcards" component={FlashcardsPage} />
      <Route path="/summary" component={SummaryPage} />
      <Route path="/buy-credits" component={BuyCreditsPage} />
      <Route>{() => <Redirect to="/" />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="quizmi-theme">
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="bottom-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
