import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/stores/useOnboarding';
import { OnboardingStepper } from './OnboardingStepper';
import { OnboardingStep } from './OnboardingStep';
import { ONBOARDING_MESSAGES } from '@/lib/onboarding-content';
import { track } from '@/lib/analytics';

export function OnboardingModal() {
  const navigate = useNavigate();
  const { 
    open, 
    step, 
    mounted,
    next, 
    prev, 
    skip, 
    setMounted 
  } = useOnboarding();

  // Safe SSR hydration
  useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  // Analytics tracking
  useEffect(() => {
    if (open && mounted) {
      const startTime = Date.now();
      track('view_onboarding', { 
        step,
        timestamp: startTime 
      });

      return () => {
        const duration = Date.now() - startTime;
        track('onboarding_step_duration', {
          step,
          duration_ms: duration
        });
      };
    }
  }, [open, step, mounted]);

  const handleNext = () => {
    track('onboarding_next', { 
      from_step: step,
      to_step: step + 1 
    });
    next();
  };

  const handlePrev = () => {
    track('onboarding_prev', { 
      from_step: step,
      to_step: step - 1 
    });
    prev();
  };

  const handleSkip = () => {
    track('onboarding_skip', { 
      at_step: step,
      completed_steps: step - 1 
    });
    skip();
  };

  const handleExplore = () => {
    track('onboarding_complete', { 
      total_steps: 3,
      final_action: 'explore_markets' 
    });
    skip();
    navigate('/');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleSkip();
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="no-motion bg-background border-primary/20 max-w-lg mx-auto w-[95vw] sm:w-full fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        aria-describedby="onboarding-description"
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {ONBOARDING_MESSAGES.welcome}
          </DialogTitle>
          <DialogDescription id="onboarding-description" className="text-muted-foreground">
            {ONBOARDING_MESSAGES.subtitle}
          </DialogDescription>
        </DialogHeader>

        <OnboardingStepper 
          currentStep={step} 
          totalSteps={3} 
          className="mb-6" 
        />

        <OnboardingStep step={step} className="mb-8" />

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={step === 1}
            className="text-muted-foreground hover:text-foreground"
          >
            {ONBOARDING_MESSAGES.buttons.back}
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="border-primary/40 text-primary hover:bg-primary/5"
            >
              {ONBOARDING_MESSAGES.buttons.skip}
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {ONBOARDING_MESSAGES.buttons.continue}
              </Button>
            ) : (
              <Button 
                onClick={handleExplore}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {ONBOARDING_MESSAGES.buttons.explore}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}