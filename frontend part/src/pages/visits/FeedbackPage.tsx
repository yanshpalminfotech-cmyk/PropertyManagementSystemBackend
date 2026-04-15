import React from 'react';
import { Table, Tag, Typography, Spin, Result, Button, Tooltip } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getFeedbacks } from '../../api/visits';
import { formatDate } from '../../utils/formatDate';
import type { VisitFeedbackDetail } from '../../types/VisitRequest';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/enums';

const { Title, Text } = Typography;

const interestColor: Record<string, string> = {
    NOT_INTERESTED: 'red',
    MAYBE: 'orange',
    INTERESTED: 'blue',
    VERY_INTERESTED: 'green',
};

const interestLabel: Record<string, string> = {
    NOT_INTERESTED: 'Not Interested',
    MAYBE: 'Maybe',
    INTERESTED: 'Interested',
    VERY_INTERESTED: 'Very Interested',
};

/**
 * Feedback page — Admin & Broker only.
 * Admin sees all property feedback; Broker sees only feedback for their properties.
 */
const FeedbackPage: React.FC = () => {
    const { role } = useAuth();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['visit-feedback'],
        queryFn: getFeedbacks,
    });

    const columns: ColumnsType<VisitFeedbackDetail> = [
        {
            title: 'Visit ID',
            dataIndex: 'visitCode',
            key: 'visitCode',
            width: 120,
        },
        {
            title: 'Property',
            key: 'property',
            render: (_: unknown, r: VisitFeedbackDetail) => (
                <div>
                    <div><strong>{r.property.propertyCode}</strong></div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                        {r.property.propertyType} · {r.property.category} · {r.property.location}
                    </div>
                </div>
            ),
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_: unknown, r: VisitFeedbackDetail) => (
                <div>
                    <div><strong>{r.customer.name}</strong></div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{r.customer.email}</div>
                </div>
            ),
        },
        {
            title: 'Visit Date',
            key: 'visitDate',
            render: (_: unknown, r: VisitFeedbackDetail) => (
                <div>
                    <div>{formatDate(r.visitDate)}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{r.startTime} – {r.endTime}</div>
                </div>
            ),
        },
        {
            title: 'Interest Level',
            dataIndex: 'interestLevel',
            key: 'interestLevel',
            render: (level: string) => (
                <Tag color={interestColor[level] ?? 'default'}>
                    {interestLabel[level] ?? level}
                </Tag>
            ),
        },
        {
            title: 'Feedback',
            dataIndex: 'feedback',
            key: 'feedback',
            ellipsis: true,
            render: (text: string) =>
                text ? (
                    <Tooltip title={text}>
                        <Text ellipsis style={{ maxWidth: 220 }}>
                            {text}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: 'Submitted On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => formatDate(d),
            sorter: (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            defaultSortOrder: 'descend',
        },
    ];

    if (isError) {
        return (
            <Result
                status="error"
                title="Failed to load feedback"
                extra={<Button type="primary" onClick={() => refetch()}>Retry</Button>}
            />
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Visit Feedback</Title>
                <Text type="secondary">
                    {role === UserRole.ADMIN
                        ? 'All customer feedback across every property on the platform.'
                        : 'Customer feedback for visits to your properties.'}
                </Text>
            </div>

            <Spin spinning={isLoading}>
                <Table<VisitFeedbackDetail>
                    columns={columns}
                    dataSource={Array.isArray(data) ? data : []}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{ emptyText: 'No feedback submitted yet.' }}
                />
            </Spin>
        </div>
    );
};

export default FeedbackPage;
