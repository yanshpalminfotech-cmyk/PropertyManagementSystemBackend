import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, Card } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AxiosError } from 'axios';

const { Title } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

/**
 * Login page with email/password form.
 * Handles error display including account lockout (403).
 */
const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const onFinish = async (values: LoginFormValues) => {
        setLoading(true);
        setError(null);
        try {
            await login(values);
            navigate('/dashboard');
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ message: string; statusCode: number }>;
            const message = axiosErr.response?.data?.message || 'Login failed. Please try again.';
            const status = axiosErr.response?.status;

            if (status === 403) {
                setError(message);
            } else {
                setFailedAttempts((prev) => prev + 1);
                if (failedAttempts + 1 >= 5) {
                    setError('Too many failed attempts. Your account may be locked. Please contact support.');
                } else {
                    setError(message);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
            <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                    SuratPropertyHub
                </Title>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 400 }}>
                    Sign in to your account
                </Title>

                {error && (
                    <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />
                )}

                <Form<LoginFormValues> layout="vertical" onFinish={onFinish} autoComplete="off">
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
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/register">New customer? Register here</Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
