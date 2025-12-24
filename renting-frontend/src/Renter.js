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

  const [priceRange, setPriceRange] = useState([0, 1000]); // min, max
  const [maxPriceInData, setMaxPriceInData] = useState(1000);

  const [selectedProperty, setSelectedProperty] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentSuccess, setRentSuccess] = useState(false);

  const [reviewRental, setReviewRental] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const [propertyImages, setPropertyImages] = useState({});
  const [selectedPropertyReviews, setSelectedPropertyReviews] = useState([]);
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);
  const [allReviews, setAllReviews] = useState([]);

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

  useEffect(() => {
    fetch("http://localhost:5062/api/review")
      .then((res) => res.json())
      .then((data) => setAllReviews(data))
      .catch(() => setAllReviews([]));
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("http://localhost:5062/api/property");
      const data = await res.json();

      console.log("📦 PROPERTIES FROM BACKEND:", data);

      const maxPrice = Math.max(...data.map((p) => p.pricePerNight || 0), 1000);

      setProperties(data);
      setFilteredProperties(data);
      setMaxPriceInData(maxPrice);
      setPriceRange([0, maxPrice]);
      setLoading(false);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const res = await fetch("http://localhost:5062/api/review");
        const data = await res.json();
        setAllReviews(data);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };

    fetchAllReviews();
  }, []);

  const fetchAllImages = async (props) => {
    if (!Array.isArray(props)) return;

    const map = {};

    for (const p of props) {
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

  /* ===================== SEARCH ===================== */

  useEffect(() => {
    const result = properties.filter((p) => {
      const matchesSearch = p.description
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesPrice =
        p.pricePerNight >= priceRange[0] && p.pricePerNight <= priceRange[1];

      return matchesSearch && matchesPrice;
    });

    setFilteredProperties(result);
  }, [search, priceRange, properties]);

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

  const openDetails = async (property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);

    const propertyId = property.id || property._id || property.Id;

    // Fetch reviews
    const res = await fetch(
      `http://localhost:5062/api/review/property/${propertyId}`
    );
    const data = await res.json();
    setReviews(data);

    // Check if user can review
    const rentCheck = await fetch(
      `http://localhost:5062/api/rental/renter/${renterEmail}`
    );
    const rentals = await rentCheck.json();

    const hasRented = rentals.some((r) => r.propertyId === propertyId);

    setCanReview(hasRented);
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
  const openReviewsPopup = async () => {
    if (!selectedProperty) return;

    const propertyId =
      selectedProperty.Id || selectedProperty._id || selectedProperty.id;

    const res = await fetch(
      `http://localhost:5062/api/review/property/${propertyId}`
    );

    const data = await res.json();
    console.log("Reviews fetched:", data);
    setSelectedPropertyReviews(data);
    setShowReviewsPopup(true);
  };

  const submitReview = async () => {
    if (!rating || rating < 0 || rating > 5) {
      alert("Please select a rating between 0 and 5");
      return;
    }

    if (!reviewText.trim()) {
      alert("Please write a review");
      return;
    }

    const propertyId =
      selectedProperty?.id || selectedProperty?._id || selectedProperty?.Id;

    if (!propertyId) {
      alert("Property ID missing");
      return;
    }

    try {
      // ================= POST REVIEW =================
      const res = await fetch("http://localhost:5062/api/review/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId,
          renterEmail: renterEmail,
          rating: rating,
          text: reviewText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit review");
        return;
      }

      // ================= REFRESH REVIEWS =================
      const res2 = await fetch(
        `http://localhost:5062/api/review/property/${propertyId}`
      );
      const updatedReviews = await res2.json();
      setReviews(updatedReviews);

      // ================= RESET + CLOSE MODAL =================
      setReviewRental(null);
      setRating(0);
      setReviewText("");
    } catch (err) {
      console.error("❌ Review submit error:", err);
      alert("Server error while submitting review");
    }
  };

  const bestRatedProperties = properties
    .map((p) => {
      const reviewsForProperty = allReviews.filter(
        (r) => r.PropertyId === p.Id
      );

      if (reviewsForProperty.length === 0) return null;

      const avgRating =
        reviewsForProperty.reduce((sum, r) => sum + r.Rating, 0) /
        reviewsForProperty.length;

      return {
        ...p,
        avgRating,
        reviewCount: reviewsForProperty.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 6); // TOP 6

  /* ===================== RENT SUBMIT (DEBUG) ===================== */

  const submitRent = async () => {
    // ===================== VALIDATION =====================
    if (!rentForm.startTime || !rentForm.endTime) {
      alert("Please select start and end dates");
      return;
    }

    const today = new Date(new Date().toDateString());
    const startDate = new Date(rentForm.startTime);
    const endDate = new Date(rentForm.endTime);

    if (startDate < today) {
      alert("Start date must be today or a future date");
      return;
    }

    const numberOfDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (numberOfDays <= 0) {
      alert("End date must be after start date");
      return;
    }

    // ===================== PROPERTY ID FIX =====================
    const propertyId =
      selectedProperty?.id || selectedProperty?._id || selectedProperty?.Id;

    if (!propertyId) {
      console.error("❌ PROPERTY ID IS UNDEFINED", selectedProperty);
      alert("Property ID missing — check console");
      return;
    }

    // ===================== PAYLOAD =====================
    const payload = {
      propertyId: propertyId,
      renterEmail: renterEmail,
      sellerEmail: selectedProperty.sellerEmail,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      numberOfPeople: rentForm.numberOfPeople,
      totalPrice: totalPrice,
    };

    // ===================== DEBUG LOG =====================
    console.log("======================================");
    console.log("🚨 RENT REQUEST PAYLOAD SENT TO BACKEND");
    console.log(payload);
    console.log("======================================");

    // ===================== API CALL =====================
    try {
      const res = await fetch("http://localhost:5062/api/rental/rent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🧾 RENT RESPONSE:", data);

      if (res.ok) {
        console.log("✅ RENT SUCCESS — notification created");

        setRentSuccess(true);

        // Reset form
        setRentForm({
          startTime: "",
          endTime: "",
          numberOfPeople: 1,
        });

        // Auto close modals
        setTimeout(() => {
          setRentSuccess(false);
          closeDetails();
        }, 2000);
      } else {
        alert(data.message || "❌ Rental failed");
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
              className="search-input"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* PRICE SLIDER */}
            <div className="price-slider">
              <div className="price-values">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>

              <div className="slider-wrapper">
                <div className="slider-track">
                  <div
                    className="slider-range"
                    style={{
                      left: `${(priceRange[0] / maxPriceInData) * 100}%`,
                      width: `${
                        ((priceRange[1] - priceRange[0]) / maxPriceInData) * 100
                      }%`,
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="0"
                  max={maxPriceInData}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([
                      Math.min(Number(e.target.value), priceRange[1] - 10),
                      priceRange[1],
                    ])
                  }
                  className="range-input range-min"
                />

                <input
                  type="range"
                  min="0"
                  max={maxPriceInData}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      Math.max(Number(e.target.value), priceRange[0] + 10),
                    ])
                  }
                  className="range-input range-max"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <img src="https://picsum.photos/1200/900?blur=2" alt="hero" />
        </div>
      </section>

      {/* ============ BENTO SECTION ============ */}
      <section className="bento-section">
        <div className="bento-grid">
          <div className="bento-card primary">
            <h3>🏡 Handpicked Stays</h3>
            <p>Carefully curated properties for comfort and quality.</p>
          </div>

          <div className="bento-card image-card">
            <img src="https://picsum.photos/600/400?house" alt="Luxury stay" />
          </div>

          <div className="bento-card accent">
            <h3>⭐ Trusted Reviews</h3>
            <p>Only verified renters can leave reviews.</p>
          </div>

          <div className="bento-card glass">
            <h3>⚡ Fast Booking</h3>
            <p>Rent in seconds with real-time price calculation.</p>
          </div>

          <div className="bento-card gradient">
            <h3>🌍 Anywhere</h3>
            <p>Urban apartments, houses, and premium stays.</p>
          </div>
        </div>
      </section>

      {/* ============ BEST RATED CAROUSEL ============ */}
      <section className="best-rated-section">
        <h2>🔥 Best Rated Stays</h2>

        {bestRatedProperties.length === 0 ? (
          <p className="empty">No rated properties yet</p>
        ) : (
          <div className="carousel">
            <div className="carousel-track">
              {/* FIRST COPY */}
              {bestRatedProperties.map((p) => (
                <div
                  key={`a-${p.Id}`}
                  className="carousel-card"
                  onClick={() => openDetails(p)}
                >
                  <div
                    className="carousel-image"
                    style={{
                      backgroundImage: propertyImages[p.Id]?.length
                        ? `url(${propertyImages[p.Id][0].imageBase64})`
                        : "none",
                    }}
                  />

                  <div className="carousel-info">
                    <h4>{p.description}</h4>

                    <div className="stars">
                      {"★".repeat(Math.round(p.avgRating))}
                      {"☆".repeat(5 - Math.round(p.avgRating))}
                    </div>

                    <small>
                      {p.reviewCount} review{p.reviewCount > 1 ? "s" : ""}
                    </small>

                    <span>${p.pricePerNight} / night</span>
                  </div>
                </div>
              ))}

              {/* SECOND COPY (FOR SEAMLESS LOOP) */}
              {bestRatedProperties.map((p) => (
                <div
                  key={`b-${p.Id}`}
                  className="carousel-card"
                  onClick={() => openDetails(p)}
                >
                  <div
                    className="carousel-image"
                    style={{
                      backgroundImage: propertyImages[p.Id]?.length
                        ? `url(${propertyImages[p.Id][0].imageBase64})`
                        : "none",
                    }}
                  />

                  <div className="carousel-info">
                    <h4>{p.description}</h4>

                    <div className="stars">
                      {"★".repeat(Math.round(p.avgRating))}
                      {"☆".repeat(5 - Math.round(p.avgRating))}
                    </div>

                    <small>
                      {p.reviewCount} review{p.reviewCount > 1 ? "s" : ""}
                    </small>

                    <span>${p.pricePerNight} / night</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <div
                className="image-wrapper"
                style={{
                  backgroundImage: propertyImages[p.Id]?.length
                    ? `url(${propertyImages[p.Id][0].imageBase64})`
                    : "none",
                }}
              >
                {!propertyImages[p.Id]?.length && <span>No Image</span>}
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
            <div className="image-gallery">
              {propertyImages[selectedProperty.Id]?.length ? (
                propertyImages[selectedProperty.Id].map((img, i) => (
                  <img
                    key={i}
                    src={img.imageBase64}
                    alt="property"
                    className="gallery-img"
                  />
                ))
              ) : (
                <p className="empty">No images available</p>
              )}
            </div>

            <div className="modal-details">
              <h2>{selectedProperty.description}</h2>
              <p>Type: {selectedProperty.propertyType}</p>
              <p>Max persons: {selectedProperty.maxPerson}</p>
              <p>Price: ${selectedProperty.pricePerNight} / night</p>

              <button className="rent-btn" onClick={openRent}>
                Rent this property
              </button>

              <button className="review-btn" onClick={openReviewsPopup}>
                View Reviews
              </button>

              {showReviewsPopup && (
                <div
                  className="review-overlay"
                  onClick={() => setShowReviewsPopup(false)}
                >
                  <div
                    className="review-popup"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="review-header">
                      <h3>Property Reviews</h3>

                      {canReview && (
                        <button
                          className="add-review-btn"
                          onClick={() => {
                            setShowReviewsPopup(false);
                            setReviewRental(selectedProperty);
                          }}
                        >
                          + Add Review
                        </button>
                      )}

                      <button onClick={() => setShowReviewsPopup(false)}>
                        ✕
                      </button>
                    </div>

                    <div className="review-body">
                      {selectedPropertyReviews.length === 0 ? (
                        <p className="empty">No reviews yet</p>
                      ) : (
                        selectedPropertyReviews.map((r) => (
                          <div className="review-card" key={r.Id}>
                            <div className="stars">
                              {"★".repeat(r.Rating)}
                              {"☆".repeat(5 - r.Rating)}
                            </div>
                            <p>{r.Text}</p>
                            <span>
                              {r.CreatedAt
                                ? new Date(r.CreatedAt).toLocaleDateString()
                                : "Just now"}
                            </span>
                            <small>By: {r.RenterEmail}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button className="close-btn" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewRental && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>Leave a Review</h2>

            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={s <= rating ? "star active" : "star"}
                  onClick={() => setRating(s)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div className="form-buttons">
              <button onClick={submitReview} className="primary-btn">
                Submit
              </button>
              <button
                onClick={() => setReviewRental(null)}
                className="secondary-btn"
              >
                Cancel
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

              {rentSuccess && (
                <div className="rent-success">
                  ✅ Rental confirmed! Seller has been notified.
                </div>
              )}

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
