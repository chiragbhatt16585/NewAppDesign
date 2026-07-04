export function isActiveTicketError(message?: string | null): boolean {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('open complaint') ||
    normalized.includes('open ticket') ||
    normalized.includes('cannot accept a new complaint') ||
    normalized.includes('ticket already open') ||
    normalized.includes('cannot create new complaint') ||
    normalized.includes('already open')
  );
}

export type ActiveTicketModalData = {
  message: string;
  title: string;
  actionLabel: string;
  navigateToTickets: boolean;
};

export function buildTicketErrorModalData(message: string): ActiveTicketModalData {
  const apiMessage = message?.trim() || 'Failed to create ticket';
  const activeTicket = isActiveTicketError(apiMessage);

  return {
    message: activeTicket
      ? "We're currently working on your issue and will update you soon."
      : apiMessage,
    title: activeTicket ? 'One Active Ticket Found' : 'Unable to Raise Ticket',
    actionLabel: activeTicket ? 'View my tickets' : 'OK',
    navigateToTickets: activeTicket,
  };
}
