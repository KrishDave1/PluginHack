import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Video from "./pages/Video";
import Home from "./pages/Home";
import Navbar from "./components/Navbar.jsx";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import PDF from "./pages/PDF";
import VidAud from "./pages/VidAud";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <Routes>
          <Route path="/video" element={<Video />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/take-assessment" element={<Assessment />} />
          <Route path="/pdf" element={<PDF />} />
          <Route path="/vidaud" element={<VidAud />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
