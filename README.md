# @sigmodx/sdk — TypeScript / JavaScript SDK

TypeScript SDK for [Sigmodx](https://sigmodx.com) — audit infrastructure
for AI agents making consequential decisions.

## Installation

```bash
npm install @sigmodx/sdk
# or
yarn add @sigmodx/sdk
```

## Quickstart

```typescript
import { SigmodxClient, AgentBlockedError } from '@sigmodx/sdk';

const client = new SigmodxClient({
  apiKey: 'your-api-key',
  agentId: 'your-agent-uuid'
});

const inputHash = client.hashInputs({
  invoiceId: 'INV-2026-0042',
  vendorId:  'VENDOR-4821',
  amount:    32000
});

try {
  const result = await client.submitInvoiceDecision({
    decisionType: 'approve',
    inputHash,
    rationale: 'Invoice matches PO. Vendor in good standing.',
    invoiceAmount: 32000,
    vendorId: 'VENDOR-4821'
  });

  console.log(result.decisionEventId);
  console.log(result.agentState); // 'ALLOW' | 'LIMIT' | 'BLOCK'

  // Later — record what happened
  await client.recordOutcome(result.decisionEventId, 'processed');

} catch (e) {
  if (e instanceof AgentBlockedError) {
    // Agent is BLOCK — do not execute
    console.error('Agent blocked:', e.reason);
  }
}
```

## Links

- [Agent API reference](https://sigmodx.com/docs/agent-api)
- [Methodology](https://sigmodx.com/docs/methodology/invoice-approval)
- [Verify attestation](https://sigmodx.com/verify)
