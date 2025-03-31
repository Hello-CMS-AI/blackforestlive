const mongoose = require('mongoose');

const dealerProductSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerCategory',
    required: true,
  },
  barcode_no: {
    type: String,
    trim: true,
    unique: true, // Still unique when provided, but allows null/undefined
    sparse: true, // Add this to allow multiple documents with no barcode_no
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  stock_quantity: {
    type: Number,
    min: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

module.exports = mongoose.model('DealerProduct', dealerProductSchema);