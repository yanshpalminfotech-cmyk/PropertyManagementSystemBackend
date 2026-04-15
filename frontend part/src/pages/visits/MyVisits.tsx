import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Select, Input, notification, Spin, Result } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyVisitRequests, cancelVisitRequest, submitVisitFeedback } from '../../api/visits';
import { VisitRequestStatus, InterestLevel } from '../../types/enums';
import { formatDate } from '../../utils/formatDate';
import type { VisitRequest } from '../../types/VisitRequest';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

/**
 * My Site Visits page — Customer only.
 * Shows visit requests with cancel and feedback functionality.
 */
const MyVisits: React.FC = () => {
    const queryClient = useQueryClient();
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; visitId: string | null }>({ open: false, visitId: null });
    const [interestLevel, setInterestLevel] = useState<InterestLevel | null>(null);
    const [feedback, setFeedback] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['my-visits'],
        queryFn: getMyVisitRequests,
    });

    const cancelMutation = useMutation({
        mutationFn: cancelVisitRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-visits'] });
            notification.success({ message: 'Visit cancelled' });
        },
    });

    const feedbackMutation = useMutation({
        mutationFn: ({ id, data: fbData }: { id: string; data: { interestLevel: InterestLevel; feedback?: string } }) =>
            submitVisitFeedback(id, fbData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-visits'] });
            setFeedbackModal({ open: false, visitId: null });
            setInterestLevel(null);
            setFeedback('');
            notification.success({ message: 'Feedback submitted' });
        },
    });

    const handleCancel = (id: string) => {
        Modal.confirm({
            title: 'Cancel this visit?',
            onOk: () => cancelMutation.mutateAsync(id),
        });
    };

    const statusColor: Record<string, string> = {
        [VisitRequestStatus.PENDING]: 'blue',
        [VisitRequestStatus.CONFIRMED]: 'green',
        [VisitRequestStatus.CANCELLED]: 'red',
        [VisitRequestStatus.COMPLETED]: 'default',
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
        { title: 'Visit Date', key: 'visitDate', render: (_: unknown, r: VisitRequest) => formatDate(r.slot.visitDate) },
        { title: 'Time Slot', key: 'slot', render: (_: unknown, r: VisitRequest) => `${r.slot.startTime} - ${r.slot.endTime}` },
        {
            title: 'Status',
            dataIndex: 'visitRequestStatus',
            key: 'visitRequestStatus',
            render: (s: VisitRequestStatus) => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: VisitRequest) => {
                if (record.visitRequestStatus === VisitRequestStatus.PENDING) {
                    return <Button danger size="small" onClick={() => handleCancel(record.id)}>Cancel</Button>;
                }
                if (record.visitRequestStatus === VisitRequestStatus.COMPLETED) {
                    if (record.interestLevel) {
                        return <Tag color="green">Feedback Submitted</Tag>;
                    }
                    return (
                        <Button
                            size="small"
                            type="primary"
                            onClick={() => setFeedbackModal({ open: true, visitId: record.id })}
                        >
                            Leave Feedback
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    if (isError) {
        return <Result status="error" title="Failed to load visits" extra={<Button onClick={() => refetch()}>Retry</Button>} />;
    }

    return (
        <div>
            <h2>My Site Visits</h2>
            <Spin spinning={isLoading}>
                <Table<VisitRequest>
                    columns={columns}
                    dataSource={Array.isArray(data) ? data : []}
                    rowKey="id"
                    scroll={{ x: 800 }}
                />
            </Spin>

            <Modal
                title="Leave Feedback"
                open={feedbackModal.open}
                onCancel={() => {
                    setFeedbackModal({ open: false, visitId: null });
                    setInterestLevel(null);
                    setFeedback('');
                }}
                onOk={() => {
                    if (feedbackModal.visitId && interestLevel) {
                        feedbackMutation.mutate({
                            id: feedbackModal.visitId,
                            data: { interestLevel, feedback: feedback || undefined },
                        });
                    }
                }}
                okButtonProps={{ disabled: !interestLevel }}
                confirmLoading={feedbackMutation.isPending}
            >
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Interest Level</label>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Select interest level"
                        value={interestLevel}
                        onChange={(v: InterestLevel) => setInterestLevel(v)}
                    >
                        <Option value={InterestLevel.NOT_INTERESTED}>Not Interested</Option>
                        <Option value={InterestLevel.MAYBE}>Maybe</Option>
                        <Option value={InterestLevel.INTERESTED}>Interested</Option>
                        <Option value={InterestLevel.VERY_INTERESTED}>Very Interested</Option>
                    </Select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Feedback (optional)</label>
                    <TextArea rows={3} value={feedback} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)} />
                </div>
            </Modal>
        </div>
    );
};

export default MyVisits;
