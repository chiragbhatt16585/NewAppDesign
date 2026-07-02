import moment from 'moment';

/** Display format: 2024-01-15, 09.30 PM */
export function formatTicketCreatedDisplay(dateInput?: string | null): string {
  if (!dateInput?.trim()) {
    return moment().format('YYYY-MM-DD, hh.mm A');
  }

  const raw = dateInput.trim();
  const parsed = moment(
    raw,
    [
      'DD-MM-YYYY HH:mm',
      'DD-MM-YYYY HH:mm:ss',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'DD-MMM,YY HH:mm',
      moment.ISO_8601,
    ],
    true,
  );

  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD, hh.mm A');
  }

  const loose = moment(raw);
  if (loose.isValid()) {
    return loose.format('YYYY-MM-DD, hh.mm A');
  }

  return raw;
}

export function normalizeTicketNo(ticketNo?: string | null): string {
  const value = String(ticketNo || '').trim();
  return value || '—';
}
