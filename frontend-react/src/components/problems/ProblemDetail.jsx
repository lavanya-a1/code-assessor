import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemsAPI, submissionsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CodeEditor, { DEFAULT_CODE } from '../editor/CodeEditor';
import LanguageSelector from '../editor/LanguageSelector';
import TestCasePanel from '../editor/TestCasePanel';
import ResultsPanel from '../editor/ResultsPanel';

function ProblemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [problem, setProblem] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [languageId, setLanguageId] = useState(71); // Python default
    const [code, setCode] = useState(DEFAULT_CODE[71]);
    const [activeTab, setActiveTab] = useState('description');
    const [consoleTab, setConsoleTab] = useState('testcase');
    const [results, setResults] = useState(null);
    const [running, setRunning] = useState(false);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        loadProblem();
    }, [id]);

    useEffect(() => {
        // Reset code when language changes
        if (!code || code === DEFAULT_CODE[languageId]) {
            setCode(DEFAULT_CODE[languageId]);
        }
    }, [languageId]);

    const loadProblem = async () => {
        try {
            const data = await problemsAPI.getById(id);
            setProblem(data);

            // Load test cases if available
            if (data.test_cases) {
                setTestCases(data.test_cases);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissions = async () => {
        if (!user) return;
        try {
            const data = await submissionsAPI.getForProblem(id);
            setSubmissions(data || []);
        } catch (err) {
            console.error('Failed to load submissions:', err);
        }
    };

    const handleRun = async () => {
        setRunning(true);
        setConsoleTab('result');
        setResults(null);

        try {
            const result = await submissionsAPI.run(parseInt(id), languageId, code);
            setResults(result);
        } catch (err) {
            setResults({ error_message: err.message, passed: false });
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            alert('Please login to submit your solution');
            return;
        }

        setRunning(true);
        setConsoleTab('result');
        setResults(null);

        try {
            const result = await submissionsAPI.submit(parseInt(id), languageId, code);
            setResults(result);
            loadSubmissions();
        } catch (err) {
            setResults({ error_message: err.message, passed: false });
        } finally {
            setRunning(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this problem?')) return;

        try {
            await problemsAPI.delete(id);
            navigate('/');
        } catch (err) {
            alert('Failed to delete problem: ' + err.message);
        }
    };

    const getDifficultyClass = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'difficulty-easy';
            case 'medium': return 'difficulty-medium';
            case 'hard': return 'difficulty-hard';
            default: return '';
        }
    };

    if (loading) {
        return <div className="text-muted" style={{ padding: '2rem' }}>Loading problem...</div>;
    }

    if (error || !problem) {
        return <div style={{ padding: '2rem', color: 'var(--error)' }}>Error: {error || 'Problem not found'}</div>;
    }

    return (
        <div className="problem-view" style={{ display: 'block' }}>
            <div className="split-container">
                {/* Left Panel: Problem Description */}
                <div className="left-panel">
                    <div className="panel-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'editorial' ? 'active' : ''}`}
                            onClick={() => setActiveTab('editorial')}
                        >
                            Editorial
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('submissions'); loadSubmissions(); }}
                        >
                            Submissions
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <div className="tab-pane active">
                                {isAdmin() && (
                                    <div className="admin-actions" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <button className="btn btn-danger" onClick={handleDelete}>Delete Problem</button>
                                    </div>
                                )}
                                <div className="problem-detail">
                                    <h2>{problem.title}</h2>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <span className={`difficulty ${getDifficultyClass(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                        {problem.tags && problem.tags.split(',').map((tag, i) => (
                                            <span key={i} className="tag" style={{ marginLeft: '0.5rem' }}>{tag.trim()}</span>
                                        ))}
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{problem.description}</div>

                                    <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                                        <div>Time Limit: {problem.time_limit || 2000}ms</div>
                                        <div>Memory Limit: {(problem.memory_limit || 256000) / 1024}MB</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'editorial' && (
                            <div className="tab-pane active">
                                <p className="text-muted">Editorial coming soon...</p>
                            </div>
                        )}

                        {activeTab === 'submissions' && (
                            <div className="tab-pane active">
                                {!user ? (
                                    <p className="text-muted">Please login to view your submissions</p>
                                ) : submissions.length === 0 ? (
                                    <p className="text-muted">No submissions yet</p>
                                ) : (
                                    <div>
                                        {submissions.map((sub) => (
                                            <div key={sub.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ color: sub.passed ? 'var(--success)' : 'var(--error)' }}>
                                                    {sub.passed ? '✓ Accepted' : '✗ Wrong Answer'}
                                                </span>
                                                <span className="text-muted" style={{ marginLeft: '1rem' }}>
                                                    {new Date(sub.submitted_at).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Resize Handle */}
                <div className="resize-handle"></div>

                {/* Right Panel: Code Editor */}
                <div className="right-panel">
                    <div className="editor-container">
                        <div className="editor-header">
                            <LanguageSelector value={languageId} onChange={setLanguageId} />
                            <div className="editor-actions">
                                <button className="btn btn-secondary" onClick={handleRun} disabled={running}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                    Run
                                </button>
                                <button className="btn btn-success" onClick={handleSubmit} disabled={running}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Submit
                                </button>
                            </div>
                        </div>

                        <CodeEditor languageId={languageId} code={code} onChange={setCode} />

                        <div className="console-panel">
                            <div className="console-tabs">
                                <button
                                    className={`console-tab-btn ${consoleTab === 'testcase' ? 'active' : ''}`}
                                    onClick={() => setConsoleTab('testcase')}
                                >
                                    Testcase
                                </button>
                                <button
                                    className={`console-tab-btn ${consoleTab === 'result' ? 'active' : ''}`}
                                    onClick={() => setConsoleTab('result')}
                                >
                                    Test Result
                                </button>
                            </div>

                            <div className="console-content">
                                {consoleTab === 'testcase' ? (
                                    <TestCasePanel testCases={testCases} />
                                ) : (
                                    <ResultsPanel results={results} loading={running} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProblemDetail;
