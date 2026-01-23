/**
 * =============================================================================
 * EXPORT HANDOFF PACK - Edge Function (Multi-Format Support)
 * =============================================================================
 * 
 * Generates CTO Handoff Pack or COO Playbook in multiple formats:
 * - JSON: Structured data for programmatic use
 * - Markdown: Human-readable documentation bundle
 * - LLM: XML-structured context file for RAG/embedding
 * =============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HandoffRequest {
  sections?: string[];
  packType?: 'cto' | 'coo';
  format?: 'json' | 'markdown' | 'llm';
}

interface SystemDoc {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  slug: string;
  description: string | null;
  content_markdown: string | null;
  mermaid_diagram: string | null;
  version: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface HandoffPack {
  metadata: {
    generated_at: string;
    version: string;
    pack_type: string;
    sections_included: string[];
  };
  product?: { overview: string; documents: SystemDoc[] };
  flows?: { user_flows: SystemDoc[]; state_machines: SystemDoc[] };
  rules?: { business_rules: SystemDoc[]; guardrails: SystemDoc[] };
  datamodel?: { tables: any[]; relationships: string; rls_policies: any[] };
  apis?: { edge_functions: any[]; database_functions: any[] };
  ux?: { routes: any[]; components: any[] };
  security?: { rbac: SystemDoc[]; rls_summary: string; pii_handling: string };
  estimation?: { epics: SystemDoc[]; risks: SystemDoc[]; unknowns: SystemDoc[] };
  playbooks?: { daily_ops: SystemDoc[]; escalation: SystemDoc[]; support: SystemDoc[]; crisis: SystemDoc[] };
  processes?: { partner_management: SystemDoc[]; workflows: SystemDoc[] };
  slas?: { response_times: SystemDoc[]; uptime: SystemDoc[] };
  metrics?: { kpis: SystemDoc[]; reporting: SystemDoc[] };
}

// =============================================================================
// FORMAT GENERATORS
// =============================================================================

function generateLLMContext(pack: HandoffPack): string {
  const lines: string[] = [];
  
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<openclique-context version="1.0" generated="${pack.metadata.generated_at}">`);
  lines.push(`  <metadata>`);
  lines.push(`    <pack-type>${pack.metadata.pack_type}</pack-type>`);
  lines.push(`    <version>${pack.metadata.version}</version>`);
  lines.push(`    <sections-included>${pack.metadata.sections_included.join(', ')}</sections-included>`);
  lines.push(`  </metadata>`);
  lines.push(``);

  // Product Overview
  if (pack.product) {
    lines.push(`  <section id="product-overview" category="product">`);
    lines.push(`    <title>Product Overview</title>`);
    lines.push(`    <content><![CDATA[${pack.product.overview}]]></content>`);
    for (const doc of pack.product.documents) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <description>${escapeXml(doc.description || '')}</description>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      if (doc.mermaid_diagram) {
        lines.push(`      <mermaid><![CDATA[${doc.mermaid_diagram}]]></mermaid>`);
      }
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Flows & State Machines
  if (pack.flows) {
    lines.push(`  <section id="flows" category="flow">`);
    lines.push(`    <title>User Flows & State Machines</title>`);
    for (const doc of [...pack.flows.user_flows, ...pack.flows.state_machines]) {
      lines.push(`    <document id="${doc.slug}" type="${doc.category}" has-diagram="${doc.mermaid_diagram ? 'true' : 'false'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      if (doc.mermaid_diagram) {
        lines.push(`      <mermaid><![CDATA[${doc.mermaid_diagram}]]></mermaid>`);
      }
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Business Rules
  if (pack.rules) {
    lines.push(`  <section id="rules" category="business-rules">`);
    lines.push(`    <title>Business Rules & Guardrails</title>`);
    for (const doc of [...pack.rules.business_rules, ...pack.rules.guardrails]) {
      lines.push(`    <document id="${doc.slug}" type="${doc.category}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Data Model
  if (pack.datamodel) {
    lines.push(`  <section id="datamodel" category="database">`);
    lines.push(`    <title>Data Model & Schema</title>`);
    lines.push(`    <tables>`);
    for (const table of pack.datamodel.tables) {
      lines.push(`      <table name="${table.name}">${escapeXml(table.description || '')}</table>`);
    }
    lines.push(`    </tables>`);
    lines.push(`    <relationships><![CDATA[${pack.datamodel.relationships}]]></relationships>`);
    lines.push(`    <rls-policies>`);
    for (const policy of pack.datamodel.rls_policies) {
      lines.push(`      <policy table="${policy.table}">${escapeXml(policy.policy)}</policy>`);
    }
    lines.push(`    </rls-policies>`);
    lines.push(`  </section>`);
    lines.push(``);
  }

  // APIs
  if (pack.apis) {
    lines.push(`  <section id="apis" category="api">`);
    lines.push(`    <title>API Documentation</title>`);
    lines.push(`    <edge-functions>`);
    for (const fn of pack.apis.edge_functions) {
      lines.push(`      <function name="${fn.name}" auth="${fn.auth}">${escapeXml(fn.description)}</function>`);
    }
    lines.push(`    </edge-functions>`);
    lines.push(`    <database-functions>`);
    for (const fn of pack.apis.database_functions) {
      lines.push(`      <function name="${fn.name}" params="${fn.params}" returns="${fn.returns}">${escapeXml(fn.description)}</function>`);
    }
    lines.push(`    </database-functions>`);
    lines.push(`  </section>`);
    lines.push(``);
  }

  // UX Routes & Components
  if (pack.ux) {
    lines.push(`  <section id="ux" category="frontend">`);
    lines.push(`    <title>UX Routes & Components</title>`);
    lines.push(`    <routes>`);
    for (const route of pack.ux.routes) {
      lines.push(`      <route path="${route.path}" page="${route.page}" protection="${route.protection}" />`);
    }
    lines.push(`    </routes>`);
    lines.push(`    <components>`);
    for (const comp of pack.ux.components) {
      lines.push(`      <component name="${comp.name}" category="${comp.category}">${escapeXml(comp.description)}</component>`);
    }
    lines.push(`    </components>`);
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Security
  if (pack.security) {
    lines.push(`  <section id="security" category="security">`);
    lines.push(`    <title>Security & Compliance</title>`);
    lines.push(`    <rls-summary><![CDATA[${pack.security.rls_summary}]]></rls-summary>`);
    lines.push(`    <pii-handling><![CDATA[${pack.security.pii_handling}]]></pii-handling>`);
    for (const doc of pack.security.rbac) {
      lines.push(`    <document id="${doc.slug}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Estimation
  if (pack.estimation) {
    lines.push(`  <section id="estimation" category="estimation">`);
    lines.push(`    <title>Estimation & Stories</title>`);
    const allDocs = [...pack.estimation.epics, ...pack.estimation.risks, ...pack.estimation.unknowns];
    for (const doc of allDocs) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // COO Playbooks
  if (pack.playbooks) {
    lines.push(`  <section id="playbooks" category="operations">`);
    lines.push(`    <title>Operations Playbooks</title>`);
    const allDocs = [
      ...pack.playbooks.daily_ops,
      ...pack.playbooks.escalation,
      ...pack.playbooks.support,
      ...pack.playbooks.crisis,
    ];
    for (const doc of allDocs) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}" has-diagram="${doc.mermaid_diagram ? 'true' : 'false'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <description>${escapeXml(doc.description || '')}</description>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      if (doc.mermaid_diagram) {
        lines.push(`      <mermaid><![CDATA[${doc.mermaid_diagram}]]></mermaid>`);
      }
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Processes
  if (pack.processes) {
    lines.push(`  <section id="processes" category="process">`);
    lines.push(`    <title>Business Processes</title>`);
    const allDocs = [...pack.processes.partner_management, ...pack.processes.workflows];
    for (const doc of allDocs) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      if (doc.mermaid_diagram) {
        lines.push(`      <mermaid><![CDATA[${doc.mermaid_diagram}]]></mermaid>`);
      }
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // SLAs
  if (pack.slas) {
    lines.push(`  <section id="slas" category="sla">`);
    lines.push(`    <title>Service Level Agreements</title>`);
    const allDocs = [...pack.slas.response_times, ...pack.slas.uptime];
    for (const doc of allDocs) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
    lines.push(``);
  }

  // Metrics
  if (pack.metrics) {
    lines.push(`  <section id="metrics" category="metrics">`);
    lines.push(`    <title>Metrics & KPIs</title>`);
    const allDocs = [...pack.metrics.kpis, ...pack.metrics.reporting];
    for (const doc of allDocs) {
      lines.push(`    <document id="${doc.slug}" subcategory="${doc.subcategory || 'general'}">`);
      lines.push(`      <title>${escapeXml(doc.title)}</title>`);
      lines.push(`      <content><![CDATA[${doc.content_markdown || ''}]]></content>`);
      lines.push(`    </document>`);
    }
    lines.push(`  </section>`);
  }

  lines.push(`</openclique-context>`);
  
  return lines.join('\n');
}

function generateMarkdownBundle(pack: HandoffPack): string {
  const lines: string[] = [];
  
  lines.push(`# OpenClique ${pack.metadata.pack_type === 'coo' ? 'COO Operations Playbook' : 'CTO Handoff Pack'}`);
  lines.push(``);
  lines.push(`> Generated: ${pack.metadata.generated_at}`);
  lines.push(`> Version: ${pack.metadata.version}`);
  lines.push(`> Sections: ${pack.metadata.sections_included.join(', ')}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Table of Contents
  lines.push(`## Table of Contents`);
  lines.push(``);
  if (pack.product) lines.push(`- [Product Overview](#product-overview)`);
  if (pack.flows) lines.push(`- [Flows & State Machines](#flows--state-machines)`);
  if (pack.rules) lines.push(`- [Business Rules](#business-rules)`);
  if (pack.datamodel) lines.push(`- [Data Model](#data-model)`);
  if (pack.apis) lines.push(`- [API Documentation](#api-documentation)`);
  if (pack.ux) lines.push(`- [UX Routes & Components](#ux-routes--components)`);
  if (pack.security) lines.push(`- [Security & Compliance](#security--compliance)`);
  if (pack.estimation) lines.push(`- [Estimation & Stories](#estimation--stories)`);
  if (pack.playbooks) lines.push(`- [Operations Playbooks](#operations-playbooks)`);
  if (pack.processes) lines.push(`- [Business Processes](#business-processes)`);
  if (pack.slas) lines.push(`- [SLAs](#slas)`);
  if (pack.metrics) lines.push(`- [Metrics & KPIs](#metrics--kpis)`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Product Overview
  if (pack.product) {
    lines.push(`## Product Overview`);
    lines.push(``);
    lines.push(pack.product.overview);
    lines.push(``);
    for (const doc of pack.product.documents) {
      lines.push(`### ${doc.title}`);
      if (doc.description) lines.push(`> ${doc.description}`);
      lines.push(``);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
      if (doc.mermaid_diagram) {
        lines.push('```mermaid');
        lines.push(doc.mermaid_diagram);
        lines.push('```');
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Flows
  if (pack.flows) {
    lines.push(`## Flows & State Machines`);
    lines.push(``);
    for (const doc of [...pack.flows.user_flows, ...pack.flows.state_machines]) {
      lines.push(`### ${doc.title}`);
      lines.push(`*Type: ${doc.category}*`);
      lines.push(``);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
      if (doc.mermaid_diagram) {
        lines.push('```mermaid');
        lines.push(doc.mermaid_diagram);
        lines.push('```');
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Rules
  if (pack.rules) {
    lines.push(`## Business Rules`);
    lines.push(``);
    for (const doc of [...pack.rules.business_rules, ...pack.rules.guardrails]) {
      lines.push(`### ${doc.title}`);
      lines.push(`*Type: ${doc.category}*`);
      lines.push(``);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Data Model
  if (pack.datamodel) {
    lines.push(`## Data Model`);
    lines.push(``);
    lines.push(`### Tables`);
    lines.push(`| Table | Description |`);
    lines.push(`|-------|-------------|`);
    for (const table of pack.datamodel.tables) {
      lines.push(`| ${table.name} | ${table.description || '-'} |`);
    }
    lines.push(``);
    lines.push(`### Relationships`);
    lines.push(pack.datamodel.relationships);
    lines.push(``);
    lines.push(`### RLS Policies`);
    lines.push(`| Table | Policy |`);
    lines.push(`|-------|--------|`);
    for (const policy of pack.datamodel.rls_policies) {
      lines.push(`| ${policy.table} | ${policy.policy} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  // APIs
  if (pack.apis) {
    lines.push(`## API Documentation`);
    lines.push(``);
    lines.push(`### Edge Functions`);
    lines.push(`| Function | Description | Auth |`);
    lines.push(`|----------|-------------|------|`);
    for (const fn of pack.apis.edge_functions) {
      lines.push(`| ${fn.name} | ${fn.description} | ${fn.auth} |`);
    }
    lines.push(``);
    lines.push(`### Database Functions`);
    lines.push(`| Function | Parameters | Returns | Description |`);
    lines.push(`|----------|------------|---------|-------------|`);
    for (const fn of pack.apis.database_functions) {
      lines.push(`| ${fn.name} | ${fn.params} | ${fn.returns} | ${fn.description} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  // UX
  if (pack.ux) {
    lines.push(`## UX Routes & Components`);
    lines.push(``);
    lines.push(`### Routes`);
    lines.push(`| Path | Page | Protection |`);
    lines.push(`|------|------|------------|`);
    for (const route of pack.ux.routes) {
      lines.push(`| ${route.path} | ${route.page} | ${route.protection} |`);
    }
    lines.push(``);
    lines.push(`### Key Components`);
    lines.push(`| Component | Category | Description |`);
    lines.push(`|-----------|----------|-------------|`);
    for (const comp of pack.ux.components) {
      lines.push(`| ${comp.name} | ${comp.category} | ${comp.description} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  // Security
  if (pack.security) {
    lines.push(`## Security & Compliance`);
    lines.push(``);
    lines.push(pack.security.rls_summary);
    lines.push(``);
    lines.push(pack.security.pii_handling);
    lines.push(``);
    for (const doc of pack.security.rbac) {
      lines.push(`### ${doc.title}`);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Estimation
  if (pack.estimation) {
    lines.push(`## Estimation & Stories`);
    lines.push(``);
    const allDocs = [...pack.estimation.epics, ...pack.estimation.risks, ...pack.estimation.unknowns];
    for (const doc of allDocs) {
      lines.push(`### ${doc.title}`);
      lines.push(`*Category: ${doc.subcategory || 'general'}*`);
      lines.push(``);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Playbooks
  if (pack.playbooks) {
    lines.push(`## Operations Playbooks`);
    lines.push(``);
    const allDocs = [
      ...pack.playbooks.daily_ops,
      ...pack.playbooks.escalation,
      ...pack.playbooks.support,
      ...pack.playbooks.crisis,
    ];
    for (const doc of allDocs) {
      lines.push(`### ${doc.title}`);
      if (doc.description) lines.push(`> ${doc.description}`);
      lines.push(``);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
      if (doc.mermaid_diagram) {
        lines.push('```mermaid');
        lines.push(doc.mermaid_diagram);
        lines.push('```');
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Processes
  if (pack.processes) {
    lines.push(`## Business Processes`);
    lines.push(``);
    const allDocs = [...pack.processes.partner_management, ...pack.processes.workflows];
    for (const doc of allDocs) {
      lines.push(`### ${doc.title}`);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
      if (doc.mermaid_diagram) {
        lines.push('```mermaid');
        lines.push(doc.mermaid_diagram);
        lines.push('```');
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  // SLAs
  if (pack.slas) {
    lines.push(`## SLAs`);
    lines.push(``);
    const allDocs = [...pack.slas.response_times, ...pack.slas.uptime];
    for (const doc of allDocs) {
      lines.push(`### ${doc.title}`);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Metrics
  if (pack.metrics) {
    lines.push(`## Metrics & KPIs`);
    lines.push(``);
    const allDocs = [...pack.metrics.kpis, ...pack.metrics.reporting];
    for (const doc of allDocs) {
      lines.push(`### ${doc.title}`);
      lines.push(doc.content_markdown || '_No content_');
      lines.push(``);
    }
  }

  return lines.join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      sections = ['product', 'flows', 'rules', 'datamodel', 'apis', 'ux', 'security', 'estimation'],
      packType = 'cto',
      format = 'json'
    } = await req.json() as HandoffRequest;

    console.log(`Generating ${packType} handoff pack in ${format} format for sections:`, sections);

    const pack: HandoffPack = {
      metadata: {
        generated_at: new Date().toISOString(),
        version: '2.0.0',
        pack_type: packType,
        sections_included: sections,
      },
    };

    // ==========================================================================
    // CTO SECTIONS
    // ==========================================================================
    
    if (sections.includes('product')) {
      const { data: productDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'product')
        .eq('is_published', true)
        .order('sort_order');

      pack.product = {
        overview: productDocs?.[0]?.content_markdown || 'No product overview documented.',
        documents: (productDocs || []) as SystemDoc[],
      };
    }

    if (sections.includes('flows')) {
      const { data: flowDocs } = await supabase
        .from('system_docs')
        .select('*')
        .in('category', ['flow', 'state_machine'])
        .eq('is_published', true)
        .order('sort_order');

      pack.flows = {
        user_flows: (flowDocs?.filter(d => d.category === 'flow') || []) as SystemDoc[],
        state_machines: (flowDocs?.filter(d => d.category === 'state_machine') || []) as SystemDoc[],
      };
    }

    if (sections.includes('rules')) {
      const { data: ruleDocs } = await supabase
        .from('system_docs')
        .select('*')
        .in('category', ['rule', 'guardrail'])
        .eq('is_published', true)
        .order('sort_order');

      pack.rules = {
        business_rules: (ruleDocs?.filter(d => d.category === 'rule') || []) as SystemDoc[],
        guardrails: (ruleDocs?.filter(d => d.category === 'guardrail') || []) as SystemDoc[],
      };
    }

    if (sections.includes('datamodel')) {
      let tables = null;
      try {
        const result = await supabase.rpc('get_table_info');
        tables = result.data;
      } catch {
        // RPC doesn't exist
      }

      pack.datamodel = {
        tables: tables || [
          { name: 'profiles', description: 'User profile data' },
          { name: 'quests', description: 'Quest definitions' },
          { name: 'quest_signups', description: 'User quest registrations' },
          { name: 'feedback', description: 'Post-quest feedback' },
          { name: 'user_roles', description: 'RBAC role assignments' },
          { name: 'user_xp', description: 'User XP totals' },
          { name: 'user_achievements', description: 'Earned achievements' },
          { name: 'support_tickets', description: 'Support requests' },
          { name: 'system_docs', description: 'System documentation' },
        ],
        relationships: `## Key Relationships

- profiles.id -> auth.users.id (1:1)
- quest_signups.user_id -> profiles.id (N:1)
- quest_signups.quest_id -> quests.id (N:1)
- feedback.user_id -> profiles.id (N:1)
- feedback.quest_id -> quests.id (N:1)
- user_roles.user_id -> auth.users.id (N:1)
- user_xp.user_id -> profiles.id (1:1)
- user_achievements.user_id -> profiles.id (N:1)`,
        rls_policies: [
          { table: 'profiles', policy: 'Users can view all profiles, edit own' },
          { table: 'quests', policy: 'Public read, admin/creator write' },
          { table: 'quest_signups', policy: 'Users manage own signups, admin all' },
          { table: 'feedback', policy: 'Users submit own, admin read all' },
          { table: 'user_roles', policy: 'Admin only' },
        ],
      };
    }

    if (sections.includes('apis')) {
      pack.apis = {
        edge_functions: [
          { name: 'send-email', description: 'Send transactional emails via Resend', auth: 'service_role' },
          { name: 'notify-admin', description: 'Send admin notifications', auth: 'service_role' },
          { name: 'notify-users', description: 'Bulk user notifications', auth: 'service_role' },
          { name: 'recommend-squads', description: 'AI-powered squad matching', auth: 'service_role' },
          { name: 'generate-quest-image', description: 'AI image generation for quests', auth: 'service_role' },
          { name: 'verify-school-email', description: 'Educational email verification', auth: 'anon' },
          { name: 'export-handoff-pack', description: 'Generate CTO/COO documentation bundle', auth: 'admin' },
        ],
        database_functions: [
          { name: 'award_quest_xp', params: 'p_user_id UUID, p_quest_id UUID', returns: 'INTEGER', description: 'Award XP for quest completion' },
          { name: 'award_xp', params: 'p_user_id UUID, p_amount INTEGER, p_source TEXT', returns: 'INTEGER', description: 'Generic XP award' },
          { name: 'check_and_unlock_achievements', params: 'p_user_id UUID', returns: 'TABLE', description: 'Auto-unlock earned achievements' },
          { name: 'get_user_level', params: 'p_user_id UUID', returns: 'TABLE', description: 'Get current level and XP' },
          { name: 'has_role', params: '_user_id UUID, _role app_role', returns: 'BOOLEAN', description: 'Check user role' },
          { name: 'is_admin', params: 'none', returns: 'BOOLEAN', description: 'Check if current user is admin' },
        ],
      };
    }

    if (sections.includes('ux')) {
      pack.ux = {
        routes: [
          { path: '/', page: 'Index', protection: 'public', category: 'main' },
          { path: '/quests', page: 'Quests', protection: 'public', category: 'main' },
          { path: '/quests/:slug', page: 'QuestDetail', protection: 'public', category: 'main' },
          { path: '/auth', page: 'Auth', protection: 'public', category: 'auth' },
          { path: '/my-quests', page: 'MyQuests', protection: 'auth', category: 'user' },
          { path: '/profile', page: 'Profile', protection: 'auth', category: 'user' },
          { path: '/admin', page: 'Admin', protection: 'admin', category: 'admin' },
          { path: '/creator', page: 'CreatorDashboard', protection: 'auth', category: 'creator' },
          { path: '/sponsor', page: 'SponsorDashboard', protection: 'auth', category: 'sponsor' },
          { path: '/support', page: 'Support', protection: 'auth', category: 'user' },
        ],
        components: [
          { name: 'QuestCard', category: 'quest', description: 'Quest display card' },
          { name: 'QuestModal', category: 'quest', description: 'Quest detail modal with signup' },
          { name: 'XPBadge', category: 'gamification', description: 'XP level display' },
          { name: 'SquadCard', category: 'squad', description: 'Squad display card' },
          { name: 'Navbar', category: 'layout', description: 'Main navigation' },
          { name: 'Footer', category: 'layout', description: 'Site footer' },
        ],
      };
    }

    if (sections.includes('security')) {
      const { data: securityDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'security')
        .eq('is_published', true)
        .order('sort_order');

      pack.security = {
        rbac: (securityDocs || []) as SystemDoc[],
        rls_summary: `## Row Level Security Summary

All tables have RLS enabled with policies enforcing:
- Users can only access their own data
- Admins have elevated access where needed
- Public data (quests, creator profiles) is readable by all
- Write operations require authentication`,
        pii_handling: `## PII Handling

### Data Classification
- **High Sensitivity**: Email, phone, payment info
- **Medium Sensitivity**: Name, location preferences
- **Low Sensitivity**: Quest preferences, XP data

### Access Controls
- PII access logged to pii_access_log table
- Admin actions audited
- Shadow mode data isolated`,
      };
    }

    if (sections.includes('estimation')) {
      const { data: estimationDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'estimation')
        .eq('is_published', true)
        .order('sort_order');

      pack.estimation = {
        epics: (estimationDocs?.filter(d => d.subcategory === 'epics') || []) as SystemDoc[],
        risks: (estimationDocs?.filter(d => d.subcategory === 'risks') || []) as SystemDoc[],
        unknowns: (estimationDocs?.filter(d => ['unknowns', 'tech_debt'].includes(d.subcategory || '')) || []) as SystemDoc[],
      };
    }

    // ==========================================================================
    // COO SECTIONS
    // ==========================================================================

    if (sections.includes('playbooks') || packType === 'coo') {
      const { data: playbookDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'playbook')
        .eq('is_published', true)
        .order('sort_order');

      pack.playbooks = {
        daily_ops: (playbookDocs?.filter(d => d.subcategory === 'daily_ops') || []) as SystemDoc[],
        escalation: (playbookDocs?.filter(d => d.subcategory === 'escalation') || []) as SystemDoc[],
        support: (playbookDocs?.filter(d => d.subcategory === 'support_runbook') || []) as SystemDoc[],
        crisis: (playbookDocs?.filter(d => d.subcategory === 'crisis_response') || []) as SystemDoc[],
      };
    }

    if (sections.includes('processes') || packType === 'coo') {
      const { data: processDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'process')
        .eq('is_published', true)
        .order('sort_order');

      pack.processes = {
        partner_management: (processDocs?.filter(d => d.subcategory === 'partner_management') || []) as SystemDoc[],
        workflows: (processDocs?.filter(d => d.subcategory !== 'partner_management') || []) as SystemDoc[],
      };
    }

    if (sections.includes('slas') || packType === 'coo') {
      const { data: slaDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'sla')
        .eq('is_published', true)
        .order('sort_order');

      pack.slas = {
        response_times: (slaDocs?.filter(d => d.subcategory === 'response_times') || []) as SystemDoc[],
        uptime: (slaDocs?.filter(d => d.subcategory !== 'response_times') || []) as SystemDoc[],
      };
    }

    if (sections.includes('metrics') || packType === 'coo') {
      const { data: metricsDocs } = await supabase
        .from('system_docs')
        .select('*')
        .eq('category', 'metrics')
        .eq('is_published', true)
        .order('sort_order');

      pack.metrics = {
        kpis: (metricsDocs?.filter(d => d.subcategory === 'kpis') || []) as SystemDoc[],
        reporting: (metricsDocs?.filter(d => d.subcategory !== 'kpis') || []) as SystemDoc[],
      };
    }

    console.log('Handoff pack generated successfully');

    // ==========================================================================
    // FORMAT OUTPUT
    // ==========================================================================

    if (format === 'llm') {
      const xml = generateLLMContext(pack);
      return new Response(xml, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="openclique-${packType}-context.xml"`,
        },
      });
    }

    if (format === 'markdown') {
      const md = generateMarkdownBundle(pack);
      return new Response(md, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="openclique-${packType}-handoff.md"`,
        },
      });
    }

    // Default: JSON
    return new Response(JSON.stringify(pack, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
