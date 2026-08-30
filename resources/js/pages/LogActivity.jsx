import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/axios';
import ActivityFormStep from '../components/activities/ActivityFormStep';
import FileAttachStep from '../components/activities/FileAttachStep';
import ConfirmStep from '../components/activities/ConfirmStep';

const STEPS = ['Details', 'Attach Files', 'Confirm'];

export default function LogActivity() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectId: searchParams.get('projectId') || '',
        date: new Date().toISOString().split('T')[0],
        activityTypeId: '',
        description: '',
        notes: '',
    });
    const [files, setFiles] = useState([]);
    const [projects, setProjects] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [errors, setErrors] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [fileErrors, setFileErrors] = useState({});
    const [loadingMeta, setLoadingMeta] = useState(true);

    useEffect(() => {
        Promise.all([
            apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
            apiClient.get('/activity-types').catch(() => ({ data: { data: [] } })),
        ]).then(([projRes, typeRes]) => {
            setProjects(projRes.data.data || []);
            setActivityTypes(typeRes.data.data || []);
        }).finally(() => setLoadingMeta(false));
    }, []);

    useEffect(() => {
        function handleBeforeUnload(e) {
            e.preventDefault();
            e.returnValue = '';
        }
        if (step > 1 || formData.description || formData.activityTypeId || files.length) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [step, formData, files]);

    function updateForm(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors?.[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return Object.keys(next).length ? next : null;
            });
        }
    }

    function validateStep1() {
        const errs = {};
        if (!formData.projectId) errs.projectId = 'Project is required.';
        if (!formData.date) errs.date = 'Date is required.';
        if (!formData.activityTypeId) errs.activityTypeId = 'Activity type is required.';
        if (!formData.description?.trim()) errs.description = 'Description is required.';
        return Object.keys(errs).length ? errs : null;
    }

    function handleNext() {
        const validationErrors = validateStep1();
        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }
        setErrors(null);
        setStep(2);
    }

    function handleBack() {
        setStep((prev) => prev - 1);
    }

    function handleAddFiles(newFiles) {
        setFiles((prev) => [...prev, ...newFiles]);
    }

    function handleRemoveFile(index) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
        setFileErrors((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    }

    async function uploadFile(activityId, file, index) {
        const form = new FormData();
        form.append('file', file);
        form.append('type', 'OTHER');
        try {
            await apiClient.post(`/activities/${activityId}/documents`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress((prev) => ({ ...prev, [index]: pct }));
                },
            });
            setUploadProgress((prev) => ({ ...prev, [index]: 100 }));
            setFileErrors((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
        } catch {
            setFileErrors((prev) => ({ ...prev, [index]: 'Upload failed' }));
            setUploadProgress((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
        }
    }

    async function handleSubmit() {
        setSubmitting(true);
        setErrors(null);
        try {
            const activityType = activityTypes.find(
                (t) => String(t.id) === String(formData.activityTypeId)
            );
            const payload = {
                projectId: Number(formData.projectId),
                date: formData.date,
                type: activityType?.name,
                description: formData.description.trim(),
                notes: formData.notes?.trim() || undefined,
            };
            const res = await apiClient.post('/activities', payload);
            const activityId = res.data?.data?.id || res.data?.id;

            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    await uploadFile(activityId, files[i], i);
                }
            }

            navigate(`/projects/${formData.projectId}`);
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const serverErrors = Object.fromEntries(
                    Object.entries(err.response.data.errors).map(([key, msgs]) => [key, msgs.join(', ')])
                );
                if (serverErrors.type) {
                    serverErrors.activityTypeId = serverErrors.type;
                    delete serverErrors.type;
                }
                if (serverErrors.projectId || serverErrors.date || serverErrors.activityTypeId || serverErrors.description) {
                    setErrors(serverErrors);
                    setStep(1);
                    return;
                }
                setErrors(serverErrors);
            } else {
                setErrors({ _general: err.response?.data?.message || 'Failed to create activity. Please try again.' });
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleRetry(index) {
        setFileErrors((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    }

    const containerStyle = {
        maxWidth: '640px', margin: '0 auto', padding: '24px 16px',
    };

    const stepIndicatorStyle = {
        display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px',
    };

    const dotStyle = (active) => ({
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '20px',
        fontSize: '13px', fontWeight: 500,
        backgroundColor: active ? '#2563eb' : '#e2e8f0',
        color: active ? 'white' : '#64748b',
        transition: 'all 0.2s',
    });

    const navBtnBase = {
        padding: '9px 24px', fontSize: '14px', fontWeight: 600,
        borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
        border: 'none',
    };

    if (loadingMeta) {
        return (
            <div style={containerStyle}>
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</p>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '24px', textAlign: 'center' }}>
                Log Activity
            </h1>

            <div style={stepIndicatorStyle}>
                {STEPS.map((label, i) => (
                    <div key={label} style={dotStyle(step === i + 1)}>
                        <span>{i + 1}</span>
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            {errors?._general && (
                <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', textAlign: 'center' }}>
                    {errors._general}
                </div>
            )}

            {step === 1 && (
                <ActivityFormStep
                    formData={formData}
                    onChange={updateForm}
                    errors={errors}
                    projects={projects}
                    activityTypes={activityTypes}
                />
            )}

            {step === 2 && (
                <FileAttachStep
                    files={files}
                    onAddFiles={handleAddFiles}
                    onRemoveFile={handleRemoveFile}
                />
            )}

            {step === 3 && (
                <ConfirmStep
                    formData={formData}
                    files={files}
                    submitting={submitting}
                    uploadProgress={uploadProgress}
                    fileErrors={fileErrors}
                    onRetry={handleRetry}
                    projects={projects}
                    activityTypes={activityTypes}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                        ...navBtnBase,
                        color: '#475569', backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        visibility: step === 1 ? 'visible' : 'hidden',
                    }}
                >
                    Cancel
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={submitting}
                            style={{
                                ...navBtnBase,
                                color: '#475569', backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Back
                        </button>
                    )}
                    {step < 3 && (
                        <button
                            type="button"
                            onClick={step === 1 ? handleNext : () => setStep(3)}
                            style={{
                                ...navBtnBase,
                                color: 'white', backgroundColor: '#2563eb',
                            }}
                        >
                            {step === 1 ? 'Next' : 'Skip & Continue'}
                        </button>
                    )}
                    {step === 3 && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                ...navBtnBase,
                                color: 'white',
                                backgroundColor: submitting ? '#93c5fd' : '#16a34a',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Activity'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
