'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import AddRoomModal from '@/components/rooms/AddRoomModal';

interface Room {
    id: number;
    number: string;
    floor: number;
    building: string;
    type: string;
    area: number;
    direction: string;
    facilities: Record<string, boolean>;
    price: number;
    deposit: number;
    status: string;
    createdAt: string;
}

const roomTypeMap = {
    SINGLE: '单人间',
    DOUBLE: '双人间',
    TRIPLE: '三人间',
    SUITE: '套房'
};

const roomStatusMap = {
    VACANT: { text: '空置', color: 'green' },
    OCCUPIED: { text: '已租', color: 'blue' },
    RESERVED: { text: '已预订', color: 'orange' },
    MAINTAINING: { text: '维修中', color: 'red' }
};

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const columns: ColumnsType<Room> = [
        {
            title: '房间号',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: '楼栋',
            dataIndex: 'building',
            key: 'building',
        },
        {
            title: '楼层',
            dataIndex: 'floor',
            key: 'floor',
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type) => roomTypeMap[type as keyof typeof roomTypeMap],
        },
        {
            title: '面积(㎡)',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: '月租(元)',
            dataIndex: 'price',
            key: 'price',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const { text, color } = roomStatusMap[status as keyof typeof roomStatusMap];
                return <Tag color={color}>{text}</Tag>;
            },
        },
    ];

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms');
            const data = await response.json();
            setRooms(data);
        } catch (error) {
            message.error('获取房源列表失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">房源管理</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    添加房源
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={rooms}
                rowKey="id"
                loading={loading}
            />

            <AddRoomModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchRooms();
                    message.success('添加房源成功');
                }}
            />
        </div>
    );
} 