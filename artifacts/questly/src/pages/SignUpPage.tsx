import { Link } from "wouter";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.info("Authentication requires Clerk setup. See the API server.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex items-center justify-center px-4">
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] bg-[hsl(280,72%,50%)]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <QuizmiWordmark variant="dark" size={40} />
          </div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-sm text-white/40 mt-1">Start studying smarter today</p>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-xs font-bold text-white/70">Full Name</Label>
              <Input
                className="mt-1.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-white/70">Email</Label>
              <Input
                type="email"
                className="mt-1.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-white/70">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPass ? "text" : "password"}
                  className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 pr-10"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full font-semibold shadow-lg shadow-primary/25" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</> : "Create Account"}
            </Button>
          </form>

          <p className="text-[10px] text-white/20 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-primary hover:text-primary/80 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
