import React from 'react';
import { Shield, TrendingUp, Zap } from 'lucide-react';
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
    title: 'Fast Markets: Pools de 60 segundos',
    description: 'Opine se ativos cripto, commodities, forex ou ações vão subir ou descer em <span style="color: white; font-weight: 600;">60 segundos</span>. Odds dinâmicas e resultados instantâneos.',
    tip: '<span style="color: white;">Perfeito para quem busca ação rápida e decisões ágeis.</span>',
    icon: Zap,
  },
  {
    id: 4,
    title: 'Segurança e controle de risco',
    description: 'Ambiente seguro com autenticação robusta, políticas transparentes e terminologia educativa. Comece pequeno, aprenda e evolua com confiança.',
    icon: Shield,
  },
];

export const ONBOARDING_MESSAGES = {
  welcome: 'Bem-vindo ao Rio Markets',
  subtitle: 'Entenda em 4 passos como funciona nossa plataforma',
  buttons: {
    back: 'Voltar',
    skip: 'Pular',
    continue: 'Continuar',
    explore: 'Explorar mercados',
  },
} as const;