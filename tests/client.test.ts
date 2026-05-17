// Integration tests — require SIGMODX_API_KEY and SIGMODX_AGENT_ID env vars
// Skip in CI unless env vars are set

import { SigmodxClient } from '../src/client';

const SKIP =
  !process.env.SIGMODX_API_KEY || !process.env.SIGMODX_AGENT_ID;

(SKIP ? test.skip : test)('hashInputs via client', () => {
  const client = new SigmodxClient({
    apiKey: process.env.SIGMODX_API_KEY!,
    agentId: process.env.SIGMODX_AGENT_ID!,
  });
  const result = client.hashInputs({ invoice_id: 'TEST-001', amount: 100 });
  expect(result).toMatch(/^sha256:/);
});
