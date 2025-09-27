import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColProps {
  title: string;
  links: FooterLink[];
}

function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-white/90">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link 
              to={link.href}
              className="text-sm text-white/70 hover:text-white transition-colors duration-200"
              aria-label={`Ir para ${link.label}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const handleRianaToggle = () => {
    window.dispatchEvent(new CustomEvent('riana:toggle'));
  };

  return (
    <footer className="mt-16 border-t border-[color:var(--border-soft)] bg-[#0E0F11] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        {/* Main content grid */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Branding section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/rio-markets-logo.png" 
                alt="Rio Markets Logo" 
                className="h-7 w-7 rounded"
              />
              <span className="text-lg font-bold">Rio Markets</span>
            </div>
            <p className="text-sm text-white/70 max-w-[32ch] leading-relaxed">
              Mercados preditivos inteligentes em tempo real.
            </p>
            <button
              onClick={handleRianaToggle}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
                         bg-[color:var(--brand-green)] text-black hover:opacity-90 
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-green)]
                         transition-all duration-200 min-h-[44px]"
              aria-label="Falar com a Riana - Assistente virtual"
            >
              <MessageCircle className="w-4 h-4" />
              Fale com a Riana
            </button>
          </div>

          {/* Navigation grid */}
          <nav className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3" aria-label="Rodapé">
            <FooterCol 
              title="Explorar" 
              links={[
                { label: 'Mercados', href: '/' },
                { label: 'Ranking', href: '/ranking' },
                { label: 'Rioz Coin', href: '/wallet' },
              ]}
            />
            <FooterCol 
              title="Ajuda" 
              links={[
                { label: 'FAQ', href: '/faq' },
                { label: 'Na mídia', href: '/press' },
              ]}
            />
            <FooterCol 
              title="Políticas" 
              links={[
                { label: 'Termos de uso', href: '/terms' },
                { label: 'Privacidade', href: '/privacy' },
                { label: 'Cookies', href: '/cookies' },
              ]}
            />
          </nav>

          {/* Transparency section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight text-white/90">
              Transparência
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              O Rio Markets não é casa de apostas. Plataforma de análises preditivas educativas, com liquidação transparente.
            </p>
            <Link 
              to="/faq#regulatorio"
              className="inline-flex items-center text-sm text-[color:var(--brand-pink)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-pink)] rounded transition-colors"
            >
              Leia as questões regulatórias →
            </Link>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
          <p>© 2025 Rio Markets. Todos os direitos reservados.</p>
          <p>Feito com Supabase, Vite, React e TypeScript.</p>
        </div>
      </div>
    </footer>
  );
}