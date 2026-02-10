import logo from './logo.svg';
import './App.css';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Login from './pages/Login';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Login />
      <Footer />
    </div>
  );
}

export default App;
