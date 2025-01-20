'use client';

import { Modal, Form, Select, DatePicker, InputNumber, message } from 'antd';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface Tenant {
    id: number;
    name: string;
    phone: string;
}

interface Room {
    id: number;
    number: string;
    building: string;
    status: 'VACANT' | 'OCCUPIED';
    price: number;
    deposit: number;
}

const { RangePicker } = DatePicker;

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

interface TenantOption {
    label: string;
    value: number;
    phone: string;
}

interface RoomOption {
    label: string;
    value: number;
    price: number;
    deposit: number;
}

export default function AddContractModal({ open, onCancel, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState<TenantOption[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);

    // 获取租客列表
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await fetch('/api/tenants');
                const data = await response.json();
                setTenants(data.map((tenant: Tenant) => ({
                    label: `${tenant.name} (${tenant.phone})`,
                    value: tenant.id,
                    phone: tenant.phone,
                })));
            } catch (error) {
                message.error('获取租客列表失败');
            }
        };
        fetchTenants();
    }, []);

    // 获取可用房源列表
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('/api/rooms');
                const data = await response.json();
                setRooms(data
                    .filter((room: Room) => room.status === 'VACANT')
                    .map((room: Room) => ({
                        label: `${room.building}-${room.number}`,
                        value: room.id,
                        price: Number(room.price),
                        deposit: Number(room.deposit),
                    }))
                );
            } catch (error) {
                message.error('获取房源列表失败');
            }
        };
        fetchRooms();
    }, []);

    // 选择房间时自动填充租金和押金
    const handleRoomSelect = (roomId: number) => {
        const selectedRoom = rooms.find(room => room.value === roomId);
        if (selectedRoom) {
            form.setFieldsValue({
                rentAmount: selectedRoom.price,
                deposit: selectedRoom.deposit,
            });
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const [startDate, endDate] = values.period;
            const formData = {
                tenantId: values.tenantId,
                roomId: values.roomId,
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
                rentAmount: values.rentAmount,
                deposit: values.deposit,
            };

            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error) {
                    message.error(result.error);
                } else if (result.details) {
                    message.error(result.details.map((d: any) => d.message).join(', '));
                } else {
                    message.error('添加租约失败');
                }
                return;
            }

            form.resetFields();
            message.success('添加租约成功');
            onSuccess();
        } catch (error) {
            console.error('Submit error:', error);
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error('添加租约失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="添加租约"
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    rentAmount: 0,
                    deposit: 0,
                }}
            >
                <Form.Item
                    name="tenantId"
                    label="租客"
                    rules={[{ required: true, message: '请选择租客' }]}
                >
                    <Select
                        showSearch
                        placeholder="请选择租客"
                        options={tenants}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="roomId"
                    label="房间"
                    rules={[{ required: true, message: '请选择房间' }]}
                >
                    <Select
                        showSearch
                        placeholder="请选择房间"
                        options={rooms}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={handleRoomSelect}
                    />
                </Form.Item>

                <Form.Item
                    name="period"
                    label="租期"
                    rules={[{ required: true, message: '请选择租期' }]}
                >
                    <RangePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                </Form.Item>

                <Form.Item
                    name="rentAmount"
                    label="月租(元)"
                    rules={[{ required: true, message: '请输入月租' }]}
                >
                    <InputNumber
                        min={0}
                        step={100}
                        style={{ width: '100%' }}
                        formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value: string | undefined): 0 | number => {
                            const parsed = value ? Number(value.replace(/\¥\s?|(,*)/g, '')) : 0;
                            return isNaN(parsed) ? 0 : parsed;
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="deposit"
                    label="押金(元)"
                    rules={[{ required: true, message: '请输入押金' }]}
                >
                    <InputNumber
                        min={0}
                        step={100}
                        style={{ width: '100%' }}
                        formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value: string | undefined): 0 | number => {
                            const parsed = value ? Number(value.replace(/\¥\s?|(,*)/g, '')) : 0;
                            return isNaN(parsed) ? 0 : parsed;
                        }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
} 