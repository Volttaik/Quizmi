"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-white/[0.07] p-12 md:p-20 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/12 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-20 w-[300px] h-[300px] bg-[hsl(200,90%,50%)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -right-20 w-[300px] h-[300px] bg-[hsl(280,72%,50%)]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3 h-3" />
              Start studying today
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Ready to study
              <br />
              <span className="text-white/40">smarter?</span>
            </h2>
            <p className="text-sm text-white/40 max-w-md mx-auto mb-10">
              Join thousands of students already using Quizmi to ace their exams with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full px-10 text-sm font-bold shadow-xl shadow-primary/30 w-full sm:w-auto">
                  Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-10 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 border border-white/10 w-full sm:w-auto"
                >
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
