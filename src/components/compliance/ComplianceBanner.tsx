import { ShieldCheck, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComplianceBannerSafe } from '@/stores/useComplianceBanner';
import { LEGAL_URLS, COMPLIANCE_MESSAGES } from '@/lib/legal';
import { track } from '@/lib/analytics';
import { useEffect } from 'react';

interface ComplianceBannerProps {
  variant?: 'sticky' | 'inline';
}

export function ComplianceBanner({ variant = 'sticky' }: ComplianceBannerProps) {
  const { shouldRender, acknowledge, version } = useComplianceBannerSafe();

  // Track banner view
  useEffect(() => {
    if (shouldRender) {
      track('view_compliance_banner', { 
        variant,
        legal_version: version 
      });
    }
  }, [shouldRender, variant, version]);

  if (!shouldRender) return null;

  const handleLinkClick = (linkType: keyof typeof LEGAL_URLS, href: string) => {
    track('click_compliance_link', { 
      link_type: linkType,
      link_url: href,
      target_url: LEGAL_URLS[linkType],
      variant,
      legal_version: version 
    });
  };

  const handleAcknowledge = () => {
    track('acknowledge_compliance_banner', { 
      variant,
      legal_version: version,
      timestamp: Date.now() 
    });
    acknowledge();
  };

  const Wrapper = variant === 'sticky'
    ? ({ children }: { children: React.ReactNode }) => (
        <div className="fixed bottom-0 inset-x-0 z-50">
          {children}
        </div>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="mt-8">
          {children}
        </div>
      );

  return (
    <Wrapper>
      <div
        role="region"
        aria-label="aviso de cookies"
        className="no-motion mx-auto max-w-6xl mb-20 md:mb-8 mx-4 rounded-2xl border border-primary/30 bg-zinc-950/90 backdrop-blur px-3 py-2 sm:px-4 sm:py-2.5"
      >
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <Cookie 
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" 
            aria-hidden="true" 
          />
          <p className="text-xs sm:text-sm leading-snug text-zinc-200 flex-1">
            {COMPLIANCE_MESSAGES.default}
          </p>

          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-400">
            <a 
              href={LEGAL_URLS.termos}
              onClick={(e) => {
                handleLinkClick('termos', e.currentTarget.href);
              }}
              className="hover:text-primary underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="leia nossos termos de uso"
            >
              termos
            </a>
            <a 
              href={LEGAL_URLS.privacidade}
              onClick={(e) => {
                handleLinkClick('privacidade', e.currentTarget.href);
              }}
              className="hover:text-primary underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="consulte nossa política de privacidade"
            >
              privacidade
            </a>
          </div>

          <Button
            onClick={handleAcknowledge}
            size="sm"
            aria-label="entendi as informações de compliance e segurança"
            className="bg-primary text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 flex-shrink-0"
          >
            Entendi
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}