import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Landing",
};

export default function LandingPage() {
  return (
    <Shell>
      <section className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-20 text-left">
          <div className="label mb-6">// CORPORATE UNDERGROUND — SYS_VER 0.1.0</div>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-fg mb-6">
            YOUR WORKPLACE.
            <br />
            WITHOUT YOUR NAME ATTACHED.
          </h1>

          <p className="text-sm sm:text-base text-dim leading-relaxed font-mono font-light max-w-xl mb-10">
            A private, verifiable, anonymous social network for company
            employees. Speak the truth about your job — your identity stays
            sealed behind a cryptographic wall. Your pseudonym carries your
            voice. Your real name carries nothing.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-16">
            <a href="#manifesto" className="btn btn-primary text-xs">
              READ THE MANIFESTO
            </a>
            <a href="/register" className="btn text-xs">
              CLAIM YOUR PSEUDONYM
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20 max-w-xl">
            {[
              ["01", "VERIFIED ONLY"],
              ["02", "ZERO PII LINKED"],
              ["03", "ONE PSEUDONYM / COMPANY"],
              ["04", "LEAK DETECTED"],
            ].map(([num, text]) => (
              <div
                key={num}
                className="card p-4 border-line bg-panel/60 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-fg/20 font-mono">
                  {num}
                </div>
                <div className="text-[10px] tracking-wider uppercase text-dim mt-2">
                  {text}
                </div>
              </div>
            ))}
          </div>

          <div
            id="manifesto"
            className="card border-line bg-panel p-6 sm:p-8 mb-12"
          >
            <div className="label mb-6">THE UNDERGROUND MANIFESTO</div>
            <div className="space-y-4 text-xs leading-relaxed text-fg/90 font-mono font-light">
              <p>
                <span className="text-dim">§1.</span> Your salary is not
                confidential. Your job title is not confidential. Your opinion
                is not confidential. Only your name is confidential.
              </p>
              <p>
                <span className="text-dim">§2.</span> We rotate your identity
                per company. At Acme you are Silent Fox. At Beta you are Neon
                Badger. Nothing connects the two — not reputation, not avatar,
                not UUID.
              </p>
              <p>
                <span className="text-dim">§3.</span> Verification is about
                proving you belong. Anonymity is about protecting what you say.
                Neither compromises the other.
              </p>
              <p>
                <span className="text-dim">§4.</span> Every word you publish
                passes an Identity Leak Detector that flags patterns that could
                narrow the "who" behind the text. We warn. We never store
                drafts.
              </p>
              <p>
                <span className="text-dim">§5.</span> The Underground Pulse
                measures how your office actually feels — aggregated, averaged,
                and only revealed when enough voices speak (threshold: 5 active
                members).
              </p>
              <p>
                <span className="text-dim">§6.</span> No advertising, no real
                names, no data resale. The community is the product. The product
                is the community.
              </p>
            </div>
          </div>

          <div className="card border-danger/30 bg-danger/5 p-6">
            <div className="label mb-3 text-danger/80">// TALK IS CHEAP</div>
            <p className="text-xs leading-relaxed text-fg/80 font-mono font-light max-w-xl">
              The system is anonymous, but not consequence-free. Do not post
              threats, illegal material, or anything that endangers a human.
              Anonymity protects whistleblowers — not predators. Moderation
              happens without deanonymization, but legal requests are
              answered.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}