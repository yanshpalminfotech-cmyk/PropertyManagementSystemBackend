import React, { useState } from 'react';
import {
    Descriptions, Button, Spin, Result, Tag, Modal, DatePicker, Select, notification, Alert, Space,
} from 'antd';
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPropertyById, deleteProperty } from '../../api/properties';
import { getAvailableSlots, createVisitRequest } from '../../api/visits';
import { useAuthStore } from '../../stores/useAuthStore';
import { UserRole, PropertyStatus } from '../../types/enums';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatArea } from '../../utils/formatArea';
import { formatDate } from '../../utils/formatDate';
import dayjs, { type Dayjs } from 'dayjs';

const { Option } = Select;

/**
 * Property detail page with role-based field visibility,
 * edit/delete for admin/broker, and site visit request for customer.
 */
const PropertyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);

    const [visitModalOpen, setVisitModalOpen] = useState(false);
    const [visitDate, setVisitDate] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [visitError, setVisitError] = useState<string | null>(null);

    const { data: property, isLoading, isError } = useQuery({
        queryKey: ['property', id],
        queryFn: () => getPropertyById(id!),
        enabled: Boolean(id),
    });

    const { data: slots, isLoading: isLoadingSlots } = useQuery({
        queryKey: ['property-slots', id, visitDate],
        queryFn: () => getAvailableSlots(id!, visitDate!),
        enabled: visitModalOpen && Boolean(id && visitDate),
        refetchInterval: 120000, // Refetch every 2 minutes
    });

    const availableSlots = Array.isArray(slots) ? slots : [];

    const deleteMutation = useMutation({
        mutationFn: () => deleteProperty(id!),
        onSuccess: () => {
            notification.success({ message: 'Property deleted' });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            navigate('/properties');
        },
    });

    const visitMutation = useMutation({
        mutationFn: () => {
            const slot = availableSlots.find(
                (s) => `${s.startTime}-${s.endTime}` === selectedSlot
            );
            return createVisitRequest({
                propertyId: id!,
                visitDate: visitDate!,
                startTime: slot!.startTime,
                endTime: slot!.endTime,
            });
        },
        onSuccess: () => {
            setVisitModalOpen(false);
            setVisitDate(null);
            setSelectedSlot(null);
            setVisitError(null);
            notification.success({ message: 'Site visit requested successfully' });
            queryClient.invalidateQueries({ queryKey: ['property-slots', id] });
        },
        onError: (err: { response?: { status?: number; data?: { message?: string } } }) => {
            if (err.response?.status === 409) {
                setVisitError(err.response.data?.message || 'Slot already taken');
            } else {
                setVisitError('Failed to request visit');
            }
        },
    });

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete this property?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: () => deleteMutation.mutateAsync(),
        });
    };

    if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
    if (isError || !property) return <Result status="error" title="Failed to load property" />;

    const isAdmin = role === UserRole.ADMIN;
    const isBroker = role === UserRole.BROKER;
    const isCustomer = role === UserRole.CUSTOMER;
    const isOwnBroker = isBroker && property.brokerId === user?.id;

    const statusColor: Record<string, string> = {
        [PropertyStatus.AVAILABLE]: 'green',
        [PropertyStatus.UNDER_NEGOTIATION]: 'orange',
        [PropertyStatus.SOLD]: 'default',
        [PropertyStatus.RENTED]: 'default',
    };

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button onClick={() => navigate('/properties')}>← Back</Button>
                {(isAdmin || isOwnBroker) && (
                    <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/properties/${id}/edit`)}>
                        Edit
                    </Button>
                )}
                {isAdmin && (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        Delete
                    </Button>
                )}
                {isCustomer && (
                    <Button type="primary" icon={<CalendarOutlined />} onClick={() => setVisitModalOpen(true)}>
                        Request Site Visit
                    </Button>
                )}
            </Space>

            <Descriptions bordered column={2} title="Property Details">
                <Descriptions.Item label="Property ID">{property.propertyCode || property.id}</Descriptions.Item>
                <Descriptions.Item label="Type">{property.propertyType}</Descriptions.Item>
                <Descriptions.Item label="Category">{property.category}</Descriptions.Item>
                <Descriptions.Item label="Transaction">{property.transactionType}</Descriptions.Item>
                <Descriptions.Item label="Location">{property.location}</Descriptions.Item>
                <Descriptions.Item label="Address">{property.address}</Descriptions.Item>
                <Descriptions.Item label="Price">{formatCurrency(property.price)}</Descriptions.Item>
                <Descriptions.Item label="Carpet Area">{formatArea(property.carpetArea)}</Descriptions.Item>
                <Descriptions.Item label="Built-up Area">{formatArea(property.builtUpArea)}</Descriptions.Item>
                <Descriptions.Item label="Maintenance">{property.maintenanceCost ? formatCurrency(property.maintenanceCost) : '-'}</Descriptions.Item>
                <Descriptions.Item label="Furnishing">{property.furnishing}</Descriptions.Item>
                <Descriptions.Item label="Parking">{String(property.parking)}</Descriptions.Item>
                <Descriptions.Item label="Floor">{property.floorNumber ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Total Floors">{property.totalFloors ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Property Age">{property.propertyAge ? `${property.propertyAge} years` : '-'}</Descriptions.Item>
                <Descriptions.Item label="Facing">{property.facing || '-'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={statusColor[property.propertiesstatus] || 'default'}>
                        {property.propertiesstatus?.replace('_', ' ')}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Posted">{property.postedDate ? formatDate(property.postedDate) : '-'}</Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>{property.description || '-'}</Descriptions.Item>

                {/* Admin only fields */}
                {isAdmin && (
                    <Descriptions.Item label="Broker Commission">
                        {property.brokerCommission ? formatCurrency(property.brokerCommission) : '-'}
                    </Descriptions.Item>
                )}

                {/* Hide owner details from Customer */}
                {!isCustomer && (
                    <>
                        <Descriptions.Item label="Owner Name">{property.ownerName || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Owner Mobile">{property.ownerMobileNumber || '-'}</Descriptions.Item>
                    </>
                )}

                {/* Hide broker name from Customer */}
                {!isCustomer && (
                    <Descriptions.Item label="Broker">{property.brokerName || '-'}</Descriptions.Item>
                )}
            </Descriptions>

            {/* Site Visit Modal */}
            <Modal
                title="Request Site Visit"
                open={visitModalOpen}
                onCancel={() => {
                    setVisitModalOpen(false);
                    setVisitError(null);
                    setVisitDate(null);
                    setSelectedSlot(null);
                }}
                onOk={() => visitMutation.mutate()}
                okText="Submit Request"
                confirmLoading={visitMutation.isPending}
                okButtonProps={{ disabled: !selectedSlot }}
            >
                {visitError && <Alert message={visitError} type="error" showIcon style={{ marginBottom: 16 }} />}

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Visit Date</label>
                    <DatePicker
                        style={{ width: '100%' }}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        onChange={(_: Dayjs | null, dateString: string | string[]) => {
                            const ds = Array.isArray(dateString) ? dateString[0] : dateString;
                            setVisitDate(ds || null);
                            setSelectedSlot(null);
                            setVisitError(null);
                        }}
                    />
                </div>

                {visitDate && (
                    <div>
                        <label style={{ display: 'block', marginBottom: 4 }}>Time Slot</label>
                        <Select
                            style={{ width: '100%' }}
                            placeholder={availableSlots.length ? 'Select a slot' : 'No available slots'}
                            value={selectedSlot}
                            onChange={(v: string) => setSelectedSlot(v)}
                            disabled={!availableSlots.length}
                            loading={isLoadingSlots}
                        >
                            {availableSlots.map((slot) => (
                                <Option key={`${slot.startTime}-${slot.endTime}`} value={`${slot.startTime}-${slot.endTime}`}>
                                    {slot.startTime} - {slot.endTime}
                                </Option>
                            ))}
                        </Select>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PropertyDetail;
