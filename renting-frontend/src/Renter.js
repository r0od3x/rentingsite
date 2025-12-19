import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Renter.css";

/*
=========================================================
RENTER PAGE – DEBUG-FIRST, MODAL-SAFE, BACKEND-COMPATIBLE
=========================================================
*/

function Renter() {
  const navigate = useNavigate();
  const renterEmail = localStorage.getItem("email");

  /* ===================== STATE ===================== */

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);

  const [rentForm, setRentForm] = useState({
    startTime: "",
    endTime: "",
    numberOfPeople: 1,
  });

  const [totalPrice, setTotalPrice] = useState(0);

  /* ===================== FETCH PROPERTIES ===================== */

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("https://localhost:7179/api/property");
      const data = await res.json();

      console.log("📦 PROPERTIES FROM BACKEND:", data);

      setProperties(data);
      setFilteredProperties(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      setLoading(false);
    }
  };

  /* ===================== SEARCH ===================== */

  useEffect(() => {
    const result = properties.filter((p) =>
      p.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProperties(result);
  }, [search, properties]);

  /* ===================== PRICE CALC ===================== */

  useEffect(() => {
    if (rentForm.startTime && rentForm.endTime && selectedProperty) {
      const start = new Date(rentForm.startTime);
      const end = new Date(rentForm.endTime);
      const days = (end - start) / (1000 * 60 * 60 * 24);

      if (days > 0) {
        setTotalPrice(days * selectedProperty.pricePerNight);
      } else {
        setTotalPrice(0);
      }
    }
  }, [rentForm, selectedProperty]);

  /* ===================== MODAL HANDLERS ===================== */

  const openDetails = (property) => {
    console.log("🟢 SELECTED PROPERTY:", property);
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedProperty(null);
    setShowRentModal(false);
  };

  const openRent = () => {
    setShowRentModal(true);
  };

  const closeRent = () => {
    setShowRentModal(false);
  };

  /* ===================== RENT SUBMIT (DEBUG) ===================== */

  const submitRent = async () => {
    if (!rentForm.startTime || !rentForm.endTime) {
      alert("Please select start and end dates");
      return;
    }

    // 🔥 IMPORTANT: handle ALL possible id names
    const propertyId =
      selectedProperty?.id || selectedProperty?._id || selectedProperty?.Id;

    const payload = {
      propertyId: propertyId,
      renterEmail: renterEmail,
      sellerEmail: selectedProperty?.sellerEmail,
      startTime: rentForm.startTime,
      endTime: rentForm.endTime,
      numberOfPeople: rentForm.numberOfPeople,
      totalPrice: totalPrice,
    };

    /* ===================== CONSOLE DEBUG ===================== */
    console.log("======================================");
    console.log("🚨 RENT REQUEST PAYLOAD SENT TO BACKEND");
    console.log(payload);
    console.log("======================================");

    // ❌ STOP if ID is missing
    if (!payload.propertyId) {
      alert("❌ Property ID is undefined. Check console.");
      return;
    }

    try {
      const res = await fetch("https://localhost:7179/api/rental/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("🧾 RENT RESPONSE:", data);

      if (res.ok) {
        alert("✅ Property rented successfully!");
        closeDetails();
      } else {
        alert(data.message || "❌ Rental failed (400)");
      }
    } catch (err) {
      console.error("❌ SERVER ERROR:", err);
      alert("Server error");
    }
  };

  /* ===================== LOADING ===================== */

  if (loading) {
    return <div className="loading">Loading properties...</div>;
  }

  /* ===================== RENDER ===================== */

  return (
    <div className="renter-page">
      {/* ============ NAVBAR ============ */}
      <header className="renter-navbar">
        <h1>Renting</h1>
        <nav>
          <button onClick={() => navigate("/seller")}>Seller</button>
          <button onClick={() => navigate("/login")}>Logout</button>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section className="renter-hero">
        <div className="hero-left">
          <span className="hero-label">PREMIUM RENTALS</span>
          <h1>
            Find Your <span>Perfect Stay</span>
          </h1>
          <p>
            Discover curated apartments & houses designed for comfort, elegance,
            and unforgettable experiences.
          </p>

          <div className="hero-search">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="hero-right">
          <img src="https://picsum.photos/1200/900?blur=2" alt="hero" />
        </div>
      </section>

      {/* ============ GRID ============ */}
      <section className="renter-content">
        <div className="property-grid">
          {filteredProperties.map((p) => (
            <div
              className="property-card"
              key={p.id || p._id}
              onClick={() => openDetails(p)}
            >
              <div className="image-wrapper">
                <img
                  src={`https://picsum.photos/600/400?random=${p.id || p._id}`}
                  alt=""
                />
              </div>
              <div className="card-info">
                <h3>{p.description}</h3>
                <p className="type">{p.propertyType}</p>
                <p className="price">${p.pricePerNight} / night</p>
                <span className="status available">Available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DETAILS MODAL ============ */}
      {showDetailsModal && selectedProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <img
              src={`https://picsum.photos/900/500?random=${
                selectedProperty.id || selectedProperty._id
              }`}
              alt=""
            />
            <div className="modal-details">
              <h2>{selectedProperty.description}</h2>
              <p>Type: {selectedProperty.propertyType}</p>
              <p>Max persons: {selectedProperty.maxPerson}</p>
              <p>Price: ${selectedProperty.pricePerNight} / night</p>

              <button className="rent-btn" onClick={openRent}>
                Rent this property
              </button>

              <button className="close-btn" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ RENT MODAL ============ */}
      {showRentModal && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-details">
              <h2>Confirm Rental</h2>

              <label>Start Date</label>
              <input
                type="date"
                onChange={(e) =>
                  setRentForm({ ...rentForm, startTime: e.target.value })
                }
              />

              <label>End Date</label>
              <input
                type="date"
                onChange={(e) =>
                  setRentForm({ ...rentForm, endTime: e.target.value })
                }
              />

              <label>Number of People</label>
              <input
                type="number"
                min="1"
                value={rentForm.numberOfPeople}
                onChange={(e) =>
                  setRentForm({
                    ...rentForm,
                    numberOfPeople: Number(e.target.value),
                  })
                }
              />

              <p className="price-preview">
                Total: <strong>${totalPrice}</strong>
              </p>

              <button className="confirm-btn" onClick={submitRent}>
                Confirm Rent
              </button>

              <button className="close-btn" onClick={closeRent}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Renter;
