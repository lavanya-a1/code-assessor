function ResultsPanel({ results, loading }) {
    if (loading) {
        return (
            <div className="results-content">
                <div className="text-muted">Running your code...</div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="results-content">
                <p className="text-muted">Run your code to see results here...</p>
            </div>
        );
    }

    const { passed, total_tests, passed_tests, execution_time, memory_used, error_message, test_results } = results;

    return (
        <div className="results-content">
            <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: passed ? 'var(--success)' : 'var(--error)' }}>
                    {passed ? '✓ Accepted' : '✗ Wrong Answer'}
                </strong>
                <span style={{ marginLeft: '1rem' }}>
                    {passed_tests}/{total_tests} tests passed
                </span>
            </div>

            {execution_time !== undefined && (
                <div style={{ marginBottom: '0.5rem' }}>
                    <span className="text-muted">Runtime: </span>
                    {execution_time.toFixed(2)}ms
                </div>
            )}

            {memory_used !== undefined && (
                <div style={{ marginBottom: '0.5rem' }}>
                    <span className="text-muted">Memory: </span>
                    {(memory_used / 1024).toFixed(2)} MB
                </div>
            )}

            {error_message && (
                <div style={{ marginTop: '1rem', color: 'var(--error)' }}>
                    <strong>Error:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{error_message}</pre>
                </div>
            )}

            {test_results && test_results.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <strong>Test Results:</strong>
                    {test_results.map((tr, i) => (
                        <div key={i} style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: '4px' }}>
                            <span style={{ color: tr.passed ? 'var(--success)' : 'var(--error)' }}>
                                {tr.passed ? '✓' : '✗'} Test {i + 1}
                            </span>
                            {tr.actual_output && !tr.passed && (
                                <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                                    <span className="text-muted">Output: </span>{tr.actual_output}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ResultsPanel;
