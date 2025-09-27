import { ONBOARDING_STEPS } from '@/lib/onboarding-content';
import { Button } from '@/components/ui/button';

interface OnboardingStepProps {
  step: number;
  className?: string;
}

export function OnboardingStep({ step, className = "" }: OnboardingStepProps) {
  const content = ONBOARDING_STEPS[step - 1];
  
  if (!content) return null;

  const IconComponent = content.icon;

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <IconComponent className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          {content.title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          {content.description}
        </p>
        
        {content.tip && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
            <p className="text-sm text-primary font-medium">
              💡 {content.tip}
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