const ClosingEntry = require('../models/ClosingEntry');

// Create a new closing entry
exports.createClosingEntry = async (req, res) => {
  try {
    const {
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !date ||
      systemSales === undefined ||
      manualSales === undefined ||
      onlineSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined ||
      denom2000 === undefined ||
      denom500 === undefined ||
      denom200 === undefined ||
      denom100 === undefined ||
      denom50 === undefined ||
      denom20 === undefined ||
      denom10 === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate non-negative values
    if (
      systemSales < 0 ||
      manualSales < 0 ||
      onlineSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0 ||
      denom2000 < 0 ||
      denom500 < 0 ||
      denom200 < 0 ||
      denom100 < 0 ||
      denom50 < 0 ||
      denom20 < 0 ||
      denom10 < 0
    ) {
      return res.status(400).json({ success: false, message: 'All values must be non-negative' });
    }

    // Calculate total sales
    const totalSales = systemSales + manualSales + onlineSales;

    // Calculate total cash from denominations
    const totalCashFromDenom =
      denom2000 * 2000 +
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10;

    if (totalCashFromDenom !== cashPayment) {
      return res.status(400).json({
        success: false,
        message: `Total cash from denominations (₹${totalCashFromDenom}) must equal cash payment (₹${cashPayment})`,
      });
    }

    // Calculate net result
    const netResult = totalSales - expenses;

    // Create new closing entry
    const closingEntry = new ClosingEntry({
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      netResult,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
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