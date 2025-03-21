import React, { useState, useEffect } from 'react';
import { Table, Button, message, Row, Col, Popconfirm } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch products from the backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api10.theblackforestcakes.com/api/dealer/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setProducts(result);
      } else {
        message.error(result.message || 'Failed to fetch products');
      }
    } catch (err) {
      message.error('Server error while fetching products');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://api10.theblackforestcakes.com/api/dealer/products/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Product deleted successfully');
        fetchProducts(); // Refresh the list
      } else {
        message.error(result.message || 'Failed to delete product');
      }
    } catch (err) {
      message.error('Server error while deleting product');
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Define table columns
  const columns = [
    { title: 'Product Name', dataIndex: 'product_name', key: 'product_name', ellipsis: true },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (category ? category.category_name : '-'),
    },
    { title: 'Barcode No', dataIndex: 'barcode_no', key: 'barcode_no' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => (price ? `₹${price.toFixed(2)}` : '-') }, // Changed $ to ₹
    { title: 'Stock Quantity', dataIndex: 'stock_quantity', key: 'stock_quantity', render: (qty) => (qty !== undefined ? qty : '-') },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            type="link"
            icon={<EditFilled />}
            style={{ color: '#1890ff', padding: '0 8px' }}
            onClick={() => router.push(`/dealers/product/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<DeleteFilled />}
              style={{ color: '#ff4d4f', padding: '0 8px' }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={24} md={24} lg={22} xl={20}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
            Product List
          </h1>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/dealers/product/create')}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  color: '#ffffff',
                }}
              >
                Create Product
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={products}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 5, showSizeChanger: true, style: { marginTop: '20px', textAlign: 'center' } }}
              scroll={{ x: 'max-content' }}
              style={{ width: '100%' }}
              tableLayout="auto"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

// Opt out of Layout component
ProductList.useLayout = false;

export default ProductList;