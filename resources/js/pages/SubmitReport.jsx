import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/axios';

const STEPS = [
    { num: 1, label: 'Select Project' },
    { num: 2, label: 'Report Details' },
    { num: 3, label: 'Attach Report' },
    { num: 4, label: 'Confirm & Submit' },
];

const REPORT_TYPES = ['QUARTERLY', 'MID_YEAR', 'ANNUAL'];

function todayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function SubmitReport() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [projectId, setProjectId] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [type, setType] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState(todayStr());
    const [narrativeSummary, setNarrativeSummary] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [parentReportId, setParentReportId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(true);
    const [draftSaved, setDraftSaved] = useState(false);

    const hasEnteredData = projectId || type || periodStart || narrativeSummary || file;

    useEffect(() => {
        if (hasEnteredData && !draftSaved) {
            const handler = (e) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', handler);
            return () => window.removeEventListener('beforeunload', handler);
        }
    }, [hasEnteredData, draftSaved]);

    useEffect(() => {
        let cancelled = false;
        const projectIdParam = searchParams.get('projectId');
        const resubmitParam = searchParams.get('resubmit');
        const draftParam = searchParams.get('draft');

        async function init() {
            try {
                const projRes = await apiClient.get('/projects', {
                    params: { owner: 'me', status: 'ACTIVE' },
                });
                if (cancelled) return;
                const projectList = projRes.data.data || [];
                setProjects(projectList);

                let prefillData = null;

                if (resubmitParam) {
                    const reportRes = await apiClient.get(`/reports/${resubmitParam}`);
                    if (cancelled) return;
                    prefillData = reportRes.data.data;
                    setParentReportId(Number(resubmitParam));
                } else if (draftParam) {
                    const reportRes = await apiClient.get(`/reports/${draftParam}`);
                    if (cancelled) return;
                    prefillData = reportRes.data.data;
                }

                if (prefillData) {
                    if (prefillData.projectId) {
                        setProjectId(String(prefillData.projectId));
                        if (prefillData.projectTitle) setProjectTitle(prefillData.projectTitle);
                    }
                    if (prefillData.type) setType(prefillData.type);
                    if (prefillData.periodStart) setPeriodStart(prefillData.periodStart);
                    if (prefillData.periodEnd) setPeriodEnd(prefillData.periodEnd);
                    if (prefillData.narrativeSummary) setNarrativeSummary(prefillData.narrativeSummary);
                } else if (projectIdParam) {
                    setProjectId(projectIdParam);
                    const found = projectList.find((p) => String(p.id) === projectIdParam);
                    if (found) setProjectTitle(found.title);
                }
            } catch {
                if (!cancelled) setError('Failed to load data. Please try again.');
            } finally {
                if (!cancelled) {
                    setProjectsLoading(false);
                    setPageLoading(false);
                }
            }
        }

        init();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const found = projects.find((p) => String(p.id) === projectId);
        if (found) setProjectTitle(found.title);
        else if (!projectId) setProjectTitle('');
    }, [projectId, projects]);

    function validateStep(step) {
        const errors = {};
        if (step === 1 && !projectId) errors.projectId = 'Please select a project.';
        if (step === 2) {
            if (!type) errors.type = 'Please select a report type.';
            if (!periodStart) errors.periodStart = 'Period start date is required.';
            if (!periodEnd) errors.periodEnd = 'Period end date is required.';
            if (!narrativeSummary.trim()) errors.narrativeSummary = 'Narrative summary is required.';
            if (periodStart && periodEnd && new Date(periodStart) > new Date(periodEnd)) {
                errors.periodEnd = 'End date must be after start date.';
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function handleNext() {
        if (validateStep(currentStep)) {
            setCurrentStep((s) => Math.min(s + 1, 4));
            setFieldErrors({});
        }
    }

    function handleBack() {
        if (currentStep === 3) {
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        setCurrentStep((s) => Math.max(s - 1, 1));
        setFieldErrors({});
    }

    function handleSaveDraft() {
        setSavingDraft(true);
        setError(null);

        const payload = buildPayload();

        apiClient
            .post('/reports/draft', payload)
            .then(() => {
                setDraftSaved(true);
                navigate('/reports');
            })
            .catch((err) => {
                const msg = err?.response?.data?.message || 'Failed to save draft.';
                setError(msg);
            })
            .finally(() => setSavingDraft(false));
    }

    function handleSubmit() {
        if (submitting) return;
        setSubmitting(true);
        setError(null);

        const payload = buildPayload();

        apiClient
            .post('/reports', payload)
            .then(() => {
                navigate('/reports');
            })
            .catch((err) => {
                const data = err?.response?.data;
                if (data?.errors) {
                    const flat = Object.values(data.errors).flat().join(' ');
                    setError(flat);
                } else {
                    setError(data?.message || 'Failed to submit report.');
                }
            })
            .finally(() => setSubmitting(false));
    }

    function buildPayload() {
        const payload = {
            projectId: Number(projectId),
            type,
            periodStart,
            periodEnd,
            narrativeSummary,
        };
        if (file?.data) payload.file = file.data;
        if (parentReportId) payload.parentReportId = parentReportId;
        return payload;
    }

    function handleFileSelect(e) {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.type !== 'application/pdf') {
            setFieldErrors({ file: 'Only PDF files are accepted.' });
            return;
        }

        setFieldErrors({});

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result?.split(',')[1] || '';
            setFile({
                name: selected.name,
                size: selected.size,
                type: selected.type,
                data: base64,
            });
        };
        reader.readAsDataURL(selected);
    }

    function handleRemoveFile() {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>
                {parentReportId ? 'Resubmit Report' : 'Submit Report'}
            </h1>

            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
                {STEPS.map((step, i) => {
                    const isActive = currentStep === step.num;
                    const isCompleted = currentStep > step.num;
                    return (
                        <div key={step.num} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-primary-bg)' : '#f1f5f9',
                                    color: isActive ? 'white' : isCompleted ? 'var(--color-primary)' : '#94a3b8',
                                    fontSize: '13px',
                                    fontWeight: isActive || isCompleted ? 600 : 400,
                                    flex: 1,
                                }}
                            >
                                <span
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : isCompleted ? 'var(--color-primary)' : '#e2e8f0',
                                        color: isActive ? 'white' : isCompleted ? 'white' : '#94a3b8',
                                    }}
                                >
                                    {isCompleted ? '\u2713' : step.num}
                                </span>
                                <span style={{ whiteSpace: 'nowrap' }}>{step.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    style={{
                                        width: '16px',
                                        height: '2px',
                                        backgroundColor: isCompleted ? 'var(--color-primary)' : '#e2e8f0',
                                        margin: '0 2px',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#991b1b',
                        fontSize: '14px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                }}
            >
                {/* Step 1: Project Selector */}
                {currentStep === 1 && (
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1e293b',
                                marginBottom: '8px',
                            }}
                        >
                            Project <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        {projectsLoading ? (
                            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading projects...</div>
                        ) : projects.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                                No active projects found.{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/projects/new')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        textDecoration: 'underline',
                                        padding: 0,
                                    }}
                                >
                                    Create a project
                                </button>
                            </div>
                        ) : (
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: `1px solid ${fieldErrors.projectId ? '#dc2626' : '#e2e8f0'}`,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    backgroundColor: 'white',
                                }}
                            >
                                <option value="">Select a project...</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                        )}
                        {fieldErrors.projectId && (
                            <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
                                {fieldErrors.projectId}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Report Details */}
                {currentStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Type */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    marginBottom: '8px',
                                }}
                            >
                                Report Type <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {REPORT_TYPES.map((t) => (
                                    <label
                                        key={t}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 14px',
                                            borderRadius: '6px',
                                            border: `1px solid ${type === t ? 'var(--color-primary)' : '#e2e8f0'}`,
                                            backgroundColor: type === t ? 'var(--color-primary-bg)' : 'white',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: type === t ? 'var(--color-primary-dark)' : '#475569',
                                            fontWeight: type === t ? 600 : 400,
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value={t}
                                            checked={type === t}
                                            onChange={(e) => setType(e.target.value)}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        {t === 'QUARTERLY' ? 'Quarterly' : t === 'MID_YEAR' ? 'Mid-year' : 'Annual'}
                                    </label>
                                ))}
                            </div>
                            {fieldErrors.type && (
                                <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
                                    {fieldErrors.type}
                                </div>
                            )}
                        </div>

                        {/* Period */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label
                                    htmlFor="period-start"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Period Start <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    id="period-start"
                                    type="date"
                                    value={periodStart}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        fontSize: '14px',
                                        border: `1px solid ${fieldErrors.periodStart ? '#dc2626' : '#e2e8f0'}`,
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                {fieldErrors.periodStart && (
                                    <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
                                        {fieldErrors.periodStart}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label
                                    htmlFor="period-end"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Period End <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    id="period-end"
                                    type="date"
                                    value={periodEnd}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        fontSize: '14px',
                                        border: `1px solid ${fieldErrors.periodEnd ? '#dc2626' : '#e2e8f0'}`,
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                {fieldErrors.periodEnd && (
                                    <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
                                        {fieldErrors.periodEnd}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Narrative */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    marginBottom: '8px',
                                }}
                            >
                                Narrative Summary <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                value={narrativeSummary}
                                onChange={(e) => setNarrativeSummary(e.target.value)}
                                rows={6}
                                placeholder="Describe the work completed during this reporting period..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: `1px solid ${fieldErrors.narrativeSummary ? '#dc2626' : '#e2e8f0'}`,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    lineHeight: '1.5',
                                }}
                            />
                            {fieldErrors.narrativeSummary && (
                                <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
                                    {fieldErrors.narrativeSummary}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: File Upload */}
                {currentStep === 3 && (
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1e293b',
                                marginBottom: '8px',
                            }}
                        >
                            Attach Report (PDF)
                        </label>
                        <div
                            style={{
                                border: `2px dashed ${file ? '#16a34a' : fieldErrors.file ? '#dc2626' : '#e2e8f0'}`,
                                borderRadius: '8px',
                                padding: '32px',
                                textAlign: 'center',
                                backgroundColor: file ? '#f0fdf4' : '#fafafa',
                                transition: 'border-color 0.2s',
                            }}
                        >
                            {!file ? (
                                <div>
                                    <div style={{ fontSize: '32px', marginBottom: '8px', color: '#94a3b8' }}>
                                        {'\u{1F4C4}'}
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px' }}>
                                        Drag and drop your PDF here, or click to browse
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        id="report-file-input"
                                    />
                                    <label
                                        htmlFor="report-file-input"
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 24px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'white',
                                            backgroundColor: 'var(--color-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Choose File
                                    </label>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{'\u{1F4C4}'}</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#16a34a', marginBottom: '4px' }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                                        {file.type} · {formatFileSize(file.size)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        style={{
                                            padding: '8px 20px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#dc2626',
                                            backgroundColor: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        {fieldErrors.file && (
                            <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>
                                {fieldErrors.file}
                            </div>
                        )}
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                            PDF files only. Maximum size: 10 MB.
                        </p>
                    </div>
                )}

                {/* Step 4: Confirm */}
                {currentStep === 4 && (
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>
                            Review Your Submission
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <SummaryRow label="Project" value={projectTitle || `ID: ${projectId}`} />
                            <SummaryRow
                                label="Report Type"
                                value={
                                    type === 'QUARTERLY'
                                        ? 'Quarterly'
                                        : type === 'MID_YEAR'
                                          ? 'Mid-year'
                                          : type === 'ANNUAL'
                                            ? 'Annual'
                                            : type
                                }
                            />
                            <SummaryRow label="Period" value={`${formatDate(periodStart)} — ${formatDate(periodEnd)}`} />
                            <SummaryRow label="Narrative Summary" value={narrativeSummary} isLong />
                            <SummaryRow
                                label="Attachment"
                                value={file ? file.name : 'No file attached'}
                            />
                        </div>

                        <div
                            style={{
                                marginTop: '20px',
                                padding: '14px 16px',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: '#92400e',
                                lineHeight: '1.5',
                            }}
                        >
                            Once submitted you cannot edit this report. The Secretary can return it with
                            comments if changes are needed.
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <div style={{ display: 'flex', gap: '8px' }}>
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={submitting}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#475569',
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Back
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {currentStep < 4 && currentStep <= 3 && (
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={savingDraft || submitting}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#475569',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {savingDraft ? 'Saving...' : 'Save as Draft'}
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'white',
                                backgroundColor: 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'white',
                                backgroundColor: submitting ? 'var(--color-primary-lighter)' : 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {submitting
                                ? 'Submitting...'
                                : parentReportId
                                  ? 'Submit Resubmission'
                                  : 'Submit to Scientific Secretary'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, isLong }) {
    return (
        <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                {label}
            </div>
            <div
                style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    whiteSpace: isLong ? 'pre-wrap' : 'normal',
                    lineHeight: isLong ? '1.5' : 'inherit',
                }}
            >
                {value}
            </div>
        </div>
    );
}
