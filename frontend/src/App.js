import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SymptomChecker from './pages/SymptomChecker';
import DiseaseDetail from './pages/DiseaseDetail';
import DiseaseListing from './pages/DiseaseListing';
import MedicineDetail from './pages/MedicineDetail';
import MedicineListing from './pages/MedicineListing';
import BookAppointment from './pages/BookAppointment';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatients from './pages/DoctorPatients';
import DoctorSchedule from './pages/DoctorSchedule';
import ReportUpload from './pages/ReportUpload';
import ReportAnalysis from './pages/ReportAnalysis';
import DoctorListing from './pages/DoctorListing';
import AppointmentHistory from './pages/AppointmentHistory';
import UserProfile from './pages/UserProfile';
import AIAssistant from './pages/AIAssistant';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminContent from './pages/admin/AdminContent';
import AdminAppointments from './pages/admin/AdminAppointments';

function App() {
  const location = useLocation();

  // Hide Navbar & Footer on auth pages for full-screen experience
  const authPages = ['/login', '/signup'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <div className="App">
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/diseases" element={<DiseaseListing />} />
        <Route path="/diseases/:slug" element={<DiseaseDetail />} />
        <Route path="/medicines" element={<MedicineListing />} />
        <Route path="/medicines/:slug" element={<MedicineDetail />} />
        <Route path="/appointments" element={<BookAppointment />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/doc-dashboard" element={<DoctorDashboard />} />
        <Route path="/patients" element={<DoctorPatients />} />
        <Route path="/schedule" element={<DoctorSchedule />} />
        <Route path="/doc_schedule" element={<DoctorSchedule />} />
        <Route path="/doc-schedule" element={<DoctorSchedule />} />
        <Route path="/upload" element={<ReportUpload />} />
        <Route path="/reports" element={<ReportUpload />} />
        <Route path="/analysis/:id" element={<ReportAnalysis />} />
        <Route path="/analysis" element={<ReportAnalysis />} />
        <Route path="/doctors" element={<DoctorListing />} />
        <Route path="/my-appointments" element={<AppointmentHistory />} />
        <Route path="/profile" element={<UserProfile />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;