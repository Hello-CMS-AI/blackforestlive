require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { updateStockOrderStatus } = require('./controllers/orderController');

// Route imports
const authRoutes = require('./routes/userRoutes');
const financialRoutes = require('./routes/financialRoutes');
const orderRoutes = require('./routes/order');
const dailyAssignmentsRoutes = require('./routes/dailyAssignments');
const closingEntryRoutes = require('./routes/closingEntries');
const dealerRoutes = require('./routes/dealerRoutes');
const dealerCategoryRoutes = require('./routes/dealerCategoryRoutes');
const dealerProductRoutes = require('./routes/dealerProductRoutes');
const stockEntryRoutes = require('./routes/stockEntryRoutes');
const billRoutes = require('./routes/billRoutes');
const tableCategoryRoutes = require('./routes/tableCategoryRoutes');
const tableRoutes = require('./routes/tableRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const albumRoutes = require('./routes/albumRoutes');
const productRoutes = require('./routes/productRoutes');
const branchRoutes = require('./routes/branchRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ======================
// 1. SECURITY MIDDLEWARE
// ======================
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// ======================
// 2. BODY PARSING
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// 3. LOGGING
// ======================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ======================
// 4. FILE HANDLING
// ======================
const uploadDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created:', uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// ======================
// 5. HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ======================
// 6. ROUTES
// ======================

// A. Authentication
app.use('/api/auth', authRoutes);

// B. High-security routes
app.use('/api/financial', financialRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/daily-assignments', dailyAssignmentsRoutes);
app.use('/api/closing-entries', closingEntryRoutes);

// C. Dealer management
app.use('/api/dealers', dealerRoutes);
app.use('/api/dealer/categories', dealerCategoryRoutes);
app.use('/api/dealer/products', dealerProductRoutes);
app.use('/api/dealer/stock-entries', stockEntryRoutes);
app.use('/api/dealers/bills', billRoutes);

// D. Table management
app.use('/api/table-categories', tableCategoryRoutes);
app.use('/api/tables', tableRoutes);

// E. General content
app.use('/api/categories', categoryRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);

// ======================
// 7. ERROR HANDLING
// ======================
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ======================
// 8. DATABASE & SERVER
// ======================
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Scheduled tasks
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ Running scheduled task: updateStockOrderStatus');
    updateStockOrderStatus().catch(console.error);
  });
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = server; // For testing