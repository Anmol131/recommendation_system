import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Gavel,
  Mail,
  Send,
} from 'lucide-react';
import jsPDF from 'jspdf';

const SECTION_LINKS = [
  { id: 'section-1', label: '01. Use of the Service' },
  { id: 'section-2', label: '02. User Accounts' },
  { id: 'section-3', label: '03. Content and Recommendations' },
  { id: 'section-4', label: '04. Intellectual Property' },
  { id: 'section-5', label: '05. Limitation of Liability' },
  { id: 'section-6', label: '06. Termination' },
  { id: 'section-7', label: '07. Changes to Terms' },
  { id: 'section-8', label: '08. Contact Information' },
];

const TERMS_PDF_CONTENT = [
  {
    title: '1. Use of the Service',
    body: 'Vibeify is a media discovery platform. By using the service, you agree to follow applicable laws and these terms. The platform is intended for personal use and must not be used for harmful or unlawful behavior.',
  },
  {
    title: '2. User Accounts',
    body: 'You are responsible for account security and all activity performed from your account. Registration details should remain accurate and up to date.',
  },
  {
    title: '3. Content and Recommendations',
    body: 'Recommendations are generated algorithmically. We improve quality continuously, but we cannot guarantee relevance or suitability for every individual case.',
  },
  {
    title: '4. Intellectual Property',
    body: 'Platform content is protected by copyright and other laws. Users retain ownership of their uploaded content while granting Vibeify a non-exclusive license to display and distribute content within the service.',
  },
  {
    title: '5. Limitation of Liability',
    body: 'To the maximum extent allowed by law, Vibeify is not liable for indirect or consequential damages, including loss of profits, goodwill, or data.',
  },
  {
    title: '6. Termination',
    body: 'Access may be suspended or terminated for violations of these terms or harmful conduct.',
  },
  {
    title: '7. Changes to Terms',
    body: 'Terms may be updated from time to time. Continued usage after updates means acceptance of revised terms.',
  },
  {
    title: '8. Contact Information',
    body: 'For legal questions, contact: vibeify@gmail.com',
  },
];

function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState(SECTION_LINKS[0].id);
  const navigate = useNavigate();

  const handleDownloadTermsPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 52;
    const maxTextWidth = pageWidth - marginX * 2;
    let cursorY = 72;

    const ensureSpace = (requiredHeight = 28) => {
      if (cursorY + requiredHeight > pageHeight - 52) {
        doc.addPage();
        cursorY = 72;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Vibeify Terms of Service', marginX, cursorY);

    cursorY += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Last Updated: 3/24/2026', marginX, cursorY);

    cursorY += 30;
    TERMS_PDF_CONTENT.forEach((section) => {
      ensureSpace(34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(section.title, marginX, cursorY);

      cursorY += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const wrapped = doc.splitTextToSize(section.body, maxTextWidth);
      wrapped.forEach((line) => {
        ensureSpace(16);
        doc.text(line, marginX, cursorY);
        cursorY += 15;
      });

      cursorY += 14;
    });

    doc.save('vibeify-terms-of-service.pdf');
  };

  const handleGoToContactPage = () => {
    navigate('/about#contact');
  };

  useEffect(() => {
    const sectionIds = SECTION_LINKS.map((item) => item.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.4, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-screen-xl px-6 pb-20 pt-32 sm:px-8">
        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-primary">Legal Framework</span>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-light-text dark:text-dark-text sm:text-7xl">Terms of Service</h1>
            <p className="text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary sm:text-xl">
              Please review these terms carefully as they govern your use of the Vibeify ecosystem. Our commitment to
              clarity matches our commitment to quality.
            </p>
          </div>

          <div className="rounded-xl border-l-4 border-primary bg-light-surface p-6 shadow-md dark:bg-dark-surface dark:shadow-dark-md">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Last Updated</p>
            <p className="text-2xl font-semibold text-primary">3/24/2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 space-y-12">
              <div className="space-y-4 border-l border-light-surface-alt pl-8 dark:border-dark-surface-alt">
                {SECTION_LINKS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`block transition-all hover:translate-x-1 hover:text-primary ${
                      activeSection === item.id
                        ? 'font-semibold text-primary'
                        : 'text-light-text-secondary dark:text-dark-text-secondary'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-light-surface-alt bg-light-surface p-8 dark:border-dark-surface-alt dark:bg-dark-surface">
                <div className="relative z-10">
                  <h4 className="mb-2 text-lg font-bold">Need a PDF?</h4>
                  <p className="mb-6 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Download our complete terms for your offline records.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTermsPdf}
                    className="flex items-center gap-2 font-bold text-primary transition-all group-hover:gap-4"
                  >
                    <span>Download</span>
                    <ArrowDownToLine size={18} />
                  </button>
                </div>
                <div className="pointer-events-none absolute -bottom-5 -right-5 opacity-10">
                  <Gavel size={110} />
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-20 lg:col-span-8">
            <section id="section-1" className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">1. Use of the Service</h2>
              </div>
              <div className="space-y-6 text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                <p>
                  Vibeify provides a digital curation platform designed to help you discover and organize visual media.
                  By accessing or using our service, you agree to comply with these terms and all applicable laws and
                  regulations.
                </p>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <CheckCircle2 className="mt-1 text-primary" size={20} />
                    <span>You must be at least 13 years of age to use this service.</span>
                  </li>
                  <li className="flex gap-4">
                    <CheckCircle2 className="mt-1 text-primary" size={20} />
                    <span>The service is intended for personal, non-commercial use unless otherwise agreed in writing.</span>
                  </li>
                  <li className="flex gap-4">
                    <CheckCircle2 className="mt-1 text-primary" size={20} />
                    <span>You agree not to use the service for unlawful purposes or to disrupt platform functionality.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="section-2" className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">2. User Accounts</h2>
              </div>
              <div className="space-y-6 rounded-xl bg-light-surface p-8 dark:bg-dark-surface">
                <p className="text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  To access certain features of Vibeify, you may be required to create an account. You are responsible
                  for maintaining the confidentiality of your credentials and for all activity under your account.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-light-surface-alt bg-light-surface-alt p-5 dark:border-dark-surface-alt dark:bg-dark-surface-alt">
                    <h4 className="mb-2 font-bold">Account Security</h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      Notify us immediately of any unauthorized access or security breaches associated with your login.
                    </p>
                  </div>
                  <div className="rounded-lg border border-light-surface-alt bg-light-surface-alt p-5 dark:border-dark-surface-alt dark:bg-dark-surface-alt">
                    <h4 className="mb-2 font-bold">Accuracy</h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      You must provide accurate, current, and complete information during registration.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="section-3" className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">3. Content and Recommendations</h2>
              </div>
              <p className="mb-8 text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                Vibeify uses proprietary algorithms to provide personalized recommendations. While we strive for
                excellence in curation, we do not guarantee the relevance, accuracy, or quality of all presented
                content.
              </p>
              <div className="relative h-64 overflow-hidden rounded-xl">
                <img
                  src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1600"
                  alt="Abstract purple shapes"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 text-sm italic text-white/85">
                  "Our algorithms are designed to inspire, not just inform."
                </p>
              </div>
            </section>

            <section id="section-4" className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">4. Intellectual Property</h2>
              </div>
              <div className="space-y-6 text-lg leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                <p>
                  All content included on the service, such as text, graphics, logos, images, and software, is the
                  property of Vibeify or its content suppliers and protected by international copyright laws.
                </p>
                <p>
                  Users retain ownership of content they upload. By uploading to Vibeify, you grant us a worldwide,
                  non-exclusive, royalty-free license to use, display, and distribute that content within the platform.
                </p>
              </div>
            </section>

            <section id="section-5" className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-primary" />
                <h2 className="text-3xl font-bold tracking-tight">5. Limitation of Liability</h2>
              </div>
              <div className="rounded-xl border border-primary/25 bg-light-surface-alt p-8 dark:bg-dark-surface-alt">
                <p className="mb-4 text-xl font-bold italic text-light-text dark:text-dark-text">
                  "To the fullest extent permitted by law..."
                </p>
                <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  Vibeify and its affiliates shall not be liable for indirect, incidental, special, consequential, or
                  punitive damages, including any loss of profits, data, goodwill, or other intangible losses.
                </p>
              </div>
            </section>

            <div className="grid gap-10 md:grid-cols-2">
              <section id="section-6" className="scroll-mt-32">
                <h3 className="mb-4 text-2xl font-bold">6. Termination</h3>
                <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  We may suspend or terminate your access to our service at any time, without notice, for conduct that
                  violates these terms or harms users or business interests.
                </p>
              </section>

              <section id="section-7" className="scroll-mt-32">
                <h3 className="mb-4 text-2xl font-bold">7. Changes to Terms</h3>
                <p className="leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
                  Vibeify may revise these terms from time to time. Continued use of the platform after updates
                  constitutes acceptance of the revised terms.
                </p>
              </section>
            </div>

            <section id="section-8" className="scroll-mt-32 border-t border-light-surface-alt pt-12 dark:border-dark-surface-alt">
              <div className="flex flex-col items-center justify-between gap-8 rounded-xl bg-light-surface p-10 dark:bg-dark-surface md:flex-row">
                <div className="text-center md:text-left">
                  <h2 className="mb-2 text-4xl font-bold tracking-tight">8. Contact Us</h2>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary">
                    Questions about our legal framework? Reach out.
                  </p>
                </div>
                <a
                  href="mailto:vibeify@gmail.com"
                  className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-3 text-lg font-bold text-white transition-all hover:bg-secondary"
                >
                  <Mail size={18} />
                  <span>vibeify@gmail.com</span>
                  <Send size={18} />
                </a>
                <button
                  type="button"
                  onClick={handleGoToContactPage}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-bold text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10"
                >
                  Contact Page
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TermsOfServicePage;
