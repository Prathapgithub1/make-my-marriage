import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface WorkspaceDataExportSectionProps {
  weddingTitle: string;
}

export function WorkspaceDataExportSection({ weddingTitle }: WorkspaceDataExportSectionProps) {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGuests = async () => {
    setExportingType('guests');
    setDownloadSuccess(null);
    try {
      const res = await apiRequest<{ data: { items: Array<Record<string, unknown>> } }>(
        'guests?limit=1000',
      );
      const items = res.data?.items || [];

      const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Headcount', 'Dietary Restrictions'];
      const rows = items.map((g) => [
        `"${String(g.fullName || '').replace(/"/g, '""')}"`,
        `"${String(g.email || '').replace(/"/g, '""')}"`,
        `"${String(g.phone || '').replace(/"/g, '""')}"`,
        `"${String(g.status || 'PENDING')}"`,
        String(g.attendingCount ?? 1),
        `"${String(g.dietaryRequirements || 'None').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const safeTitle = weddingTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      triggerCsvDownload(`${safeTitle}-guests-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
      setDownloadSuccess('Guest roster exported successfully as CSV.');
    } catch {
      alert('Unable to export guest roster at this time. Please try again.');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExpenses = async () => {
    setExportingType('expenses');
    setDownloadSuccess(null);
    try {
      const res = await apiRequest<{ data: { items: Array<Record<string, unknown>> } }>(
        'expenses?limit=1000',
      );
      const items = res.data?.items || [];

      const headers = ['Title', 'Category', 'Vendor', 'Amount (INR)', 'Payment Status', 'Created Date'];
      const rows = items.map((e) => [
        `"${String(e.title || '').replace(/"/g, '""')}"`,
        `"${String(e.category || '').replace(/"/g, '""')}"`,
        `"${String((e.vendor as { name?: string })?.name || '').replace(/"/g, '""')}"`,
        String(e.amountDecimal || '0.00'),
        `"${String(e.status || 'PENDING')}"`,
        `"${String(e.createdAt || '').slice(0, 10)}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const safeTitle = weddingTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      triggerCsvDownload(`${safeTitle}-expenses-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
      setDownloadSuccess('Financial ledger exported successfully as CSV.');
    } catch {
      alert('Unable to export expenses ledger at this time.');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportVendors = async () => {
    setExportingType('vendors');
    setDownloadSuccess(null);
    try {
      const res = await apiRequest<{ data: { items: Array<Record<string, unknown>> } }>(
        'vendors?limit=500',
      );
      const items = res.data?.items || [];

      const headers = ['Business Name', 'Category', 'Contact Person', 'Phone', 'Email', 'Status'];
      const rows = items.map((v) => [
        `"${String(v.businessName || v.name || '').replace(/"/g, '""')}"`,
        `"${String(v.category || '').replace(/"/g, '""')}"`,
        `"${String(v.contactPerson || '').replace(/"/g, '""')}"`,
        `"${String(v.phone || '').replace(/"/g, '""')}"`,
        `"${String(v.email || '').replace(/"/g, '""')}"`,
        `"${String(v.status || 'ACTIVE')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const safeTitle = weddingTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      triggerCsvDownload(`${safeTitle}-vendors-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
      setDownloadSuccess('Vendor directory exported successfully as CSV.');
    } catch {
      alert('Unable to export vendor directory at this time.');
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-5 border-b border-[#EAE4DC]">
        <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
          Section 06
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
          Workspace Data & Export
        </h2>
        <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
          Export spreadsheets, generate comprehensive backup archives, and review data metrics.
        </p>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 rounded-lg bg-[#EAF5EB] border border-[#CDE5D1] text-[#2F6B38] text-xs font-medium flex items-center justify-between">
          <span>{downloadSuccess}</span>
          <button onClick={() => setDownloadSuccess(null)} className="text-[#2F6B38] font-bold">
            ×
          </button>
        </div>
      )}

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Guests Export Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#9A6218] flex items-center justify-center text-lg border border-[#EAE4DC]">
              👥
            </div>
            <h3 className="text-sm font-bold text-[#2C1810]">Guest List & RSVPs</h3>
            <p className="text-xs text-[#7C6659] leading-relaxed">
              Export all attendees, ceremony invitations, RSVP status, party size, and dietary restrictions to a spreadsheet.
            </p>
          </div>

          <button
            type="button"
            disabled={exportingType === 'guests'}
            onClick={handleExportGuests}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#D5CCC0] text-xs font-semibold text-[#2C1810] transition-colors"
          >
            {exportingType === 'guests' ? 'Generating...' : '📥 Export Guests (.CSV)'}
          </button>
        </div>

        {/* Expenses Export Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#7B341E] flex items-center justify-center text-lg border border-[#EAE4DC]">
              💰
            </div>
            <h3 className="text-sm font-bold text-[#2C1810]">Expenses & Financial Ledger</h3>
            <p className="text-xs text-[#7C6659] leading-relaxed">
              Download your complete wedding budget ledger with categories, paid amounts, installments, and payment notes.
            </p>
          </div>

          <button
            type="button"
            disabled={exportingType === 'expenses'}
            onClick={handleExportExpenses}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#D5CCC0] text-xs font-semibold text-[#2C1810] transition-colors"
          >
            {exportingType === 'expenses' ? 'Generating...' : '📥 Export Ledger (.CSV)'}
          </button>
        </div>

        {/* Vendors Export Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#5A453A] flex items-center justify-center text-lg border border-[#EAE4DC]">
              🤝
            </div>
            <h3 className="text-sm font-bold text-[#2C1810]">Vendor Directory & Contracts</h3>
            <p className="text-xs text-[#7C6659] leading-relaxed">
              Export vendor service agreements, contact directories, booking status, and pending balance summaries.
            </p>
          </div>

          <button
            type="button"
            disabled={exportingType === 'vendors'}
            onClick={handleExportVendors}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#D5CCC0] text-xs font-semibold text-[#2C1810] transition-colors"
          >
            {exportingType === 'vendors' ? 'Generating...' : '📥 Export Vendors (.CSV)'}
          </button>
        </div>
      </div>
    </div>
  );
}
