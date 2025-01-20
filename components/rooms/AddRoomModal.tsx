'use client';

import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { useState } from 'react';

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

// 添加设施类型定义
interface Facilities {
    [key: string]: boolean;
}

const roomTypes = [
    { label: '单人间', value: 'SINGLE' },
    { label: '双人间', value: 'DOUBLE' },
    { label: '三人间', value: 'TRIPLE' },
    { label: '套房', value: 'SUITE' },
];

const directions = [
    { label: '东', value: 'EAST' },
    { label: '南', value: 'SOUTH' },
    { label: '西', value: 'WEST' },
    { label: '北', value: 'NORTH' },
    { label: '东南', value: 'SOUTHEAST' },
    { label: '西南', value: 'SOUTHWEST' },
    { label: '东北', value: 'NORTHEAST' },
    { label: '西北', value: 'NORTHWEST' },
];

const facilityOptions = [
    { label: '空调', value: 'aircon' },
    { label: '热水器', value: 'waterHeater' },
    { label: '洗衣机', value: 'washingMachine' },
    { label: '冰箱', value: 'fridge' },
    { label: '电视', value: 'tv' },
    { label: '宽带', value: 'internet' },
    { label: '衣柜', value: 'wardrobe' },
    { label: '书桌', value: 'desk' },
];

export default function AddRoomModal({ open, onCancel, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            // 确保数值类型正确
            const formData = {
                ...values,
                floor: Number(values.floor),
                area: Number(values.area),
                price: Number(values.price),
                deposit: Number(values.deposit),
                facilities: Array.isArray(values.facilities)
                    ? values.facilities.reduce((acc: Record<string, boolean>, curr: string) => ({
                        ...acc,
                        [curr]: true
                    }), {})
                    : {}
            };

            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '添加房源失败');
            }

            form.resetFields();
            onSuccess();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error('添加房源失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="添加房源"
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={720}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    floor: 1,
                    facilities: [],
                    deposit: 0,
                    price: 0,
                    area: 20
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 左侧列 */}
                    <div>
                        <Form.Item
                            name="number"
                            label="房间号"
                            rules={[{ required: true, message: '请输入房间号' }]}
                        >
                            <Input placeholder="如：A101" />
                        </Form.Item>

                        <Form.Item
                            name="building"
                            label="楼栋"
                            rules={[{ required: true, message: '请输入楼栋' }]}
                        >
                            <Input placeholder="如：A栋" />
                        </Form.Item>

                        <Form.Item
                            name="floor"
                            label="楼层"
                            rules={[{ required: true, message: '请输入楼层' }]}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                placeholder="请输入楼层"
                            />
                        </Form.Item>

                        <Form.Item
                            name="type"
                            label="房型"
                            rules={[{ required: true, message: '请选择房型' }]}
                        >
                            <Select
                                options={roomTypes}
                                placeholder="请选择房型"
                            />
                        </Form.Item>
                    </div>

                    {/* 右侧列 */}
                    <div>
                        <Form.Item
                            name="area"
                            label="面积(㎡)"
                            rules={[{ required: true, message: '请输入面积' }]}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                placeholder="请输入面积"
                            />
                        </Form.Item>

                        <Form.Item
                            name="direction"
                            label="朝向"
                            rules={[{ required: true, message: '请选择朝向' }]}
                        >
                            <Select
                                options={directions}
                                placeholder="请选择朝向"
                            />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="月租(元)"
                            rules={[
                                { required: true, message: '请输入月租' },
                                { type: 'number', min: 0, message: '租金不能为负' }
                            ]}
                        >
                            <InputNumber
                                min={0}
                                step={100}
                                style={{ width: '100%' }}
                                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value: string | undefined): number => {
                                    const parsed = value ? parseFloat(value.replace(/\¥\s?|(,*)/g, '')) : 0;
                                    return isNaN(parsed) ? 0 : parsed;
                                }}
                                placeholder="请输入月租金额"
                            />
                        </Form.Item>

                        <Form.Item
                            name="deposit"
                            label="押金(元)"
                            rules={[
                                { required: true, message: '请输入押金' },
                                { type: 'number', min: 0, message: '押金不能为负' }
                            ]}
                        >
                            <InputNumber
                                min={0}
                                step={100}
                                style={{ width: '100%' }}
                                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value: string | undefined): number => {
                                    const parsed = value ? parseFloat(value.replace(/\¥\s?|(,*)/g, '')) : 0;
                                    return isNaN(parsed) ? 0 : parsed;
                                }}
                                placeholder="请输入押金金额"
                            />
                        </Form.Item>
                    </div>
                </div>

                {/* 底部跨列的设施配置 */}
                <Form.Item
                    name="facilities"
                    label="设施配置"
                    rules={[{ required: true, message: '请选择设施配置' }]}
                >
                    <Select
                        mode="multiple"
                        options={facilityOptions}
                        placeholder="请选择设施"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
} 