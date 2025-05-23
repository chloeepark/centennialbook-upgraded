import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch the profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5001/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsername(response.data.username);  // 서버에서 받은 username 설정
      } catch (err) {
        setError("Failed to load profile");
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateUsername = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5001/profile",
        { newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Username changed successfully!");
      setNewUsername("");
      setUsername(response.data.user.username); // 변경된 username을 업데이트
      localStorage.setItem("token", response.data.token);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        alert(err.response.data.message);
      } else {
        console.error("Error updating username:", err);
        setError("Failed to update username.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action is irreversible."
    );
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete("http://localhost:5001/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        alert("Account deleted successfully!");
        localStorage.removeItem("token");
        navigate("/signup");
      } catch (err) {
        console.error("Error deleting account:", err);
        setError("Failed to delete account.");
      }
    }
  };

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Display current username */}
      <div className="username-section">
        <p>Current Username: <strong>{username}</strong></p>
      </div>

      <div className="form-section">
        <label htmlFor="new-username">Edit Username:</label>
        <input
          id="new-username"
          type="text"
          placeholder="Enter new username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <button className="update-btn" onClick={handleUpdateUsername}>
          Update Username
        </button>
      </div>

      <div className="delete-section">
        <button className="delete-btn" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Profile;
