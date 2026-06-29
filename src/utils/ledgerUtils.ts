const parseLedgerDateString = (dateStr: string): number => {
  if (!dateStr || typeof dateStr !== 'string') return 0;

  try {
    const match = dateStr.trim().match(/^(\d{1,2})-([A-Za-z]{3}),(\d{2})\s+(\d{1,2}):(\d{2})$/i);
    if (match) {
      const [, day, monthAbbr, year2Digit, hour, minute] = match;
      const year = parseInt(year2Digit, 10);
      const fullYear = year <= 50 ? 2000 + year : 1900 + year;
      const monthMap: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const month = monthMap[monthAbbr.toLowerCase()];
      if (month === undefined) return 0;

      const date = new Date(
        fullYear,
        month,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
      );
      const timestamp = date.getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    const fallbackDate = new Date(dateStr);
    return Number.isNaN(fallbackDate.getTime()) ? 0 : fallbackDate.getTime();
  } catch {
    return 0;
  }
};

export const getLatestReceiptDate = (ledgerData: unknown): string | null => {
  if (!Array.isArray(ledgerData)) return null;

  const payments = ledgerData[0];
  if (!Array.isArray(payments) || payments.length === 0) return null;

  const sorted = [...payments].sort((a: any, b: any) => {
    const dateAStr = a?.dateString || '';
    const dateBStr = b?.dateString || '';
    const dateA = parseLedgerDateString(dateAStr);
    const dateB = parseLedgerDateString(dateBStr);

    if (dateA > 0 && dateB > 0) return dateB - dateA;
    if (dateA === 0 && dateB > 0) return 1;
    if (dateB === 0 && dateA > 0) return -1;
    return dateBStr.localeCompare(dateAStr, undefined, { numeric: true, sensitivity: 'base' });
  });

  const latestDateString = sorted[0]?.dateString;
  if (!latestDateString || typeof latestDateString !== 'string') return null;

  return latestDateString.split(' ')[0] || latestDateString;
};
