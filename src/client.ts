import { hashInputs as _hashInputs } from './hasher';
import {
  InvoiceDecisionParams,
  DecisionResult,
  ReliabilityState
} from './models';
import { SigmodxError, AgentBlockedError } from './errors';

const DEFAULT_BASE_URL = 'https://api.sigmodx.com';
const SDK_VERSION = '0.1.0';

interface InvoiceDecisionApiResponse {
  decision_event_id: string;
  requires_human_approval: boolean;
  agent_state: 'ALLOW' | 'LIMIT' | 'BLOCK';
  created_at: string;
}

interface ErrorApiResponse {
  detail?: string;
  error?: string;
}

interface ReliabilityApiResponse {
  agent_id: string;
  current_state: 'ALLOW' | 'LIMIT' | 'BLOCK';
  state_source: 'computed' | 'override';
  state_reason: string;
  latest_signals?: {
    reviewer_agreement_rate: number | null;
    error_rate: number;
    escalation_rate: number;
    total_decisions: number;
    period_start: string;
    period_end: string;
  };
}

export class SigmodxClient {
  private apiKey: string;
  public agentId: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: {
    apiKey: string;
    agentId: string;
    baseUrl?: string;
    timeout?: number;
  }) {
    this.apiKey = options.apiKey;
    this.agentId = options.agentId;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = options.timeout ?? 10000;
  }

  hashInputs(payload: Record<string, unknown>): string {
    return _hashInputs(payload);
  }

  async submitInvoiceDecision(
    params: InvoiceDecisionParams
  ): Promise<DecisionResult> {
    if (!['approve', 'reject', 'escalate'].includes(params.decisionType)) {
      throw new SigmodxError('decisionType must be approve, reject, or escalate');
    }
    if (params.rationale.length < 10) {
      throw new SigmodxError('rationale must be at least 10 characters');
    }

    const body: Record<string, unknown> = {
      decision_type: params.decisionType,
      input_hash: params.inputHash,
      rationale: params.rationale,
    };
    if (params.confidence != null) body.confidence = params.confidence;
    if (params.invoiceAmount != null) body.invoice_amount = params.invoiceAmount;
    if (params.invoiceCurrency) body.invoice_currency = params.invoiceCurrency;
    if (params.vendorName) body.vendor_name = params.vendorName;
    if (params.vendorId) body.vendor_id = params.vendorId;
    if (params.poReference) body.po_reference = params.poReference;
    if (params.invoiceReference) body.invoice_reference = params.invoiceReference;
    if (params.delegatedAuthorityLimit != null)
      body.delegated_authority_limit = params.delegatedAuthorityLimit;

    const res = await this.fetch(
      `/agents/${this.agentId}/decisions/invoice`,
      { method: 'POST', body: JSON.stringify(body) }
    );

    if (res.status === 403) {
      const data = (await res.json()) as ErrorApiResponse;
      throw new AgentBlockedError(data.detail ?? data.error);
    }
    if (res.status !== 200 && res.status !== 201) {
      throw new SigmodxError(`Unexpected response ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as InvoiceDecisionApiResponse;
    return {
      decisionEventId: data.decision_event_id,
      requiresHumanApproval: data.requires_human_approval,
      agentState: data.agent_state,
      createdAt: data.created_at,
    };
  }

  async recordOutcome(
    decisionEventId: string,
    outcome: 'processed' | 'rejected' | 'reversed' | 'disputed',
    outcomeNote?: string
  ): Promise<void> {
    const body: Record<string, unknown> = { outcome };
    if (outcomeNote) body.outcome_note = outcomeNote;

    const res = await this.fetch(
      `/decisions/${decisionEventId}/outcome`,
      { method: 'POST', body: JSON.stringify(body) }
    );
    if (res.status === 409) {
      throw new SigmodxError('Outcome is already recorded and cannot be changed.');
    }
    if (!res.ok) {
      throw new SigmodxError(`Unexpected response ${res.status}: ${await res.text()}`);
    }
  }

  async getReliability(): Promise<ReliabilityState> {
    const res = await this.fetch(
      `/agents/${this.agentId}/reliability/invoice`
    );
    if (!res.ok) {
      throw new SigmodxError(`Unexpected response ${res.status}`);
    }
    const data = (await res.json()) as ReliabilityApiResponse;
    return {
      agentId: data.agent_id,
      currentState: data.current_state,
      stateSource: data.state_source,
      stateReason: data.state_reason,
      latestSignals: data.latest_signals ? {
        reviewerAgreementRate: data.latest_signals.reviewer_agreement_rate,
        errorRate: data.latest_signals.error_rate,
        escalationRate: data.latest_signals.escalation_rate,
        totalDecisions: data.latest_signals.total_decisions,
        periodStart: data.latest_signals.period_start,
        periodEnd: data.latest_signals.period_end,
      } : undefined,
    };
  }

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await globalThis.fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': `sigmodx-typescript/${SDK_VERSION}`,
          ...(init?.headers ?? {}),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
