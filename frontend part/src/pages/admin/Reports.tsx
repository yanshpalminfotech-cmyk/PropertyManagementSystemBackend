import React from 'react';
import { Card, Row, Col, Statistic, Table, Tabs, Typography, Spin, Space, Tag, Empty } from 'antd';
import { 
    LineChartOutlined, 
    HomeOutlined, 
    TeamOutlined, 
    SolutionOutlined, 
    DashboardOutlined,
    ArrowUpOutlined,
    UserOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { 
    getDailySummary, 
    getPropertyPerformance, 
    getBrokerPerformance, 
    getCustomerEngagement 
} from '@/api/reports';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatArea } from '@/utils/formatArea';
import { formatDate } from '@/utils/formatDate';

const { Title, Text } = Typography;

const ReportsPage: React.FC = () => {
    // Queries
    const summaryQuery = useQuery({ queryKey: ['reports', 'summary'], queryFn: getDailySummary });
    const propertyQuery = useQuery({ queryKey: ['reports', 'properties'], queryFn: getPropertyPerformance });
    const brokerQuery = useQuery({ queryKey: ['reports', 'brokers'], queryFn: getBrokerPerformance });
    const customerQuery = useQuery({ queryKey: ['reports', 'customers'], queryFn: getCustomerEngagement });

    const isLoading = summaryQuery.isLoading || propertyQuery.isLoading || brokerQuery.isLoading || customerQuery.isLoading;

    const summaryData = summaryQuery.data;

    // Table Columns definitions
    const propertyColumns = [
        { title: 'Property Code', dataIndex: 'propertyCode', key: 'propertyCode', render: (v: string) => <Tag color="blue">{v}</Tag> },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Broker', dataIndex: 'brokerName', key: 'brokerName' },
        { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => formatCurrency(v) },
        { title: 'Days Listed', dataIndex: 'dayCount', key: 'dayCount', sorter: (a: any, b: any) => a.dayCount - b.dayCount },
        { title: 'Total Visits', dataIndex: 'totalVisitRequests', key: 'totalVisitRequests', sorter: (a: any, b: any) => a.totalVisitRequests - b.totalVisitRequests },
        { title: 'Completed Visits', dataIndex: 'completedVisits', key: 'completedVisits', render: (v: number) => <Tag color="green">{v}</Tag> },
    ];

    const brokerColumns = [
        { title: 'Broker Name', dataIndex: 'brokerName', key: 'brokerName', render: (v: string) => <Text strong>{v}</Text> },
        { title: 'Total Prop.', dataIndex: 'totalProperties', key: 'totalProperties' },
        { title: 'Active Prop.', dataIndex: 'activeProperties', key: 'activeProperties' },
        { title: 'Closed (Month)', dataIndex: 'closedThisMonth', key: 'closedThisMonth', render: (v: number) => <Tag color="purple">{v}</Tag> },
        { title: 'Visits Conducted', dataIndex: 'siteVisitsConducted', key: 'siteVisitsConducted' },
        { title: 'Conversion Rate', dataIndex: 'conversionRate', key: 'conversionRate', render: (v: number) => <Text type={v > 50 ? 'success' : 'warning'}>{v}%</Text>, sorter: (a: any, b: any) => a.conversionRate - b.conversionRate },
    ];

    const customerColumns = [
        { title: 'Customer Name', dataIndex: 'customerName', key: 'customerName', render: (v: string) => <Text strong>{v}</Text> },
        { title: 'Phone', dataIndex: 'phone', key: 'phone' },
        { title: 'Visits Requested', dataIndex: 'totalVisitsRequested', key: 'totalVisitsRequested' },
        { title: 'Visits Completed', dataIndex: 'visitsCompleted', key: 'visitsCompleted' },
        { title: 'Completion Rate', dataIndex: 'completionRate', key: 'completionRate', render: (v: number) => <Tag color={v > 70 ? 'green' : 'orange'}>{v}%</Tag> },
        { title: 'Top Interest', dataIndex: 'mostCommonInterest', key: 'mostCommonInterest', render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : '-' },
        { title: 'Last Activity', dataIndex: 'lastActivityDate', key: 'lastActivityDate', render: (v: string) => formatDate(v) },
    ];

    const renderSummary = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="New Properties Today"
                            value={summaryData?.total_properties}
                            prefix={<HomeOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Visits Scheduled Today"
                            value={summaryData?.total_visits_scheduled}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Visits Completed Today"
                            value={summaryData?.total_visits_completed}
                            prefix={<SolutionOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="report-card">
                        <Statistic
                            title="Closures Today"
                            value={summaryData?.total_closed_properties}
                            prefix={<ArrowUpOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Today's Top Inquired Properties" bordered={false}>
                {summaryData?.top_inquired_properties && summaryData.top_inquired_properties.length > 0 ? (
                    <Table 
                        dataSource={summaryData.top_inquired_properties}
                        pagination={false}
                        rowKey="propertyId"
                        columns={[
                            { title: 'Property Code', dataIndex: 'propertyCode', key: 'propertyCode' },
                            { title: 'Inquiries Today', dataIndex: 'inquiryCount', key: 'inquiryCount', render: (v) => <Tag color="gold">{v}</Tag> }
                        ]}
                    />
                ) : (
                    <Empty description="No inquiries today yet" />
                )}
            </Card>
        </Space>
    );

    const items = [
        { key: '1', label: (<span><DashboardOutlined />Summary</span>), children: renderSummary() },
        { key: '2', label: (<span><HomeOutlined />Property Performance</span>), children: <Table dataSource={propertyQuery.data} columns={propertyColumns} rowKey="id" pagination={{ pageSize: 8 }} /> },
        { key: '3', label: (<span><SolutionOutlined />Broker Ranking</span>), children: <Table dataSource={brokerQuery.data} columns={brokerColumns} rowKey="brokerName" pagination={{ pageSize: 8 }} /> },
        { key: '4', label: (<span><UserOutlined />Customer Engagement</span>), children: <Table dataSource={customerQuery.data} columns={customerColumns} rowKey="customerName" pagination={{ pageSize: 8 }} /> },
    ];

    return (
        <div style={{ padding: '0px' }}>
            <Title level={2} style={{ marginBottom: 24 }}>System Reports</Title>
            <Spin spinning={isLoading}>
                <Tabs defaultActiveKey="1" items={items} />
            </Spin>
        </div>
    );
};

export default ReportsPage;
