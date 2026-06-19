import { Zap, Brain, Layers, Target } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Generated Quizzes",
    desc: "Paste your notes. Get a full quiz in seconds. Our AI understands context, creates targeted questions, and adapts to your level.",
    img: "/quiz-cards-visual.png",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "Smart Summaries",
    desc: "Extract the essence of any material. Key concepts, definitions, and relationships — distilled into crystal clear summaries.",
    img: "/hero-visual.png",
    color: "text-[hsl(280,72%,60%)]",
    bg: "bg-[hsl(280,72%,60%)]/10",
  },
  {
    icon: Layers,
    title: "Adaptive Flashcards",
    desc: "Spaced repetition that actually works. Cards reappear at the perfect moment — right before you forget.",
    img: "/flashcard-preview.png",
    color: "text-[hsl(199,89%,48%)]",
    bg: "bg-[hsl(199,89%,48%)]/10",
  },
  {
    icon: Target,
    title: "Pinpoint Weak Spots",
    desc: "Identify exactly which topics you struggle with. Focus your time where it matters, skip what you already know.",
    img: "/dashboard-preview.png",
    color: "text-[hsl(142,70%,45%)]",
    bg: "bg-[hsl(142,70%,45%)]/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Everything you need to
            <br />
            <span className="text-white/40">ace every exam</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-3xl border border-white/[0.06] overflow-hidden hover:border-white/[0.14] transition-all duration-500"
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(222,47%,6%)] z-10" />
                <img
                  src={f.img}
                  alt={f.title}
                  className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              <div className="p-7">
                <div className={`w-10 h-10 rounded-2xl ${f.bg} border border-white/[0.06] flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
