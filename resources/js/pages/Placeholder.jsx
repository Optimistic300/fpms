export default function Placeholder({ title }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                color: '#94a3b8',
                fontSize: '18px',
            }}
        >
            <p>{title || 'Coming soon'}</p>
        </div>
    );
}
