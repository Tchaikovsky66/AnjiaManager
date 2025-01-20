'use client';

import { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import AddTenantModal from '@/components/tenants/AddTenantModal';

interface Tenant {
    id: number;
    name: string;
    phone: string;
    idCard: string;
    email?: string;
    status: string;
    createdAt: string;
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columns: ColumnsType<Tenant> = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: '身份证号',
            dataIndex: 'idCard',
            key: 'idCard',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString(),
        },
    ];

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/tenants');
            const data = await response.json();
            setTenants(data);
        } catch (error) {
            message.error('获取租户列表失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">租户管理</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    添加租户
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={tenants}
                rowKey="id"
                loading={loading}
            />

            <AddTenantModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchTenants();
                    message.success('添加租户成功');
                }}
            />
        </div>
    );
} 