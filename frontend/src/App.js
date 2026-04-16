import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SymptomChecker from './pages/SymptomChecker';
import DiseaseDetail from './pages/DiseaseDetail';
import MedicineDetail from './pages/MedicineDetail';
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

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/diseases/:slug" element={<DiseaseDetail />} />
        <Route path="/medicines/:slug" element={<MedicineDetail />} />
        <Route path="/appointments" element={<BookAppointment />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/doc-dashboard" element={<DoctorDashboard />} />
        <Route path="/patients" element={<DoctorPatients />} />
        <Route path="/schedule" element={<DoctorSchedule />} />
        <Route path="/upload" element={<ReportUpload />} />
        <Route path="/analysis/:id" element={<ReportAnalysis />} />
        <Route path="/analysis" element={<ReportAnalysis />} />
        <Route path="/doctors" element={<DoctorListing />} />
        <Route path="/my-appointments" element={<AppointmentHistory />} />
        <Route path="/profile" element={<UserProfile />} />

        <Route path="*" element={<div style={{textAlign:'center', padding:'50px'}}>404 - Page Not Found</div>} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;