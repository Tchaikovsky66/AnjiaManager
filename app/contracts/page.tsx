'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Modal, Popconfirm, Form, Input, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import AddContractModal from '../../components/contracts/AddContractModal';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { RangePicker } = DatePicker;

interface SearchParams {
    roomNumber: string;
    tenantName: string;
    status: '' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

interface Contract {
    id: number;
    tenantId: number;
    roomId: number;
    startDate: string;
    endDate: string;
    rentAmount: number;
    deposit: number;
    status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
    createdAt: string;
    tenant: {
        name: string;
        phone: string;
    };
    room: {
        number: string;
        building: true;
    };
}

const contractStatusMap = {
    ACTIVE: { text: '生效中', color: 'green' },
    TERMINATED: { text: '已终止', color: 'red' },
    EXPIRED: { text: '已到期', color: 'orange' }
};

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    const [searchParams, setSearchParams] = useState<SearchParams>({
        roomNumber: '',
        tenantName: '',
        status: '',
        dateRange: null,
    });

    const columns: ColumnsType<Contract> = [
        {
            title: '房间',
            key: 'room',
            render: (_, record) => `${record.room.building}-${record.room.number}`,
        },
        {
            title: '租客',
            key: 'tenant',
            render: (_, record) => (
                <div>
                    <div>{record.tenant.name}</div>
                    <div className="text-gray-400 text-sm">{record.tenant.phone}</div>
                </div>
            ),
        },
        {
            title: '租期',
            key: 'period',
            render: (_, record) => (
                <div>
                    <div>{dayjs(record.startDate).format('YYYY-MM-DD')}</div>
                    <div className="text-gray-400 text-sm">
                        至 {dayjs(record.endDate).format('YYYY-MM-DD')}
                    </div>
                </div>
            ),
        },
        {
            title: '月租(元)',
            dataIndex: 'rentAmount',
            key: 'rentAmount',
            render: (amount) => `¥${amount.toLocaleString()}`,
        },
        {
            title: '押金(元)',
            dataIndex: 'deposit',
            key: 'deposit',
            render: (amount) => `¥${amount.toLocaleString()}`,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const { text, color } = contractStatusMap[status as keyof typeof contractStatusMap];
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button.Group>
                    <Button
                        type="link"
                        onClick={() => router.push(`/contracts/${record.id}`)}
                    >
                        查看
                    </Button>
                    {record.status === 'ACTIVE' && (
                        <Popconfirm
                            title="终止合同"
                            description="确定要终止这份合同吗？终止后房间将变为空置状态"
                            okText="确认"
                            cancelText="取消"
                            okButtonProps={{
                                danger: true,
                                loading: loading
                            }}
                            onConfirm={() => handleTerminate(record.id)}
                        >
                            <Button type="link" danger>
                                终止
                            </Button>
                        </Popconfirm>
                    )}
                </Button.Group>
            ),
        },
    ];

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (searchParams.roomNumber) {
                queryParams.append('roomNumber', searchParams.roomNumber);
            }
            if (searchParams.tenantName) {
                queryParams.append('tenantName', searchParams.tenantName);
            }
            if (searchParams.status) {
                queryParams.append('status', searchParams.status);
            }
            if (searchParams.dateRange && searchParams.dateRange[0] && searchParams.dateRange[1]) {
                queryParams.append('startDate', searchParams.dateRange[0].format('YYYY-MM-DD'));
                queryParams.append('endDate', searchParams.dateRange[1].format('YYYY-MM-DD'));
            }

            const response = await fetch(`/api/contracts?${queryParams.toString()}`);
            const data = await response.json();
            setContracts(data);
        } catch (error) {
            message.error('获取合同列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setLoading(true);
        fetchContracts();
    };

    const handleReset = () => {
        setSearchParams({
            roomNumber: '',
            tenantName: '',
            status: '',
            dateRange: null,
        });
        setLoading(true);
        fetchContracts();
    };

    const handleTerminate = async (contractId: number) => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/contracts/${contractId}/terminate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '终止合同失败');
            }

            message.success('合同已终止');
            await fetchContracts();
        } catch (error) {
            console.error('Terminate error:', error);
            message.error(error instanceof Error ? error.message : '终止合同失败');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">租约管理</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    添加租约
                </Button>
            </div>

            <div className="mb-4 bg-white p-4 rounded shadow">
                <Form layout="inline">
                    <Form.Item label="房间号">
                        <Input
                            placeholder="输入房间号"
                            value={searchParams.roomNumber}
                            onChange={e => setSearchParams(prev => ({ ...prev, roomNumber: e.target.value }))}
                        />
                    </Form.Item>
                    <Form.Item label="租客">
                        <Input
                            placeholder="输入租客姓名"
                            value={searchParams.tenantName}
                            onChange={e => setSearchParams(prev => ({ ...prev, tenantName: e.target.value }))}
                        />
                    </Form.Item>
                    <Form.Item label="状态">
                        <Select
                            style={{ width: 120 }}
                            value={searchParams.status}
                            onChange={value => setSearchParams(prev => ({ ...prev, status: value }))}
                            options={[
                                { label: '全部', value: '' },
                                { label: '生效中', value: 'ACTIVE' },
                                { label: '已终止', value: 'TERMINATED' },
                                { label: '已到期', value: 'EXPIRED' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="日期范围">
                        <RangePicker
                            value={searchParams.dateRange}
                            onChange={(dates) => setSearchParams(prev => ({
                                ...prev,
                                dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null
                            }))}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={handleSearch}>搜索</Button>
                        <Button className="ml-2" onClick={handleReset}>重置</Button>
                    </Form.Item>
                </Form>
            </div>

            <Table
                columns={columns}
                dataSource={contracts}
                rowKey="id"
                loading={loading}
            />

            <AddContractModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchContracts();
                    message.success('添加租约成功');
                }}
            />
        </div>
    );
} 