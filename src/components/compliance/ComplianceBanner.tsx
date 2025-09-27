import { ShieldCheck } from 'lucide-react';
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
        <div className="fixed bottom-0 inset-x-0 z-40">
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
        aria-label="aviso de compliance e segurança"
        className="no-motion mx-auto max-w-6xl border-t border-primary/30 bg-zinc-950/90 backdrop-blur px-4 sm:px-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 py-3">
          <div className="flex items-center gap-2 text-zinc-200">
            <ShieldCheck 
              className="h-5 w-5 text-primary" 
              aria-hidden="true" 
            />
            <p className="text-sm leading-snug">
              {COMPLIANCE_MESSAGES.default}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <a 
              href={LEGAL_URLS.como_funciona}
              onClick={(e) => {
                handleLinkClick('como_funciona', e.currentTarget.href);
              }}
              className="hover:text-primary underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="saiba como funciona a plataforma"
            >
              como funciona
            </a>
            <a 
              href={LEGAL_URLS.termos}
              onClick={(e) => {
                handleLinkClick('termos', e.currentTarget.href);
              }}
              className="hover:text-primary underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="leia nossos termos de uso"
            >
              termos de uso
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
            <a 
              href={LEGAL_URLS.compliance}
              onClick={(e) => {
                handleLinkClick('compliance', e.currentTarget.href);
              }}
              className="hover:text-primary underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="veja informações sobre compliance"
            >
              compliance
            </a>
          </div>

          <div className="flex-1" />

          <Button
            onClick={handleAcknowledge}
            aria-label="entendi as informações de compliance e segurança"
            className="bg-primary text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Entendi
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}