/**
 * ClubCard - Display card for a club within an umbrella org
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Lock, Globe, ChevronRight, CheckCircle } from 'lucide-react';
import type { Organization } from '@/hooks/useOrganizations';

interface ClubCardProps {
  club: Organization;
  isMember?: boolean;
  onJoin?: () => void;
  isJoining?: boolean;
}

export function ClubCard({ club, isMember, onJoin, isJoining }: ClubCardProps) {
  const isPrivate = club.visibility === 'private' || club.visibility === 'invite_only';

  return (
    <Card className="hover:border-primary/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Club Icon */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: club.primary_color || '#14B8A6' }}
          >
            {club.name.charAt(0)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground truncate">
                {club.name}
              </h3>
              {isPrivate && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              {club.is_verified && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Verified
                </Badge>
              )}
            </div>

            {club.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {club.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {club.member_count || 0} members
              </span>
              {club.category && (
                <Badge variant="secondary" className="text-xs">
                  {club.category}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                {isPrivate ? (
                  <>
                    <Lock className="h-3 w-3" />
                    {club.visibility === 'invite_only' ? 'Invite Only' : 'Private'}
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    Public
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0">
            {isMember ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/org/${club.slug}`}>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  View
                </Link>
              </Button>
            ) : isPrivate ? (
              <Button variant="outline" size="sm" onClick={onJoin} disabled={isJoining}>
                Request to Join
              </Button>
            ) : (
              <Button size="sm" onClick={onJoin} disabled={isJoining}>
                Join Club
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
