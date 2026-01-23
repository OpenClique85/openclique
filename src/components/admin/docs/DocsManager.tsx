/**
 * =============================================================================
 * DOCS MANAGER - Main Documentation Management Interface
 * =============================================================================
 * 
 * Tabbed interface for managing system documentation used in CTO Handoff Pack.
 * =============================================================================
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocsFlowsManager } from './DocsFlowsManager';
import { DocsRulesManager } from './DocsRulesManager';
import { DocsSecurityManager } from './DocsSecurityManager';
import { DocsEstimationManager } from './DocsEstimationManager';

export function DocsManager() {
  const [activeTab, setActiveTab] = useState('flows');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">System Documentation</h2>
        <p className="text-muted-foreground mt-1">
          Manage documentation for flows, rules, and system behavior. These docs are included in the CTO Handoff Pack.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flows">Flows & States</TabsTrigger>
          <TabsTrigger value="rules">Business Rules</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="estimation">Estimation</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="mt-6">
          <DocsFlowsManager />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <DocsRulesManager />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <DocsSecurityManager />
        </TabsContent>

        <TabsContent value="estimation" className="mt-6">
          <DocsEstimationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
