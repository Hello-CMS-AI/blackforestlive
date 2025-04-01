import React, { useState, useEffect } from 'react';
import { Table, Button, message, Row, Col, Popconfirm } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const DealerCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch categories from the backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/dealer/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setCategories(result);
      } else {
        message.error(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      message.error('Server error while fetching categories');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://apib.dinasuvadu.in/api/dealer/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Dealer category deleted successfully');
        fetchCategories(); // Refresh the list
      } else {
        message.error(result.message || 'Failed to delete category');
      }
    } catch (err) {
      message.error('Server error while deleting category');
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Define table columns
  const columns = [
    { title: 'Category Name', dataIndex: 'category_name', key: 'category_name', ellipsis: true },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Parent Category',
      dataIndex: 'parent_category',
      key: 'parent_category',
      render: (parent) => (parent ? parent.category_name : '-'),
    },
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
            onClick={() => router.push(`/dealers/category/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
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
            Dealer Category List
          </h1>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/dealers/category/create')}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  color: '#ffffff',
                }}
              >
                Create Dealer Category
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={categories}
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


export default DealerCategoryList;