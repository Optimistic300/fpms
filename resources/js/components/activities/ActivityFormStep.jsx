export default function ActivityFormStep({ formData, onChange, errors, projects, activityTypes }) {
    function handleChange(field, value) {
        onChange(field, value);
    }

    const today = new Date().toISOString().split('T')[0];

    const groupStyle = { marginBottom: '18px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: '#374151' };
    const inputStyle = {
        width: '100%', padding: '9px 12px', fontSize: '14px',
        border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
    };
    const errorTextStyle = { color: '#dc2626', fontSize: '12px', marginTop: '4px' };

    return (
        <div>
            <div style={groupStyle}>
                <label style={labelStyle}>Project *</label>
                <select
                    value={formData.projectId || ''}
                    onChange={(e) => handleChange('projectId', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.title || p.name}
                        </option>
                    ))}
                </select>
                {errors?.projectId && <div style={errorTextStyle}>{errors.projectId}</div>}
            </div>

            <div style={groupStyle}>
                <label style={labelStyle}>Date *</label>
                <input
                    type="date"
                    value={formData.date || today}
                    onChange={(e) => handleChange('date', e.target.value)}
                    style={inputStyle}
                />
                {errors?.date && <div style={errorTextStyle}>{errors.date}</div>}
            </div>

            <div style={groupStyle}>
                <label style={labelStyle}>Activity Type *</label>
                <select
                    value={formData.activityTypeId || ''}
                    onChange={(e) => handleChange('activityTypeId', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                >
                    <option value="">Select type</option>
                    {activityTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
                {errors?.activityTypeId && <div style={errorTextStyle}>{errors.activityTypeId}</div>}
            </div>

            <div style={groupStyle}>
                <label style={labelStyle}>Description *</label>
                <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the activity"
                    style={inputStyle}
                />
                {errors?.description && <div style={errorTextStyle}>{errors.description}</div>}
            </div>

            <div style={groupStyle}>
                <label style={labelStyle}>Notes</label>
                <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Optional notes"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                />
            </div>
        </div>
    );
}
