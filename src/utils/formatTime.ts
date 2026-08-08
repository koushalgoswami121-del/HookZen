export function formatTo12HrTime(timeStr?: string): string {
  if (!timeStr) return '';

  // If already contains AM or PM (case-insensitive)
  if (/am|pm/i.test(timeStr)) return timeStr;

  // Try parsing time string like "23:07" or "23:07:15"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Try parsing as Date string
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return timeStr;
}
