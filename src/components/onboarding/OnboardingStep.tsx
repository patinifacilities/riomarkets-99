import { ONBOARDING_STEPS } from '@/lib/onboarding-content';
import { Button } from '@/components/ui/button';
import logoWhite from '@/assets/rio-white-logo-auth.png';
import { useTheme } from 'next-themes';

interface OnboardingStepProps {
  step: number;
  className?: string;
}

export function OnboardingStep({ step, className = "" }: OnboardingStepProps) {
  const content = ONBOARDING_STEPS[step - 1];
  const { resolvedTheme } = useTheme();
  
  if (!content) return null;

  const IconComponent = content.icon;

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="flex justify-center">
        {content.id === 1 ? (
          <div className="flex items-center justify-center">
            <img src={logoWhite} alt="Rio Markets" className="h-8 w-auto" />
          </div>
        ) : content.id === 3 ? (
          <div className="w-16 h-16 rounded-full bg-[#ff2389]/10 flex items-center justify-center animate-pulse">
            <IconComponent className="w-8 h-8 text-[#ff2389]" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-primary" />
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <h3 className={`text-xl font-semibold ${content.id === 3 ? 'text-[#ff2389]' : 'text-foreground'}`}>
          {content.title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          {content.description}
        </p>
        
        {content.tip && (
          <div className={`border rounded-lg p-3 mt-4 ${
            content.id === 3 
              ? 'bg-[#ff2389]/5 border-[#ff2389]/20' 
              : 'bg-primary/5 border-primary/20'
          }`}>
            <p className={`text-sm font-medium ${
              content.id === 3 ? 'text-[#ff2389]' : 'text-primary'
            }`}>
              {content.id === 3 ? '' : '💡 '}{content.tip}
            </p>
          </div>
        )}
        
        {content.ctaText && content.ctaHref && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <a 
                href={content.ctaHref} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                {content.ctaText}
                <span className="text-xs">↗</span>
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}