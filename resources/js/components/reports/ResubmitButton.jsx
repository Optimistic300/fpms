import { useNavigate } from 'react-router-dom';

export default function ResubmitButton({ reportId, projectId, label = 'Resubmit', style: customStyle, ...props }) {
    const navigate = useNavigate();

    function handleClick() {
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        params.set('resubmit', reportId);
        navigate(`/reports/new?${params.toString()}`);
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                ...customStyle,
            }}
            {...props}
        >
            {label}
        </button>
    );
}
