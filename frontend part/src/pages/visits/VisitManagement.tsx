import React from 'react';
import { Table, Button, Tag, Space, notification, Spin, Result, Typography, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyVisitRequests, confirmVisitRequest, cancelVisitRequest, completeVisitRequest } from '../../api/visits';
import { VisitRequestStatus } from '../../types/enums';
import { formatDate } from '../../utils/formatDate';
import type { VisitRequest } from '../../types/VisitRequest';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, CarryOutOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/enums';

const { Title, Text } = Typography;

/**
 * Visit Management page — Admin & Broker only.
 * Allows viewing all visits (admin) or assigned visits (broker) and updating status.
 */
const VisitManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const { role } = useAuth();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-visits'],
        queryFn: getMyVisitRequests,
    });

    const approveMutation = useMutation({
        mutationFn: confirmVisitRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-visits'] });
            notification.success({ message: 'Visit approved' });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: cancelVisitRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-visits'] });
            notification.warning({ message: 'Visit rejected' });
        },
    });

    const completeMutation = useMutation({
        mutationFn: completeVisitRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-visits'] });
            notification.success({ message: 'Visit marked as completed' });
        },
    });

    const statusColor: Record<string, string> = {
        [VisitRequestStatus.PENDING]: 'blue',
        [VisitRequestStatus.CONFIRMED]: 'orange',
        [VisitRequestStatus.CANCELLED]: 'red',
        [VisitRequestStatus.COMPLETED]: 'green',
    };

    const columns: ColumnsType<VisitRequest> = [
        { title: 'Visit ID', dataIndex: 'visitCode', key: 'visitCode', width: 120 },
        {
            title: 'Property',
            key: 'property',
            render: (_: unknown, r: VisitRequest) => (
                <div>
                    <div><strong>{r.property.propertyCode}</strong></div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{r.property.propertyType} - {r.property.category}</div>
                </div>
            )
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_: unknown, r: VisitRequest) => (
                <div>
                    <div><strong>{r.customerName}</strong></div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{r.customerEmail}</div>
                </div>
            )
        },
        { 
            title: 'Schedule', 
            key: 'schedule', 
            render: (_: unknown, r: VisitRequest) => (
                <div>
                    <div>{formatDate(r.slot.visitDate)}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{r.slot.startTime} - {r.slot.endTime}</div>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'visitRequestStatus',
            key: 'visitRequestStatus',
            render: (s: VisitRequestStatus) => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: VisitRequest) => (
                <Space size="middle">
                    {record.visitRequestStatus === VisitRequestStatus.PENDING && (
                        <>
                            <Tooltip title="Approve Visit">
                                <Button 
                                    type="primary" 
                                    shape="circle" 
                                    icon={<CheckCircleOutlined />} 
                                    onClick={() => approveMutation.mutate(record.id)}
                                    loading={approveMutation.isPending && approveMutation.variables === record.id}
                                />
                            </Tooltip>
                            <Tooltip title="Reject Visit">
                                <Button 
                                    danger 
                                    shape="circle" 
                                    icon={<CloseCircleOutlined />} 
                                    onClick={() => rejectMutation.mutate(record.id)}
                                    loading={rejectMutation.isPending && rejectMutation.variables === record.id}
                                />
                            </Tooltip>
                        </>
                    )}
                    {record.visitRequestStatus === VisitRequestStatus.CONFIRMED && (
                        <>
                            {role === UserRole.BROKER && (
                                <Tooltip title="Mark as Completed">
                                    <Button 
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                                        shape="circle" 
                                        icon={<CarryOutOutlined />} 
                                        onClick={() => completeMutation.mutate(record.id)}
                                        loading={completeMutation.isPending && completeMutation.variables === record.id}
                                    />
                                </Tooltip>
                            )}
                            <Tooltip title="Cancel Visit">
                                <Button 
                                    danger 
                                    type="text"
                                    icon={<CloseCircleOutlined />} 
                                    onClick={() => rejectMutation.mutate(record.id)}
                                    loading={rejectMutation.isPending && rejectMutation.variables === record.id}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    if (isError) {
        return (
            <Result 
                status="error" 
                title="Failed to load visit requests" 
                extra={<Button type="primary" onClick={() => refetch()}>Retry</Button>} 
            />
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Visit Management</Title>
                <Text type="secondary">
                    {role === UserRole.ADMIN 
                        ? 'Monitor and manage all site visit requests across the platform.' 
                        : 'Manage visit requests for your properties.'}
                </Text>
            </div>

            <Spin spinning={isLoading}>
                <Table<VisitRequest>
                    columns={columns}
                    dataSource={Array.isArray(data) ? data : []}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 10 }}
                />
            </Spin>
        </div>
    );
};

export default VisitManagement;
