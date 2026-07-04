import { TroubleshootingAnswer } from '../types/troubleshooting';

export type TroubleshootingSessionState = {
  selectedFlowId: string | null;
  currentNodeId: string | null;
  history: string[];
  answers: TroubleshootingAnswer[];
  ticketDescription: string;
};

let session: TroubleshootingSessionState | null = null;

export function getTroubleshootingSession(): TroubleshootingSessionState | null {
  return session;
}

export function setTroubleshootingSession(state: TroubleshootingSessionState): void {
  session = state;
}

export function clearTroubleshootingSession(): void {
  session = null;
}
