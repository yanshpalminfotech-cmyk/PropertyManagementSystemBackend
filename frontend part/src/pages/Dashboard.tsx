import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { HomeOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';

const { Title } = Typography;

/**
 * Dashboard page — simple welcome screen after login.
 */
const Dashboard: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);

    return (
        <div>
            <Title level={3}>Welcome back, {user?.name}!</Title>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Role" value={role || ''} prefix={<UserOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Properties" value="View All" prefix={<HomeOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Site Visits" value="Manage" prefix={<CalendarOutlined />} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
