import { useState, useEffect, useRef } from 'react';

const statusOptions = ['', 'PROPOSED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
const fundingOptions = ['', 'DONOR', 'GOVERNMENT', 'INTERNAL'];

export default function ProjectFilters({
    search,
    onSearchChange,
    division,
    onDivisionChange,
    status,
    onStatusChange,
    fundingType,
    onFundingTypeChange,
    divisions = [],
}) {
    const [localSearch, setLocalSearch] = useState(search || '');
    const debounceRef = useRef(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (onSearchChange) onSearchChange(localSearch);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [localSearch]);

    const chipStyle = (active) => ({
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: 500,
        color: active ? 'var(--color-primary-dark)' : '#475569',
        backgroundColor: active ? 'var(--color-primary-bg)' : '#f1f5f9',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
    });

    return (
        <div
            style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '16px',
            }}
        >
            <input
                type="text"
                placeholder="Search projects..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    flex: '1 1 200px',
                    minWidth: '160px',
                    outline: 'none',
                    fontFamily: 'inherit',
                }}
            />

            <select
                value={division}
                onChange={(e) => onDivisionChange(e.target.value)}
                style={{
                    ...chipStyle(!!division),
                    appearance: 'none',
                    paddingRight: '24px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                }}
            >
                <option value="">Division</option>
                {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.name}
                    </option>
                ))}
            </select>

            <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                style={{
                    ...chipStyle(!!status),
                    appearance: 'none',
                    paddingRight: '24px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                }}
            >
                {statusOptions.map((s) => (
                    <option key={s} value={s}>
                        {s === '' ? 'Status' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>

            <select
                value={fundingType}
                onChange={(e) => onFundingTypeChange(e.target.value)}
                style={{
                    ...chipStyle(!!fundingType),
                    appearance: 'none',
                    paddingRight: '24px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                }}
            >
                {fundingOptions.map((f) => (
                    <option key={f} value={f}>
                        {f === '' ? 'Funding' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>

            {(search || division || status || fundingType) && (
                <button
                    type="button"
                    onClick={() => {
                        setLocalSearch('');
                        onSearchChange('');
                        onDivisionChange('');
                        onStatusChange('');
                        onFundingTypeChange('');
                    }}
                    style={{
                        ...chipStyle(false),
                        color: '#dc2626',
                    }}
                >
                    Clear all
                </button>
            )}
        </div>
    );
}
