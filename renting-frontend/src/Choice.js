import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Choice.css";

function Choice() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <div className="choice-container">
      <div className="renter" onClick={() => navigate("/renter")}>
        Renter
      </div>
      <div className="seller" onClick={() => navigate("/seller")}>
        Seller
      </div>
    </div>
  );
}

export default Choice;
