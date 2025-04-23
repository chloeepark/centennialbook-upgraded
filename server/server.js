import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import User from "./models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Add bcrypt for password hashing
import eventRoutes from "./routes/events.js";
import loginRoutes from "./routes/login.js";
//import authRoutes from "./routes/auth.js";
import mongoose from "mongoose";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

// Route for event-related API calls
app.use("/routes/events", eventRoutes);

app.use("/login", loginRoutes);

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: "Username Taken" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save(); 
    res.send({ message: "User created" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

// Admin Signup route
app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, isAdmin: true });
    await user.save();
    res.send({ message: "Admin account created successfully!" });
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).send({ message: "An error occurred during admin signup" });
  }
});


// Forgot password route
app.post("/forgotPassword", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send({ message: "Username is required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOption = {
      from: process.env.EMAIL,
      to: username,
      subject: "Password Reset Request",
      text: `We have received a request to reset your password. Please use the link below to reset it:\n\n${process.env.FRONTEND}/${token}`,
    };

    await transporter.sendMail(mailOption);
    res.send({ message: "Password reset link sent to your email address" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).send({ message: "An error occurred while sending reset email", error: error.message });
  }
});

// Reset password route
app.post("/resetPassword/:token", async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Hash new password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.send({ message: "Password reset!" });
  } catch (error) {
    res.status(400).send({ message: "Something went wrong, please resubmit password reset request.", error: error.message });
  }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  console.log("Token received in middleware:", token);
  if (!token)
    return res.status(401).send({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(403).send({ message: "Invalid token" });
  }
};

// Profile route
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send({ username: user.username });
  } catch (error) {
    res.status(500).send({ message: "An error occurred", error: error.message });
  }
});

// Update username route
app.put("/profile", authenticateToken, async (req, res) => {
  const { newUsername } = req.body;

  if (!newUsername || newUsername.trim() === "") {
    return res.status(400).send({ message: "New username cannot be empty" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: req.user.username },
      { username: newUsername },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    const newToken = jwt.sign({ username: newUsername }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.send({
      message: "Username updated successfully",
      user: updatedUser,
      token: newToken,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).send({ message: "An error occurred", error: error.message });
  }
});

// Delete profile route
app.delete("/profile", authenticateToken, async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ username: req.user.username });
    if (deletedUser) {
      res.send({ message: "User account deleted successfully" });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ message: "An error occurred", error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
