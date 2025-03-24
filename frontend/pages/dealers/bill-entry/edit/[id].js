import React, { useState, useEffect } from 'react';
import { Space,Form, Input, Select, Button, Upload, message, Row, Col, Spin, Modal } from 'antd';
import { UploadOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';

const { Option } = Select;
const { Item } = Form;

const EditBillEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [billData, setBillData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState([]); // Manage fileList state for preview
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchBillData();
      fetchDealers();
      fetchBranches();
    }
  }, [id]);

  const fetchBillData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://159.89.163.222/api/dealers/bills/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBillData(result);
        const initialFileList = result.billImage
          ? [{ uid: '-1', name: 'Current Image', status: 'done', url: `http://159.89.163.222/${result.billImage}` }]
          : [];
        setFileList(initialFileList);
        form.setFieldsValue({
          billNumber: result.billNumber,
          amount: result.amount,
          dealer: result.dealer?._id,
          branch: result.branch?._id,
          billImage: initialFileList,
        });
        console.log('Initial fileList:', initialFileList);
      } else {
        message.error(result.message || 'Failed to fetch bill data');
      }
    } catch (err) {
      message.error('Server error while fetching bill data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const response = await fetch('http://159.89.163.222/api/dealers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setDealers(result);
      } else {
        message.error('Failed to fetch dealers');
      }
    } catch (err) {
      message.error('Server error while fetching dealers');
      console.error('Error:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://159.89.163.222/api/branches/public', {
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
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    console.log('Form values on submit:', values); // Debug log
    const formData = new FormData();
    formData.append('billNumber', values.billNumber);
    formData.append('amount', values.amount);
    formData.append('dealer', values.dealer);
    formData.append('branch', values.branch);

    // Check if a new file is uploaded
    if (values.billImage && values.billImage.length > 0) {
      const file = values.billImage[0];
      if (file.originFileObj) {
        formData.append('billImage', file.originFileObj);
        console.log('New file uploaded:', file.originFileObj.name);
      } else {
        console.log('No new file to upload, keeping existing image');
      }
    } else if (fileList.length === 0) {
      formData.append('removeImage', 'true');
      console.log('Image removal requested');
    } else {
      console.log('No changes to bill image');
    }

    try {
      const response = await fetch(`http://159.89.163.222/api/dealers/bills/${id}`, {
        method: 'PUT',
        body: formData,
      });
      const result = await response.json();
      console.log('Backend response:', result); // Debug log
      if (response.ok) {
        message.success('Bill updated successfully');
        router.push('/dealers/bill-entry/list');
      } else {
        message.error(result.message || 'Failed to update bill');
      }
    } catch (err) {
      message.error('Server error while updating bill');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form failed:', errorInfo);
    message.error('Please check the form errors');
  };

  const normFile = (e) => {
    console.log('normFile e:', e);
    if (Array.isArray(e)) {
      return e;
    }
    if (e && e.fileList) {
      return Array.isArray(e.fileList) ? e.fileList : [];
    }
    return [];
  };

  const beforeUpload = (file) => {
    const isValidType = /image\/(jpeg|jpg|png)|application\/pdf/.test(file.type);
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isValidType) {
      message.error('Only JPEG, JPG, PNG, and PDF files are allowed!');
      return Upload.LIST_IGNORE;
    }
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }
    return true; // Allow upload
  };

  const showModal = (imageUrl) => {
    setPreviewImage(imageUrl);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setPreviewImage('');
  };

  const handleRemoveImage = () => {
    setFileList([]);
    form.setFieldsValue({ billImage: [] });
    console.log('Image removed, fileList cleared');
  };

  const handleChange = ({ fileList: newFileList }) => {
    console.log('handleChange newFileList:', newFileList);
    const updatedFileList = newFileList.map((file) => {
      if (file.originFileObj && !file.url) {
        return { ...file, url: URL.createObjectURL(file.originFileObj), status: 'done' };
      }
      return file;
    });
    setFileList(updatedFileList);
    form.setFieldsValue({ billImage: updatedFileList });
    console.log('Updated fileList:', updatedFileList);
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>Edit Bill Entry</h1>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <Form
                form={form}
                name="editBillForm"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                layout="vertical"
                initialValues={{ billImage: [] }}
              >
                <Item
                  name="billNumber"
                  label="Bill Number"
                  rules={[{ required: true, message: 'Please input the bill number!' }]}
                >
                  <Input placeholder="Enter bill number" />
                </Item>

                <Item
                  name="amount"
                  label="Amount (₹)"
                  rules={[{ required: true, message: 'Please input the amount!' }]}
                >
                  <Input type="number" placeholder="Enter amount" min={0} />
                </Item>

                <Item
                  name="dealer"
                  label="Dealer"
                  rules={[{ required: true, message: 'Please select a dealer!' }]}
                >
                  <Select placeholder="Select a dealer" allowClear>
                    {dealers.map((dealer) => (
                      <Option key={dealer._id} value={dealer._id}>
                        {dealer.dealer_name}
                      </Option>
                    ))}
                  </Select>
                </Item>

                <Item
                  name="branch"
                  label="Branch"
                  rules={[{ required: true, message: 'Please select a branch!' }]}
                >
                  <Select placeholder="Select a branch" allowClear>
                    {branches.map((branch) => (
                      <Option key={branch._id} value={branch._id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </Item>

                <Item
                  name="billImage"
                  label="Bill Image"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                  <Upload
                    name="billImage"
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    fileList={fileList}
                    maxCount={1}
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    showUploadList={false} // Hide default upload list
                  >
                    {fileList.length < 1 && (
                      <Button icon={<UploadOutlined />}>Upload New Bill Image</Button>
                    )}
                  </Upload>
                </Item>

                {fileList.length > 0 && (
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                    <img
                      src={fileList[0].url}
                      alt="Bill Preview"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: '#fff',
                        border: 'none',
                      }}
                      onClick={() => showModal(fileList[0].url)}
                    />
                    <Button
                      type="link"
                      icon={<CloseOutlined />}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#ff4d4f',
                        border: 'none',
                      }}
                      onClick={handleRemoveImage}
                    />
                  </div>
                )}

                <Item>
                  <Space>
                    <Button type="primary" htmlType="submit" style={{ background: 'linear-gradient(to right, #34495e, #1a3042)', borderColor: '#34495e', color: '#ffffff' }}>
                      Save Changes
                    </Button>
                    <Button type="default" onClick={() => router.push('/dealers/bill-entry/list')}>
                      Back
                    </Button>
                  </Space>
                </Item>
              </Form>
            </div>
          )}
        </Col>
      </Row>

      <Modal
        title="View Bill"
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {previewImage ? (
          <img
            src={previewImage}
            alt="Bill Preview"
            style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
            onError={(e) => {
              console.error('Image load error:', e);
              message.error('Failed to load bill image');
            }}
          />
        ) : (
          <p>No bill image available</p>
        )}
      </Modal>
    </div>
  );
};

export default EditBillEntry;