export const TOKEN_NAME = "Rioz Coin";

export function fmtToken(n: number): string {
  return `${n.toLocaleString()} ${TOKEN_NAME}`;
}

export function fmtVolume(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0)}b ${TOKEN_NAME}`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}m ${TOKEN_NAME}`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}k ${TOKEN_NAME}`;
  return `${Math.round(n)} ${TOKEN_NAME}`;
}

export function formatCurrency(value: number, currency: 'BRL' | 'RIOZ'): string {
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  } else {
    return `${value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })} RIOZ`;
  }
}