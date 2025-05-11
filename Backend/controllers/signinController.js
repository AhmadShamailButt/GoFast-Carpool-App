const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "8ae74b4cf76c2e91531a6a5e7ed2ef3a62c4dcaee24d7b176fdfd0ba6c1e9abf";

// @route   POST /signin
// @desc    Authenticate user and return JWT + user data (except password)
router.post("/signin", async (req, res) => {
    console.log("Incoming sign in body:", req.body);
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
if (!user) {
  console.log("User not found for email:", email);
  return res.status(400).json({ error: "Invalid email or password." });
}


    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  console.log("Password incorrect for email:", email);
  return res.status(400).json({ error: "Invalid email or password." });
  console.log("Password comparison result:", isMatch);

}

    // 3. Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Send user info (excluding password)
    res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        gender: user.gender,
        rating: user.rating,
        rides_taken: user.rides_taken,
        rides_offered: user.rides_offered,
      },
    });
  } catch (err) {
    console.error("SignIn Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
