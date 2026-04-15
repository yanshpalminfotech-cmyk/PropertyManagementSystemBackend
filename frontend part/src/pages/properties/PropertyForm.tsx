import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, notification, Result } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProperty, updateProperty, getPropertyById } from '../../api/properties';
import { useAuthStore } from '../../stores/useAuthStore';
import { UserRole, PropertyType, PropertyCategory, TransactionType, PropertyLocation, PropertyStatus, Furnishing, FacingDirection } from '../../types/enums';
import type { PropertyFormValues } from '../../types/Property';
import { AxiosError } from 'axios';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Add/Edit property form page.
 * Broker can only edit own properties. Admin can edit all.
 */
const PropertyForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm<PropertyFormValues>();
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);

    const { data: property, isLoading } = useQuery({
        queryKey: ['property', id],
        queryFn: () => getPropertyById(id!),
        enabled: isEdit,
    });

    // Broker ownership check
    const isBrokerNotOwner =
        isEdit && role === UserRole.BROKER && property && property.brokerId !== user?.id;

    useEffect(() => {
        if (property && isEdit) {
            form.setFieldsValue(property as PropertyFormValues);
        }
    }, [property, isEdit, form]);

    const mutation = useMutation({
        mutationFn: (values: PropertyFormValues) =>
            isEdit ? updateProperty(id!, values) : createProperty(values),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['property', id] });
            notification.success({ message: isEdit ? 'Property updated' : 'Property created' });
            navigate(`/properties/${data?.id || id}`);
        },
        onError: (err: AxiosError<{ message: string | string[]; errors?: Record<string, string[]> }>) => {
            const resp = err.response?.data;
            if (err.response?.status === 422 && resp?.errors) {
                const fields = Object.entries(resp.errors).map(([name, errs]) => ({
                    name: name as keyof PropertyFormValues,
                    errors: errs,
                }));
                form.setFields(fields);
            } else {
                notification.error({ message: typeof resp?.message === 'string' ? resp.message : 'Failed to save property' });
            }
        },
    });

    if (isBrokerNotOwner) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="You can only edit your own properties."
                extra={<Button onClick={() => navigate('/properties')}>Back to Properties</Button>}
            />
        );
    }

    const selectProps = { style: { width: '100%' } };

    return (
        <Card title={isEdit ? 'Edit Property' : 'Add New Property'} loading={isEdit && isLoading}>
            <Form<PropertyFormValues>
                form={form}
                layout="vertical"
                onFinish={(values) => mutation.mutate(values)}
                style={{ maxWidth: 800 }}
            >
                <Form.Item name="propertyType" label="Property Type" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select type">
                        {Object.values(PropertyType).map((t) => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select category">
                        {Object.values(PropertyCategory).map((c) => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="transactionType" label="Transaction Type" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select transaction type">
                        {Object.values(TransactionType).map((t) => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select location">
                        {Object.values(PropertyLocation).map((l) => <Option key={l} value={l}>{l}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                    <TextArea rows={2} placeholder="Full address" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <TextArea rows={3} placeholder="Property description" />
                </Form.Item>

                <Form.Item
                    name="carpetArea"
                    label="Carpet Area (sq ft)"
                    rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                            validator(_, value: number) {
                                const builtUp = getFieldValue('builtUpArea') as number;
                                if (value && builtUp && value >= builtUp) {
                                    return Promise.reject(new Error('Carpet area must be less than built-up area'));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="builtUpArea" label="Built-up Area (sq ft)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="price" label="Price (₹)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="maintenanceCost" label="Maintenance Cost">
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item
                    name="floorNumber"
                    label="Floor Number"
                    rules={[
                        ({ getFieldValue }) => ({
                            validator(_, value: number) {
                                const total = getFieldValue('totalFloors') as number;
                                if (value && total && value > total) {
                                    return Promise.reject(new Error('Floor number must be ≤ total floors'));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="totalFloors" label="Total Floors">
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="propertyAge" label="Property Age (years)">
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>

                <Form.Item name="furnishing" label="Furnishing" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select furnishing">
                        {Object.values(Furnishing).map((f) => <Option key={f} value={f}>{f.replace('_', ' ')}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="parking" label="Parking">
                    <Select {...selectProps} placeholder="Select parking">
                        <Option value="NONE">None</Option>
                        <Option value="TWO_WHEELER">Two-Wheeler</Option>
                        <Option value="FOUR_WHEELER">Four-Wheeler</Option>
                        <Option value="BOTH">Both</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="facing" label="Facing Direction">
                    <Select {...selectProps} placeholder="Select direction">
                        {Object.values(FacingDirection).map((d) => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="propertiesstatus" label="Status" rules={[{ required: true }]}>
                    <Select {...selectProps} placeholder="Select status">
                        {Object.values(PropertyStatus).map((s) => <Option key={s} value={s}>{s.replace('_', ' ')}</Option>)}
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={mutation.isPending} style={{ marginRight: 8 }}>
                        {isEdit ? 'Update Property' : 'Create Property'}
                    </Button>
                    <Button onClick={() => navigate('/properties')}>Cancel</Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default PropertyForm;
