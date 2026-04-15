import React from 'react';
import { Card, Typography, Row, Col, Statistic, Spin, Alert, Tag, Button } from 'antd';
import { 
    HomeOutlined, UserOutlined, SolutionOutlined, TeamOutlined, 
    ArrowRightOutlined, ClockCircleOutlined, CheckCircleOutlined, 
    CalendarOutlined, FileDoneOutlined 
} from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard';
import { UserRole } from '../types/enums';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Dashboard page — Shows statistics and quick links based on user role.
 */
const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);
    
    // All roles can see basic stats now, just tailored
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
        enabled: !!role,
    });

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2}>Welcome back, {user?.name}!</Title>
                <Text type="secondary">
                    You are logged in as <Tag color="blue" style={{ marginLeft: 4 }}>{role}</Tag>.
                </Text>
            </div>

            {isError && (
                <Alert
                    message="Error"
                    description="Failed to load dashboard statistics."
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <Spin spinning={isLoading}>
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={8}>
                        <Card hoverable onClick={() => navigate('/properties')} style={{ borderLeft: '4px solid #1890ff' }}>
                            <Statistic 
                                title="Total Properties" 
                                value={stats?.totalProperties || 0} 
                                prefix={<HomeOutlined />} 
                                suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card hoverable onClick={() => navigate(role === UserRole.ADMIN ? '/brokers' : '/properties')} style={{ borderLeft: '4px solid #fa8c16' }}>
                            <Statistic 
                                title="Total Brokers" 
                                value={stats?.totalBrokers || 0} 
                                prefix={<SolutionOutlined />} 
                                suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card hoverable onClick={() => navigate(role === UserRole.ADMIN ? '/customers' : '/properties')} style={{ borderLeft: '4px solid #52c41a' }}>
                            <Spin spinning={isLoading}>
                                <Statistic 
                                    title="Total Customers" 
                                    value={stats?.totalCustomers || 0} 
                                    prefix={<TeamOutlined />} 
                                    suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf' }} />}
                                />
                            </Spin>
                        </Card>
                    </Col>
                </Row>
            </Spin>


            <Row gutter={[16, 16]}>
                <Col xs={24} sm={24}>
                    <Card title="Quick Navigation" bordered={false}>
                        <Text>Use the sidebar to explore properties, manage your requests, and update your profile.</Text>
                        <div style={{ marginTop: 16 }}>
                            <Button type="primary" ghost onClick={() => navigate('/properties')}>Browse Properties</Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;


