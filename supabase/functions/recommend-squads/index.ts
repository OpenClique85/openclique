import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecommendSquadsRequest {
  quest_id: string;
  squad_size?: number;
  options?: {
    prioritize_referrals?: boolean;
    balance_vibe?: boolean;
  };
}

interface UserProfile {
  id: string;
  display_name: string;
  email: string | null;
  preferences: {
    demographics?: {
      age_range?: string;
      austin_area?: string;
    };
    social_style?: {
      vibe_preference?: number;
      group_size?: string[];
    };
    interests?: {
      quest_types?: string[];
      not_my_thing?: string[];
    };
    context_tags?: string[];
  } | null;
}

interface SignupWithProfile {
  id: string;
  user_id: string;
  profile: UserProfile | null;
  referral_cluster?: number;
}

interface SquadSuggestion {
  suggested_name: string;
  members: {
    user_id: string;
    signup_id: string;
    display_name: string;
    austin_area?: string;
    referral_cluster?: number;
  }[];
  compatibility_score: number;
  referral_bonds: number;
}

// Calculate compatibility score between two users
function calculateCompatibility(user1: UserProfile | null, user2: UserProfile | null): number {
  if (!user1?.preferences || !user2?.preferences) return 0.5; // Neutral if no preferences
  
  let score = 0;
  let factors = 0;
  
  // Vibe compatibility (0-100 slider, closer = more compatible)
  const vibe1 = user1.preferences.social_style?.vibe_preference ?? 50;
  const vibe2 = user2.preferences.social_style?.vibe_preference ?? 50;
  const vibeDiff = Math.abs(vibe1 - vibe2);
  score += (100 - vibeDiff) / 100;
  factors++;
  
  // Age range proximity
  const ages = ['18_24', '25_34', '35_44', '45_54', '55_plus'];
  const age1 = user1.preferences.demographics?.age_range;
  const age2 = user2.preferences.demographics?.age_range;
  if (age1 && age2) {
    const ageDiff = Math.abs(ages.indexOf(age1) - ages.indexOf(age2));
    score += (4 - ageDiff) / 4;
    factors++;
  }
  
  // Austin area proximity
  const nearbyAreas: Record<string, string[]> = {
    'downtown': ['east_austin', 'central', 'south_austin'],
    'east_austin': ['downtown', 'central', 'north_austin'],
    'south_austin': ['downtown', 'central'],
    'north_austin': ['east_austin', 'central', 'round_rock_pflugerville', 'cedar_park_leander'],
    'central': ['downtown', 'east_austin', 'south_austin', 'north_austin'],
    'round_rock_pflugerville': ['north_austin', 'cedar_park_leander'],
    'cedar_park_leander': ['north_austin', 'round_rock_pflugerville'],
  };
  const area1 = user1.preferences.demographics?.austin_area;
  const area2 = user2.preferences.demographics?.austin_area;
  if (area1 && area2) {
    if (area1 === area2) {
      score += 1;
    } else if (nearbyAreas[area1]?.includes(area2)) {
      score += 0.7;
    } else {
      score += 0.3;
    }
    factors++;
  }
  
  // Quest type interest overlap
  const types1 = user1.preferences.interests?.quest_types || [];
  const types2 = user2.preferences.interests?.quest_types || [];
  if (types1.length > 0 && types2.length > 0) {
    const overlap = types1.filter(t => types2.includes(t)).length;
    const maxPossible = Math.max(types1.length, types2.length);
    score += overlap / maxPossible;
    factors++;
  }
  
  // Context tag overlap (new_to_city, remote_wfh, etc.)
  const tags1 = user1.preferences.context_tags || [];
  const tags2 = user2.preferences.context_tags || [];
  if (tags1.length > 0 && tags2.length > 0) {
    const overlap = tags1.filter(t => tags2.includes(t)).length;
    const maxPossible = Math.max(tags1.length, tags2.length);
    score += overlap / maxPossible;
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
}

// Build referral clusters from referrals table
async function buildReferralClusters(
  supabase: any,
  questId: string,
  userIds: string[]
): Promise<Map<string, number>> {
  const { data: referrals } = await supabase
    .from("referrals")
    .select("referrer_user_id, referred_user_id")
    .eq("quest_id", questId)
    .not("referred_user_id", "is", null);
  
  const userCluster = new Map<string, number>();
  let clusterNum = 0;
  
  // Build adjacency list
  const connections = new Map<string, Set<string>>();
  for (const ref of (referrals || [])) {
    if (!userIds.includes(ref.referrer_user_id) || !userIds.includes(ref.referred_user_id)) continue;
    
    if (!connections.has(ref.referrer_user_id)) {
      connections.set(ref.referrer_user_id, new Set());
    }
    if (!connections.has(ref.referred_user_id)) {
      connections.set(ref.referred_user_id, new Set());
    }
    connections.get(ref.referrer_user_id)!.add(ref.referred_user_id);
    connections.get(ref.referred_user_id)!.add(ref.referrer_user_id);
  }
  
  // BFS to find connected components (referral clusters)
  const visited = new Set<string>();
  for (const userId of connections.keys()) {
    if (visited.has(userId)) continue;
    
    clusterNum++;
    const queue = [userId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      userCluster.set(current, clusterNum);
      
      for (const neighbor of (connections.get(current) || [])) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  return userCluster;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    // Verify admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc("is_admin");
    if (adminError || !isAdminData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RecommendSquadsRequest = await req.json();
    const { quest_id, squad_size = 6, options = {} } = body;
    const { prioritize_referrals = true } = options;

    console.log("Recommend squads request:", { quest_id, squad_size });

    // Fetch pending signups
    const { data: signups, error: signupsError } = await supabaseAdmin
      .from("quest_signups")
      .select("id, user_id")
      .eq("quest_id", quest_id)
      .eq("status", "pending");

    if (signupsError) throw signupsError;
    if (!signups || signups.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        squads: [], 
        unassigned_users: [],
        total_pending: 0,
        message: "No pending signups found"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profiles
    const userIds = signups.map(s => s.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, preferences")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles || []).map(p => [p.id, p as UserProfile]));

    // Build referral clusters
    const referralClusters = prioritize_referrals 
      ? await buildReferralClusters(supabaseAdmin, quest_id, userIds)
      : new Map<string, number>();

    // Prepare signups with profiles and cluster info
    const signupsWithProfiles: SignupWithProfile[] = signups.map(s => ({
      id: s.id,
      user_id: s.user_id,
      profile: profileMap.get(s.user_id) || null,
      referral_cluster: referralClusters.get(s.user_id),
    }));

    // Group by referral clusters first
    const clusterGroups = new Map<number, SignupWithProfile[]>();
    const unclustered: SignupWithProfile[] = [];
    
    for (const signup of signupsWithProfiles) {
      if (signup.referral_cluster !== undefined) {
        if (!clusterGroups.has(signup.referral_cluster)) {
          clusterGroups.set(signup.referral_cluster, []);
        }
        clusterGroups.get(signup.referral_cluster)!.push(signup);
      } else {
        unclustered.push(signup);
      }
    }

    // Build squads
    const squads: SquadSuggestion[] = [];
    const assigned = new Set<string>();
    let squadLetter = 65; // ASCII 'A'

    // Process clusters first - keep referral groups together
    for (const [clusterId, clusterMembers] of clusterGroups) {
      // If cluster is larger than squad size, split it
      let remaining = clusterMembers.filter(m => !assigned.has(m.user_id));
      
      while (remaining.length > 0) {
        const squadMembers = remaining.slice(0, squad_size);
        remaining = remaining.slice(squad_size);
        
        // Fill with compatible unclustered users if needed
        while (squadMembers.length < squad_size && unclustered.length > 0) {
          // Score unclustered users by compatibility with squad members
          let bestMatch: SignupWithProfile | null = null;
          let bestScore = -1;
          
          for (const candidate of unclustered) {
            if (assigned.has(candidate.user_id)) continue;
            
            let totalScore = 0;
            for (const member of squadMembers) {
              totalScore += calculateCompatibility(candidate.profile, member.profile);
            }
            const avgScore = totalScore / squadMembers.length;
            
            if (avgScore > bestScore) {
              bestScore = avgScore;
              bestMatch = candidate;
            }
          }
          
          if (bestMatch) {
            squadMembers.push(bestMatch);
            const idx = unclustered.indexOf(bestMatch);
            if (idx > -1) unclustered.splice(idx, 1);
          } else {
            break;
          }
        }
        
        if (squadMembers.length >= Math.min(3, squad_size)) {
          // Calculate overall compatibility score
          let totalCompat = 0;
          let pairs = 0;
          for (let i = 0; i < squadMembers.length; i++) {
            for (let j = i + 1; j < squadMembers.length; j++) {
              totalCompat += calculateCompatibility(
                squadMembers[i].profile, 
                squadMembers[j].profile
              );
              pairs++;
            }
          }
          const avgCompatibility = pairs > 0 ? totalCompat / pairs : 0.5;
          
          // Count referral bonds
          const referralBonds = squadMembers.filter(m => m.referral_cluster !== undefined).length;
          
          squadMembers.forEach(m => assigned.add(m.user_id));
          
          squads.push({
            suggested_name: `Squad ${String.fromCharCode(squadLetter++)}`,
            members: squadMembers.map(m => ({
              user_id: m.user_id,
              signup_id: m.id,
              display_name: m.profile?.display_name || "Unknown",
              austin_area: m.profile?.preferences?.demographics?.austin_area,
              referral_cluster: m.referral_cluster,
            })),
            compatibility_score: Math.round(avgCompatibility * 100) / 100,
            referral_bonds: referralBonds,
          });
        }
      }
    }

    // Process unclustered users
    const remainingUnclustered = unclustered.filter(u => !assigned.has(u.user_id));
    
    while (remainingUnclustered.length >= Math.min(3, squad_size)) {
      const squadMembers: SignupWithProfile[] = [remainingUnclustered.shift()!];
      
      while (squadMembers.length < squad_size && remainingUnclustered.length > 0) {
        let bestMatch: SignupWithProfile | null = null;
        let bestScore = -1;
        let bestIdx = -1;
        
        for (let i = 0; i < remainingUnclustered.length; i++) {
          const candidate = remainingUnclustered[i];
          let totalScore = 0;
          for (const member of squadMembers) {
            totalScore += calculateCompatibility(candidate.profile, member.profile);
          }
          const avgScore = totalScore / squadMembers.length;
          
          if (avgScore > bestScore) {
            bestScore = avgScore;
            bestMatch = candidate;
            bestIdx = i;
          }
        }
        
        if (bestMatch && bestIdx > -1) {
          squadMembers.push(bestMatch);
          remainingUnclustered.splice(bestIdx, 1);
        } else {
          break;
        }
      }
      
      if (squadMembers.length >= Math.min(3, squad_size)) {
        let totalCompat = 0;
        let pairs = 0;
        for (let i = 0; i < squadMembers.length; i++) {
          for (let j = i + 1; j < squadMembers.length; j++) {
            totalCompat += calculateCompatibility(
              squadMembers[i].profile, 
              squadMembers[j].profile
            );
            pairs++;
          }
        }
        const avgCompatibility = pairs > 0 ? totalCompat / pairs : 0.5;
        
        squadMembers.forEach(m => assigned.add(m.user_id));
        
        squads.push({
          suggested_name: `Squad ${String.fromCharCode(squadLetter++)}`,
          members: squadMembers.map(m => ({
            user_id: m.user_id,
            signup_id: m.id,
            display_name: m.profile?.display_name || "Unknown",
            austin_area: m.profile?.preferences?.demographics?.austin_area,
            referral_cluster: undefined,
          })),
          compatibility_score: Math.round(avgCompatibility * 100) / 100,
          referral_bonds: 0,
        });
      }
    }

    // Collect unassigned users
    const unassignedUsers = signupsWithProfiles
      .filter(s => !assigned.has(s.user_id))
      .map(s => ({
        user_id: s.user_id,
        signup_id: s.id,
        display_name: s.profile?.display_name || "Unknown",
      }));

    console.log(`Generated ${squads.length} squads, ${unassignedUsers.length} unassigned`);

    return new Response(JSON.stringify({
      success: true,
      squads,
      unassigned_users: unassignedUsers,
      total_pending: signups.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("Error in recommend-squads function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
