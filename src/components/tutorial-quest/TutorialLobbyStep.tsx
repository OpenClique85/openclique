import { BuggsNarration } from './BuggsNarration';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const MOCK_MEMBERS = [
  { name: 'Alex K.', trait: '🎨 Creative', initials: 'AK' },
  { name: 'Jordan M.', trait: '🏃 Active', initials: 'JM' },
  { name: 'Sam R.', trait: '🍕 Foodie', initials: 'SR' },
  { name: 'You', trait: '✨ New Explorer', initials: 'ME' },
];

export function TutorialLobbyStep() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Meet Your Clique</h2>
        <p className="text-muted-foreground text-sm mt-1">Every quest starts with a small group</p>
      </div>

      <BuggsNarration message="This is your clique. Before each quest, you'll see who you're adventuring with. Small groups (3–6 people) make it easy to connect!" />

      <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Clique Alpha</h3>
          <Badge variant="outline" className="text-xs">4 members</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MOCK_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.trait}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Roles like Navigator and Archivist rotate each quest
        </p>
      </div>
    </div>
  );
}
