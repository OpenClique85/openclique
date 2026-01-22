import { CreatorAnalytics } from '@/components/creators/CreatorAnalytics';

interface CreatorAnalyticsPreviewProps {
  previewUserId: string;
}

export function CreatorAnalyticsPreview({ previewUserId }: CreatorAnalyticsPreviewProps) {
  return <CreatorAnalytics userId={previewUserId} />;
}
