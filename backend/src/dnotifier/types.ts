// dnotifier/types.ts
// The installed @dnotifier-realtime/dnotifier .d.ts does not export any
// message/disconnect types (only Agent/Workflow/etc). These are local
// convenience types based on the documented runtime shape, not SDK exports.
export interface DNotifierIncomingMessage {
  metadata: {
    id?: string;
    sender: string;
    timestamp: number;
    type?: string;
  };
  payload: {
    toJSON(): unknown;
    toString(encoding?: string): string;
    toBase64(): string;
    raw(): ArrayBuffer | Buffer;
  };
}

export interface DNotifierDisconnectInfo {
  code?: number;
  reason?: string;
}
export interface WorkflowRunResult {
  result: any;
  state: Record<string, any>;
  executionId?: string; // present when workflow.observability === true; missing from installed .d.ts, confirmed present at runtime from runner.js source
}