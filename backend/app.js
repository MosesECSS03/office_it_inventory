const express = require('express');
const cors = require('cors');

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server fallback
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://ecss-it-inventory-frontend.azurewebsites.net', // Your Azure frontend
    // Add any other domains where your frontend might be hosted
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes (Boundary layer)
const inventoryRoutes = require('./routes/inventoryRoutes');
const formsRoutes = require('./routes/formsRoutes');

// Routes middleware
app.use('/inventory', inventoryRoutes);
app.use('/forms', formsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = app;
