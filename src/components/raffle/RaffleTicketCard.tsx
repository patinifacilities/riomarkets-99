import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RaffleTicketCardProps {
  raffleTitle: string;
  ticketCount: number;
  purchaseDate: string;
  status: string;
  imageUrl?: string;
  onClick: () => void;
  isTopTicket?: boolean;
}

export const RaffleTicketCard = ({
  raffleTitle,
  ticketCount,
  purchaseDate,
  status,
  onClick,
  isTopTicket = false
}: RaffleTicketCardProps) => {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group",
        isTopTicket && "ring-2 ring-[#ffd700] shadow-[0_0_30px_rgba(255,215,0,0.3)]"
      )}
      onClick={onClick}
    >
      {/* Golden shimmer animation for top ticket */}
      {isTopTicket && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent animate-shimmer-slow pointer-events-none z-10" 
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
      
      {/* Tear effect on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col justify-around z-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className="relative"
          >
            <svg 
              className="absolute right-0" 
              width="24" 
              height="8" 
              viewBox="0 0 24 8"
            >
              <path 
                d="M 0 0 Q 12 4 24 0 L 24 8 Q 12 4 0 8 Z" 
                fill="hsl(var(--background))"
              />
            </svg>
          </div>
        ))}
      </div>
      
      <div className="p-5 pr-10 space-y-4">
        <div>
          <h3 className={cn(
            "text-xl font-bold mb-2",
            isTopTicket && "text-[#ffd700]"
          )}>
            {raffleTitle}
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bilhetes</span>
            <span className={cn(
              "font-bold text-lg",
              isTopTicket ? "text-[#ffd700]" : "text-primary"
            )}>
              {ticketCount}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Comprado há</span>
          <span className="font-medium">{purchaseDate}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-medium ${
            status === 'active' ? 'text-green-500' : 'text-muted-foreground'
          }`}>
            {status === 'active' ? 'Ativa' : 'Finalizada'}
          </span>
        </div>
      </div>
    </Card>
  );
};