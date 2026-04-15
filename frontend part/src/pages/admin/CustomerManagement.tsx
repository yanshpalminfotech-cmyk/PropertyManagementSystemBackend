import React, { useState } from 'react';
import { Table, Tag, Button, Space, Typography, Modal, Form, Input, message, Popconfirm, Tooltip, Switch } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, deleteUser, type User } from '@/api/users';
import { UserRole } from '@/types/enums';
import { formatDate } from '@/utils/formatDate';
import { KeyOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CustomerManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [form] = Form.useForm();

    const { data: customers, isLoading } = useQuery({
        queryKey: ['users', 'CUSTOMER'],
        queryFn: () => getUsers('CUSTOMER'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
        onSuccess: () => {
            message.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['users', 'CUSTOMER'] });
            setIsPasswordModalOpen(false);
            form.resetFields();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update user');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteUser(id),
        onSuccess: () => {
            message.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users', 'CUSTOMER'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to delete user');
        },
    });

    const handleToggleStatus = (user: User) => {
        const newStatus = user.status === 1 ? 0 : 1;
        updateMutation.mutate({ id: user.id, data: { status: newStatus } });
    };

    const handlePasswordReset = (values: any) => {
        if (selectedUser) {
            updateMutation.mutate({ id: selectedUser.id, data: { password: values.password } });
        }
    };

    const openPasswordModal = (user: User) => {
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <UserOutlined />
                    <Typography.Text strong>{text}</Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'User Code',
            dataIndex: 'userCode',
            key: 'userCode',
            render: (code: string) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: 'Joined Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: number, record: User) => (
                <Space>
                    <Tag color={status === 1 ? 'green' : 'orange'}>
                        {status === 1 ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                    <Switch
                        size="small"
                        checked={status === 1}
                        onChange={() => handleToggleStatus(record)}
                        loading={updateMutation.isPending && selectedUser?.id === record.id}
                    />
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space size="middle">
                    <Tooltip title="Reset Password">
                        <Button
                            icon={<KeyOutlined />}
                            onClick={() => openPasswordModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete User"
                        description="Are you sure you want to delete this customer? This action is permanent (soft delete)."
                        onConfirm={() => deleteMutation.mutate(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Customer Management</Title>
            </div>

            <Table
                columns={columns}
                dataSource={customers}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={`Reset Password for ${selectedUser?.name}`}
                open={isPasswordModalOpen}
                onCancel={() => setIsPasswordModalOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handlePasswordReset}
                >
                    <Form.Item
                        name="password"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please enter a new password' },
                            { min: 8, message: 'Password must be at least 8 characters' }
                        ]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending} block>
                            Update Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomerManagement;
