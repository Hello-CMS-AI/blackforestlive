import React, { useState, useEffect } from 'react';
import { Table, Select, DatePicker, Button, Spin, Typography, Space, Card } from 'antd';
import { RedoOutlined, PrinterOutlined, PlusOutlined, StockOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ClosingEntryList = () => {
  const [closingEntries, setClosingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [netResultFilter, setNetResultFilter] = useState('All');
  const [dateFilterType, setDateFilterType] = useState('Created');

  useEffect(() => {
    fetchBranches();
    fetchClosingEntries();
  }, []);

  useEffect(() => {
    let filtered = [...closingEntries];

    if (branchFilter) {
      filtered = filtered.filter((entry) => entry.branchId._id === branchFilter);
    }

    if (dateRangeFilter && dateRangeFilter.length === 2) {
      const startDate = dayjs(dateRangeFilter[0]).startOf('day');
      const endDate = dayjs(dateRangeFilter[1]).endOf('day');
      filtered = filtered.filter((entry) => {
        const entryDate = dateFilterType === 'Created' ? dayjs(entry.createdAt) : dayjs(entry.date);
        return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    if (netResultFilter === 'Profit') {
      filtered = filtered.filter((entry) => entry.netResult >= 0);
    } else if (netResultFilter === 'Loss') {
      filtered = filtered.filter((entry) => entry.netResult < 0);
    }

    setFilteredEntries(filtered);
  }, [closingEntries, branchFilter, dateRangeFilter, netResultFilter, dateFilterType]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchClosingEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/closing-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setClosingEntries(result);
        setFilteredEntries(result);
      }
    } catch (err) {
      console.error('Error fetching closing entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBranchFilter(null);
    setDateRangeFilter(null);
    setNetResultFilter('All');
    setDateFilterType('Created');
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Closing Entry List</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .positive { color: #52c41a; }
              .negative { color: #ff4d4f; }
            }
          </style>
        </head>
        <body>
          <h1>Closing Entry List</h1>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Product Sales</th>
                <th>Cake Sales</th>
                <th>Total Sales</th>
                <th>Expenses</th>
                <th>Net Result</th>
                <th>Credit Card</th>
                <th>UPI</th>
                <th>Cash</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries
                .map(
                  (entry, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${entry.branchId?.name || 'N/A'}</td>
                      <td>${dayjs(entry.date).format('YYYY-MM-DD')}</td>
                      <td>₹${entry.productSales}</td>
                      <td>₹${entry.cakeSales}</td>
                      <td>₹${entry.productSales + entry.cakeSales}</td>
                      <td>₹${entry.expenses}</td>
                      <td class="${entry.netResult >= 0 ? 'positive' : 'negative'}">₹${entry.netResult}</td>
                      <td>₹${entry.creditCardPayment}</td>
                      <td>₹${entry.upiPayment}</td>
                      <td>₹${entry.cashPayment}</td>
                      <td>${dayjs(entry.createdAt).format('YYYY-MM-DD hh:mm A')}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      width: 100,
    },
    {
      title: 'Product Sales',
      dataIndex: 'productSales',
      key: 'productSales',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Cake Sales',
      dataIndex: 'cakeSales',
      key: 'cakeSales',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Total Sales',
      key: 'totalSales',
      sorter: (a, b) => a.productSales + a.cakeSales - (b.productSales + b.cakeSales),
      render: (record) => `₹${record.productSales + record.cakeSales}`,
      width: 120,
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Net Result',
      dataIndex: 'netResult',
      key: 'netResult',
      sorter: (a, b) => a.netResult - b.netResult,
      render: (value) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ₹{value}
        </Text>
      ),
      width: 120,
    },
    {
      title: 'Credit Card',
      dataIndex: 'creditCardPayment',
      key: 'creditCardPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'UPI',
      dataIndex: 'upiPayment',
      key: 'upiPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => dayjs(date).format('YYYY-MM-DD hh:mm A'),
      width: 160,
    },
  ];

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
      <div style={{ maxWidth: '1600px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Space>
            {/* Stock Icon Button (Create) */}
            <Button
              type="default"
              size="large"
              icon={<StockOutlined />}
              href="https://blackforestlive.netlify.app/dealers/stock-entry/create"
            />
            {/* Stock Text Button (List) */}
            <Button
              type="default"
              size="large"
              href="https://blackforestlive.netlify.app/dealers/stock-entry/list"
            >
              Stock List
            </Button>
            {/* Bill Entry Icon Button (Create) */}
            <Button
              type="default"
              size="large"
              icon={<FileTextOutlined />}
              href="https://blackforestlive.netlify.app/dealers/bill-entry/create"
            />
            {/* Bill Entry Text Button (List) */}
            <Button
              type="default"
              size="large"
              href="https://blackforestlive.netlify.app/dealers/bill-entry/list"
            >
              Bill Entry List
            </Button>
            {/* Expense Entry Button (Unchanged) */}
            <Button
              type="default"
              size="large"
              icon={<DollarOutlined />}
              href="https://blackforestlive.netlify.app/dealers/expense/ExpenseEntry"
            >
              Expense Entry
            </Button>
          </Space>

          <Title
            level={2}
            style={{
              margin: 0,
              color: '#1a3042',
              fontWeight: 'bold',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Closing Entry List
          </Title>

          <div style={{ width: '300px' }}></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <Space wrap style={{ width: '100%', padding: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Branch</Text>
                  <Select
                    placeholder="All Branches"
                    value={branchFilter}
                    onChange={(value) => setBranchFilter(value)}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {branches.map((branch) => (
                      <Option key={branch._id} value={branch._id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Filter</Text>
                  <Space>
                    <Select
                      value={dateFilterType}
                      onChange={(value) => setDateFilterType(value)}
                      style={{ width: '120px' }}
                    >
                      <Option value="Created">Created</Option>
                      <Option value="Date">Date</Option>
                    </Select>
                    <RangePicker
                      value={dateRangeFilter}
                      onChange={(dates) => setDateRangeFilter(dates)}
                      format="YYYY-MM-DD"
                      style={{ width: '250px' }}
                    />
                  </Space>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Net Result</Text>
                  <Select
                    value={netResultFilter}
                    onChange={(value) => setNetResultFilter(value)}
                    style={{ width: '150px' }}
                  >
                    <Option value="All">All</Option>
                    <Option value="Profit">Profit</Option>
                    <Option value="Loss">Loss</Option>
                  </Select>
                </div>

                <Space style={{ marginTop: '20px' }}>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                  />
                  <Button
                    type="default"
                    icon={<RedoOutlined />}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    href="https://blackforestlive.netlify.app/dealers/closing-entry/closingentry"
                  >
                    Create Closing Bill
                  </Button>
                </Space>
              </Space>
            </Card>

            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredEntries}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                bordered
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

ClosingEntryList.useLayout = false;
export default ClosingEntryList;