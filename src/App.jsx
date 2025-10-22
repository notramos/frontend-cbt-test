import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Test from "./pages/Test";
import Results from "./pages/Results";
import Review from "./pages/Review";
import Navbar from "./components/Navbar";
import LoginModal from "./components/LoginModal";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AppContent = () => {
  const { showLogin, setShowLogin } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test/:examId" element={<Test />} />
        <Route path="/result/:sessionId" element={<Results />} />
        <Route path="/review/:sessionId" element={<Review />} />
      </Routes>
      {showLogin && <LoginModal />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
