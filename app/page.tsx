import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-slate-100 font-sans antialiased selection:bg-primary/30">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 w-full bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#3b3b3b] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <Logo size={40} />
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-100">
              Interview<span className="text-primary">Integrity</span>
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a className="hover:text-primary transition-colors" href="#features">Features</a>
            <a className="hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
            <a className="hover:text-primary transition-colors" href="#stats">Architecture</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <button className="px-5 py-2 text-sm font-semibold text-slate-100 hover:text-primary transition-colors">
                Login
              </button>
            </Link>
            <Link href="/auth">
              <button className="bg-primary hover:bg-primary/90 text-[#0f0f0f] px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_2px_rgba(230,126,92,0.3)]">
                Try the Demo
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        {/* ─── Hero Section ─── */}
        <section className="relative pt-20 pb-32 px-6">
          {/* Glow effects */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">v2.0 Now Live</span>
              </div>

              <h2 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-100 tracking-tight">
                Next-Generation <span className="text-primary">AI Proctoring</span> Research.
              </h2>

              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                An advanced Master&apos;s Degree project demonstrating real-time edge-computing computer vision and zero-latency biometric verification running entirely in the browser.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/auth">
                  <button className="bg-primary hover:bg-primary/90 text-[#0f0f0f] px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_2px_rgba(230,126,92,0.3)] flex items-center gap-2">
                    Launch Demo Environment <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </Link>
                <a href="#how-it-works">
                  <button className="bg-[#3b3b3b]/50 border border-[#3b3b3b] hover:bg-[#3b3b3b] text-slate-100 px-8 py-4 rounded-xl text-lg font-bold transition-all">
                    View Project Architecture
                  </button>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">Master of Science Project</p>
              </div>
            </div>

            {/* 3D Glassmorphic Mockup */}
            <div className="relative group hidden lg:block">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative rounded-2xl p-4 shadow-2xl overflow-hidden border border-[#3b3b3b] bg-[#1a1a1a]/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono tracking-tighter">SECURE_SESSION_ACTIVE // ID: 882-XQ</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-[#3b3b3b]">
                    <Image
                      src="/candidate-mockup.png"
                      alt="Candidate Feed"
                      fill
                      className="object-cover z-0 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/90 via-transparent to-transparent z-10" />
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/30 uppercase backdrop-blur-sm">Live Monitor</span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-20">
                      <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-bold text-green-500 uppercase">Integrity Score: 98%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="h-1/2 bg-slate-900 rounded-lg p-3 border border-[#3b3b3b] flex flex-col justify-center gap-2">
                      <div className="h-1 w-full bg-[#3b3b3b] rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gaze Consistency</span>
                    </div>
                    <div className="h-1/2 bg-slate-900 rounded-lg p-3 border border-[#3b3b3b] flex flex-col justify-center gap-2">
                      <div className="h-1 w-full bg-[#3b3b3b] rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-1/2" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audio Analysis</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-[#0f0f0f]/80 backdrop-blur-md rounded-lg p-3 border border-[#3b3b3b]">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-3">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Security Feed</span>
                    <span className="text-red-400 font-mono tracking-wider">2 ANOMALIES DETECTED</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/20 p-2 rounded relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
                      <span className="material-symbols-outlined text-red-400 text-[14px] mt-0.5">group</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-red-100">Multiple Persons Detected</span>
                        <span className="text-[9px] text-red-400/80 font-mono tracking-tighter">Confidence: 94.2% • 14:22:05</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-yellow-950/30 border border-yellow-500/20 p-2 rounded relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500" />
                      <span className="material-symbols-outlined text-yellow-400 text-[14px] mt-0.5">volume_up</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-yellow-100">Background Speech (85dB)</span>
                        <span className="text-[9px] text-yellow-400/80 font-mono tracking-tighter">Transcribing... • 14:24:12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Grid ─── */}
        <section id="features" className="py-24 px-6 bg-[#1a1a1a]/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 mb-16 text-center max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-100">Uncompromising Security Features</h3>
              <p className="text-slate-400">Our suite of proprietary AI models works in silence to protect the sanctity of your hiring decisions.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "visibility",
                  title: "AI Gaze Detection",
                  desc: "Sophisticated eye-tracking detects when candidates look off-screen for answers or external assistance.",
                },
                {
                  icon: "no_photography",
                  title: "Virtual Camera Blocking",
                  desc: "Automatically identifies and restricts the use of virtual cameras, OBS, deepfake filters, and pre-recorded loops.",
                },
                {
                  icon: "desktop_windows",
                  title: "System Monitoring",
                  desc: "Comprehensive lockdown prevents screen sharing, dual monitors, and background process exploits during sessions.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-8 rounded-2xl border border-[#3b3b3b] bg-[#1a1a1a]/60 backdrop-blur-xl hover:border-primary/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-100 mb-3">{f.title}</h4>
                  <p className="text-slate-400 leading-relaxed mb-6">{f.desc}</p>
                  <div className="h-1 w-12 bg-primary rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it Works ─── */}
        <section id="how-it-works" className="py-24 bg-[#0f0f0f] overflow-hidden">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">The Process</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight">How it Works</h3>
            </div>

            <div className="grid grid-cols-[60px_1fr] gap-x-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center bg-[#0f0f0f] text-primary shadow-[0_0_15px_rgba(230,126,92,0.3)]">
                  <span className="material-symbols-outlined">face_retouching_natural</span>
                </div>
                <div className="w-[2px] bg-gradient-to-b from-primary to-primary/20 h-24 my-2" />
              </div>
              <div className="pt-2 pb-12">
                <h4 className="text-xl font-bold text-slate-100 mb-2">AI Identity Verification</h4>
                <p className="text-slate-400 max-w-xl leading-relaxed">Multi-factor biometric verification ensures the candidate is who they claim to be. 3D liveness detection prevents spoofing attempts with 99.9% accuracy.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center bg-[#0f0f0f] text-primary shadow-[0_0_15px_rgba(230,126,92,0.3)]">
                  <span className="material-symbols-outlined">visibility</span>
                </div>
                <div className="w-[2px] bg-gradient-to-b from-primary/20 to-primary/20 h-24 my-2" />
              </div>
              <div className="pt-2 pb-12">
                <h4 className="text-xl font-bold text-slate-100 mb-2">Real-time Behavioral Monitoring</h4>
                <p className="text-slate-400 max-w-xl leading-relaxed">Continuous analysis of eye movement, browser activity, and environmental audio. Our AI flags suspicious behavior instantly without interrupting the candidate&apos;s flow.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center bg-[#0f0f0f] text-primary shadow-[0_0_15px_rgba(230,126,92,0.3)]">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
              </div>
              <div className="pt-2">
                <h4 className="text-xl font-bold text-slate-100 mb-2">Automated Integrity Scoring</h4>
                <p className="text-slate-400 max-w-xl leading-relaxed">Detailed post-session reporting provides an objective integrity score and timestamped video evidence for rapid review by your recruitment team.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Social Proof ─── */}
        <section className="py-16 bg-[#1a1a1a] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-slate-500 text-sm font-medium tracking-widest uppercase mb-10">Built with Cutting-Edge Academic & Industry Frameworks</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-center opacity-70">
              {["TensorFlow.js", "MediaPipe", "Next.js 16", "WebRTC", "MongoDB"].map((tech) => (
                <div key={tech} className="flex justify-center">
                  <div className="px-8 h-12 bg-slate-400/10 hover:bg-slate-400/20 transition-colors rounded-xl flex items-center justify-center border border-slate-500/20">
                    <span className="font-bold text-lg md:text-xl text-slate-200">{tech}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Integrity Score Visualization ─── */}
        <section id="stats" className="py-24 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-[#1a1a1a] rounded-3xl p-8 md:p-16 border border-white/5 flex flex-col md:flex-row items-center gap-16 shadow-2xl">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Industry Benchmark
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-100 leading-tight">Real-Time Inference at the Edge</h2>
                <p className="text-lg text-slate-400 leading-relaxed">Our platform delivers an unprecedented 98.4% detection rate of sophisticated AI-assisted cheating attempts, running models directly on the client GPU for zero-latency monitoring.</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-slate-300">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    Processes 30 frames per second natively in-browser
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    Zero server-side video storage (Privacy-First Design)
                  </li>
                </ul>
              </div>

              {/* Circular Progress */}
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-slate-800" cx="50" cy="50" fill="transparent" r="45" stroke="currentColor" strokeWidth="6" />
                    <circle
                      className="text-primary drop-shadow-[0_0_12px_rgba(230,126,92,0.5)] transition-all duration-1000 ease-out"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="45"
                      stroke="currentColor"
                      strokeDasharray="180 282.74"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      strokeWidth="6"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-5xl md:text-7xl font-black text-slate-100">
                      98<span className="text-primary text-3xl md:text-5xl">%</span>
                    </span>
                    <span className="text-slate-500 font-medium tracking-widest text-xs uppercase mt-2">Integrity Score</span>
                  </div>
                </div>
                <div className="mt-8 px-6 py-4 bg-[#0f0f0f]/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-400">Total Confidence in Every Hire</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

          <div className="max-w-5xl mx-auto rounded-3xl p-12 md:p-20 text-center border border-primary/20 bg-[#1a1a1a]/60 backdrop-blur-xl relative z-10">
            <h3 className="text-4xl md:text-5xl font-black text-slate-100 mb-6">Explore the Platform Architecture</h3>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Test the real-time proctoring engine for yourself by logging in as a Candidate, or explore the analytics dashboard as a Recruiter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-[#0f0f0f] px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_2px_rgba(230,126,92,0.3)]">
                  Launch Demo
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0f0f0f] border-t border-[#3b3b3b] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-md">
              <div className="flex items-center gap-3 text-primary mb-6">
                <Logo size={32} />
                <h1 className="text-lg font-bold tracking-tight text-slate-100">InterviewIntegrity</h1>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                The gold standard in remote interview integrity and candidate verification, demonstrating theoretical and practical advances in real-time edge-computing computer vision.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-500 hover:text-primary transition-colors cursor-pointer"><span className="material-symbols-outlined">code</span></a>
                <a href="#" className="text-slate-500 hover:text-primary transition-colors cursor-pointer"><span className="material-symbols-outlined">description</span></a>
              </div>
            </div>

            <div className="flex gap-16">
              <div>
                <h5 className="text-slate-100 font-bold mb-6">Project</h5>
                <ul className="space-y-4 text-sm text-slate-500">
                  <li><Link href="/auth" className="hover:text-primary transition-colors">Start Demo</Link></li>
                  <li><a href="#architecture" className="hover:text-primary transition-colors">Architecture</a ></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#3b3b3b] flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-xs font-medium uppercase tracking-widest">
            <p>&copy; 2026 Academic Project Showcase. All rights reserved.</p>
            <p>Master&apos;s Project - Computer Science</p>
          </div>
        </div>
      </footer>
    </div>
  );
}