import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes
import './App.css';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SymptomChecker from './pages/SymptomChecker';
import DiseaseDetail from './pages/DiseaseDetail';
import MedicineDetail from './pages/MedicineDetail';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/diseases/influenza" element={<DiseaseDetail />} />
        <Route path="/medicines/paracetamol" element={<MedicineDetail />} />

        <Route path="*" element={<div style={{textAlign:'center', padding:'50px'}}>404 - Page Not Found</div>} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;