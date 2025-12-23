import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Redirect if not admin
  useEffect(() => {
    if (role !== "admin") {
      alert("Access denied. Admins only.");
      navigate("/login");
    }
  }, [role, navigate]);

  // Fetch data on load
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchStats(), fetchUsers(), fetchProperties(), fetchRentals()]);
    setLoading(false);
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ==================== FETCH ====================

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5062/api/admin/stats", {
        headers: authHeaders,
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5062/api/admin/users", {
        headers: authHeaders,
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Users error:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("http://localhost:5062/api/admin/properties", {
        headers: authHeaders,
      });
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error("Properties error:", err);
    }
  };

  const fetchRentals = async () => {
    try {
      const res = await fetch("http://localhost:5062/api/admin/rentals", {
        headers: authHeaders,
      });
      const data = await res.json();
      setRentals(data);
    } catch (err) {
      console.error("Rentals error:", err);
    }
  };

  // ==================== USER ACTIONS ====================

  const banUser = async (id) => {
    if (!window.confirm("Ban this user?")) return;
    try {
      const res = await fetch(`http://localhost:5062/api/admin/users/${id}/ban`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      alert(data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Error banning user");
    }
  };

  const unbanUser = async (id) => {
    try {
      const res = await fetch(`http://localhost:5062/api/admin/users/${id}/unban`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      alert(data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Error unbanning user");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      const res = await fetch(`http://localhost:5062/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      alert(data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Error deleting user");
    }
  };

  // ==================== PROPERTY ACTIONS ====================

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try {
      const res = await fetch(`http://localhost:5062/api/admin/properties/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      alert(data.message);
      fetchProperties();
      fetchStats();
    } catch (err) {
      alert("Error deleting property");
    }
  };

  // ==================== LOGOUT ====================

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ==================== RENDER ====================

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-page">
      {/* Navbar */}
      <header className="admin-navbar">
        <h1>
          Renting <span>Admin</span>
        </h1>
        <nav>
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={activeTab === "properties" ? "active" : ""}
            onClick={() => setActiveTab("properties")}
          >
            Properties
          </button>
          <button
            className={activeTab === "rentals" ? "active" : ""}
            onClick={() => setActiveTab("rentals")}
          >
            Rentals
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="admin-hero">
        <h2>Welcome back, Admin</h2>
        <p>Manage users, properties, and rentals from your dashboard.</p>
      </section>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <>
          <section className="stats-section">
            <div className="stat-card">
              <h3>{stats.totalUsers || 0}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-card danger">
              <h3>{stats.bannedUsers || 0}</h3>
              <p>Banned Users</p>
            </div>
            <div className="stat-card gold">
              <h3>{stats.totalProperties || 0}</h3>
              <p>Properties</p>
            </div>
            <div className="stat-card success">
              <h3>{stats.totalRentals || 0}</h3>
              <p>Total Rentals</p>
            </div>
          </section>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <section className="admin-content">
          <h2>Users Management</h2>
          {users.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>Users will appear here once they register.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.isBanned ? "banned" : ""}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isBanned ? "banned" : "active"}`}>
                        {user.isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      {user.role !== "admin" && (
                        <>
                          {user.isBanned ? (
                            <button
                              className="action-btn unban"
                              onClick={() => unbanUser(user.id)}
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              className="action-btn ban"
                              onClick={() => banUser(user.id)}
                            >
                              Ban
                            </button>
                          )}
                          <button
                            className="action-btn delete"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <section className="admin-content">
          <h2>Properties Management</h2>
          {properties.length === 0 ? (
            <div className="empty-state">
              <h3>No properties found</h3>
              <p>Properties will appear here once sellers add them.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Price/Night</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop.Id || prop.id}>
                    <td>{prop.Description || prop.description}</td>
                    <td>{prop.PropertyType || prop.propertyType}</td>
                    <td>${prop.PricePerNight || prop.pricePerNight}</td>
                    <td>{prop.SellerEmail || prop.sellerEmail}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          (prop.RentalStatus || prop.rentalStatus) === "Rented"
                            ? "rented"
                            : "available"
                        }`}
                      >
                        {prop.RentalStatus || prop.rentalStatus || "Available"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn delete"
                        onClick={() => deleteProperty(prop.Id || prop.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Rentals Tab */}
      {activeTab === "rentals" && (
        <section className="admin-content">
          <h2>Rentals History</h2>
          {rentals.length === 0 ? (
            <div className="empty-state">
              <h3>No rentals yet</h3>
              <p>Rental history will appear here.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Property ID</th>
                  <th>Renter</th>
                  <th>Seller</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental, index) => (
                  <tr key={rental.Id || rental.id || index}>
                    <td>
                      ...{(rental.PropertyId || rental.propertyId || "").slice(-6)}
                    </td>
                    <td>{rental.RenterEmail || rental.renterEmail}</td>
                    <td>{rental.SellerEmail || rental.sellerEmail}</td>
                    <td>
                      {new Date(
                        rental.StartTime || rental.startTime
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      {new Date(
                        rental.EndTime || rental.endTime
                      ).toLocaleDateString()}
                    </td>
                    <td>${rental.TotalPrice || rental.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default Admin;
