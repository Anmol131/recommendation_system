import {
  CheckCircle2,
  Database,
  Eraser,
  KeyRound,
  Shield,
  UserRoundCheck,
} from 'lucide-react';

function PrivacyPolicyPage() {
  return (
    <div className="bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-32 sm:px-8">
        <header className="mb-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-full bg-light-surface-alt px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary dark:bg-dark-surface-alt">
              Legal Documentation
            </span>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Last Updated: 3/24/2026</span>
          </div>

          <h1 className="mb-8 text-5xl font-bold tracking-tight text-light-text dark:text-dark-text md:text-7xl">
            Privacy Policy for Vibeify.
          </h1>

          <p className="max-w-2xl text-xl leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
            At Vibeify, your privacy is the cornerstone of our curated experience. We are committed to protecting your
            personal data through transparency and high-end security.
          </p>
        </header>

        <section className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="relative min-h-[360px] overflow-hidden rounded-xl bg-light-surface p-8 shadow-md dark:bg-dark-surface dark:shadow-dark-md md:col-span-2">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary to-secondary" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <Shield className="mb-4 text-primary" size={36} />
              <h2 className="mb-4 text-2xl font-semibold">Information We Collect</h2>
              <p className="mb-6 leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                We gather data to enhance your experience, including account details, usage patterns, and device
                identifiers to ensure seamless cross-platform recommendations.
              </p>
              <ul className="space-y-3 text-sm text-light-text dark:text-dark-text">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 text-primary" size={16} />
                  <span>Personal identifiers (name, email, account preferences)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 text-primary" size={16} />
                  <span>Usage data (history, interactions, curation habits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 text-primary" size={16} />
                  <span>Technical data (IP address, browser type, operating system)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-light-surface-alt bg-light-surface-alt p-8 dark:border-dark-surface-alt dark:bg-dark-surface-alt">
            <Database className="mb-4 text-primary" size={34} />
            <h2 className="mb-4 text-2xl font-semibold">How We Use Information</h2>
            <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
              Your data powers our recommendation engine, personalizing every suggestion to match your unique aesthetic
              profile.
            </p>
          </div>
        </section>

        <article className="space-y-20">
          <section>
            <h3 className="mb-8 flex items-center gap-4 text-3xl font-semibold">
              <span className="h-[2px] w-12 bg-primary" />
              Data Storage
            </h3>
            <div className="rounded-xl bg-light-surface p-8 shadow-md dark:bg-dark-surface dark:shadow-dark-md">
              <p className="mb-6 text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                All information is stored on encrypted servers. We employ industry-standard security protocols to ensure
                your data remains protected and retained only as long as necessary for service delivery or legal
                compliance.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <section>
              <h3 className="mb-6 text-xl font-bold tracking-tight text-primary">Third-Party Services</h3>
              <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                We collaborate with trusted partners for payment processing and analytics. These partners are vetted to
                meet strict privacy standards. We never sell your personal data to advertisers.
              </p>
            </section>

            <section>
              <h3 className="mb-6 text-xl font-bold tracking-tight text-primary">Cookies</h3>
              <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                Vibeify uses essential and performance cookies to maintain your session and understand platform usage.
                You can manage these settings at any time from your account preferences.
              </p>
            </section>
          </div>

          <section className="border-t border-light-surface-alt pt-16 dark:border-dark-surface-alt">
            <h3 className="mb-8 text-3xl font-semibold">User Rights and Sovereignty</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-light-surface p-6 shadow-md dark:bg-dark-surface dark:shadow-dark-md">
                <KeyRound className="mb-4 text-primary" size={22} />
                <h4 className="mb-2 font-bold">Access</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Request a copy of your personal data in a portable format.
                </p>
              </div>

              <div className="rounded-xl bg-light-surface p-6 shadow-md dark:bg-dark-surface dark:shadow-dark-md">
                <UserRoundCheck className="mb-4 text-primary" size={22} />
                <h4 className="mb-2 font-bold">Rectification</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Correct or update inaccurate profile information instantly.
                </p>
              </div>

              <div className="rounded-xl bg-light-surface p-6 shadow-md dark:bg-dark-surface dark:shadow-dark-md">
                <Eraser className="mb-4 text-primary" size={22} />
                <h4 className="mb-2 font-bold">Erasure</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Exercise your right to account deletion and permanent data removal.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-10">
            <div className="max-w-2xl">
              <h3 className="mb-6 text-3xl font-semibold">Data Sharing</h3>
              <p className="mb-8 leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                We share data only when required for service delivery, legal compliance, or explicit user opt-in. Your
                profile and behavior stay private unless you decide to share.
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-bold">Changes to Policy</h4>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    We may update this policy to reflect evolving privacy standards and will notify users of major
                    changes.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-bold">Contact Us</h4>
                  <p className="mb-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Questions about your data? Reach out to our privacy team.
                  </p>
                  <a className="font-bold text-primary hover:underline" href="mailto:vibeify@gmail.com">
                    vibeify@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

export default PrivacyPolicyPage;
