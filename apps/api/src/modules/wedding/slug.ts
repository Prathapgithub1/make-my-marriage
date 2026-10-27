export function generateWeddingSlug(
  brideName: string,
  groomName: string,
  dateStr?: string | null,
): string {
  const sanitize = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const p1 = sanitize(brideName) || 'partner1';
  const p2 = sanitize(groomName) || 'partner2';
  let datePart = '';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      datePart = `-${day}${month}${year}`;
    }
  }
  return `${p1}-${p2}${datePart}`;
}
