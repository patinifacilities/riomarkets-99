import { useLivePrice } from '@/hooks/useLivePrice';

interface PoolPriceDisplayProps {
  assetSymbol: string;
}

export const PoolPriceDisplay = ({ assetSymbol }: PoolPriceDisplayProps) => {
  const { price, loading } = useLivePrice(assetSymbol);

  if (loading) {
    return <span>...</span>;
  }

  return <span>${price.toLocaleString()}</span>;
};
