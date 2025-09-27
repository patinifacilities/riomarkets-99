import React from 'react';

type StatusKind = 'aberto' | 'encerrando' | 'encerrado' | 'liquidado';

interface StatusBadgeProps {
  kind: StatusKind;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ kind, children, className = '' }: StatusBadgeProps) {
  const styles: Record<StatusKind, string> = {
    aberto: "text-[color:var(--brand-green)] border-[color:var(--brand-green)]/40 bg-[#0f1a14]",
    encerrando: "text-[#E8B100] border-[#E8B100]/40 bg-[#161206]",
    encerrado: "text-[color:var(--text-secondary)] border-[color:var(--border-soft)] bg-[#0F1216]",
    liquidado: "text-[color:var(--text-secondary)] border-[color:var(--border-soft)] bg-[#0F1216]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[kind]} ${className}`}>
      {children ?? kind}
    </span>
  );
}