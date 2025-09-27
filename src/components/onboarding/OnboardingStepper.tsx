interface OnboardingStepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingStepper({ 
  currentStep, 
  totalSteps, 
  className = "" 
}: OnboardingStepperProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      <span className="sr-only">
        Passo {currentStep} de {totalSteps}
      </span>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;
        
        return (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded transition-colors duration-200 ${
              isActive 
                ? 'bg-primary' 
                : 'bg-muted-foreground/20'
            }`}
            aria-current={step === currentStep ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}