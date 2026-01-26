/**
 * OrgPage - Organization landing page with clubs directory
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ClubDirectory } from '@/components/clubs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, GraduationCap } from 'lucide-react';

export default function OrgPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Organization Not Found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-6 items-start">
              <div className="p-4 rounded-xl bg-primary/10">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold">{org.name}</h1>
                <p className="text-muted-foreground">{org.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <ClubDirectory umbrellaOrgId={org.id} umbrellaOrgName={org.name} />
      </main>
      <Footer />
    </div>
  );
}
