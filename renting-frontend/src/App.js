import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Choice from "./Choice";
import Seller from "./Seller";
import Renter from "./Renter"; // ✅ IMPORT RENTER

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Role choice */}
        <Route path="/choice" element={<Choice />} />
        {/* Main pages */}
        <Route path="/seller" element={<Seller />} />
        <Route path="/renter" element={<Renter />} /> {/* ✅ REAL PAGE */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
