import React, { useState, useEffect } from 'react';
import {
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Card,
  Tooltip,
} from 'antd';
import { SaveOutlined, CreditCardOutlined, MobileOutlined, DollarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router'; // Import useRouter for navigation
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { Text, Title } = Typography;

const ClosingEntry = () => {
  const router = useRouter(); // Initialize router for navigation
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [branchId, setBranchId] = useState(null);
  const [date, setDate] = useState(dayjs()); // Default to current date
  const [productSales, setProductSales] = useState(0);
  const [cakeSales, setCakeSales] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [creditCardPayment, setCreditCardPayment] = useState(0);
  const [upiPayment, setUpiPayment] = useState(0);
  const [cashPayment, setCashPayment] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [netResult, setNetResult] = useState(0);

  // Fetch branches on page load
  useEffect(() => {
    fetchBranches();
  }, []);

  // Recalculate totals whenever inputs change
  useEffect(() => {
    const total = (productSales || 0) + (cakeSales || 0);
    setTotalSales(total);

    const totalPay = (creditCardPayment || 0) + (upiPayment || 0) + (cashPayment || 0);
    setTotalPayments(totalPay);

    setNetResult(total - (expenses || 0));
  }, [productSales, cakeSales, expenses, creditCardPayment, upiPayment, cashPayment]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api10.theblackforestcakes.com/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      } else {
        message.error('Failed to fetch branches');
      }
    } catch (err) {
      message.error('Server error while fetching branches');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!branchId) {
      message.error('Please select a branch');
      return;
    }
    if (!date) {
      message.error('Please select a date');
      return;
    }
    if (productSales === null || productSales === undefined) {
      message.error('Please enter product sales');
      return;
    }
    if (cakeSales === null || cakeSales === undefined) {
      message.error('Please enter cake sales');
      return;
    }
    if (expenses === null || expenses === undefined) {
      message.error('Please enter expenses');
      return;
    }
    if (
      creditCardPayment === null ||
      creditCardPayment === undefined ||
      upiPayment === null ||
      upiPayment === undefined ||
      cashPayment === null ||
      cashPayment === undefined
    ) {
      message.error('Please enter all payment amounts');
      return;
    }

    // Validate payment totals
    if (totalPayments !== totalSales) {
      message.error(`Total payments (₹${totalPayments}) must equal total sales (₹${totalSales})`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('https://api10.theblackforestcakes.com/api/closing-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          date: date.format('YYYY-MM-DD'),
          productSales,
          cakeSales,
          expenses,
          creditCardPayment,
          upiPayment,
          cashPayment,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        message.success('Closing entry submitted successfully');
        // Reset form
        setBranchId(null);
        setDate(dayjs());
        setProductSales(0);
        setCakeSales(0);
        setExpenses(0);
        setCreditCardPayment(0);
        setUpiPayment(0);
        setCashPayment(0);
      } else {
        message.error(result.message || 'Failed to submit closing entry');
      }
    } catch (err) {
      message.error('Server error while submitting closing entry');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        <Title
          level={2}
          style={{
            textAlign: 'center',
            marginBottom: '20px', // Reduced margin to make space for the button
            color: '#1a3042',
            fontWeight: 'bold',
          }}
        >
          Closing Entry
        </Title>

        {/* Add View Closing Entries Button */}
        <Space style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Button
            type="default"
            icon={<UnorderedListOutlined />}
            onClick={() => router.push('/dealers/closing-entry/list')}
            style={{
              background: 'linear-gradient(to right, #34495e, #1a3042)',
              borderColor: '#34495e',
              color: '#fff',
            }}
          >
            View Closing Entries
          </Button>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '30px',
              alignItems: 'start',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr',
              },
            }}
          >
            {/* Form Section */}
            <Card
              title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Enter Closing Details</Title>}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                transition: 'all 0.3s ease',
              }}
              hoverable
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '15px',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <Text strong>Branch:</Text>
                <Select
                  placeholder="Select Branch"
                  value={branchId}
                  onChange={(value) => setBranchId(value)}
                  allowClear
                  style={{ width: '100%' }}
                  size="large"
                >
                  {branches.map((branch) => (
                    <Option key={branch._id} value={branch._id}>
                      {branch.name}
                    </Option>
                  ))}
                </Select>

                <Text strong>Date:</Text>
                <DatePicker
                  value={date}
                  onChange={(value) => setDate(value || dayjs())}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  size="large"
                />

                <Text strong>Product Sales (₹):</Text>
                <InputNumber
                  value={productSales}
                  onChange={(value) => setProductSales(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />

                <Text strong>Cake Sales (₹):</Text>
                <InputNumber
                  value={cakeSales}
                  onChange={(value) => setCakeSales(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />

                <Text strong>Expenses (₹):</Text>
                <InputNumber
                  value={expenses}
                  onChange={(value) => setExpenses(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />

                {/* Payment Breakdown */}
                <Text strong>
                  Credit Card (₹):
                  <Tooltip title="Amount paid via credit/debit card">
                    <CreditCardOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  value={creditCardPayment}
                  onChange={(value) => setCreditCardPayment(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />

                <Text strong>
                  UPI (₹):
                  <Tooltip title="Amount paid via UPI (e.g., Google Pay, PhonePe)">
                    <MobileOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  value={upiPayment}
                  onChange={(value) => setUpiPayment(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />

                <Text strong>
                  Cash (₹):
                  <Tooltip title="Amount paid in cash">
                    <DollarOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  value={cashPayment}
                  onChange={(value) => setCashPayment(value)}
                  min={0}
                  formatter={(value) => `₹${value}`}
                  parser={(value) => value.replace('₹', '')}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                size="large"
                style={{
                  width: '150px',
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '0 auto',
                  transition: 'all 0.3s ease',
                }}
              >
                Submit
              </Button>
            </Card>

            {/* Summary Section */}
            <Card
              title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Summary</Title>}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                transition: 'all 0.3s ease',
                position: 'sticky',
                top: '40px',
              }}
              hoverable
            >
              <Space direction="vertical" style={{ width: '100%', fontSize: '14px' }}>
                {/* Sales and Expenses */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Product Sales:</Text>
                  <Text>₹{productSales || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Cake Sales:</Text>
                  <Text>₹{cakeSales || 0}</Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: '1px solid #e8e8e8',
                    fontWeight: 'bold',
                  }}
                >
                  <Text strong>Total Sales:</Text>
                  <Text strong>₹{totalSales}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Expenses:</Text>
                  <Text>₹{expenses || 0}</Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: '1px solid #e8e8e8',
                    fontWeight: 'bold',
                  }}
                >
                  <Text strong>Net Result:</Text>
                  <Text
                    strong
                    style={{
                      color: netResult >= 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '16px',
                    }}
                  >
                    ₹{netResult}
                  </Text>
                </div>

                {/* Payment Breakdown */}
                <div style={{ marginTop: '20px' }}>
                  <Title level={5} style={{ margin: 0, color: '#34495e' }}>
                    Payment Breakdown
                  </Title>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <Text>
                      <CreditCardOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      Credit Card:
                    </Text>
                    <Text>₹{creditCardPayment || 0}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>
                      <MobileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      UPI:
                    </Text>
                    <Text>₹{upiPayment || 0}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>
                      <DollarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      Cash:
                    </Text>
                    <Text>₹{cashPayment || 0}</Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderTop: '1px solid #e8e8e8',
                      fontWeight: 'bold',
                    }}
                  >
                    <Text strong>Total Payments:</Text>
                    <Text
                      strong
                      style={{
                        color: totalPayments === totalSales ? '#52c41a' : '#ff4d4f',
                        fontSize: '14px',
                      }}
                    >
                      ₹{totalPayments}
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

ClosingEntry.useLayout = false;
export default ClosingEntry;