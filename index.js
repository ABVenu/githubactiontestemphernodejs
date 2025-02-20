// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();

if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: ".env.testing" });
} else {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

// Models
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  })
);

const Todo = mongoose.model(
  "Todo",
  new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  })
);

// Middleware
app.use(bodyParser.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes
// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
  res.json({ token });
});

// Create Todo
app.post("/todos", authenticateToken, async (req, res) => {
  const { text } = req.body;
  const newTodo = new Todo({ text, userId: req.user.id });
  await newTodo.save();
  res.status(201).json(newTodo);
});

// Read Todos
app.get("/todos", authenticateToken, async (req, res) => {
  const todos = await Todo.find({ userId: req.user.id });
  res.json(todos);
});

// Update Todo
app.put("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;

  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { text, completed },
    { new: true }
  );
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  res.json(todo);
});

// Delete Todo
app.delete("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const todo = await Todo.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  res.json({ message: "Todo deleted successfully" });
});

module.exports = app;
