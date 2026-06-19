"use client";

import { Zap, Shield, Globe, Clock, Award, Smartphone } from "lucide-react";
import Image from "next/image";

const perks = [
  { icon: Zap, title: "Lightning Fast", desc: "Generate a full quiz from any topic in under 10 seconds.", color: "text-[hsl(45,95%,55%)]", bg: "bg-[hsl(45,95%,55%)]/10" },
  { icon: Shield, title: "Private & Secure", desc: "Your study materials stay yours. Never shared or trained on.", color: "text-[hsl(142,70%,45%)]", bg: "bg-[hsl(142,70%,45%)]/10" },
  { icon: Globe, title: "Study Anywhere", desc: "Mobile-first design. Pick up where you left off on any device.", color: "text-[hsl(199,89%,48%)]", bg: "bg-[hsl(199,89%,48%)]/10" },
  { icon: Clock, title: "Save Hours Daily", desc: "Turn 3 hours of manual note-taking into 3 minutes with AI.", color: "text-primary", bg: "bg-primary/10" },
  { icon: Award, title: "Proven Results", desc: "Students using Quizmi see significant improvement in recall and retention.", color: "text-[hsl(30,90%,55%)]", bg: "bg-[hsl(30,90%,55%)]/10" },
  { icon: Smartphone, title: "Native Mobile", desc: "Optimized for phones. Study on the bus, in bed, anywhere.", color: "text-[hsl(280,70%,60%)]", bg: "bg-[hsl(280,70%,60%)]/10" },
];

export default function GetMoreSection() {
  return (
    <section className="py-28 relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left: image */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-[60px]" />
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.06]">
              <Image
                src="/hero-visual.png"
                alt="Study smarter with Quizmi"
                width={600}
                height={450}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,6%)]/60 to-transparent" />

              {/* Floating card */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-white/60 font-medium">Study time saved</p>
                    <p className="text-xl font-black text-white">~3 hours/day</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-white/60 font-medium">Recall improvement</p>
                    <p className="text-xl font-black text-[hsl(142,70%,55%)]">Significant</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: perks grid */}
          <div className="order-1 lg:order-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">More reasons</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 tracking-tight mb-10">
                Why students choose
                <br />
                <span className="text-white/40">Quizmi</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="rounded-2xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl ${perk.bg} flex items-center justify-center mb-3`}>
                    <perk.icon className={`w-4 h-4 ${perk.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{perk.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
