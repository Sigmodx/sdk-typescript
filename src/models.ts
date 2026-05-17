export interface InvoiceDecisionParams {
  decisionType: 'approve' | 'reject' | 'escalate';
  inputHash: string;
  rationale: string;
  confidence?: number;
  invoiceAmount?: number;
  invoiceCurrency?: string;
  vendorName?: string;
  vendorId?: string;
  poReference?: string;
  invoiceReference?: string;
  delegatedAuthorityLimit?: number;
}

export interface DecisionResult {
  decisionEventId: string;
  requiresHumanApproval: boolean;
  agentState: 'ALLOW' | 'LIMIT' | 'BLOCK';
  createdAt: string;
}

export interface ReliabilityState {
  agentId: string;
  currentState: 'ALLOW' | 'LIMIT' | 'BLOCK';
  stateSource: 'computed' | 'override';
  stateReason: string;
  latestSignals?: {
    reviewerAgreementRate: number | null;
    errorRate: number;
    escalationRate: number;
    totalDecisions: number;
    periodStart: string;
    periodEnd: string;
  };
}
