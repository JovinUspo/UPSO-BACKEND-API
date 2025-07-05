require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const locationFilter = require("./middleware/locationFilter")

// Basic middlewares
app.use(cors());
app.use(express.json());
// Apply locationFilter to all `/api` routes
// app.use('/api', locationFilter);

// Route groups
app.use('/api/user', require('./routers/user'));
app.use('/api/vendor', require('./routers/vendor'));
app.use('/api/driver', require('./routers/driver'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Health check
app.get('/', (req, res) => res.json({ status: 'API running' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



