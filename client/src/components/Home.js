import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css"; // 스타일을 따로 관리

function Home({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="home-container">
      <h1>Welcome to CentennialBook 🎓</h1>
      <p className="subtitle">Your campus life starts here!</p>

      <div className="card-grid">
        <Link to="/events" className="card">🎉 Events</Link>
        <Link to="/clubs" className="card">🤝 Clubs</Link>
        <Link to="/profile" className="card">👤 My Profile</Link>
        <Link to="/rsvp" className="card">📅 RSVP</Link>
        <Link to="/CreatePost" className="card">📝 Posts</Link>
      </div>

      <button className="logout-button" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Home;
