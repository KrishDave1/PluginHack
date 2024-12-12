import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  // Fetch profile data when the component loads
  const fetchProfile = async () => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      setError("You are not logged in.");
      navigate("/login"); // Redirect to login if no token is found
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/user-get-delete/?email=${email}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Unauthorized: Invalid or expired token. Please log in again."
          );
        }
        throw new Error("Failed to fetch profile data.");
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login"); // Redirect to login page
  };

  // Navigate to history page
  const goToHistory = () => {
    navigate("/history");
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f4f4f9",
      }}
    >
      <div
        style={{
          background: "#fff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333", fontSize: "34px" }}>
          Profile
        </h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div
          style={{
            background: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <p>
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={{
              padding: "10px 20px",
              background: "#007BFF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            onClick={goToHistory}
            style={{
              padding: "10px 20px",
              background: "#007BFF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            View History
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "red",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
