import React from 'react';
import { Shield, TrendingUp } from 'lucide-react';
import RioWhiteLogo from '@/assets/rio-white-logo.png';

export type OnboardingStepContent = {
  id: number;
  title: string;
  description: string;
  tip?: string;
  icon: React.ComponentType<{ className?: string }> | (() => JSX.Element);
  ctaText?: string;
  ctaHref?: string;
};

const LogoIcon = () => React.createElement('img', { 
  src: RioWhiteLogo, 
  alt: 'Rio Markets Logo', 
  className: 'w-16 h-16 object-contain' 
});

export const ONBOARDING_STEPS: OnboardingStepContent[] = [
  {
    id: 1,
    title: 'Analise o futuro, aprenda com o mercado',
    description: 'O Rio Markets é uma plataforma de mercados preditivos. Você publica análises sobre eventos e recebe recompensas conforme a precisão.',
    tip: 'Sem linguagem de apostas. Aqui é educação + previsibilidade.',
    icon: LogoIcon,
  },
  {
    id: 2,
    title: 'Recompensas em Rioz Coin, com transparência',
    description: 'Resultados têm liquidação transparente (pari-passu). Taxas claras (plataforma/cashout).',
    ctaText: 'Saiba mais',
    ctaHref: '/como-funciona',
    icon: TrendingUp,
  },
  {
    id: 3,
    title: 'Clareza, compliance e controle de risco',
    description: 'Terminologia educativa, políticas públicas, segurança Supabase/Auth. Comece pequeno e evolua com aprendizado.',
    icon: Shield,
  },
];

export const ONBOARDING_MESSAGES = {
  welcome: 'Bem-vindo ao Rio Markets',
  subtitle: 'Entenda em 3 passos como funciona nossa plataforma',
  buttons: {
    back: 'Voltar',
    skip: 'Pular',
    continue: 'Continuar',
    explore: 'Explorar mercados',
  },
} as const;