import { useLivePrice } from '@/hooks/useLivePrice';
import { useEffect } from 'react';

interface PoolPriceDisplayProps {
  assetSymbol: string;
  onPriceChange?: (price: number) => void;
}

export const PoolPriceDisplay = ({ assetSymbol, onPriceChange }: PoolPriceDisplayProps) => {
  const { price, loading } = useLivePrice(assetSymbol);

  useEffect(() => {
    if (!loading && price > 0 && onPriceChange) {
      onPriceChange(price);
    }
  }, [price, loading, onPriceChange]);

  if (loading) {
    return <span>...</span>;
  }

  return <span>${price.toLocaleString()}</span>;
};
