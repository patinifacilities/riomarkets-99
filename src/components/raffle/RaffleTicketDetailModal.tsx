import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";

interface RaffleTicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleTitle: string;
  ticketNumbers: number[];
}

export const RaffleTicketDetailModal = ({
  isOpen,
  onClose,
  raffleTitle,
  ticketNumbers
}: RaffleTicketDetailModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            {raffleTitle}
          </DialogTitle>
        </DialogHeader>

        <div>
          <h4 className="text-sm font-semibold mb-3">
            Seus Bilhetes ({ticketNumbers.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {ticketNumbers.map((number, index) => (
              <Badge
                key={index}
                variant="outline"
                className="justify-center py-2 text-base font-bold"
              >
                {String(number).padStart(6, '0')}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Seus números são únicos e gerados aleatoriamente no momento da compra.
            Guarde bem seus números para conferir o resultado!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
