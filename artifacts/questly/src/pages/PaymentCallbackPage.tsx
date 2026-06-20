import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Zap, Home, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCallbackPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const credits = params.get("credits");
  const reason = params.get("reason");
  const ref = params.get("ref");

  const isSuccess = status === "success";

  const reasonMap: Record<string, string> = {
    no_reference: "No payment reference found.",
    not_configured: "Payment system is not configured.",
    payment_not_successful: "Your payment did not complete successfully.",
    missing_metadata: "Payment data is incomplete.",
    server_error: "A server error occurred while verifying your payment.",
  };

  const errorMessage = reasonMap[reason ?? ""] ?? "Your payment could not be verified.";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-0 right-0 h-[400px] ${isSuccess ? "bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-transparent" : "bg-gradient-to-br from-red-600/15 via-red-500/8 to-transparent"}`}
        />
        <div className={`absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] ${isSuccess ? "bg-emerald-500/20" : "bg-red-500/15"}`} />
        <div className={`absolute top-10 right-1/4 w-56 h-56 rounded-full blur-[80px] ${isSuccess ? "bg-emerald-400/15" : "bg-red-400/10"}`} />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {isSuccess ? (
          <>
            <motion.div
              className="w-28 h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-6"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <CheckCircle className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
            </motion.div>

            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Payment Successful! 🎉</h1>
              <p className="text-muted-foreground text-sm mb-4">Your credits have been added to your account.</p>

              {credits && (
                <motion.div
                  className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-5 py-3 rounded-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-xl font-extrabold">+{parseInt(credits).toLocaleString()} Credits</span>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="w-full space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link to="/dashboard" className="block">
                <Button className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/create-quiz" className="block">
                <Button variant="outline" className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Generating
                </Button>
              </Link>
            </motion.div>

            {ref && (
              <p className="text-[10px] text-muted-foreground/40 mt-6 text-center">
                Ref: {ref}
              </p>
            )}
          </>
        ) : (
          <>
            <motion.div
              className="w-28 h-28 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-6"
              initial={{ scale: 0, rotate: 20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <XCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
            </motion.div>

            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Payment Failed</h1>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <p className="text-muted-foreground/60 text-xs mt-2">Your card was not charged. Please try again.</p>
            </motion.div>

            <motion.div
              className="w-full space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Link to="/buy-credits" className="block">
                <Button className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              <Link to="/dashboard" className="block">
                <Button variant="outline" className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
