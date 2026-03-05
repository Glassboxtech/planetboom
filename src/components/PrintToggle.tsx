import { Printer, PrinterCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PrintToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function PrintToggle({ enabled, onToggle }: PrintToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'transition-colors',
              enabled
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {enabled ? <PrinterCheck className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{enabled ? 'Label printing ON — click to disable' : 'Label printing OFF — click to enable'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
