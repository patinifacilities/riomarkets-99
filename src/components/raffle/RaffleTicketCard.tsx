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
  imageUrl,
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
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            hsl(var(--card)) 0px,
            hsl(var(--card)) 20px,
            transparent 20px,
            transparent 40px
          ),
          repeating-linear-gradient(
            180deg,
            hsl(var(--card)) 0px,
            hsl(var(--card)) 20px,
            transparent 20px,
            transparent 40px
          ),
          repeating-linear-gradient(
            270deg,
            hsl(var(--card)) 0px,
            hsl(var(--card)) 20px,
            transparent 20px,
            transparent 40px
          ),
          repeating-linear-gradient(
            0deg,
            hsl(var(--card)) 0px,
            hsl(var(--card)) 20px,
            transparent 20px,
            transparent 40px
          )
        `,
        backgroundSize: '2px 100%, 100% 2px, 2px 100%, 100% 2px',
        backgroundPosition: '0 0, 0 0, 100% 0, 0 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Golden shimmer animation for top ticket */}
      {isTopTicket && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent animate-shimmer-slow pointer-events-none" 
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
      
      {/* Ticket perforation edge on left */}
      <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around py-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="w-2 h-2 rounded-full bg-background border border-border"
          />
        ))}
      </div>

      {imageUrl && (
        <div className="w-full h-48 overflow-hidden ml-4">
          <img 
            src={imageUrl} 
            alt={raffleTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}
      
      <div className="p-6 pl-8 space-y-4">
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
