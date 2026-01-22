import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Link2, Check, Loader2, UserPlus } from 'lucide-react';

interface SquadMember {
  user_id: string;
  signup_id: string;
  display_name: string;
  austin_area?: string;
  referral_cluster?: number;
}

interface SquadSuggestion {
  suggested_name: string;
  members: SquadMember[];
  compatibility_score: number;
  referral_bonds: number;
}

interface SquadCardProps {
  squad: SquadSuggestion;
  squadIndex: number;
  onConfirm: (squad: SquadSuggestion, whatsappLink: string) => Promise<void>;
  isConfirming: boolean;
}

const AREA_LABELS: Record<string, string> = {
  downtown: 'Downtown',
  east_austin: 'East Austin',
  south_austin: 'South Austin',
  north_austin: 'North Austin',
  central: 'Central',
  round_rock_pflugerville: 'Round Rock/Pflugerville',
  cedar_park_leander: 'Cedar Park/Leander',
  other: 'Other',
};

export function SquadCard({ squad, squadIndex, onConfirm, isConfirming }: SquadCardProps) {
  const [whatsappLink, setWhatsappLink] = useState('');
  
  const compatPercent = Math.round(squad.compatibility_score * 100);
  const compatColor = compatPercent >= 75 
    ? 'bg-emerald-100 text-emerald-700' 
    : compatPercent >= 50 
      ? 'bg-amber-100 text-amber-700' 
      : 'bg-red-100 text-red-700';

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {squad.suggested_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={compatColor}>
              {compatPercent}% match
            </Badge>
            {squad.referral_bonds > 0 && (
              <Badge variant="outline" className="border-primary text-primary">
                <UserPlus className="h-3 w-3 mr-1" />
                {squad.referral_bonds} referral{squad.referral_bonds > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Members list */}
        <div className="space-y-2">
          {squad.members.map((member, idx) => (
            <div 
              key={member.user_id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {idx + 1}
                </span>
                <span className="font-medium">{member.display_name}</span>
                {member.referral_cluster && (
                  <Badge variant="secondary" className="text-xs">
                    cluster {member.referral_cluster}
                  </Badge>
                )}
              </div>
              {member.austin_area && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {AREA_LABELS[member.austin_area] || member.austin_area}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* WhatsApp link input */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            WhatsApp Group Link (optional)
          </label>
          <Input
            placeholder="https://chat.whatsapp.com/..."
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
          />
        </div>

        {/* Confirm button */}
        <Button 
          className="w-full"
          onClick={() => onConfirm(squad, whatsappLink)}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirm Squad & Notify
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
