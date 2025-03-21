const ClosingEntry = require('../models/ClosingEntry');

// Create a new closing entry
exports.createClosingEntry = async (req, res) => {
  try {
    const {
      branchId,
      date,
      productSales,
      cakeSales,
      expenses,
      creditCardPayment,
      upiPayment,
      cashPayment,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !date ||
      productSales === undefined ||
      cakeSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate numeric fields
    if (
      productSales < 0 ||
      cakeSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0
    ) {
      return res.status(400).json({ success: false, message: 'Sales, expenses, and payments must be non-negative' });
    }

    // Calculate total sales
    const totalSales = productSales + cakeSales;

    // Validate payment breakdown
    const totalPayments = creditCardPayment + upiPayment + cashPayment;
    if (totalPayments !== totalSales) {
      return res.status(400).json({
        success: false,
        message: `Total payments (₹${totalPayments}) must equal total sales (₹${totalSales})`,
      });
    }

    // Calculate net result
    const netResult = totalSales - expenses;

    // Create new closing entry
    const closingEntry = new ClosingEntry({
      branchId,
      date,
      productSales,
      cakeSales,
      expenses,
      netResult,
      creditCardPayment,
      upiPayment,
      cashPayment,
    });

    // Save to database
    await closingEntry.save();

    res.status(201).json({ success: true, message: 'Closing entry created successfully', closingEntry });
  } catch (error) {
    console.error('Error creating closing entry:', error);
    res.status(500).json({ success: false, message: 'Server error while creating closing entry' });
  }
};

// Get all closing entries
exports.getClosingEntries = async (req, res) => {
  try {
    const closingEntries = await ClosingEntry.find()
      .populate('branchId', 'name') // Populate branch name
      .sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json(closingEntries);
  } catch (error) {
    console.error('Error fetching closing entries:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching closing entries' });
  }
};