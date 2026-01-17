import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import UserList from './components/UserList'; 
import ClassList from './components/ClassList';
import SubjectList from './components/SubjectList';
import ScheduleList from './components/ScheduleList';
import PointsList from './components/PointsList';
import AttendanceList from './components/AttendanceList';
import Settings from './components/Settings';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserList />} />
            <Route path="students" element={<StudentList />} />
            <Route path="classes" element={<ClassList />} />
            <Route path="subjects" element={<SubjectList />} />
            <Route path="schedule" element={<ScheduleList />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="points" element={<PointsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
