import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { problemsAPI, plagiarismAPI } from '../../services/api';

function PlagiarismView() {
    const { isAdmin } = useAuth();
    const [problems, setProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        loadProblems();
    }, []);

    const loadProblems = async () => {
        try {
            const data = await problemsAPI.getAll();
            setProblems(data || []);
        } catch (err) {
            console.error('Failed to load problems:', err);
        }
    };

    const handleCheck = async () => {
        if (!selectedProblem) {
            alert('Please select a problem');
            return;
        }

        setLoading(true);
        setStatus('Checking for plagiarism...');
        setResults(null);

        try {
            const data = await plagiarismAPI.checkProblem(
                selectedProblem,
                selectedLanguage || null
            );
            setResults(data);
            setStatus(`Found ${data?.results?.length || 0} potential matches`);
        } catch (err) {
            setStatus('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin()) {
        return (
            <div className="problems-view">
                <h2>Access Denied</h2>
                <p className="text-muted">You don't have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div className="problems-view">
            <div className="problems-header">
                <h2>Plagiarism Detection</h2>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <select
                    className="language-select"
                    style={{ minWidth: '250px' }}
                    value={selectedProblem}
                    onChange={(e) => setSelectedProblem(e.target.value)}
                >
                    <option value="">Select a problem...</option>
                    {problems.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>

                <select
                    className="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                    <option value="">All Languages</option>
                    <option value="71">Python 3</option>
                    <option value="63">JavaScript</option>
                    <option value="54">C++</option>
                    <option value="62">Java</option>
                    <option value="48">C</option>
                    <option value="60">Go</option>
                </select>

                <button className="btn btn-primary" onClick={handleCheck} disabled={loading}>
                    {loading ? 'Checking...' : 'Check Plagiarism'}
                </button>
            </div>

            {status && <div className="text-muted" style={{ marginBottom: '1rem' }}>{status}</div>}

            <div className="problems-table-container">
                {!results ? (
                    <p className="text-muted">Select a problem and click "Check Plagiarism" to analyze submissions.</p>
                ) : results.results?.length === 0 ? (
                    <p className="text-muted">No plagiarism detected.</p>
                ) : (
                    <table className="problems-table">
                        <thead>
                            <tr>
                                <th>User 1</th>
                                <th>User 2</th>
                                <th>Similarity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.results?.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.submission_1?.user?.username || `Submission ${r.submission_id_1}`}</td>
                                    <td>{r.submission_2?.user?.username || `Submission ${r.submission_id_2}`}</td>
                                    <td>
                                        <span style={{ color: r.similarity_percent > 80 ? 'var(--error)' : 'var(--warning)' }}>
                                            {r.similarity_percent.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td>{r.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default PlagiarismView;
