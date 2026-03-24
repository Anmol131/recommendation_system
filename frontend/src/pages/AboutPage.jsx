import {
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Palette,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg py-16 px-8 transition-colors duration-300">
      <main className="mx-auto max-w-4xl space-y-32">
        <section id="about" className="mb-32">
          <div className="editorial-grid grid grid-cols-12 gap-6">
            <div className="col-span-12 mb-12 lg:col-span-7 lg:mb-0">
              <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-primary">Our Philosophy</span>
              <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                The art of discovery, refined for <span className="italic text-primary">your soul.</span>
              </h1>
              <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-light-text dark:text-dark-text/95">
                <p>
                  In a world flooded by infinite feeds, Vibeify believes discovery should feel human,
                  precise, and deeply personal. We design recommendation experiences that respect your
                  attention and elevate your mood, not overwhelm it.
                </p>
                <p>
                  Our mission is to blend thoughtful curation with elegant design so every suggestion
                  feels like it was chosen with intention. From film to books to music and games, we
                  surface what resonates with your emotional frequency.
                </p>
              </div>
            </div>

            <div className="relative col-span-12 lg:col-span-5">
              <div className="absolute -right-2 -top-2 z-10 flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary shadow-[0_12px_30px_-16px_rgba(62,37,72,0.5)]">
                <Moon size={14} />
                Light-first curation
              </div>
              <div className="aspect-[4/5] rotate-3 overflow-hidden rounded-xl bg-surface-container shadow-[0_28px_60px_-24px_rgba(62,37,72,0.45)] transition-transform duration-500 hover:rotate-0">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
                  alt="Editorial collage style artwork"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 max-w-[260px] rounded-lg bg-surface-container-lowest p-6 shadow-xl">
                <p className="text-sm italic text-on-surface">
                  "Vibeify does not chase attention. It curates moments that stay with you."
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">- The Curator&apos;s Digest</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="md:col-span-2 flex min-h-[300px] flex-col justify-end rounded-xl bg-surface-container-low p-10 shadow-[0_14px_38px_-24px_rgba(62,37,72,0.45)] transition-all hover:shadow-lg">
              <Sparkles className="mb-6 text-primary" size={38} />
              <h3 className="mb-3 text-2xl font-bold">Intentional Curation</h3>
              <p className="max-w-lg text-light-text dark:text-dark-text/95">
                We map content to feeling, context, and taste so your next recommendation feels aligned,
                not random.
              </p>
            </article>

            <article className="flex flex-col justify-between rounded-xl bg-surface-container-highest p-10 shadow-[0_14px_38px_-24px_rgba(62,37,72,0.45)] transition-all hover:shadow-lg">
              <Eye className="text-primary" size={38} />
              <div>
                <h3 className="mb-3 text-2xl font-bold">Pure Interface</h3>
                <p className="text-light-text dark:text-dark-text/95">
                  Clean, immersive, and distraction-free surfaces that keep focus on what matters: discovery.
                </p>
              </div>
            </article>

            <article className="flex flex-col justify-between rounded-xl bg-primary p-10 text-on-primary shadow-[0_14px_38px_-24px_rgba(62,37,72,0.45)] transition-all hover:shadow-lg">
              <Users size={38} />
              <div>
                <h3 className="mb-3 text-2xl font-bold">Global Vibe</h3>
                <p className="text-on-primary/85">
                  We connect cultures, voices, and communities through meaningful recommendations.
                </p>
              </div>
            </article>

            <article className="md:col-span-2 flex items-center gap-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-10 shadow-[0_14px_38px_-24px_rgba(62,37,72,0.35)] transition-all hover:shadow-lg">
              <div className="hidden h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container sm:flex">
                <Palette className="text-on-secondary-container" size={40} />
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-bold">Designed for Humans</h3>
                <p className="text-light-text dark:text-dark-text/95">
                  Every interaction is crafted to feel natural, warm, and intuitive so technology supports
                  your flow instead of interrupting it.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-3xl scroll-mt-32">
          <div className="mb-16 text-center">
            <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-primary">Get in touch</span>
            <h2 className="mb-4 text-4xl font-bold text-on-surface dark:text-white">Let&apos;s start a conversation.</h2>
            <p className="text-on-surface/70 dark:text-white/70">
              Questions, partnerships, or ideas worth building together. We would love to hear from you.
            </p>
          </div>

          <div className="rounded-lg border border-surface-container bg-white dark:bg-slate-900 p-8 shadow-md dark:shadow-dark-md md:p-12">
            <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="about-name" className="ml-1 block text-xs font-bold uppercase tracking-wider text-on-surface/60 dark:text-white/60">
                    Name
                  </label>
                  <input
                    id="about-name"
                    type="text"
                    placeholder="Alex Rivera"
                    className="w-full rounded-lg border border-surface-container bg-white dark:bg-slate-900 p-4 text-on-surface dark:text-white placeholder:text-on-surface/40 dark:placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="about-email" className="ml-1 block text-xs font-bold uppercase tracking-wider text-on-surface/60 dark:text-white/60">
                    Email
                  </label>
                  <input
                    id="about-email"
                    type="email"
                    placeholder="alex@curated.com"
                    className="w-full rounded-lg border border-surface-container bg-white dark:bg-slate-900 p-4 text-on-surface dark:text-white placeholder:text-on-surface/40 dark:placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="about-message" className="ml-1 block text-xs font-bold uppercase tracking-wider text-on-surface/60 dark:text-white/60">
                  Message
                </label>
                <textarea
                  id="about-message"
                  rows={5}
                  placeholder="Tell us what is on your mind..."
                  className="w-full resize-none rounded-lg border border-surface-container bg-white dark:bg-slate-900 p-4 text-on-surface dark:text-white placeholder:text-on-surface/40 dark:placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-3 rounded-lg bg-primary hover:bg-primary/90 px-12 py-4 font-bold text-white shadow-md dark:shadow-dark-md transition-all duration-300 active:scale-[0.98]"
                >
                  Send Message
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-10 text-sm font-medium text-on-surface/70 dark:text-white/70">
            <div className="flex items-center gap-2">
              <Mail className="text-primary" size={18} />
              hello@vibeify.com
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-primary" size={18} />
              The Digital Cloud
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="text-primary" size={18} />
              @vibeify_app
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;
