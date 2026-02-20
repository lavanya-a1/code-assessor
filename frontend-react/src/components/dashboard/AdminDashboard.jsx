import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, dashboardAPI, problemsAPI } from '../../services/api';
import './AdminDashboard.css';

/* ─── Main Component ───────────────────────────────────────────────────────── */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // ── Global state ──
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview'); // overview | courses | faculty | students
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ── Courses state ──
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionProblems, setSessionProblems] = useState([]);
    const [sessionLesson, setSessionLesson] = useState(null);
    const [allProblems, setAllProblems] = useState([]);
    const [courseView, setCourseView] = useState('list'); // list | sessions | session-detail

    // ── User management state ──
    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState(''); // '' | 'faculty' | 'student'

    // ── Modal state ──
    const [modal, setModal] = useState(null); // null | 'create-course' | 'create-session' | 'add-problem' | 'edit-lesson' | 'create-user'
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // ── Toast ──
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    /* ── Fetch helpers ── */
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getStats();
            setStats(data);
        } catch {
            showToast('Failed to load stats', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getCourses();
            setCourses(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load courses', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async (role) => {
        try {
            setLoading(true);
            const data = await adminAPI.getUsers(role || undefined);
            setUsers(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSessions = useCallback(async (courseId) => {
        try {
            const data = await adminAPI.getCourseSessions(courseId);
            setSessions(data.sessions || []);
        } catch {
            showToast('Failed to load sessions', 'error');
        }
    }, []);

    const fetchSessionDetail = useCallback(async (courseId, session) => {
        setSelectedSession(session);
        setSessionProblems([]);
        setSessionLesson(null);
        if (session.session_type === 'lab') {
            try {
                const ps = await adminAPI.getSessionProblems(courseId, session.id);
                setSessionProblems(Array.isArray(ps) ? ps : []);
            } catch { /* no problems yet */ }
        } else {
            try {
                const lesson = await adminAPI.getSessionLesson(courseId, session.id);
                setSessionLesson(lesson);
            } catch { /* no lesson yet */ }
        }
    }, []);

    /* ── Section effects ── */
    useEffect(() => {
        if (activeSection === 'overview') fetchStats();
        else if (activeSection === 'courses') { fetchCourses(); setCourseView('list'); setSelectedCourse(null); setSelectedSession(null); }
        else if (activeSection === 'faculty') { setUserFilter('faculty'); fetchUsers('faculty'); }
        else if (activeSection === 'students') { setUserFilter('student'); fetchUsers('student'); }
    }, [activeSection]);

    /* ── Course drill-down ── */
    const openCourseSessions = async (course) => {
        setSelectedCourse(course);
        await fetchSessions(course.id);
        setCourseView('sessions');
    };

    const openSessionDetail = async (session) => {
        await fetchSessionDetail(selectedCourse.id, session);
        setCourseView('session-detail');
    };

    /* ── Form Handlers ── */
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        setFormLoading(true); setFormError('');
        try {
            await adminAPI.createCourse({
                course_code: data.course_code,
                course_name: data.course_name,
                course_type: data.course_type,
                credits: parseInt(data.credits) || 3,
                semester_id: parseInt(data.semester_id) || 1,
                branch_id: parseInt(data.branch_id) || 1,
            });
            setModal(null);
            showToast('Course created!');
            fetchCourses();
        } catch (err) {
            setFormError(err.message);
        } finally { setFormLoading(false); }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        setFormLoading(true); setFormError('');
        try {
            await adminAPI.createSession(selectedCourse.id, {
                title: data.title,
                description: data.description,
                week_number: parseInt(data.week_number) || 1,
                order_index: parseInt(data.order_index) || 0,
            });
            setModal(null);
            showToast('Session created!');
            fetchSessions(selectedCourse.id);
        } catch (err) {
            setFormError(err.message);
        } finally { setFormLoading(false); }
    };

    const handleDeleteSession = async (session) => {
        if (!window.confirm(`Delete session "${session.title}"?`)) return;
        try {
            await adminAPI.deleteSession(selectedCourse.id, session.id);
            showToast('Session deleted');
            fetchSessions(selectedCourse.id);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleAddProblem = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        setFormLoading(true); setFormError('');
        try {
            await adminAPI.addProblemToSession(selectedCourse.id, selectedSession.id, {
                problem_id: parseInt(data.problem_id),
                order_index: parseInt(data.order_index) || 0,
            });
            setModal(null);
            showToast('Problem added!');
            fetchSessionDetail(selectedCourse.id, selectedSession);
        } catch (err) {
            setFormError(err.message);
        } finally { setFormLoading(false); }
    };

    const handleRemoveProblem = async (problemId) => {
        if (!window.confirm('Remove this problem from the session?')) return;
        try {
            await adminAPI.removeProblemFromSession(selectedCourse.id, selectedSession.id, problemId);
            showToast('Problem removed');
            fetchSessionDetail(selectedCourse.id, selectedSession);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        setFormLoading(true); setFormError('');
        try {
            await adminAPI.updateSessionLesson(selectedCourse.id, selectedSession.id, {
                title: data.title,
                description: data.description,
                content: data.content,
                week_number: parseInt(data.week_number) || 1,
            });
            setModal(null);
            showToast('Lesson saved!');
            fetchSessionDetail(selectedCourse.id, selectedSession);
        } catch (err) {
            setFormError(err.message);
        } finally { setFormLoading(false); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        setFormLoading(true); setFormError('');
        try {
            await adminAPI.createUser({
                username: data.username,
                email: data.email,
                password: data.password,
                role: data.role,
                branch_id: data.branch_id ? parseInt(data.branch_id) : undefined,
                phone: data.phone || '',
            });
            setModal(null);
            showToast('User created!');
            fetchUsers(userFilter);
        } catch (err) {
            setFormError(err.message);
        } finally { setFormLoading(false); }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await adminAPI.downloadTemplate(userFilter);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${userFilter}_import_template.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Failed to download template', 'error');
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const res = await adminAPI.importUsers(userFilter, file);
            showToast(res.message);
            if (res.errors && res.errors.length > 0) {
                console.warn('Import warnings:', res.errors);
            }
            fetchUsers(userFilter);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleToggleUser = async (userId) => {
        try {
            const res = await adminAPI.toggleUser(userId);
            showToast(`User ${res.is_active ? 'activated' : 'deactivated'}`);
            fetchUsers(userFilter);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const openAddProblemModal = async () => {
        try {
            const ps = await adminAPI.getAllProblems();
            setAllProblems(Array.isArray(ps) ? ps : []);
        } catch { setAllProblems([]); }
        setModal('add-problem');
    };

    /* ─── Render ─────────────────────────────────────────────────────────────── */
    return (
        <div className={`ad-layout ${sidebarOpen ? '' : 'ad-sidebar-collapsed'}`}>
            {/* ── Toast ── */}
            {toast && (
                <div className={`ad-toast ad-toast-${toast.type}`}>
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    {toast.msg}
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside className="ad-sidebar">
                <div className="ad-sidebar-brand">
                    <div className="ad-brand-icon"><span>&lt;/&gt;</span></div>
                    {sidebarOpen && <span className="ad-brand-name">Admin Panel</span>}
                </div>

                <nav className="ad-sidebar-nav">
                    {[
                        { id: 'overview', icon: <GridIcon />, label: 'Overview' },
                        { id: 'courses', icon: <BookIcon />, label: 'Courses' },
                        { id: 'faculty', icon: <TeachIcon />, label: 'Faculty' },
                        { id: 'students', icon: <GradIcon />, label: 'Students' },
                    ].map(item => (
                        <button
                            key={item.id}
                            id={`ad-nav-${item.id}`}
                            className={`ad-nav-item ${activeSection === item.id ? 'ad-active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                            title={item.label}
                        >
                            <span className="ad-nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="ad-nav-label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <button className="ad-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
                    {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>

                <button className="ad-logout-btn" onClick={handleLogout} title="Logout">
                    <LogoutIcon />
                    {sidebarOpen && <span>Logout</span>}
                </button>
            </aside>

            {/* ── Main ── */}
            <main className="ad-main">
                {/* Topbar */}
                <header className="ad-topbar">
                    <div className="ad-topbar-title">
                        <h1>
                            {activeSection === 'overview' && 'Dashboard Overview'}
                            {activeSection === 'courses' && (
                                courseView === 'list' ? 'Courses' :
                                    courseView === 'sessions' ? `${selectedCourse?.course_name} — Sessions` :
                                        `${selectedCourse?.course_name} › ${selectedSession?.title}`
                            )}
                            {activeSection === 'faculty' && 'Faculty Management'}
                            {activeSection === 'students' && 'Students Management'}
                        </h1>
                        {/* Breadcumb for courses drill-down */}
                        {activeSection === 'courses' && courseView !== 'list' && (
                            <div className="ad-breadcrumb">
                                <button onClick={() => { setCourseView('list'); setSelectedCourse(null); setSelectedSession(null); }}>
                                    Courses
                                </button>
                                {courseView !== 'list' && (
                                    <>
                                        <span>/</span>
                                        <button onClick={() => { setCourseView('sessions'); setSelectedSession(null); }}>
                                            {selectedCourse?.course_name}
                                        </button>
                                    </>
                                )}
                                {courseView === 'session-detail' && (
                                    <>
                                        <span>/</span>
                                        <span>{selectedSession?.title}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="ad-topbar-right">
                        <div className="ad-user-chip">
                            <div className="ad-user-avatar">{(user?.username || 'A')[0].toUpperCase()}</div>
                            <div className="ad-user-info">
                                <span className="ad-user-name">{user?.username || 'Admin'}</span>
                                <span className="ad-user-role">Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="ad-content">
                    {loading && (
                        <div className="ad-loading">
                            <div className="ad-spinner" />
                            <span>Loading...</span>
                        </div>
                    )}

                    {/* ── Overview ── */}
                    {!loading && activeSection === 'overview' && (
                        <OverviewSection stats={stats} onNavigate={setActiveSection} />
                    )}

                    {/* ── Courses ── */}
                    {!loading && activeSection === 'courses' && courseView === 'list' && (
                        <CoursesListView
                            courses={courses}
                            onOpen={openCourseSessions}
                            onCreate={() => { setFormError(''); setModal('create-course'); }}
                        />
                    )}
                    {!loading && activeSection === 'courses' && courseView === 'sessions' && selectedCourse && (
                        <SessionsView
                            course={selectedCourse}
                            sessions={sessions}
                            onOpenSession={openSessionDetail}
                            onDeleteSession={handleDeleteSession}
                            onCreateSession={() => { setFormError(''); setModal('create-session'); }}
                        />
                    )}
                    {!loading && activeSection === 'courses' && courseView === 'session-detail' && selectedSession && (
                        <SessionDetailView
                            course={selectedCourse}
                            session={selectedSession}
                            problems={sessionProblems}
                            lesson={sessionLesson}
                            onAddProblem={openAddProblemModal}
                            onRemoveProblem={handleRemoveProblem}
                            onEditLesson={() => { setFormError(''); setModal('edit-lesson'); }}
                        />
                    )}

                    {/* ── Faculty / Students ── */}
                    {!loading && (activeSection === 'faculty' || activeSection === 'students') && (
                        <UsersView
                            users={users}
                            role={userFilter}
                            onToggle={handleToggleUser}
                            onCreate={() => { setFormError(''); setModal('create-user'); }}
                            onDownloadTemplate={handleDownloadTemplate}
                            onImportCSV={handleImportCSV}
                        />
                    )}
                </div>
            </main>

            {/* ── Modals ── */}
            {modal && (
                <div className="ad-modal-overlay" onClick={() => setModal(null)}>
                    <div className="ad-modal" onClick={e => e.stopPropagation()}>
                        <button className="ad-modal-close" onClick={() => setModal(null)}>✕</button>

                        {modal === 'create-course' && (
                            <CreateCourseModal
                                onSubmit={handleCreateCourse}
                                loading={formLoading}
                                error={formError}
                            />
                        )}
                        {modal === 'create-session' && selectedCourse && (
                            <CreateSessionModal
                                courseType={selectedCourse.course_type}
                                onSubmit={handleCreateSession}
                                loading={formLoading}
                                error={formError}
                            />
                        )}
                        {modal === 'add-problem' && (
                            <AddProblemModal
                                problems={allProblems}
                                onSubmit={handleAddProblem}
                                loading={formLoading}
                                error={formError}
                            />
                        )}
                        {modal === 'edit-lesson' && (
                            <EditLessonModal
                                lesson={sessionLesson}
                                session={selectedSession}
                                onSubmit={handleUpdateLesson}
                                loading={formLoading}
                                error={formError}
                            />
                        )}
                        {modal === 'create-user' && (
                            <CreateUserModal
                                defaultRole={userFilter || 'faculty'}
                                onSubmit={handleCreateUser}
                                loading={formLoading}
                                error={formError}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


/* ─── Section Components ───────────────────────────────────────────────────── */
const OverviewSection = ({ stats, onNavigate }) => (
    <div className="ad-overview">
        <div className="ad-stats-grid">
            <StatCard color="blue" icon={<BookIcon />} value={stats?.total_courses ?? 0} label="Total Courses" sub={`Lab: ${stats?.lab_courses ?? 0} | Theory: ${stats?.theory_courses ?? 0}`} />
            <StatCard color="green" icon={<GradIcon />} value={stats?.total_students ?? 0} label="Students" sub="Enrolled across all sections" />
            <StatCard color="violet" icon={<TeachIcon />} value={stats?.total_faculty ?? 0} label="Faculty" sub="Active instructors" />
            <StatCard color="amber" icon={<CodeIcon />} value={stats?.total_problems ?? 0} label="Problems" sub="In problem bank" />
        </div>

        <div className="ad-quick-actions">
            <h2 className="ad-section-title">Quick Actions</h2>
            <div className="ad-action-grid">
                <QuickAction icon={<BookIcon />} title="Manage Courses" desc="Create courses with lab/theory sessions" color="blue" onClick={() => onNavigate('courses')} />
                <QuickAction icon={<TeachIcon />} title="Manage Faculty" desc="Add or deactivate faculty members" color="violet" onClick={() => onNavigate('faculty')} />
                <QuickAction icon={<GradIcon />} title="Manage Students" desc="View and manage student accounts" color="green" onClick={() => onNavigate('students')} />
            </div>
        </div>
    </div>
);

const CoursesListView = ({ courses, onOpen, onCreate }) => (
    <div className="ad-section">
        <div className="ad-section-header">
            <div>
                <h2 className="ad-section-title">All Courses</h2>
                <p className="ad-section-desc">{courses.length} courses found. Click a course to manage its sessions.</p>
            </div>
            <button id="ad-btn-create-course" className="ad-btn ad-btn-primary" onClick={onCreate}>
                <PlusIcon /> New Course
            </button>
        </div>
        {courses.length === 0 ? (
            <EmptyState icon={<BookIcon />} title="No courses yet" desc="Create your first course to get started." />
        ) : (
            <div className="ad-courses-grid">
                {courses.map(c => (
                    <div key={c.id} className={`ad-course-card ad-course-${c.course_type}`} onClick={() => onOpen(c)}>
                        <div className="ad-course-type-badge">{c.course_type?.toUpperCase()}</div>
                        <div className="ad-course-icon">
                            {c.course_type === 'lab' ? <FlaskIcon /> : <TheoryIcon />}
                        </div>
                        <h3 className="ad-course-name">{c.course_name}</h3>
                        <p className="ad-course-code">{c.course_code}</p>
                        <div className="ad-course-meta">
                            <span>Sem {c.semester_id}</span>
                            <span>{c.credits} Credits</span>
                        </div>
                        <div className="ad-course-arrow"><ChevronRightIcon /></div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const SessionsView = ({ course, sessions, onOpenSession, onDeleteSession, onCreateSession }) => (
    <div className="ad-section">
        <div className="ad-section-header">
            <div>
                <h2 className="ad-section-title">
                    {course.course_type === 'lab' ? 'Lab Topics' : 'Theory Modules'}
                </h2>
                <p className="ad-section-desc">
                    {sessions.length} {course.course_type === 'lab' ? 'lab topics' : 'theory modules'} —
                    {course.course_type === 'lab'
                        ? ' each topic can contain coding problems'
                        : ' each module contains a lesson'}
                </p>
            </div>
            <button id="ad-btn-create-session" className="ad-btn ad-btn-primary" onClick={onCreateSession}>
                <PlusIcon /> {course.course_type === 'lab' ? 'New Lab Topic' : 'New Module'}
            </button>
        </div>
        {sessions.length === 0 ? (
            <EmptyState
                icon={course.course_type === 'lab' ? <FlaskIcon /> : <TheoryIcon />}
                title="No sessions yet"
                desc="Add your first session to this course."
            />
        ) : (
            <div className="ad-sessions-list">
                {sessions.map((s, idx) => (
                    <div key={s.id} className="ad-session-row">
                        <div className="ad-session-num">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="ad-session-icon">
                            {s.session_type === 'lab' ? <FlaskIcon /> : <BookOpenIcon />}
                        </div>
                        <div className="ad-session-info" onClick={() => onOpenSession(s)}>
                            <span className="ad-session-title">{s.title}</span>
                            {s.description && <span className="ad-session-desc">{s.description}</span>}
                            {s.week_number > 0 && <span className="ad-session-week">Week {s.week_number}</span>}
                        </div>
                        <div className="ad-session-actions">
                            <button className="ad-btn ad-btn-ghost" onClick={() => onOpenSession(s)}>
                                {s.session_type === 'lab' ? 'Manage Problems' : 'Edit Lesson'}
                            </button>
                            <button className="ad-btn ad-btn-danger-ghost" onClick={() => onDeleteSession(s)} title="Delete session">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const SessionDetailView = ({ course, session, problems, lesson, onAddProblem, onRemoveProblem, onEditLesson }) => {
    if (session.session_type === 'lab') {
        return (
            <div className="ad-section">
                <div className="ad-section-header">
                    <div>
                        <h2 className="ad-section-title">Problems in "{session.title}"</h2>
                        <p className="ad-section-desc">{problems.length} problem(s) assigned to this lab topic</p>
                    </div>
                    <button id="ad-btn-add-problem" className="ad-btn ad-btn-primary" onClick={onAddProblem}>
                        <PlusIcon /> Add Problem
                    </button>
                </div>
                {problems.length === 0 ? (
                    <EmptyState icon={<CodeIcon />} title="No problems yet" desc="Add problems from the problem bank to this lab session." />
                ) : (
                    <div className="ad-problems-list">
                        {problems.map((p, idx) => (
                            <div key={p.problem_id} className="ad-problem-row">
                                <span className="ad-problem-num">{idx + 1}</span>
                                <div className="ad-problem-info">
                                    <span className="ad-problem-title">{p.title}</span>
                                    <span className={`ad-problem-diff ad-diff-${p.difficulty}`}>{p.difficulty}</span>
                                    {p.tags && <span className="ad-problem-tags">{p.tags}</span>}
                                </div>
                                <button className="ad-btn ad-btn-danger-ghost" onClick={() => onRemoveProblem(p.problem_id)} title="Remove">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="ad-section">
            <div className="ad-section-header">
                <div>
                    <h2 className="ad-section-title">Lesson — {session.title}</h2>
                    {lesson?.week_number > 0 && <p className="ad-section-desc">Week {lesson.week_number}</p>}
                </div>
                <button id="ad-btn-edit-lesson" className="ad-btn ad-btn-primary" onClick={onEditLesson}>
                    <EditIcon /> Edit Lesson
                </button>
            </div>
            <div className="ad-lesson-card">
                {lesson ? (
                    <>
                        <h3 className="ad-lesson-title">{lesson.title}</h3>
                        {lesson.description && <p className="ad-lesson-desc">{lesson.description}</p>}
                        <div className="ad-lesson-content">
                            {lesson.content
                                ? <pre className="ad-lesson-pre">{lesson.content}</pre>
                                : <span className="ad-lesson-empty">No content added yet. Click "Edit Lesson" to add content.</span>
                            }
                        </div>
                    </>
                ) : (
                    <EmptyState icon={<BookOpenIcon />} title="No lesson content" desc='Click "Edit Lesson" to add lesson content.' />
                )}
            </div>
        </div>
    );
};

const UsersView = ({ users, role, onToggle, onCreate, onDownloadTemplate, onImportCSV }) => (
    <div className="ad-section">
        <div className="ad-section-header">
            <div>
                <h2 className="ad-section-title">{role === 'faculty' ? 'Faculty Members' : 'Students'}</h2>
                <p className="ad-section-desc">{users.length} {role === 'faculty' ? 'faculty members' : 'students'} found</p>
            </div>
            <div className="ad-section-actions">
                <button className="ad-btn ad-btn-ghost" onClick={onDownloadTemplate} title="Download CSV Template">
                    <DownloadIcon /> Template
                </button>
                <label className="ad-btn ad-btn-ghost" style={{ cursor: 'pointer' }}>
                    <UploadIcon /> Import CSV
                    <input
                        type="file"
                        accept=".csv"
                        onChange={onImportCSV}
                        style={{ display: 'none' }}
                    />
                </label>
                <button id="ad-btn-create-user" className="ad-btn ad-btn-primary" onClick={onCreate}>
                    <PlusIcon /> Add {role === 'faculty' ? 'Faculty' : 'Student'}
                </button>
            </div>
        </div>
        {users.length === 0 ? (
            <EmptyState icon={role === 'faculty' ? <TeachIcon /> : <GradIcon />} title={`No ${role || 'users'} found`} desc="Add users by clicking the button above or import via CSV." />
        ) : (
            <div className="ad-users-table-wrap">
                <table className="ad-users-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, idx) => (
                            <tr key={u.id} className={!u.is_active ? 'ad-row-inactive' : ''}>
                                <td className="ad-td-num">{idx + 1}</td>
                                <td><div className="ad-user-cell"><div className="ad-user-avatar-sm">{u.username[0].toUpperCase()}</div>{u.username}</div></td>
                                <td>{u.email}</td>
                                <td><span className={`ad-role-badge ad-role-${u.role}`}>{u.role}</span></td>
                                <td>{u.branch_id || '—'}</td>
                                <td>{u.phone || '—'}</td>
                                <td>
                                    <span className={`ad-status-badge ${u.is_active ? 'ad-status-active' : 'ad-status-inactive'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`ad-btn ${u.is_active ? 'ad-btn-danger-ghost' : 'ad-btn-ghost'}`}
                                        onClick={() => onToggle(u.id)}
                                    >
                                        {u.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);


/* ─── Modals ───────────────────────────────────────────────────────────────── */
const CreateCourseModal = ({ onSubmit, loading, error }) => (
    <form className="ad-modal-form" onSubmit={onSubmit}>
        <h2 className="ad-modal-title">Create New Course</h2>
        {error && <div className="ad-form-error">{error}</div>}
        <div className="ad-form-row">
            <div className="ad-form-group">
                <label>Course Code *</label>
                <input name="course_code" placeholder="e.g. CS301" required />
            </div>
            <div className="ad-form-group">
                <label>Credits</label>
                <input name="credits" type="number" defaultValue="3" min="1" max="6" />
            </div>
        </div>
        <div className="ad-form-group">
            <label>Course Name *</label>
            <input name="course_name" placeholder="e.g. Data Structures & Algorithms" required />
        </div>
        <div className="ad-form-row">
            <div className="ad-form-group">
                <label>Course Type *</label>
                <select name="course_type" required>
                    <option value="lab">Lab</option>
                    <option value="theory">Theory</option>
                </select>
            </div>
            <div className="ad-form-group">
                <label>Semester ID *</label>
                <input name="semester_id" type="number" placeholder="1" required min="1" />
            </div>
            <div className="ad-form-group">
                <label>Branch ID *</label>
                <input name="branch_id" type="number" placeholder="1" required min="1" />
            </div>
        </div>
        <button id="ad-submit-course" type="submit" className="ad-btn ad-btn-primary ad-btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Course'}
        </button>
    </form>
);

const CreateSessionModal = ({ courseType, onSubmit, loading, error }) => (
    <form className="ad-modal-form" onSubmit={onSubmit}>
        <h2 className="ad-modal-title">{courseType === 'lab' ? 'Add Lab Topic' : 'Add Theory Module'}</h2>
        {error && <div className="ad-form-error">{error}</div>}
        <div className="ad-form-group">
            <label>{courseType === 'lab' ? 'Topic Title' : 'Module Title'} *</label>
            <input name="title" placeholder={courseType === 'lab' ? 'e.g. Sorting Algorithms' : 'e.g. Week 1: Introduction'} required />
        </div>
        <div className="ad-form-group">
            <label>Description</label>
            <textarea name="description" rows={3} placeholder="Brief description of this session..." />
        </div>
        {courseType === 'theory' && (
            <div className="ad-form-row">
                <div className="ad-form-group">
                    <label>Week Number</label>
                    <input name="week_number" type="number" defaultValue="1" min="1" />
                </div>
                <div className="ad-form-group">
                    <label>Order Index</label>
                    <input name="order_index" type="number" defaultValue="0" min="0" />
                </div>
            </div>
        )}
        {courseType === 'lab' && (
            <div className="ad-form-group">
                <label>Order Index</label>
                <input name="order_index" type="number" defaultValue="0" min="0" />
            </div>
        )}
        <button id="ad-submit-session" type="submit" className="ad-btn ad-btn-primary ad-btn-full" disabled={loading}>
            {loading ? 'Creating...' : `Create ${courseType === 'lab' ? 'Topic' : 'Module'}`}
        </button>
    </form>
);

const AddProblemModal = ({ problems, onSubmit, loading, error }) => (
    <form className="ad-modal-form" onSubmit={onSubmit}>
        <h2 className="ad-modal-title">Add Problem to Session</h2>
        {error && <div className="ad-form-error">{error}</div>}
        <div className="ad-form-group">
            <label>Select Problem *</label>
            <select name="problem_id" required>
                <option value="">— choose a problem —</option>
                {problems.map(p => (
                    <option key={p.id} value={p.id}>[{p.difficulty}] {p.title}</option>
                ))}
            </select>
        </div>
        <div className="ad-form-group">
            <label>Order Index</label>
            <input name="order_index" type="number" defaultValue="0" min="0" />
        </div>
        <button id="ad-submit-add-problem" type="submit" className="ad-btn ad-btn-primary ad-btn-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Problem'}
        </button>
    </form>
);

const EditLessonModal = ({ lesson, session, onSubmit, loading, error }) => (
    <form className="ad-modal-form" onSubmit={onSubmit}>
        <h2 className="ad-modal-title">Edit Lesson — {session?.title}</h2>
        {error && <div className="ad-form-error">{error}</div>}
        <div className="ad-form-group">
            <label>Title *</label>
            <input name="title" defaultValue={lesson?.title || session?.title || ''} required />
        </div>
        <div className="ad-form-group">
            <label>Week Number</label>
            <input name="week_number" type="number" defaultValue={lesson?.week_number || 1} min="1" />
        </div>
        <div className="ad-form-group">
            <label>Description</label>
            <textarea name="description" rows={2} defaultValue={lesson?.description || ''} placeholder="Brief description..." />
        </div>
        <div className="ad-form-group">
            <label>Lesson Content (Markdown supported)</label>
            <textarea name="content" rows={8} defaultValue={lesson?.content || ''} placeholder="Write your lesson content here..." className="ad-content-editor" />
        </div>
        <button id="ad-submit-lesson" type="submit" className="ad-btn ad-btn-primary ad-btn-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Lesson'}
        </button>
    </form>
);

const CreateUserModal = ({ defaultRole, onSubmit, loading, error }) => (
    <form className="ad-modal-form" onSubmit={onSubmit}>
        <h2 className="ad-modal-title">Add User</h2>
        {error && <div className="ad-form-error">{error}</div>}
        <div className="ad-form-row">
            <div className="ad-form-group">
                <label>Username *</label>
                <input name="username" placeholder="e.g. john_doe" required />
            </div>
            <div className="ad-form-group">
                <label>Role *</label>
                <select name="role" defaultValue={defaultRole}>
                    <option value="faculty">Faculty</option>
                    <option value="student">Student</option>
                    <option value="hod">HOD</option>
                </select>
            </div>
        </div>
        <div className="ad-form-group">
            <label>Email *</label>
            <input name="email" type="email" placeholder="user@college.edu" required />
        </div>
        <div className="ad-form-row">
            <div className="ad-form-group">
                <label>Password *</label>
                <input name="password" type="password" placeholder="Min 8 characters" required minLength={6} />
            </div>
            <div className="ad-form-group">
                <label>Phone</label>
                <input name="phone" placeholder="+91 9876543210" />
            </div>
        </div>
        <div className="ad-form-group">
            <label>Branch ID</label>
            <input name="branch_id" type="number" placeholder="Leave blank if not applicable" min="1" />
        </div>
        <button id="ad-submit-user" type="submit" className="ad-btn ad-btn-primary ad-btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
        </button>
    </form>
);


/* ─── Small shared components ──────────────────────────────────────────────── */
const StatCard = ({ color, icon, value, label, sub }) => (
    <div className={`ad-stat-card ad-stat-${color}`}>
        <div className="ad-stat-icon">{icon}</div>
        <div className="ad-stat-body">
            <span className="ad-stat-value">{value}</span>
            <span className="ad-stat-label">{label}</span>
            {sub && <span className="ad-stat-sub">{sub}</span>}
        </div>
    </div>
);

const QuickAction = ({ icon, title, desc, color, onClick }) => (
    <button className={`ad-quick-action ad-qa-${color}`} onClick={onClick}>
        <div className="ad-qa-icon">{icon}</div>
        <div className="ad-qa-text">
            <span className="ad-qa-title">{title}</span>
            <span className="ad-qa-desc">{desc}</span>
        </div>
        <ChevronRightIcon />
    </button>
);

const EmptyState = ({ icon, title, desc }) => (
    <div className="ad-empty">
        <div className="ad-empty-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
    </div>
);

/* ─── Icons ────────────────────────────────────────────────────────────────── */
const GridIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);
const BookIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const BookOpenIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);
const TeachIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const GradIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);
const CodeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
);
const FlaskIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6l1 9H8L9 3z" /><path d="M6.5 12.5c-1.5 2-2.5 3.5-2.5 5a5 5 0 0 0 10 0c0-1.5-1-3-2.5-5" />
        <line x1="9" y1="3" x2="9" y2="12" /><line x1="15" y1="3" x2="15" y2="12" />
    </svg>
);
const TheoryIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export default AdminDashboard;
