import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function SiteFooter() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const footerLogoSrc = isDarkMode ? '/logo1.png' : '/logo2.png';

  return (
    <footer className="mt-12 rounded-t-3xl border border-light-surface-alt bg-gradient-to-b from-light-surface to-light-surface-alt px-6 py-10 text-light-text shadow-lg dark:border-dark-surface-alt dark:from-[#061233] dark:to-dark-bg dark:text-dark-text sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <img src={footerLogoSrc} alt="Vibefy" className="h-20 w-[220px] object-contain object-left" />
            <p className="max-w-xs text-sm leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
              A curated experience for the digital avant-garde. We prioritize depth over noise, and soul over algorithms.
            </p>

            <div className="pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-light-text-secondary dark:text-dark-text-secondary">
                Newsletter
              </p>
              <div className="flex max-w-sm overflow-hidden rounded-lg border border-light-surface-alt bg-light-surface dark:border-dark-surface-alt dark:bg-dark-surface">
                <input
                  type="email"
                  placeholder="Join the circle"
                  className="w-full border-none bg-transparent px-4 py-2.5 text-sm text-light-text placeholder:text-light-text-secondary focus:outline-none dark:text-dark-text dark:placeholder:text-dark-text-secondary"
                />
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center bg-primary text-white transition-colors hover:bg-secondary"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">Categories</h4>
            <div className="flex flex-col gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <Link to="/about" className="transition-colors hover:text-primary">Our Story</Link>
              <Link to="/explore" className="transition-colors hover:text-primary">The Archive</Link>
              <Link to="/register" className="transition-colors hover:text-primary">Curator Program</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <button type="button" onClick={() => navigate('/terms')} className="text-left transition-colors hover:text-primary">Terms of Service</button>
              <button type="button" onClick={() => navigate('/privacy')} className="text-left transition-colors hover:text-primary">Privacy Policy</button>
              <button type="button" className="text-left transition-colors hover:text-primary">Newsletter</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">Community</h4>
            <div className="flex flex-col gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <button type="button" onClick={() => navigate('/about#contact')} className="text-left transition-colors hover:text-primary">Contact</button>
              <button type="button" onClick={() => navigate('/about')} className="text-left transition-colors hover:text-primary">Careers</button>
            </div>
            <img src={footerLogoSrc} alt="Vibefy" className="h-35 w-[200px] object-contain object-left opacity-40" />
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-light-surface-alt pt-5 text-xs text-light-text-secondary dark:border-dark-surface-alt dark:text-dark-text-secondary">
        Part of the Vibeify Creative Collective. © 2024
      </div>
    </footer>
  );
}

export default SiteFooter;
