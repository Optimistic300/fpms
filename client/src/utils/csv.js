export function exportCSV(activities, start, end) {
    const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['Date', 'Activity', 'Notes', 'Logged By'].map(esc).join(',');
    const rows = activities.map(a =>
        [a.activityDate, a.description, a.notes || '', a.userName].map(esc).join(',')
    ).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fpms_report_${start}_to_${end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
