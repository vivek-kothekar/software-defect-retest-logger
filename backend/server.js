const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');

// Initialize database schema and demo accounts
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const defectRoutes = require('./routes/defects');
const fixesRoutes = require('./routes/fixes');
const retestsRoutes = require('./routes/retests');
const closuresRoutes = require('./routes/closures');

app.use('/api/auth', authRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/defects', fixesRoutes);
app.use('/api/retests', retestsRoutes);
app.use('/api/defects', retestsRoutes);
app.use('/api/closures', closuresRoutes);
app.use('/api/defects', closuresRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Software Defect Re-Test Execution Logger API',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` SEQA Defect Re-Test Logger API Server running on port ${PORT}`);
  console.log(` Database: SQLite (backend/database/database.sqlite)`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
