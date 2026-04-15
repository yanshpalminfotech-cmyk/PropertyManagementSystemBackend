import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, Card, notification, Radio } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, SolutionOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../../api/auth';
import { AxiosError } from 'axios';
import { UserRole } from '../../types/enums';

const { Title } = Typography;

interface RegisterFormValues {
    name: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
}

/**
 * User self-registration page. Public route — allows registering as Customer or Broker.
 */
const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: RegisterFormValues) => {
        setLoading(true);
        setError(null);
        try {
            await registerApi({
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password,
                role: values.role,
            });
            notification.success({
                message: 'Registration Successful',
                description: 'Registration successful. Please log in.',
            });
            navigate('/login');
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ message: string; statusCode: number }>;
            const message = axiosErr.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
            <Card style={{ width: 440, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '20px' }}>
                <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                    Create Account
                </Title>

                {error && (
                    <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />
                )}

                <Form<RegisterFormValues> 
                    layout="vertical" 
                    onFinish={onFinish} 
                    autoComplete="off"
                    initialValues={{ role: UserRole.CUSTOMER }}
                >
                    <Form.Item
                        name="role"
                        label="Registration Type"
                        rules={[{ required: true, message: 'Please select a registration type' }]}
                    >
                        <Radio.Group style={{ width: '100%' }} buttonStyle="solid">
                            <Radio.Button value={UserRole.CUSTOMER} style={{ width: '50%', textAlign: 'center' }}>
                                <UserOutlined /> Customer
                            </Radio.Button>
                            <Radio.Button value={UserRole.BROKER} style={{ width: '50%', textAlign: 'center' }}>
                                <SolutionOutlined /> Broker
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[{ required: true, message: 'Please enter your phone number' }]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="+1234567890" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            { required: true, message: 'Please enter a password' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password (min 8 chars)" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm Password"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Register
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/login">Already have an account? Sign in</Link>
                </div>
            </Card>
        </div>
    );
};

export default Register;

