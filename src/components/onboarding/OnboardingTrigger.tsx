import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/stores/useOnboarding';
import { track } from '@/lib/analytics';

interface OnboardingTriggerProps {
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function OnboardingTrigger({ 
  children = "Como funciona", 
  variant = "outline",
  size = "lg",
  className = ""
}: OnboardingTriggerProps) {
  const { openManually } = useOnboarding();

  const handleClick = () => {
    track('onboarding_open_from_trigger', {
      trigger_location: 'hero_section',
      user_initiated: true
    });
    openManually();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      aria-label="Abrir tutorial sobre como funciona a plataforma"
    >
      {children}
    </Button>
  );
}