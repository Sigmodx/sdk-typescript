export class SigmodxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SigmodxError';
  }
}

export class AgentBlockedError extends SigmodxError {
  reason: string | null;

  constructor(reason?: string) {
    super(
      `Agent is currently BLOCK${reason ? `: ${reason}` : ''}. ` +
      'Check the agent reliability state in your Sigmodx org dashboard.'
    );
    this.name = 'AgentBlockedError';
    this.reason = reason ?? null;
  }
}
