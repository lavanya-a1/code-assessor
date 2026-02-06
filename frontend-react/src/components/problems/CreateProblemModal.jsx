import { useState } from 'react';
import Modal from '../common/Modal';
import { problemsAPI } from '../../services/api';

function CreateProblemModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1 = problem details, 2 = test cases
    const [problemId, setProblemId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [problemData, setProblemData] = useState({
        title: '',
        description: '',
        difficulty: 'easy',
        tags: '',
        time_limit: 2000,
        memory_limit: 256000,
    });

    const [testCases, setTestCases] = useState([
        { input: '', expected_output: '', is_sample: true, points: 10 },
    ]);

    const handleProblemChange = (e) => {
        setProblemData({ ...problemData, [e.target.name]: e.target.value });
    };

    const handleProblemSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await problemsAPI.create(problemData);
            setProblemId(result.id);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: '', expected_output: '', is_sample: false, points: 10 }]);
    };

    const removeTestCase = (index) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const updateTestCase = (index, field, value) => {
        const updated = [...testCases];
        updated[index][field] = value;
        setTestCases(updated);
    };

    const handleFinish = async () => {
        setError('');
        setLoading(true);

        try {
            for (const tc of testCases) {
                if (tc.input && tc.expected_output) {
                    await problemsAPI.createTestCase(problemId, tc);
                }
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            {step === 1 ? (
                <>
                    <h2>Create Problem</h2>
                    <form onSubmit={handleProblemSubmit}>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={problemData.title}
                                onChange={handleProblemChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                rows="6"
                                value={problemData.description}
                                onChange={handleProblemChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Difficulty</label>
                            <select name="difficulty" value={problemData.difficulty} onChange={handleProblemChange}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                name="tags"
                                value={problemData.tags}
                                onChange={handleProblemChange}
                                placeholder="e.g., Arrays, Strings"
                            />
                        </div>
                        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Time Limit (ms)</label>
                                <input
                                    type="number"
                                    name="time_limit"
                                    value={problemData.time_limit}
                                    onChange={handleProblemChange}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Memory Limit (KB)</label>
                                <input
                                    type="number"
                                    name="memory_limit"
                                    value={problemData.memory_limit}
                                    onChange={handleProblemChange}
                                />
                            </div>
                        </div>
                        {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Creating...' : 'Next: Add Test Cases'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <h2>Add Test Cases</h2>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Add test cases for the problem. Mark sample test cases that will be visible to users.
                    </p>

                    {testCases.map((tc, index) => (
                        <div key={index} className="test-case-item" style={{ border: '1px solid var(--border)', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong>Test Case {index + 1}</strong>
                                {testCases.length > 1 && (
                                    <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeTestCase(index)}>
                                        Remove
                                    </button>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Input</label>
                                <textarea
                                    rows="2"
                                    value={tc.input}
                                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Expected Output</label>
                                <textarea
                                    rows="2"
                                    value={tc.expected_output}
                                    onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={tc.is_sample}
                                        onChange={(e) => updateTestCase(index, 'is_sample', e.target.checked)}
                                    />
                                    Sample (visible to users)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Points:
                                    <input
                                        type="number"
                                        value={tc.points}
                                        onChange={(e) => updateTestCase(index, 'points', parseInt(e.target.value))}
                                        style={{ width: '60px' }}
                                    />
                                </label>
                            </div>
                        </div>
                    ))}

                    <button type="button" className="btn btn-secondary" onClick={addTestCase} style={{ marginBottom: '1rem' }}>
                        + Add Test Case
                    </button>

                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button type="button" className="btn btn-success" style={{ flex: 1 }} onClick={handleFinish} disabled={loading}>
                            {loading ? 'Saving...' : 'Finish'}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}

export default CreateProblemModal;
