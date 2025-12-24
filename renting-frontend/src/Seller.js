import { useEffect, useState } from "react";
import "./Seller.css";
import { useNavigate } from "react-router-dom";


function Seller() {
  const email = localStorage.getItem("email");

  /* =======================
     STATE
  ======================= */
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [propertyImages, setPropertyImages] = useState({});




  const emptyForm = {
    Id: "",
    description: "",
    propertyType: "",
    maxPerson: 1,
    pricePerNight: "",
    rentalStatus: "Available",
    sellerEmail: email,
  };

  const [formData, setFormData] = useState(emptyForm);

  /* =======================
     API
  ======================= */
  const fetchProperties = async () => {
    const res = await fetch(
      `http://localhost:5062/api/property/seller/${email}`
    );
    const data = await res.json();
    setProperties(data);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  /* =======================
     FORM LOGIC
  ======================= */
  const openAddForm = () => {
    setEditing(false);
    setFormData(emptyForm);
    setShowForm(true);
  };


  const fetchAllImages = async (props) => {
    if (!Array.isArray(props)) return; // 🛡️ safety

    const map = {};

    for (const p of props) {
      if (!p?.Id) continue;

      const res = await fetch(
        `http://localhost:5062/api/image/property/${p.Id}`
      );
      const imgs = await res.json();
      map[p.Id] = imgs;
    }

    setPropertyImages(map);
  };


 useEffect(() => {
   fetchAllImages(properties);
 }, [properties]);


  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });


  const openEditForm = (property) => {
    setEditing(true);
    setFormData({ ...property });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitForm = async (e) => {
    e.preventDefault();

    const url = editing
      ? `http://localhost:5062/api/property/${formData.Id}`
      : "http://localhost:5062/api/property/add";

    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Something went wrong");
      return;
    }

    // ✅ GET PROPERTY ID SAFELY
    const propertyId = data.id || data._id || data.Id || formData.Id;

    if (!propertyId) {
      console.error("❌ PROPERTY ID NOT FOUND", data);
      alert("Property saved but ID missing");
      return;
    }

    // ✅ UPLOAD IMAGES
    for (const file of imageFiles) {
      const base64 = await fileToBase64(file);

      await fetch("http://localhost:5062/api/image/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId,
          imageBase64: base64,
        }),
      });
    }

    setImageFiles([]);
    setShowForm(false);
    fetchProperties();
  };


  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property permanently?")) return;
    await fetch(`http://localhost:5062/api/property/${id}`, {
      method: "DELETE",
    });
    fetchProperties();
  };

  /* =======================
     STATS
  ======================= */
  const totalEarnings = properties.reduce(
    (sum, p) => sum + p.pricePerNight * 12,
    0
  );

  const rentedCount = properties.filter(
    (p) => p.rentalStatus === "Rented"
  ).length;

  /* =======================
     RENDER
  ======================= */
  const fetchNotifications = async () => {
    const res = await fetch(
      `http://localhost:5062/api/notifications/seller/${email}`
    );
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    fetchProperties();
    fetchNotifications();
  }, []);

  return (
    <div className="seller-site">
      <button className="go-renter-btn" onClick={() => navigate("/renter")}>
        ← Go to Renter
      </button>

      {/* 🔔 Notification Bell */}
      <div
        className="notification-bell"
        onClick={() => setShowNotifications(true)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </div>

      {/* ================= HERO ================= */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Your Properties, Elevated</h1>
          <p>
            A premium platform to manage, showcase and grow your rental
            portfolio.
          </p>

          <button className="primary-btn" onClick={openAddForm}>
            Add New Property
          </button>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section className="about-section">
        <div className="about-text">
          <h2>Designed for Modern Sellers</h2>
          <p>
            Manage listings, track income, and present your properties with a
            professional aesthetic trusted by premium hosts.
          </p>
        </div>
        <div className="about-image"></div>
      </section>

      {/* ================= STATS ================= */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>{properties.length}</h3>
          <span>Total Properties</span>
        </div>
        <div className="stat-card">
          <h3>{rentedCount}</h3>
          <span>Currently Rented</span>
        </div>
        <div className="stat-card">
          <h3>${totalEarnings}</h3>
          <span>Estimated Annual Earnings</span>
        </div>
      </section>

      {/* ================= PROPERTIES ================= */}
      <section className="properties-section">
        <h2>Your Listings</h2>

        <div className="property-grid">
          {properties.map((p) => (
            <div className="property-card" key={p.Id}>
              <div
                className="property-image"
                style={{
                  backgroundImage: propertyImages[p.Id]?.length
                    ? `url(${propertyImages[p.Id][0].imageBase64})`
                    : "none",
                }}
              >
                {!propertyImages[p.Id]?.length && <span>No Image</span>}
              </div>

              <div className="property-info">
                <h3>{p.description}</h3>
                <p className="type">{p.propertyType}</p>
                <p className="price">${p.pricePerNight} / night</p>
                <p className={`status ${p.rentalStatus.toLowerCase()}`}>
                  {p.rentalStatus}
                </p>

                <div className="property-actions">
                  <button onClick={() => openEditForm(p)}>Edit</button>
                  <button
                    className="danger"
                    onClick={() => deleteProperty(p.Id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MODAL ================= */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>{editing ? "Edit Property" : "Add Property"}</h2>

            <form onSubmit={submitForm}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles([...e.target.files])}
              />

              <input
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
              />
              <input
                name="propertyType"
                placeholder="Property Type"
                value={formData.propertyType}
                onChange={handleChange}
              />
              <input
                type="number"
                name="maxPerson"
                value={formData.maxPerson}
                onChange={handleChange}
              />
              <input
                type="number"
                name="pricePerNight"
                value={formData.pricePerNight}
                onChange={handleChange}
              />
              <select
                name="rentalStatus"
                value={formData.rentalStatus}
                onChange={handleChange}
              >
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
              </select>

              <div className="form-buttons">
                <button className="primary-btn">Save</button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="secondary-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showNotifications && (
        <div
          className="notification-overlay"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="notification-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-header">
              <h3>Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>✕</button>
            </div>

            <div className="notification-body">
              {notifications.length === 0 ? (
                <p className="empty">No notifications yet</p>
              ) : (
                notifications.map((n, index) => (
                  <div className="notification-card" key={index}>
                    <p>{n.text}</p>
                    <span>{new Date(n.date).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <p>© 2025 Renting Platform — Seller Portal</p>
      </footer>
    </div>
  );
}

export default Seller;
