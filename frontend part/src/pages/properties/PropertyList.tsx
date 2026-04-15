import React, { useState, useMemo } from 'react';
import { Table, Input, Select, InputNumber, Button, Tag, Spin, Result, Row, Col, Card } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProperties, getMyProperties } from '../../api/properties';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDebounce } from '../../hooks/useDebounce';
import { UserRole, PropertyType, PropertyCategory, TransactionType, PropertyLocation, PropertyStatus } from '../../types/enums';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { formatArea } from '../../utils/formatArea';
import type { PropertyQueryParams } from '../../types/Property';
import type { ColumnsType } from 'antd/es/table';
import type { Property } from '../../types/Property';

const { Option } = Select;

/**
 * Property listing page with role-based columns, filters, search, and pagination.
 */
const PropertyList: React.FC = () => {
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.role);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState<Partial<PropertyQueryParams>>({});

    const debouncedSearch = useDebounce(searchText, 400);

    const queryParams: PropertyQueryParams = useMemo(
        () => ({
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            ...filters,
        }),
        [page, pageSize, debouncedSearch, filters]
    );

    const fetchFn = role === UserRole.BROKER ? getMyProperties : getProperties;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['properties', queryParams, role],
        queryFn: () => fetchFn(queryParams),
    });

    const statusColor: Record<string, string> = {
        [PropertyStatus.AVAILABLE]: 'green',
        [PropertyStatus.UNDER_NEGOTIATION]: 'orange',
        [PropertyStatus.SOLD]: 'default',
        [PropertyStatus.RENTED]: 'default',
    };

    const columns: ColumnsType<Property> = useMemo(() => {
        const cols: ColumnsType<Property> = [
            { title: 'Property ID', dataIndex: 'propertyCode', key: 'propertyCode', width: 120, render: (v: string, r: Property) => v || r.id?.slice(0, 8) },
            { title: 'Type', dataIndex: 'propertyType', key: 'propertyType', width: 110 },
            { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
            { title: 'Transaction', dataIndex: 'transactionType', key: 'transactionType', width: 110 },
            { title: 'Location', dataIndex: 'location', key: 'location', width: 110 },
            { title: 'Price', dataIndex: 'price', key: 'price', width: 130, render: (v: number) => formatCurrency(v) },
            { title: 'Carpet Area', dataIndex: 'carpetArea', key: 'carpetArea', width: 120, render: (v: number) => formatArea(v) },
            {
                title: 'Status',
                dataIndex: 'propertiesstatus',
                key: 'propertiesstatus',
                width: 140,
                render: (status: PropertyStatus) => (
                    <Tag color={statusColor[status] || 'default'}>{status?.replace('_', ' ')}</Tag>
                ),
            },
            { title: 'Posted', dataIndex: 'postedDate', key: 'postedDate', width: 120, render: (v: string) => v ? formatDate(v) : '-' },
        ];

        // Admin sees broker commission
        if (role === UserRole.ADMIN) {
            cols.splice(6, 0, {
                title: 'Commission',
                dataIndex: 'brokerCommission',
                key: 'brokerCommission',
                width: 120,
                render: (v: number) => v ? formatCurrency(v) : '-',
            });
        }

        // Action column
        cols.push({
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_: unknown, record: Property) => (
                <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/properties/${record.id}`)}>
                    View
                </Button>
            ),
        });

        return cols;
    }, [role, navigate]);

    const updateFilter = (key: keyof PropertyQueryParams, value: string | number | undefined) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    };

    if (isError) {
        return <Result status="error" title="Failed to load properties" extra={<Button onClick={() => refetch()}>Retry</Button>} />;
    }

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Properties</h2>
                {(role === UserRole.ADMIN || role === UserRole.BROKER) && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/properties/new')}>
                        Add Property
                    </Button>
                )}
            </Row>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search location or ID..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Select placeholder="Type" allowClear style={{ width: '100%' }} onChange={(v: PropertyType) => updateFilter('type', v)}>
                            {Object.values(PropertyType).map((t) => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Select placeholder="Category" allowClear style={{ width: '100%' }} onChange={(v: PropertyCategory) => updateFilter('category', v)}>
                            {Object.values(PropertyCategory).map((c) => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Select placeholder="Transaction" allowClear style={{ width: '100%' }} onChange={(v: TransactionType) => updateFilter('transactionType', v)}>
                            {Object.values(TransactionType).map((t) => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <Select placeholder="Location" allowClear style={{ width: '100%' }} onChange={(v: PropertyLocation) => updateFilter('location', v)}>
                            {Object.values(PropertyLocation).map((l) => <Option key={l} value={l}>{l}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <InputNumber placeholder="Min Price" style={{ width: '100%' }} onChange={(v) => updateFilter('minPrice', v ?? undefined)} />
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                        <InputNumber placeholder="Max Price" style={{ width: '100%' }} onChange={(v) => updateFilter('maxPrice', v ?? undefined)} />
                    </Col>
                </Row>
            </Card>

            <Spin spinning={isLoading}>
                <Table<Property>
                    columns={columns}
                    dataSource={data?.items || []}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{
                        current: page,
                        pageSize,
                        total: data?.total || 0,
                        showSizeChanger: false,
                        onChange: (p: number) => setPage(p),
                    }}
                />
            </Spin>
        </div>
    );
};

export default PropertyList;
