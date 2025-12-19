import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("email");
    if (!token) {
      navigate("/login");
    } else {
      setEmail(userEmail || "User");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="container mt-5 text-center">
      <h1 className="mb-4">Welcome back, {email}!</h1>
      <p>You are successfully logged in.</p>
      <button className="btn btn-danger mt-3" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

export default Home;
