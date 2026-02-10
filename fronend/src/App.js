import logo from './logo.svg';
import './App.css';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Signup />
      <Footer />
    </div>
  );
}

export default App;
