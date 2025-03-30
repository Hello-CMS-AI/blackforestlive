import React, { useState, useEffect, useRef } from "react";
import { Layout, Button, Space, Row, Col, message, Image, Radio, Badge, Tooltip, Select, Dropdown, Menu, Input } from "antd";
import { LogoutOutlined, ShoppingCartOutlined, MenuOutlined, ArrowLeftOutlined, CheckCircleFilled, PlusOutlined, MinusOutlined, CloseOutlined, WalletOutlined, CreditCardOutlined, SaveOutlined, PrinterOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { jwtDecode as jwtDecodeLib } from "jwt-decode";

const { Header, Content, Sider } = Layout;
const { Option } = Select;

const BillingPage = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [name, setName] = useState("Branch User");
  const [branchName, setBranchName] = useState("");
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [lastBillNo, setLastBillNo] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [todayAssignment, setTodayAssignment] = useState({});
  const [branchInventory, setBranchInventory] = useState([]);

  const contentRef = useRef(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apib.dinasuvadu.in/';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      if (!storedToken) {
        router.replace('/login');
        return;
      }

      try {
        const decoded = jwtDecodeLib(storedToken);
        if (decoded.role !== 'branch') {
          router.replace('/login');
          return;
        }
        setName(decoded.name || decoded.username || "Branch User");
        setBranchName(`Branch ${branchId.replace('B', '')}`);
      } catch (error) {
        console.error('Error decoding token:', error);
        router.replace('/login');
      }

      fetchBranchDetails(storedToken, branchId);
      fetchCategories(storedToken);
      fetchEmployees(storedToken, 'Cashier', setCashiers);
      fetchEmployees(storedToken, 'Manager', setManagers);
      fetchTodayAssignment(storedToken);
      fetchBranchInventory(storedToken);

      setIsMobile(window.innerWidth <= 991);
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);

      const updateContentWidth = () => {
        if (contentRef.current) {
          setContentWidth(contentRef.current.getBoundingClientRect().width);
        }
      };

      updateContentWidth();
      window.addEventListener("resize", updateContentWidth);

      const handleOrientationChange = (e) => {
        setIsPortrait(e.matches);
        setIsMobileMenuOpen(false);
        updateContentWidth();
      };

      const mediaQuery = window.matchMedia("(orientation: portrait)");
      mediaQuery.addEventListener("change", handleOrientationChange);

      const handleResize = () => {
        setIsMobile(window.innerWidth <= 991);
        updateContentWidth();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        mediaQuery.removeEventListener("change", handleOrientationChange);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [router, branchId]);

  const fetchBranchDetails = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branch/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBranchName(data.name || `Branch ${branchId.replace('B', '')}`);
      } else {
        message.error('Failed to fetch branch details');
      }
    } catch (error) {
      message.error('Error fetching branch details');
    }
  };

  const fetchCategories = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCategories(data);
      else message.error('Failed to fetch categories');
    } catch (error) {
      message.error('Error fetching categories');
    }
    setLoading(false);
  };

  const fetchEmployees = async (token, team, setter) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/employees?team=${team}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredEmployees = data.filter(employee => employee.status === 'Active');
        setter(filteredEmployees);
      } else {
        message.error(`Failed to fetch ${team}s`);
      }
    } catch (error) {
      message.error(`Error fetching ${team}s`);
    }
  };

  const fetchTodayAssignment = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}/today`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTodayAssignment(data);
        if (data.cashierId) setSelectedCashier(data.cashierId._id);
        if (data.managerId) setSelectedManager(data.managerId._id);
      } else {
        message.error('Failed to fetch today\'s assignment');
      }
    } catch (error) {
      message.error('Error fetching today\'s assignment');
    }
  };

  const fetchBranchInventory = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory?locationId=${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBranchInventory(data);
      } else {
        message.error('Failed to fetch branch inventory');
      }
    } catch (error) {
      message.error('Error fetching branch inventory');
    }
  };

  const fetchProducts = async (categoryId) => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredProducts = data.filter(product => product.category?._id === categoryId);
        setProducts(filteredProducts);
        applyFilters(filteredProducts);
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

  const applyFilters = (productList) => {
    let filtered = productList;
    if (selectedProductType) {
      filtered = filtered.filter(product => product.productType === selectedProductType);
    }
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (selectedCategory) {
      applyFilters(products);
    }
  };

  const handleProductTypeFilter = (type) => {
    setSelectedProductType(type);
    if (selectedCategory) {
      applyFilters(products);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedProductType(null);
    setSearchQuery("");
    fetchProducts(category._id);
    setSelectedUnits({});
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
    const stockInfo = branchInventory.find(item => item.productId._id === product._id);
    const availableStock = stockInfo ? stockInfo.inStock : 0;
    const currentCount = selectedProducts
      .filter(item => item._id === product._id)
      .reduce((sum, item) => sum + item.count, 0);
  
    if (currentCount >= availableStock) {
      message.warning(`${product.name} is out of stock at this branch! (Stock: ${availableStock})`);
      return;
    }
  
    setSelectedProducts(prev => {
      const existingProduct = prev.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
      const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || "non-gst"; // Default to "non-gst" if undefined
      if (existingProduct) {
        return prev.map(item =>
          item._id === product._id && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count + 1 }
            : item
        );
      } else {
        return [...prev, { 
          ...product, 
          selectedUnitIndex, 
          count: 1, 
          bminstock: 0,
          gstRate // Add gstRate explicitly to preserve it
        }];
      }
    });
  };

  const handleIncreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      return prev.map(item =>
        item._id === productId && item.selectedUnitIndex === selectedUnitIndex
          ? { ...item, count: item.count + 1 }
          : item
      );
    });
  };

  const handleDecreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      const existingProduct = prev.find(item => item._id === productId && item.selectedUnitIndex === selectedUnitIndex);
      if (existingProduct.count === 1) {
        return prev.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
      } else {
        return prev.map(item =>
          item._id === productId && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count - 1 }
            : item
        );
      }
    });
  };

  const handleRemoveProduct = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      return prev.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
    });
    setLastBillNo(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSearchQuery("");
    setSelectedUnits({});
    setLastBillNo(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setName('Branch User');
    router.replace('/login');
  };

  const handleCartToggle = () => {
    setIsCartExpanded(!isCartExpanded);
    message.info(`Cart ${isCartExpanded ? 'collapsed' : 'expanded'}`);
    setTimeout(() => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.getBoundingClientRect().width);
      }
    }, 0);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSwipe = (e) => {
    if (!selectedCategory) return;

    const touch = e.changedTouches[0];
    const swipeDistance = touch.clientX - touchStartX;
    if (swipeDistance > 50) { // Swipe right threshold
      handleBackToCategories();
    }
  };

  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleSave = async () => {
    if (selectedProducts.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }

    const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

    const orderData = {
      branchId,
      tab: 'billing',
      products: selectedProducts.map(product => {
        const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
        return {
          productId: product._id,
          name: product.name,
          quantity: product.count,
          price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
          unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
          gstRate: gstRate, // Use "non-gst" instead of 0
          productTotal: calculateProductTotal(product),
          productGST: gstRate === "non-gst" ? 0 : calculateProductGST(product), // Force 0 for non-gst
          bminstock: product.bminstock || 0,
        };
      }),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'draft',
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
        setSelectedProducts([]);
      } else {
        message.error(data.message || 'Failed to save order');
      }
    } catch (error) {
      message.error('Error saving order');
    }
  };

  const handleSaveAndPrint = async () => {
    if (selectedProducts.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }

    const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

    const totalWithGSTRounded = Math.round(totalWithGST);
    const roundOff = totalWithGSTRounded - totalWithGST;
    const tenderAmount = totalWithGSTRounded;
    const balance = tenderAmount - totalWithGSTRounded;
    const sgst = totalGST / 2;
    const cgst = totalGST / 2;

    const orderData = {
      branchId,
      tab: 'billing',
      products: selectedProducts.map(product => {
        const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
        return {
          productId: product._id,
          name: product.name,
          quantity: product.count,
          price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
          unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
          gstRate: gstRate, // Use "non-gst" instead of 0
          productTotal: calculateProductTotal(product),
          productGST: gstRate === "non-gst" ? 0 : calculateProductGST(product), // Force 0 for non-gst
          bminstock: product.bminstock || 0,
        };
      }),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'completed',
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
        await reduceBranchStock(data.order);
        printReceipt(data.order, todayAssignment, {
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
        setSelectedProducts([]);
      } else {
        message.error(data.message || 'Failed to save and print order');
      }
    } catch (error) {
      message.error('Error saving and printing order');
    }
  };

  const reduceBranchStock = async (order) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/reduce`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId: order.branchId,
          products: order.products.map(product => ({
            productId: product.productId,
            quantity: product.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Stock updated successfully');
      } else {
        message.error(data.message || 'Failed to reduce stock');
      }
    } catch (error) {
      message.error('Error reducing stock');
    }
  };

  const printReceipt = async (order, todayAssignment, summary) => {
    const { totalQty, subtotal, totalWithGSTRounded } = summary;
    const { sgst, cgst } = summary;
    const totalGST = sgst + cgst;
    const dateTime = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');
  
    // =============================================
    // 1. Build the ESC/POS thermal printer commands
    // =============================================
    let escposCommands = [
      '\x1B\x40', // Initialize printer
      '\x1B\x61\x01', // Center align
      '\x1D\x21\x11', // Double height/width
      `${order.branchId?.name || 'MY STORE'}\n`,
      '\x1D\x21\x00', // Normal text
      '\x1B\x61\x00', // Left align
      `${order.branchId?.address || ''}\n`,
      `Phone: ${order.branchId?.phoneNo || 'N/A'}\n`,
      `Bill No: ${order.billNo}\n`,
      `Date: ${dateTime}\n`,
      '--------------------------------\n',
      '\x1B\x45\x01', // Bold on
      'ITEM           QTY  PRICE  AMOUNT\n',
      '\x1B\x45\x00', // Bold off
      '--------------------------------\n'
    ];
  
    // Add products
    order.products.forEach(product => {
      escposCommands.push(
        `${truncate(product.name, 14).padEnd(14)} ` +
        `${product.quantity.toString().padEnd(3)} ` +
        `₹${product.price.toFixed(2).padEnd(6)} ` +
        `₹${product.productTotal.toFixed(2)}\n`
      );
    });
  
    // Add summary
    escposCommands.push(
      '--------------------------------\n',
      `Subtotal: ₹${subtotal.toFixed(2).padStart(24)}\n`
    );
  
    if (totalGST > 0) {
      escposCommands.push(
        `GST: ₹${totalGST.toFixed(2).padStart(29)}\n`
      );
    }
  
    escposCommands.push(
      `TOTAL: ₹${totalWithGSTRounded.toFixed(2).padStart(27)}\n`,
      '\n',
      '\x1B\x61\x01', // Center align
      'Thank you for your purchase!\n',
      '\n\n\n',
      '\x1B\x69' // Paper cut (if supported)
    );
  
    // =============================================
    // 2. Print directly to USB thermal printer
    // =============================================
    try {
      await printViaUSB(escposCommands.join(''));
      return { success: true, billNo: order.billNo };
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to iframe printing if USB fails
      return await fallbackToIframePrinting(order, todayAssignment, summary);
    }
  };
  
  // =============================================
  // Helper Functions
  // =============================================
  
  async function printViaUSB(content) {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported. Please use Chrome/Edge.');
    }
  
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 }); // Adjust baud rate if needed
  
    const writer = port.writable.getWriter();
    await writer.write(new TextEncoder().encode(content));
    
    writer.releaseLock();
    await port.close();
  }
  
  async function fallbackToIframePrinting(order, todayAssignment, summary) {
    // Your existing iframe printing implementation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 302px; 
              margin: 0; 
              padding: 5px; 
              font-size: 12px; 
              line-height: 1.3; 
              color: #000; 
              font-weight: bold; 
            }
            h1 { 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold; 
              margin: 0 0 3px 0; 
              color: #000; 
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
              width: 100%; 
              color: #000; 
              font-weight: bold; 
            }
            .header-left { 
              text-align: left; 
              max-width: 50%; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              color: #000; 
              font-weight: bold; 
            }
            .header-right { 
              text-align: right; 
              max-width: 50%; 
              white-space: nowrap; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              color: #000; 
              font-weight: bold; 
            }
            p { 
              margin: 2px 0; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              color: #000; 
              font-weight: bold; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 5px; 
              color: #000; 
              font-weight: bold; 
            }
            th, td { 
              padding: 5px 2px; 
              text-align: left; 
              font-size: 12px; 
              color: #000; 
              font-weight: bold; 
              vertical-align: top; 
            }
            th { 
              font-weight: bold; 
              color: #000; 
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 5px 0; 
            }
            .summary { 
              margin-top: 5px; 
              color: #000; 
              font-weight: bold; 
            }
            .summary div {
              display: flex;
              justify-content: flex-end;
              white-space: nowrap;
              color: #000;
              font-weight: bold;
              font-size: 12px;
            }
            .summary div span {
              color: #000;
              font-weight: bold;
              font-size: 12px;
            }
            .summary div span:first-child {
              margin-right: 5px;
            }
            .grand-total {
              font-weight: 900;
              font-size: 22px;
              color: #000;
              margin-top: 10px;
              padding-top: 5px;
              border-top: 1px dashed #000;
              display: flex;
              justify-content: flex-end;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .grand-total span:first-child {
              font-size: 1.5em;
              margin-right: 5px;
            }
            .grand-total span:last-child {
              font-size: 1.5em;
            }
            .thank-you {
              text-align: center;
              margin-top: 10px;
              color: #000;
              font-weight: bold;
              font-size: 14px;
            }
            .before-grand-total {
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
              margin-bottom: 5px;
            }
            .item-row { 
              display: flex; 
              width: 100%; 
            }
            .item-name { 
              flex: 2; 
              word-break: break-word; 
              padding-right: 10px; 
            }
            .item-qty { 
              flex: 0.7; 
              text-align: right; 
              padding-right: 10px; 
            }
            .item-price { 
              flex: 1.2; 
              text-align: right; 
              padding-right: 10px; 
            }
            .item-amount { 
              flex: 1.3; 
              text-align: right; 
            }
            @media print { 
              @page { 
                margin: 0; 
                size: 80mm auto; 
              } 
              body { 
                margin: 0; 
                padding: 5px; 
                width: 302px; 
              } 
            }
          </style>
        </head>
        <body>
          <h1>${order.branchId?.name || 'Unknown Branch'}</h1>
          <p style="text-align: center;">${order.branchId?.address || 'Address Not Available'}</p>
          <p style="text-align: center;">Phone: ${order.branchId?.phoneNo || 'Phone Not Available'}</p>
          <p style="text-align: center;">Bill No: ${order.billNo}</p>
          <div class="header">
            <div class="header-left">
              <p>Date: ${dateTime}</p>
              <p>Manager: ${todayAssignment?.managerId?.name || 'Not Assigned'}</p>
            </div>
            <div class="header-right">
              <p>Cashier: ${todayAssignment?.cashierId?.name || 'Not Assigned'}</p>
            </div>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 15%; text-align: right;">Qty</th>
                <th style="width: 15%; text-align: right;">Price</th>
                <th style="width: 20%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.products
                .map(
                  (product) => `
                  <tr>
                    <td style="white-space: normal; word-break: break-word; vertical-align: top; padding-right: 10px;">
                      ${product.name} (${product.quantity}${product.unit}${
                    product.cakeType
                      ? `, ${product.cakeType === 'freshCream' ? 'FC' : 'BC'}`
                      : ''
                  })
                    </td>
                    <td style="text-align: right; vertical-align: top; padding-right: 10px;">${product.quantity}</td>
                    <td style="text-align: right; vertical-align: top; padding-right: 10px;">₹${product.price.toFixed(
                      2
                    )}</td>
                    <td style="text-align: right; vertical-align: top;">₹${product.productTotal.toFixed(
                      2
                    )}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="summary">
            <div><span style="font-weight: bold; font-size: 12px;">Total Qty: ${totalQty.toFixed(
              2
            )}</span><span style="font-weight: bold; font-size: 12px;">Total Amount: ₹${subtotal.toFixed(
              2
            )}</span></div>
            ${
              totalGST > 0
                ? `
                <div style="display: flex; justify-content: flex-end;"><span style="font-weight: bold; font-size: 12px;">SGST:</span><span style="font-weight: bold; font-size: 12px;">₹${sgst.toFixed(
                  2
                )}</span></div>
                <div style="display: flex; justify-content: flex-end;"><span style="font-weight: bold; font-size: 12px;">CGST:</span><span style="font-weight: bold; font-size: 12px;">₹${cgst.toFixed(
                  2
                )}</span></div>
              `
                : ''
            }
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>₹${totalWithGSTRounded.toFixed(2)}</span>
            </div>
          </div>
          <p class="thank-you">Thank You !! Visit Again</p>
        </body>
      </html>
    `);
    doc.close();
  
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  
    return new Promise((resolve) => {
      iframe.contentWindow.onafterprint = () => {
        document.body.removeChild(iframe);
        resolve({ success: true, billNo: order.billNo });
      };
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
        resolve({ success: true, billNo: order.billNo });
      }, 1000);
    });
  }
  
  function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n-1) + '…' : str;
  }
  
  // Add padding functions if not already available
  if (!String.prototype.padEnd) {
    String.prototype.padEnd = function(length, padString = ' ') {
      if (this.length >= length) return this.toString();
      return this + padString.repeat(length - this.length);
    };
  }
  
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(length, padString = ' ') {
      if (this.length >= length) return this.toString();
      return padString.repeat(length - this.length) + this;
    };
  }

  const getCardSize = () => {
    if (typeof window === 'undefined') return 200;
    if (window.innerWidth >= 1600) return 200;
    if (window.innerWidth >= 1400) return 180;
    if (window.innerWidth >= 1200) return 160;
    if (window.innerWidth >= 992) return 150;
    if (window.innerWidth >= 768) return isPortrait ? 140 : 150;
    if (window.innerWidth >= 576) return isPortrait ? 120 : 130;
    return isPortrait ? 100 : 110;
  };

  const cardSize = getCardSize();
  const gutter = 16;
  const columns = contentWidth > 0 ? Math.floor(contentWidth / (cardSize + gutter)) : 1;
  const fontSize = isPortrait && window.innerWidth <= 575 ? 10 : Math.max(cardSize * 0.1, 12);
  const lineHeight = Math.max(cardSize * 0.3, 20);

  const formatPriceDetails = (priceDetails, selectedUnitIndex = 0) => {
    if (!priceDetails || priceDetails.length === 0 || typeof selectedUnitIndex !== 'number') return 'No Price';
    const detail = priceDetails[selectedUnitIndex];
    return `₹${detail.price}`;
  };

  const formatUnitLabel = (detail, productType) => {
    const baseLabel = `${detail.quantity}${detail.unit}`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseLabel} (${cakeTypeLabel})`;
    }
    return baseLabel;
  };

  const formatTooltip = (detail, productType) => {
    const baseTooltip = `Unit: ${detail.quantity}${detail.unit}, GST: ${detail.gst}%`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseTooltip}, Type: ${cakeTypeLabel}`;
    }
    return baseTooltip;
  };

  const formatDisplayName = (product) => {
    const detail = product.priceDetails?.[product.selectedUnitIndex];
    if (!detail) return product.name;
    const baseName = `${product.name} (${detail.quantity}${detail.unit}${product.productType === 'cake' && detail.cakeType ? `, ${detail.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})`;
    return baseName;
  };

  const calculateProductTotal = (product) => {
    if (!product.priceDetails || product.priceDetails.length === 0) return 0;
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const price = product.priceDetails[selectedUnitIndex]?.price || 0;
    return price * product.count;
  };

  const calculateProductGST = (product) => {
    const productTotal = calculateProductTotal(product);
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || "non-gst";
    if (gstRate === "non-gst" || typeof gstRate !== 'number') return 0; // No GST for non-gst items
    return productTotal * (gstRate / 100);
  };

  const calculateCartTotals = () => {
    const totalQty = selectedProducts.reduce((sum, product) => sum + product.count, 0);
    const uniqueItems = selectedProducts.length;
    const subtotal = selectedProducts.reduce((sum, product) => sum + calculateProductTotal(product), 0);
    const totalGST = selectedProducts.reduce((sum, product) => sum + calculateProductGST(product), 0);
    const totalWithGST = subtotal + totalGST;
    return { totalQty, uniqueItems, subtotal, totalGST, totalWithGST };
  };

  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

  const saveAssignment = async () => {
    if (!selectedCashier && !selectedManager) {
      message.warning('Please select at least one cashier or manager');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cashierId: selectedCashier,
          managerId: selectedManager,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Assignment saved successfully');
        setTodayAssignment(data.assignment);
      } else {
        message.error(data.message || 'Failed to save assignment');
      }
    } catch (error) {
      message.error('Error saving assignment');
    }
  };

  const userMenu = (
    <div style={{ padding: '10px', background: '#fff', borderRadius: '4px', width: '300px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Cashier:</label>
        <Select
          value={selectedCashier}
          onChange={(value) => setSelectedCashier(value)}
          style={{ width: '100%' }}
          placeholder="Select a cashier"
          allowClear
        >
          {cashiers.length > 0 ? (
            cashiers.map(cashier => (
              <Option key={cashier._id} value={cashier._id}>
                {cashier.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No cashiers available</Option>
          )}
        </Select>
        {todayAssignment.cashierId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Cashier: {todayAssignment.cashierId.name}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Manager:</label>
        <Select
          value={selectedManager}
          onChange={(value) => setSelectedManager(value)}
          style={{ width: '100%' }}
          placeholder="Select a manager"
          allowClear
        >
          {managers.length > 0 ? (
            managers.map(manager => (
              <Option key={manager._id} value={manager._id}>
                {manager.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No managers available</Option>
          )}
        </Select>
        {todayAssignment.managerId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Manager: {todayAssignment.managerId.name}
          </p>
        )}
      </div>

      <Button type="primary" onClick={saveAssignment} block style={{ marginBottom: '15px' }}>
        Confirm Assignment
      </Button>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: "#000000",
          padding: "0 20px",
          color: "#FFFFFF",
          height: "64px",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Left Side: User Icon and Username */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Space align="center">
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Button
                type="text"
                icon={<UserOutlined />}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              />
            </Dropdown>
            <span style={{ fontSize: "14px", color: "#FFFFFF" }}>
              {name} |
            </span>
          </Space>
        </div>

        {/* Center: Search Bar */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {selectedCategory && (
            <Input
              placeholder="Search products by name"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '600px', // Increased width
                height: '40px',
                fontSize: '16px',
                borderRadius: '8px',
                background: '#fff',
                color: '#000',
              }}
            />
          )}
        </div>

        {/* Right Side: Filter Buttons, Cart, Logout, and Mobile Menu */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleMobileMenu}
            style={{
              display: isPortrait || isMobile ? "block" : "none",
              fontSize: "18px",
              color: "#FFFFFF",
              marginRight: "10px",
            }}
          />
          <div
            style={{
              display: isPortrait || isMobile ? "none" : "flex",
              alignItems: "center",
            }}
          >
            <Space align="center">
              <Button
                type={selectedProductType === null ? "primary" : "text"}
                onClick={() => handleProductTypeFilter(null)}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                All
              </Button>
              <Button
                type={selectedProductType === 'cake' ? "primary" : "text"}
                onClick={() => handleProductTypeFilter('cake')}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                Cake
              </Button>
              <Button
                type={selectedProductType === 'non-cake' ? "primary" : "text"}
                onClick={() => handleProductTypeFilter('non-cake')}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                Non-Cake
              </Button>
              <Badge count={selectedProducts.length} showZero>
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleCartToggle}
                  style={{
                    fontSize: "24px",
                    color: "#FFFFFF",
                    marginRight: '10px',
                  }}
                />
              </Badge>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                Logout
              </Button>
            </Space>
          </div>
        </div>
      </Header>

      <Layout style={{ flex: 1, marginTop: '64px' }}>
        <Content
          ref={contentRef}
          style={{
            padding: '20px',
            background: '#FFFFFF',
            flex: isCartExpanded ? '80%' : '100%',
            minHeight: 'calc(100vh - 64px)',
            position: 'relative',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleSwipe}
        >
          <div style={{ marginBottom: '20px' }}>
            {selectedCategory ? (
              <>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToCategories}
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '24px',
                    color: '#000000',
                    zIndex: 1,
                  }}
                />
                {productsLoading ? (
                  <div>Loading products...</div>
                ) : (
                  <Row gutter={[16, 24]} justify="center">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <Col
                          key={product._id}
                          span={24 / columns}
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          {renderProductCard(product)}
                        </Col>
                      ))
                    ) : (
                      <div>No products found for this category.</div>
                    )}
                  </Row>
                )}
              </>
            ) : (
              <>
                <h2 style={{ color: '#000000', marginBottom: '15px' }}>Billing</h2>
                <Row gutter={[16, 24]} justify="center">
                  {loading ? (
                    <div>Loading categories...</div>
                  ) : categories.length > 0 ? (
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
                          <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: 0, margin: 0 }}>
                            {category.image ? (
                              <Image
                                src={`${BACKEND_URL}/${category.image}`}
                                alt={category.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                                preview={false}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>No Image</div>
                            )}
                          </div>
                          <div style={{ width: '100%', background: '#000000', textAlign: 'center', padding: 0, margin: 0 }}>
                            <span
                              style={{
                                color: '#FFFFFF',
                                fontSize: `${fontSize}px`,
                                fontWeight: 'bold',
                                padding: 0,
                                margin: 0,
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
          </div>
        </Content>
        <Sider
          collapsed={!isCartExpanded}
          width={400}
          trigger={null}
          style={{
            background: '#FFFFFF',
            boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
            display: isCartExpanded ? 'block' : 'none',
          }}
        >
          <div style={{ padding: '20px', color: '#000000', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '15px' }}>Cart</h3>
            {lastBillNo && (
              <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                Last Bill No: {lastBillNo}
              </p>
            )}
            {selectedProducts.length > 0 ? (
              <>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
  {selectedProducts.map(product => {
    const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
    return (
      <li key={`${product._id}-${product.selectedUnitIndex}`} style={{ marginBottom: '30px', fontSize: '14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ flex: 1 }}>
            {formatDisplayName(product)}{gstRate === "non-gst" ? " (Non-GST)" : ""}
          </span>
          <span style={{ flex: 1, textAlign: 'right' }}>
            {formatPriceDetails(product.priceDetails, product.selectedUnitIndex)} x {product.count}
          </span>
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
          <span style={{ fontWeight: 'bold' }}>
            ₹{calculateProductTotal(product)}
            {gstRate !== "non-gst" && ` + ₹${calculateProductGST(product).toFixed(2)} GST`}
          </span>
        </div>
      </li>
    );
  })}
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
                    disabled={lastBillNo && selectedProducts.length === 0}
                  >
                    Save
                  </Button>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handleSaveAndPrint}
                    style={{ flex: 1 }}
                    disabled={lastBillNo && selectedProducts.length === 0}
                  >
                    Save & Print
                  </Button>
                </div>
              </>
            ) : (
              <p>No products selected.</p>
            )}
          </div>
        </Sider>
      </Layout>
    </Layout>
  );

  function renderProductCard(product) {
    const selectedUnitIndex = selectedUnits[product._id] || 0;
    const selectedProduct = selectedProducts.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
    const count = selectedProduct ? selectedProduct.count : 0;
    const stockInfo = branchInventory.find(item => item.productId._id === product._id);
    const availableStock = stockInfo ? stockInfo.inStock : 0;
    const currentCount = selectedProducts
      .filter(item => item._id === product._id)
      .reduce((sum, item) => sum + item.count, 0);
    const isOutOfStock = currentCount >= availableStock;

    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: cardSize,
            height: cardSize,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
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
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={`${BACKEND_URL}/uploads/${product.images[0]}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                preview={false}
              />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>
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
                cursor: 'pointer',
              }}
            >
              <Tooltip
                title={
                  product.priceDetails?.[selectedUnitIndex]
                    ? formatTooltip(product.priceDetails[selectedUnitIndex], product.productType)
                    : 'No Details'
                }
              >
                {formatPriceDetails(product.priceDetails, selectedUnitIndex)}
              </Tooltip>
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
    );
  }
};

export async function getServerSideProps(context) {
  const { params } = context;
  const { branchId } = params;

  return {
    props: {
      branchId,
    },
  };
}

BillingPage.useLayout = false;
export default BillingPage;