import buggsFace from '@/assets/buggs-face.png';

interface BuggsNarrationProps {
  message: string;
  className?: string;
}

export function BuggsNarration({ message, className = '' }: BuggsNarrationProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <img src={buggsFace} alt="BUGGS" className="w-10 h-10 object-contain flex-shrink-0" />
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground">
        {message}
      </div>
    </div>
  );
}
