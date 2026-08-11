import { useState } from 'react';

const REPORT_TYPES = ['QUARTERLY', 'ANNUAL', 'COMPLETION', 'SPECIAL', 'THESIS'];
const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'RETURNED', 'ESCALATED'];

export default function ReportFilters({ filters, onChange }) {
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    function handleSearchChange(e) {
        setLocalSearch(e.target.value);
    }

    function handleSearchKeyDown(e) {
        if (e.key === 'Enter') {
            onChange({ ...filters, search: localSearch });
        }
    }

    function handleSearchBlur() {
        onChange({ ...filters, search: localSearch });
    }

    function togglePendingOnly() {
        onChange({ ...filters, pendingOnly: !filters.pendingOnly });
    }

    function setDivision(value) {
        onChange({ ...filters, division: value });
    }

    function setType(value) {
        onChange({ ...filters, type: value });
    }

    function setStatus(value) {
        onChange({ ...filters, status: value });
    }

    function clearFilters() {
        setLocalSearch('');
        onChange({ search: '', pendingOnly: true, division: '', type: '', status: '' });
    }

    const hasActiveFilters = filters.search || filters.division || filters.type || filters.status || !filters.pendingOnly;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '16px 0' }}>
            <input
                type="text"
                placeholder="Search by researcher, project, division..."
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                }}
            />

            <button
                type="button"
                onClick={togglePendingOnly}
                style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${filters.pendingOnly ? 'var(--color-primary)' : '#e2e8f0'}`,
                    backgroundColor: filters.pendingOnly ? '#eff6ff' : 'white',
                    color: filters.pendingOnly ? 'var(--color-primary)' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                {filters.pendingOnly ? '✓ Pending only' : 'All statuses'}
            </button>

            <select
                value={filters.division}
                onChange={(e) => setDivision(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: filters.division ? '#1e293b' : '#94a3b8',
                    outline: 'none',
                    backgroundColor: 'white',
                    minWidth: '120px',
                }}
            >
                <option value="">All divisions</option>
                <option value="Forest Ecology">Forest Ecology</option>
                <option value="Forest Engineering">Forest Engineering</option>
                <option value="Social Forestry">Social Forestry</option>
                <option value="Forest Products">Forest Products</option>
                <option value="Watershed Management">Watershed Management</option>
            </select>

            <select
                value={filters.type}
                onChange={(e) => setType(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: filters.type ? '#1e293b' : '#94a3b8',
                    outline: 'none',
                    backgroundColor: 'white',
                    minWidth: '110px',
                }}
            >
                <option value="">All types</option>
                {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>

            <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    color: filters.status ? '#1e293b' : '#94a3b8',
                    outline: 'none',
                    backgroundColor: 'white',
                    minWidth: '110px',
                }}
            >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        color: '#ef4444',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}