import { PRINTER_CONFIG } from './printerConfig';

export const generateReceipt = (orderData) => {
  const encoder = new TextEncoder();
  const dateTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(',', '');

  const buffer = [
    // Initialize printer with custom settings
    new Uint8Array([
      ...PRINTER_CONFIG.commands.init,
      ...PRINTER_CONFIG.commands.density,
      ...PRINTER_CONFIG.commands.codepage,
    ]),
    
    // Header
    encoder.encode(`${orderData.branch.name}\n`),
    encoder.encode(`${orderData.branch.address || 'Address Not Available'}\n`),
    encoder.encode(`Phone: ${orderData.branch.phoneNo || 'Phone Not Available'}\n`),
    encoder.encode(`Bill No: ${orderData.billNo}\n`),
    encoder.encode(`Date: ${dateTime}\n`),
    encoder.encode(`Cashier: ${orderData.todayAssignment?.cashierId?.name || 'Not Assigned'}\n`),
    encoder.encode(`Waiter: ${orderData.waiterInfo}\n`),
    encoder.encode('--------------------------------\n'),
    
    // Items
    ...orderData.items.map(item => 
      encoder.encode(`${item.name.padEnd(20)} x${item.qty.toString().padStart(2)} ₹${item.total.padStart(6)}\n`)
    ),
    
    // Footer
    encoder.encode('--------------------------------\n'),
    encoder.encode(`Total: ₹${orderData.grandTotal.padStart(6)}\n`),
    encoder.encode('\nThank You !! Visit Again\n\n'),
    
    // Printer commands
    new Uint8Array(PRINTER_CONFIG.commands.cut),
    new Uint8Array(PRINTER_CONFIG.commands.beep),
  ];

  return buffer;
};