import React, { useState, useEffect } from "react";
import { Row, Col, Button, Space, message, Image, Select, Input } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled, CloseOutlined, MinusOutlined, PlusOutlined, SaveOutlined, PrinterOutlined, WalletOutlined, CreditCardOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Option } = Select;

const TableOrder = ({
  branchId,
  token,
  categories,
  tableCategories,
  fetchTableCategories,
  waiters,
  selectedProductsByTab,
  setSelectedProductsByTab,
  branchInventory,
  BACKEND_URL,
}) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiterInput, setWaiterInput] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [waiterError, setWaiterError] = useState('');
  const [lastBillNo, setLastBillNo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    fetchTableCategories(token);
  }, [token, fetchTableCategories]);

  const fetchProducts = async (categoryId) => {
    setProductsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredProducts = data.filter(product => product.category?._id === categoryId);
        setProducts(filteredProducts);
        setFilteredProducts(filteredProducts);
      } else {
        message.error('Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      message.error('Error fetching products');
      setProducts([]);
      setFilteredProducts([]);
    }
    setProductsLoading(false);
  };

  const handleProductTypeFilter = (type) => {
    setSelectedProductType(type);
    if (type === null) {
      setFilteredProducts([...products]);
    } else {
      const filtered = products.filter(product => product.productType === type);
      setFilteredProducts(filtered);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedProductType(null);
    fetchProducts(category._id);
    setSelectedUnits({});
  };

  const handleTableClick = (table) => {
    const tableId = table._id;
    if (table.status === 'Occupied' && table.currentOrder) {
      message.warning('Table is already occupied. You can add more items or bill the existing order.');
      const existingOrder = table.currentOrder;
      setSelectedProductsByTab(prev => ({
        ...prev,
        tableOrder: {
          ...prev.tableOrder,
          [tableId]: existingOrder.products.map(product => ({
            ...product,
            _id: product.productId,
            count: product.quantity,
            selectedUnitIndex: 0,
            bminstock: product.bminstock || 0,
          })),
        },
      }));
      setSelectedWaiter(existingOrder.waiterId?._id || null);
      setWaiterInput(existingOrder.waiterId ? existingOrder.waiterId.employeeId?.replace('E', '') : '');
      setWaiterName(existingOrder.waiterId ? `${existingOrder.waiterId.name} (${existingOrder.waiterId.employeeId})` : '');
      setLastBillNo(existingOrder.billNo);
    } else {
      setSelectedProductsByTab(prev => ({
        ...prev,
        tableOrder: {
          ...prev.tableOrder,
          [tableId]: prev.tableOrder[tableId] || [],
        },
      }));
      setLastBillNo(null);
      setSelectedWaiter(null);
      setWaiterInput('');
      setWaiterName('');
      setWaiterError('');
    }
    setSelectedTable(table);
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    message.info(`Selected table: ${table.tableNumber}`);
  };

  const handleUnitChange = (productId, unitIndex) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: unitIndex,
    }));
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleProductClick = (product) => {
    const selectedUnitIndex = selectedUnits[product._id] || 0;
    const tabKey = selectedTable ? selectedTable._id : 'tableOrder';
    const tabSelections = selectedProductsByTab.tableOrder[tabKey] || [];

    const stockInfo = branchInventory.find(item => item.productId._id === product._id);
    const availableStock = stockInfo ? stockInfo.inStock : 0;
    const currentCount = tabSelections
      .filter(item => item._id === product._id)
      .reduce((sum, item) => sum + item.count, 0);

    if (currentCount >= availableStock) {
      message.warning(`${product.name} is out of stock at this branch! (Stock: ${availableStock})`);
      return;
    }

    setSelectedProductsByTab(prev => {
      const existingProduct = tabSelections.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
      if (existingProduct) {
        const updatedSelections = tabSelections.map(item =>
          item._id === product._id && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count + 1 }
            : item
        );
        return {
          ...prev,
          tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections },
        };
      } else {
        const newSelections = [...tabSelections, { ...product, selectedUnitIndex, count: 1, bminstock: 0 }];
        return {
          ...prev,
          tableOrder: { ...prev.tableOrder, [tabKey]: newSelections },
        };
      }
    });
  };

  const handleIncreaseCount = (productId, selectedUnitIndex) => {
    const tabKey = selectedTable._id;
    setSelectedProductsByTab(prev => {
      const tabSelections = prev.tableOrder[tabKey] || [];
      const updatedSelections = tabSelections.map(item =>
        item._id === productId && item.selectedUnitIndex === selectedUnitIndex
          ? { ...item, count: item.count + 1 }
          : item
      );
      return { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } };
    });
  };

  const handleDecreaseCount = (productId, selectedUnitIndex) => {
    const tabKey = selectedTable._id;
    setSelectedProductsByTab(prev => {
      const tabSelections = prev.tableOrder[tabKey] || [];
      const existingProduct = tabSelections.find(item => item._id === productId && item.selectedUnitIndex === selectedUnitIndex);
      if (existingProduct.count === 1) {
        const updatedSelections = tabSelections.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
        return { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } };
      } else {
        const updatedSelections = tabSelections.map(item =>
          item._id === productId && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count - 1 }
            : item
        );
        return { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } };
      }
    });
  };

  const handleRemoveProduct = (productId, selectedUnitIndex) => {
    const tabKey = selectedTable._id;
    setSelectedProductsByTab(prev => {
      const tabSelections = prev.tableOrder[tabKey] || [];
      const updatedSelections = tabSelections.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
      return { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } };
    });
    setLastBillNo(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    setLastBillNo(null);
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    setLastBillNo(null);
    setSelectedWaiter(null);
    setWaiterInput('');
    setWaiterName('');
    setWaiterError('');
  };

  const handleWaiterInputChange = (value) => {
    setWaiterInput(value);
    setWaiterError('');
    setWaiterName('');
    setSelectedWaiter(null);

    if (!value) return;

    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) {
      setWaiterError('Please enter a valid number');
      return;
    }

    const formattedId = `E${String(numericValue).padStart(3, '0')}`;
    const waiter = waiters.find(w => w.employeeId === formattedId);
    if (waiter) {
      setSelectedWaiter(waiter._id);
      setWaiterName(`${waiter.name} (${formattedId})`);
    } else {
      setWaiterError('Invalid Waiter ID');
    }
  };

  const calculateProductTotal = (product) => {
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const price = product.priceDetails?.[selectedUnitIndex]?.price || 0;
    return price * product.count;
  };

  const calculateProductGST = (product) => {
    const productTotal = calculateProductTotal(product);
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || 0;
    return productTotal * (gstRate / 100);
  };

  const calculateCartTotals = () => {
    const tabKey = selectedTable ? selectedTable._id : 'tableOrder';
    const tabSelections = selectedProductsByTab.tableOrder[tabKey] || [];
    const totalQty = tabSelections.reduce((sum, product) => sum + product.count, 0);
    const uniqueItems = tabSelections.length;
    const subtotal = tabSelections.reduce((sum, product) => sum + calculateProductTotal(product), 0);
    const totalGST = tabSelections.reduce((sum, product) => sum + calculateProductGST(product), 0);
    const totalWithGST = subtotal + totalGST;
    return { totalQty, uniqueItems, subtotal, totalGST, totalWithGST };
  };

  const currentTabSelections = selectedTable ? (selectedProductsByTab.tableOrder[selectedTable._id] || []) : [];
  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

  const getCardSize = () => {
    if (typeof window === 'undefined') return 200;
    const width = window.innerWidth;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    if (width >= 1600) return 200;
    if (width >= 1400) return 180;
    if (width >= 1200) return 160;
    if (width >= 992) return 150;
    if (width >= 768) return isPortrait ? 140 : 150;
    if (width >= 576) return isPortrait ? 120 : 130;
    return isPortrait ? 100 : 110;
  };

  const cardSize = getCardSize();
  const gutter = 16;
  const columns = Math.floor((window.innerWidth - 40) / (cardSize + gutter));
  const fontSize = window.innerWidth <= 575 && window.matchMedia("(orientation: portrait)").matches ? 10 : Math.max(cardSize * 0.1, 12);
  const lineHeight = Math.max(cardSize * 0.3, 20);

  const formatPriceDetails = (priceDetails, selectedUnitIndex = 0) => {
    if (!priceDetails || priceDetails.length === 0) return 'No Price';
    const detail = priceDetails[selectedUnitIndex];
    return `₹${detail.price}`;
  };

  const formatUnitLabel = (detail, productType) => {
    const baseLabel = `${detail.quantity}${detail.unit}`;
    if (productType === 'cake' && detail.cakeType) {
      return `${baseLabel} (${detail.cakeType === 'freshCream' ? 'FC' : 'BC'})`;
    }
    return baseLabel;
  };

  const formatTooltip = (detail, productType) => {
    const baseTooltip = `Unit: ${detail.quantity}${detail.unit}, GST: ${detail.gst}%`;
    if (productType === 'cake' && detail.cakeType) {
      return `${baseTooltip}, Type: ${detail.cakeType === 'freshCream' ? 'FC' : 'BC'}`;
    }
    return baseTooltip;
  };

  const formatDisplayName = (product) => {
    const detail = product.priceDetails?.[product.selectedUnitIndex];
    if (!detail) return product.name;
    return `${product.name} (${detail.quantity}${detail.unit}${product.productType === 'cake' && detail.cakeType ? `, ${detail.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})`;
  };

  const handleSave = async () => {
    const tabKey = selectedTable._id;
    const tabSelections = selectedProductsByTab.tableOrder[tabKey] || [];

    if (tabSelections.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }
    if (!selectedTable) {
      message.warning('Please select a table!');
      return;
    }

    const orderData = {
      branchId,
      tab: 'tableOrder',
      products: tabSelections.map(product => ({
        productId: product._id,
        name: product.name,
        quantity: product.count,
        price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
        unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
        gstRate: product.priceDetails?.[product.selectedUnitIndex]?.gst || 0,
        productTotal: calculateProductTotal(product),
        productGST: calculateProductGST(product),
        bminstock: product.bminstock || 0,
      })),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'draft',
      waiterId: selectedWaiter,
      tableId: selectedTable._id,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Cart saved as draft!');
        setLastBillNo(data.order.billNo);
        setSelectedProductsByTab(prev => ({
          ...prev,
          tableOrder: { ...prev.tableOrder, [tabKey]: [] },
        }));
        setSelectedWaiter(null);
        setWaiterInput('');
        setWaiterName('');
        setWaiterError('');
        fetchTableCategories(token);
        setSelectedTable(null);
      } else {
        message.error(data.message || 'Failed to save order');
      }
    } catch (error) {
      message.error('Error saving order');
    }
  };

  const handleSaveAndPrint = async () => {
    const tabKey = selectedTable._id;
    const tabSelections = selectedProductsByTab.tableOrder[tabKey] || [];

    if (tabSelections.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }
    if (!selectedTable) {
      message.warning('Please select a table!');
      return;
    }

    const totalWithGSTRounded = Math.round(totalWithGST);
    const roundOff = totalWithGSTRounded - totalWithGST;
    const tenderAmount = totalWithGSTRounded;
    const balance = tenderAmount - totalWithGSTRounded;
    const sgst = totalGST / 2;
    const cgst = totalGST / 2;

    const orderData = {
      branchId,
      tab: 'tableOrder',
      products: tabSelections.map(product => ({
        productId: product._id,
        name: product.name,
        quantity: product.count,
        price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
        unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
        gstRate: product.priceDetails?.[product.selectedUnitIndex]?.gst || 0,
        productTotal: calculateProductTotal(product),
        productGST: calculateProductGST(product),
        bminstock: product.bminstock || 0,
      })),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'completed',
      waiterId: selectedWaiter,
      tableId: selectedTable._id,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Cart saved and ready to print!');
        setLastBillNo(data.order.billNo);
        printReceipt(data.order, {
          totalQty,
          totalItems: uniqueItems,
          subtotal,
          sgst,
          cgst,
          totalWithGST,
          totalWithGSTRounded,
          roundOff,
          paymentMethod,
          tenderAmount,
          balance,
        });
        setSelectedProductsByTab(prev => ({
          ...prev,
          tableOrder: { ...prev.tableOrder, [tabKey]: [] },
        }));
        setSelectedWaiter(null);
        setWaiterInput('');
        setWaiterName('');
        setWaiterError('');
        fetchTableCategories(token);
        setSelectedTable(null);
      } else {
        message.error(data.message || 'Failed to save and print order');
      }
    } catch (error) {
      message.error('Error saving and printing order');
    }
  };

  const printReceipt = (order, summary) => {
    const { totalQty, totalItems, subtotal, sgst, cgst, totalWithGST, totalWithGSTRounded, roundOff, paymentMethod, tenderAmount, balance } = summary;
    const printWindow = window.open('', '_blank');
    const dateTime = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 302px; margin: 0; padding: 5px; font-size: 10px; line-height: 1.2; }
            h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
            .header { display: flex; justify-content: space-between; margin-bottom: 5px; width: 100%; }
            .header-left { text-align: left; max-width: 50%; overflow: hidden; text-overflow: ellipsis; }
            .header-right { text-align: right; max-width: 50%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            p { margin: 2px 0; overflow: hidden; text-overflow: ellipsis; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { padding: 2px; text-align: left; font-size: 10px; }
            th { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .summary { margin-top: 5px; }
            .summary div { display: flex; justify-content: space-between; }
            .payment-details { margin-top: 5px; }
            @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 5px; } }
          </style>
        </head>
        <body>
          <h2>${order.branchId?.name || 'Unknown Branch'}</h2>
          <p style="text-align: center;">${order.branchId?.address || 'Address Not Available'}</p>
          <p style="text-align: center;">Phone: ${order.branchId?.phoneNo || 'Phone Not Available'}</p>
          <p style="text-align: center;">Bill No: ${order.billNo}</p>
          <p style="text-align: center;">Table: ${order.tableId.tableNumber}</p>
          <div class="header">
            <div class="header-left">
              <p>Date: ${dateTime}</p>
              <p>Waiter: ${order.waiterId?.name || 'Not Assigned'}</p>
            </div>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">SL</th>
                <th style="width: 40%;">Description</th>
                <th style="width: 15%;">MRP</th>
                <th style="width: 15%;">Qty</th>
                <th style="width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.products.map((product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${product.name} (${product.quantity}${product.unit}${product.cakeType ? `, ${product.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})
                  </td>
                  <td>₹${product.price.toFixed(2)}</td>
                  <td>${product.quantity}</td>
                  <td>₹${product.productTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="summary">
            <div><span>Tot Qty:</span><span>${totalQty.toFixed(2)}</span></div>
            <div><span>Tot Items:</span><span>${totalItems}</span></div>
            <div><span>Total Amount:</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div><span>SGST:</span><span>₹${sgst.toFixed(2)}</span></div>
            <div><span>CGST:</span><span>₹${cgst.toFixed(2)}</span></div>
            <div><span>Round Off:</span><span>${roundOff >= 0 ? '+' : ''}${roundOff.toFixed(2)}</span></div>
            <div><span>Net Amt:</span><span>₹${totalWithGSTRounded.toFixed(2)}</span></div>
          </div>
          <div class="payment-details">
            <p>Payment Details:</p>
            <p>${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} - ₹${totalWithGSTRounded.toFixed(2)}</p>
            <p>Tender: ₹${tenderAmount.toFixed(2)}</p>
            <p>Balance: ₹${balance.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div style={{ padding: '20px', background: '#FFFFFF', minHeight: 'calc(100vh - 50px)' }}>
      {selectedTable ? (
        <>
          {selectedCategory ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToCategories}
                    style={{ marginRight: '10px', color: '#000000' }}
                  >
                    Back to Categories
                  </Button>
                  <h2 style={{ color: '#000000', margin: 0 }}>
                    Table Order - {selectedTable.tableNumber} - {selectedCategory.name}
                  </h2>
                </div>
                <Space>
                  <Button
                    type={selectedProductType === null ? "primary" : "default"}
                    onClick={() => handleProductTypeFilter(null)}
                  >
                    All
                  </Button>
                  <Button
                    type={selectedProductType === 'cake' ? "primary" : "default"}
                    onClick={() => handleProductTypeFilter('cake')}
                  >
                    Cake
                  </Button>
                  <Button
                    type={selectedProductType === 'non-cake' ? "primary" : "default"}
                    onClick={() => handleProductTypeFilter('non-cake')}
                  >
                    Non-Cake
                  </Button>
                </Space>
              </div>
              {productsLoading ? (
                <div>Loading products...</div>
              ) : filteredProducts.length > 0 ? (
                <Row gutter={[16, 24]} justify="center">
                  {filteredProducts.map(product => {
                    const selectedUnitIndex = selectedUnits[product._id] || 0;
                    const selectedProduct = currentTabSelections.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
                    const count = selectedProduct ? selectedProduct.count : 0;
                    const stockInfo = branchInventory.find(item => item.productId._id === product._id);
                    const availableStock = stockInfo ? stockInfo.inStock : 0;
                    const currentCount = currentTabSelections
                      .filter(item => item._id === product._id)
                      .reduce((sum, item) => sum + item.count, 0);
                    const isOutOfStock = currentCount >= availableStock;

                    return (
                      <Col
                        key={product._id}
                        span={24 / columns}
                        style={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              width: cardSize,
                              height: cardSize,
                              borderRadius: 8,
                              overflow: 'hidden',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                              cursor: 'pointer',
                              border: count > 0 ? '3px solid #95BF47' : 'none',
                            }}
                            onClick={() => handleProductClick(product)}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: product.isVeg ? 'green' : 'red',
                                zIndex: 1,
                              }}
                            />
                            {product.images?.length > 0 ? (
                              <Image
                                src={`${BACKEND_URL}/uploads/${product.images[0]}`}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                preview={false}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                No Image
                              </div>
                            )}
                            <div
                              style={{
                                position: 'absolute',
                                top: 5,
                                left: 5,
                                background: 'rgba(0, 0, 0, 0.6)',
                                color: '#FFFFFF',
                                fontSize: `${fontSize * 0.7}px`,
                                fontWeight: 'bold',
                                padding: '2px 5px',
                                borderRadius: 4,
                                maxWidth: '80%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {product.name}
                              <span
                                style={{
                                  marginLeft: 5,
                                  color: isOutOfStock ? 'red' : 'rgb(150, 191, 71)',
                                  fontSize: `${fontSize * 0.7}px`,
                                  fontWeight: 'bold',
                                }}
                              >
                                {isOutOfStock ? 'OS' : `-${availableStock}`}
                              </span>
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 5,
                                left: 5,
                                right: 5,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  color: '#FFFFFF',
                                  fontSize: `${fontSize * 0.9}px`,
                                  fontWeight: 'bold',
                                  padding: '2px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {formatPriceDetails(product.priceDetails, selectedUnitIndex)}
                              </div>
                              <div style={{ width: '40%' }} onClick={stopPropagation}>
                                <Select
                                  value={selectedUnitIndex}
                                  onChange={(value) => handleUnitChange(product._id, value)}
                                  size="small"
                                  style={{ width: '100%' }}
                                >
                                  {product.priceDetails?.map((detail, index) => (
                                    <Option key={index} value={index}>
                                      {formatUnitLabel(detail, product.productType)}
                                    </Option>
                                  ))}
                                </Select>
                              </div>
                              {count > 0 && (
                                <div
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    color: '#FFFFFF',
                                    fontSize: `${fontSize * 0.9}px`,
                                    fontWeight: 'bold',
                                    padding: '2px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {count}
                                </div>
                              )}
                            </div>
                          </div>
                          {count > 0 && (
                            <CheckCircleFilled
                              style={{
                                position: 'absolute',
                                top: -12,
                                right: -12,
                                fontSize: '24px',
                                color: '#95BF47',
                              }}
                            />
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <div>No products found for this category.</div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToTables}
                  style={{ marginRight: '10px', color: '#000000' }}
                >
                  Back to Tables
                </Button>
                <h2 style={{ color: '#000000', margin: 0 }}>Table Order - {selectedTable.tableNumber}</h2>
              </div>
              <Row gutter={[16, 24]} justify="center">
                {categories.length > 0 ? (
                  categories.map(category => (
                    <Col
                      key={category._id}
                      span={24 / columns}
                      style={{ display: 'flex', justifyContent: 'center' }}
                    >
                      <div
                        style={{
                          width: cardSize,
                          height: cardSize,
                          borderRadius: 8,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category.image ? (
                          <Image
                            src={`${BACKEND_URL}/${category.image}`}
                            alt={category.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            No Image
                          </div>
                        )}
                        <div style={{ width: '100%', background: '#000000', textAlign: 'center' }}>
                          <span
                            style={{
                              color: '#FFFFFF',
                              fontSize: `${fontSize}px`,
                              fontWeight: 'bold',
                              display: 'block',
                              lineHeight: `${lineHeight}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {category.name}
                          </span>
                        </div>
                      </div>
                    </Col>
                  ))
                ) : (
                  <div>No categories found</div>
                )}
              </Row>
            </>
          )}
        </>
      ) : (
        <>
          <h2 style={{ color: '#000000', marginBottom: '15px' }}>Table Order</h2>
          {tablesLoading ? (
            <div>Loading tables...</div>
          ) : tableCategories.length > 0 ? (
            tableCategories.map(category => (
              <div key={category._id} style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#000000', marginBottom: '15px' }}>{category.name}</h3>
                <Row gutter={[16, 24]} justify="center">
                  {category.tables.map(table => (
                    <Col
                      key={table._id}
                      span={24 / columns}
                      style={{ display: 'flex', justifyContent: 'center' }}
                    >
                      <div
                        style={{
                          width: cardSize,
                          height: cardSize,
                          borderRadius: 8,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          cursor: 'pointer',
                          border: table.status === 'Occupied' ? '3px solid #ff4d4f' : '3px solid #52c41a',
                        }}
                        onClick={() => handleTableClick(table)}
                      >
                        <span style={{ color: table.status === 'Occupied' ? '#ff4d4f' : '#52c41a', fontSize: `${fontSize}px`, fontWeight: 'bold' }}>
                          {table.tableNumber}
                        </span>
                        <span style={{ color: table.status === 'Occupied' ? '#ff4d4f' : '#52c41a', fontSize: `${fontSize * 0.8}px` }}>
                          {table.status}
                        </span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          ) : (
            <div>No tables found. Create table categories in the user menu.</div>
          )}
        </>
      )}

      {selectedTable && currentTabSelections.length > 0 && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
          <h3>Cart - Table {selectedTable.tableNumber}</h3>
          {lastBillNo && <p style={{ fontWeight: 'bold' }}>Last Bill No: {lastBillNo}</p>}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Enter Waiter ID:</label>
            <Input
              value={waiterInput}
              onChange={(e) => handleWaiterInputChange(e.target.value)}
              placeholder="Enter waiter ID (e.g., 4 for E004)"
              style={{ width: '100%' }}
            />
            {waiterName && <p style={{ marginTop: '5px', color: '#52c41a' }}>Waiter: {waiterName}</p>}
            {waiterError && <p style={{ marginTop: '5px', color: '#ff4d4f' }}>{waiterError}</p>}
          </div>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {currentTabSelections.map(product => (
              <li key={`${product._id}-${product.selectedUnitIndex}`} style={{ marginBottom: '30px', fontSize: '14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ flex: 1 }}>{formatDisplayName(product)}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{formatPriceDetails(product.priceDetails, product.selectedUnitIndex)} x {product.count}</span>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemoveProduct(product._id, product.selectedUnitIndex)}
                    style={{ color: '#ff4d4f', fontSize: '14px', marginLeft: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingBottom: '5px', borderBottom: '1px dotted #d9d9d9' }}>
                  <Space size="middle">
                    <Button
                      type="default"
                      icon={<MinusOutlined />}
                      onClick={() => handleDecreaseCount(product._id, product.selectedUnitIndex)}
                      size="small"
                      style={{ backgroundColor: '#ff4d4f', color: '#ffffff' }}
                    />
                    <span>{product.count}</span>
                    <Button
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={() => handleIncreaseCount(product._id, product.selectedUnitIndex)}
                      size="small"
                      style={{ backgroundColor: '#95BF47', color: '#ffffff' }}
                    />
                  </Space>
                  <span style={{ fontWeight: 'bold' }}>₹{calculateProductTotal(product)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '20px', borderTop: '1px solid #d9d9d9', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
              <span>Total (Excl. GST)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
              <span>GST</span>
              <span>₹{totalGST.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold' }}>
              <span>Total (Incl. GST)</span>
              <span>₹{totalWithGST.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '5px' }}>
              <span>Total Items</span>
              <span>{uniqueItems}</span>
            </div>
          </div>
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <Radio.Group
              onChange={(e) => setPaymentMethod(e.target.value)}
              value={paymentMethod}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
            >
              <Radio.Button value="cash" style={{ borderRadius: '50px', textAlign: 'center' }}>
                <WalletOutlined /> Cash
              </Radio.Button>
              <Radio.Button value="upi" style={{ borderRadius: '50px', textAlign: 'center' }}>
                <CreditCardOutlined /> UPI
              </Radio.Button>
            </Radio.Group>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{ flex: 1, marginRight: '10px' }}
              disabled={lastBillNo && currentTabSelections.length === 0}
            >
              Save
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handleSaveAndPrint}
              style={{ flex: 1 }}
              disabled={lastBillNo && currentTabSelections.length === 0}
            >
              Save & Print
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOrder;