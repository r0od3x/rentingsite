import { useEffect, useState } from "react";
import "./Seller.css";

function Seller() {
  const email = localStorage.getItem("email");

  /* =======================
     STATE
  ======================= */
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

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
      `https://localhost:7179/api/property/seller/${email}`
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
      ? `https://localhost:7179/api/property/${formData.Id}`
      : "https://localhost:7179/api/property/add";

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

    setShowForm(false);
    fetchProperties();
  };

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property permanently?")) return;
    await fetch(`https://localhost:7179/api/property/${id}`, {
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
  return (
    <div className="seller-site">
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
                  backgroundImage: `url(https://picsum.photos/600/400?random=${p.Id})`,
                }}
              ></div>

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

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <p>© 2025 Renting Platform — Seller Portal</p>
      </footer>
    </div>
  );
}

export default Seller;
