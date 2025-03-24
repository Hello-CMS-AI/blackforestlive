import React from 'react';
import { Card, Space, Typography, Row, Col, Button, Dropdown, Menu } from 'antd';
import { StockOutlined, FileTextOutlined, FileDoneOutlined, DollarOutlined, DownOutlined, BankOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CategoryDashboard = () => {
  // Dropdown menu for StockEntry
  const stockMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="https://apib.dinasuvadu.in/dealers/stock-entry/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="https://apib.dinasuvadu.in/dealers/stock-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  // Dropdown menu for BillEntry
  const billMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="https://apib.dinasuvadu.in/dealers/bill-entry/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="https://apib.dinasuvadu.in/dealers/bill-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  // Dropdown menu for ClosingEntry
  const closingMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="https://apib.dinasuvadu.in/dealers/closing-entry/closingentry">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="https://apib.dinasuvadu.in/dealers/closing-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)', // Gradient background
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        {/* Page Title */}
        <Title
          level={2}
          style={{
            marginBottom: '40px',
            color: '#1a3042',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Entry Dashboard
        </Title>

        {/* Grid of Category Cards - First Row */}
        <Row gutter={[24, 24]} justify="center">
          {/* StockEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Stock Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={stockMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<StockOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* BillEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Bill Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={billMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<FileTextOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* ClosingEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Closing Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={closingMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<FileDoneOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* ExpenseEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Expense Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<DollarOutlined />}
                href="https://apib.dinasuvadu.in/dealers/expense/ExpenseEntry"
                style={{ width: '150px' }}
              >
                Expense Entry
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Second Row for Financial Management */}
        <Row gutter={[24, 24]} justify="center" style={{ marginTop: '24px' }}>
          {/* Financial Management Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Financial Management"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<BankOutlined />}
                href="https://apib.dinasuvadu.in/FinancialManagement"
                style={{ width: '150px' }}
              >
                Finance
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

CategoryDashboard.useLayout = false;
export default CategoryDashboard;