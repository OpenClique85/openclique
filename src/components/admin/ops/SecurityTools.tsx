import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, FileSearch, AlertTriangle } from 'lucide-react';
import { RBACInspector } from './security/RBACInspector';
import { PIIAccessLog } from './security/PIIAccessLog';
import { AbuseMonitor } from './security/AbuseMonitor';

export function SecurityTools() {
  const [activeTab, setActiveTab] = useState('rbac');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Tools
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          RBAC inspection, PII access logging, and security monitoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rbac" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">RBAC Inspector</span>
            <span className="sm:hidden">RBAC</span>
          </TabsTrigger>
          <TabsTrigger value="pii" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">PII Access Log</span>
            <span className="sm:hidden">PII Log</span>
          </TabsTrigger>
          <TabsTrigger value="abuse" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Abuse Monitor</span>
            <span className="sm:hidden">Abuse</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rbac" className="mt-6">
          <RBACInspector />
        </TabsContent>

        <TabsContent value="pii" className="mt-6">
          <PIIAccessLog />
        </TabsContent>

        <TabsContent value="abuse" className="mt-6">
          <AbuseMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
