import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TagFilter from './TagFilter';
import CreateProblemModal from './CreateProblemModal';

function ProblemList() {
    const { isAdmin } = useAuth();
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadProblems();
    }, []);

    const loadProblems = async () => {
        try {
            const data = await problemsAPI.getAll();
            // Handle both array and object responses
            const problemsList = Array.isArray(data) ? data : (data?.problems || data?.data || []);
            setProblems(problemsList);
            setFilteredProblems(problemsList);
        } catch (err) {
            console.error('Failed to load problems:', err);
            setProblems([]);
            setFilteredProblems([]);
        } finally {
            setLoading(false);
        }
    };

    const extractTags = () => {
        const tagSet = new Set();
        if (!Array.isArray(problems)) return [];
        problems.forEach((problem) => {
            if (problem.tags) {
                problem.tags.split(',').forEach((tag) => tagSet.add(tag.trim()));
            }
        });
        return Array.from(tagSet).sort();
    };

    const handleTagFilter = (tag) => {
        setSelectedTag(tag);
        if (tag === 'all') {
            setFilteredProblems(problems);
        } else {
            setFilteredProblems(
                problems.filter((p) => p.tags && p.tags.toLowerCase().includes(tag.toLowerCase()))
            );
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
        return <div className="text-muted" style={{ padding: '2rem' }}>Loading problems...</div>;
    }

    return (
        <div className="problems-view">
            <div className="problems-header">
                <h2>Problems</h2>
                {isAdmin() && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        + New Problem
                    </button>
                )}
            </div>

            <TagFilter
                tags={extractTags()}
                selectedTag={selectedTag}
                onSelectTag={handleTagFilter}
            />

            <div className="problems-table-container">
                <table className="problems-table">
                    <thead>
                        <tr>
                            <th width="40%">Title</th>
                            <th width="15%">Difficulty</th>
                            <th width="20%">Tags</th>
                            <th width="25%">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProblems.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-muted" style={{ textAlign: 'center' }}>
                                    No problems found
                                </td>
                            </tr>
                        ) : (
                            filteredProblems.map((problem) => (
                                <tr key={problem.id}>
                                    <td>
                                        <Link to={`/problem/${problem.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                            {problem.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <span className={`difficulty ${getDifficultyClass(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                    </td>
                                    <td>
                                        {problem.tags && problem.tags.split(',').map((tag, i) => (
                                            <span key={i} className="tag" style={{ marginRight: '0.25rem' }}>
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                        {problem.description?.substring(0, 100)}...
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <CreateProblemModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadProblems();
                    }}
                />
            )}
        </div>
    );
}

export default ProblemList;
