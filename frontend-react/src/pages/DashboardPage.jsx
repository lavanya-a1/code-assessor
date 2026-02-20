import { useState } from 'react';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import FacultyDashboard from '../components/dashboard/FacultyDashboard';
import TeacherAnalytics from '../components/dashboard/TeacherAnalytics';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import HodDashboard from '../components/dashboard/HodDashboard';
import PrincipalDashboard from '../components/dashboard/PrincipalDashboard';

import { useAuth } from '../context/AuthContext';

function DashboardPage() {
    const { user } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState(null);

    // If user is faculty and a course is selected, show analytics
    if (user?.role === 'faculty' && selectedCourse) {
        return (
            <div className="main-container">
                <TeacherAnalytics
                    course={selectedCourse}
                    onBack={() => setSelectedCourse(null)}
                />
            </div>
        );
    }

    const renderDashboard = () => {
        switch (user?.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'faculty':
                return <FacultyDashboard onSelectCourse={(course) => setSelectedCourse(course)} />;
            case 'hod':
                return <HodDashboard />;
            case 'principal':
                return <PrincipalDashboard />;
            default:
                return <StudentDashboard />;
        }
    };

    return (
        <div className="main-container">
            {renderDashboard()}
        </div>
    );
}


export default DashboardPage;
