import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import { DeliveryLog } from './DeliveryLog';
import { TemplatePreview } from './TemplatePreview';
import { FailureAnalysis } from './FailureAnalysis';
import { NotificationStats } from './NotificationStats';

export function NotificationConsole() {
  const [activeTab, setActiveTab] = useState('delivery');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Console</h2>
        <p className="text-muted-foreground">
          Monitor email delivery, preview templates, and analyze failures
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Delivery Log
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="failures" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Failures
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="mt-6">
          <DeliveryLog />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatePreview />
        </TabsContent>

        <TabsContent value="failures" className="mt-6">
          <FailureAnalysis />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <NotificationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
