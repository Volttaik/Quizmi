"use client";
import { Heart, Users, Home, GraduationCap, BookOpen, Share2 } from "lucide-react";

const quizTypes = [
  {
    icon: Heart,
    title: "Love Quizzes",
    desc: "Build a quiz about yourself — favourite things, habits, preferences — and see how deeply your partner really knows you.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/10",
    glow: "group-hover:shadow-rose-500/10",
  },
  {
    icon: Users,
    title: "Friendship Quizzes",
    desc: "Test your squad's knowledge. Create questions about your crew's memories, inside jokes, and shared moments.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/10",
    glow: "group-hover:shadow-amber-500/10",
  },
  {
    icon: Home,
    title: "Family Quizzes",
    desc: "Bring the family together with fun questions about shared memories, traditions, and who knows who best.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/10",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: GraduationCap,
    title: "Classroom Quizzes",
    desc: "Teachers can build topic quizzes in seconds, share with a link, and track how well the class is doing.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/10",
    glow: "group-hover:shadow-sky-500/10",
  },
  {
    icon: BookOpen,
    title: "Study Quizzes",
    desc: "Paste your notes, get a full AI-generated quiz in seconds. Adaptive questions that target your weak spots.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/10",
    glow: "group-hover:shadow-violet-500/10",
  },
  {
    icon: Share2,
    title: "Share with Anyone",
    desc: "Every quiz gets a unique link. Share it publicly — no sign-up needed to take someone else's quiz.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/10",
    glow: "group-hover:shadow-primary/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">What you can create</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            A quiz for every
            <br />
            <span className="text-white/40">relationship in your life</span>
          </h2>
          <p className="text-white/35 text-sm mt-4 max-w-sm mx-auto leading-relaxed">
            From studying for exams to finding out who knows you best — one platform, five quiz types.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {quizTypes.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border ${f.border} bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-xl ${f.glow}`}
            >
              <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
