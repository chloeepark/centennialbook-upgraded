// routes/login.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Login route
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    // Compare password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.send({ message: "Login successful", token, isAdmin: user.isAdmin });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "An error occurred during login" });
  }
});

export default router;
