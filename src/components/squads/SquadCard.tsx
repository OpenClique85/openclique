import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Crown, ChevronRight } from 'lucide-react';

interface SquadMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface SquadCardProps {
  id: string;
  name: string;
  members: SquadMember[];
  questCount: number;
  createdAt: string;
  currentUserId: string;
}

export function SquadCard({ 
  id, 
  name, 
  members, 
  questCount,
  createdAt,
  currentUserId 
}: SquadCardProps) {
  const leader = members.find(m => m.role === 'leader');
  const isCurrentUserLeader = leader?.user_id === currentUserId;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-foreground">
                  {name}
                </h3>
                {isCurrentUserLeader && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Leader
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span>{members.length} members</span>
                <span>•</span>
                <span>Formed {formattedDate}</span>
                {questCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{questCount} quest{questCount !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {leader && (
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Crown className="h-3 w-3 text-amber-500" />
                    {leader.display_name}
                  </span>
                )}
                {members
                  .filter(m => m.role !== 'leader')
                  .slice(0, 4)
                  .map((member, i) => (
                    <span key={member.user_id} className="text-xs text-muted-foreground">
                      {i === 0 && leader ? ', ' : i > 0 ? ', ' : ''}
                      {member.user_id === currentUserId ? 'You' : member.display_name}
                    </span>
                  ))}
                {members.filter(m => m.role !== 'leader').length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{members.filter(m => m.role !== 'leader').length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/cliques/${id}`}>
              View
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
