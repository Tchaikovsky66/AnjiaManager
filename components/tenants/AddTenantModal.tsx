'use client';

import { Modal, Form, Input, message, Select } from 'antd';
import { useState } from 'react';

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function AddTenantModal({ open, onCancel, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const cleanValues = {
                ...values,
                gender: values.gender || null,
                email: values.email || null,
                emergencyContact: values.emergencyContact || null,
                emergencyPhone: values.emergencyPhone || null,
            };

            console.log('Submitting tenant data:', cleanValues);

            const response = await fetch('/api/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanValues),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || '添加租户失败');
            }

            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('Submit error:', error);
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error('添加租户失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="添加租户"
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="idCard"
                    label="身份证号"
                    rules={[
                        { required: true, message: '请输入身份证号' },
                        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="emergencyContact"
                    label="紧急联系人"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="emergencyPhone"
                    label="紧急联系人电话"
                    rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="性别"
                    name="gender"
                >
                    <Select
                        placeholder="请选择性别"
                        allowClear
                        options={[
                            { label: '男', value: 'MALE' },
                            { label: '女', value: 'FEMALE' },
                        ]}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
} 