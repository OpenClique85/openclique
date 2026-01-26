/**
 * =============================================================================
 * FILE: UGCShowcase.tsx
 * PURPOSE: Displays approved user-generated content (photos/videos) from quests
 * =============================================================================
 * 
 * This component fetches approved UGC submissions from the database and displays
 * them in an attractive masonry-style gallery. Only shows content where users
 * have given consent for marketing use.
 * 
 * USAGE:
 * <UGCShowcase limit={6} />
 * 
 * RELATED FILES:
 * - src/components/admin/UGCManager.tsx (admin approval interface)
 * - src/components/feedback/FeedbackMediaUpload.tsx (user upload interface)
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Play } from "lucide-react";

interface UGCItem {
  id: string;
  file_url: string;
  file_type: string;
  caption: string | null;
  user_display_name: string | null;
  quest_title: string | null;
}

interface UGCShowcaseProps {
  limit?: number;
  showTitle?: boolean;
}

export function UGCShowcase({ limit = 6, showTitle = true }: UGCShowcaseProps) {
  const [items, setItems] = useState<UGCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UGCItem | null>(null);

  useEffect(() => {
    fetchApprovedUGC();
  }, [limit]);

  const fetchApprovedUGC = async () => {
    try {
      const { data, error } = await supabase
        .from('ugc_submissions')
        .select(`
          id,
          file_url,
          file_type,
          caption,
          profiles:user_id (display_name),
          quests:quest_id (title)
        `)
        .eq('status', 'approved')
        .eq('consent_marketing', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedItems: UGCItem[] = (data || []).map((item: any) => ({
        id: item.id,
        file_url: item.file_url,
        file_type: item.file_type,
        caption: item.caption,
        user_display_name: item.profiles?.display_name || 'Anonymous',
        quest_title: item.quests?.title || null,
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching UGC:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div 
                key={i} 
                className="aspect-square bg-muted animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null; // Don't show section if no approved UGC
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {showTitle && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Camera className="w-4 h-4" />
              Community Moments
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Real Stories, Real Connections
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what happens when strangers become cliques. These moments were shared by our community members.
            </p>
          </div>
        )}

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`relative group cursor-pointer overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <div className={`${index === 0 ? 'aspect-square md:aspect-auto md:h-full' : 'aspect-square'}`}>
                {item.file_type.startsWith('video/') ? (
                  <>
                    <video
                      src={item.file_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-foreground ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.file_url}
                    alt={item.caption || 'Community moment'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Overlay with user info */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-foreground font-medium text-sm truncate">
                    {item.user_display_name}
                  </p>
                  {item.quest_title && (
                    <p className="text-muted-foreground text-xs truncate">
                      {item.quest_title}
                    </p>
                  )}
                  {item.caption && (
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                      "{item.caption}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="max-w-4xl max-h-[90vh] w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
            
            {selectedItem.file_type.startsWith('video/') ? (
              <video
                src={selectedItem.file_url}
                className="w-full max-h-[70vh] object-contain rounded-xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedItem.file_url}
                alt={selectedItem.caption || 'Community moment'}
                className="w-full max-h-[70vh] object-contain rounded-xl"
              />
            )}
            
            <div className="mt-4 text-center">
              <p className="text-foreground font-medium">
                {selectedItem.user_display_name}
              </p>
              {selectedItem.quest_title && (
                <p className="text-muted-foreground text-sm">
                  {selectedItem.quest_title}
                </p>
              )}
              {selectedItem.caption && (
                <p className="text-muted-foreground text-sm mt-2 italic">
                  "{selectedItem.caption}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
