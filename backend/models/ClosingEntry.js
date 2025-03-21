const mongoose = require('mongoose');

const closingEntrySchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    productSales: {
      type: Number,
      required: true,
      min: 0,
    },
    cakeSales: {
      type: Number,
      required: true,
      min: 0,
    },
    expenses: {
      type: Number,
      required: true,
      min: 0,
    },
    netResult: {
      type: Number,
      required: true,
    },
    creditCardPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    upiPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    cashPayment: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClosingEntry', closingEntrySchema);