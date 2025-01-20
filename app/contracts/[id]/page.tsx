'use client';

import { useEffect, useState, use } from 'react';
import { Card, Descriptions, Tag, Spin, message, Button, Popconfirm, Breadcrumb } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

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
        id: number;
        name: string;
        phone: string;
        idCard: string | null;
        gender: 'MALE' | 'FEMALE' | null;
    };
    room: {
        id: number;
        number: string;
        building: string;
        floor: number;
        type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'SUITE';
        area: number;
        price: number;
        deposit: number;
    };
}

const contractStatusMap = {
    ACTIVE: { text: '生效中', color: 'green' },
    TERMINATED: { text: '已终止', color: 'red' },
    EXPIRED: { text: '已到期', color: 'orange' }
};

const roomTypeMap = {
    'SINGLE': '单人间',
    'DOUBLE': '双人间',
    'TRIPLE': '三人间',
    'SUITE': '套房',
} as const;

const genderMap = {
    'MALE': '男',
    'FEMALE': '女',
} as const;

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { id } = use(params);

    useEffect(() => {
        fetchContractDetail();
    }, []);

    const fetchContractDetail = async () => {
        try {
            console.log('Fetching contract details for ID:', id);
            const response = await fetch(`/api/contracts/${id}`);
            const text = await response.text(); // 先获取原始响应文本
            console.log('API response text:', text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('服务器响应格式错误');
            }

            console.log('Parsed API response:', result);

            if (!response.ok) {
                throw new Error(result.error || '获取合同详情失败');
            }

            if (!result.data) {
                throw new Error('返回数据格式错误');
            }

            setContract(result.data);
        } catch (error) {
            console.error('Fetch contract detail error:', error);
            message.error(error instanceof Error ? error.message : '获取合同详情失败');
        } finally {
            setLoading(false);
        }
    };

    const handleTerminate = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/contracts/${id}/terminate`,
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
            // 重新获取合同详情
            fetchContractDetail();
        } catch (error) {
            console.error('Terminate error:', error);
            message.error(error instanceof Error ? error.message : '终止合同失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
    }

    if (!contract) {
        return <div className="text-center text-red-500">合同不存在</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <Breadcrumb items={[
                    {
                        title: (
                            <Link href="/">
                                <HomeOutlined /> 首页
                            </Link>
                        ),
                    },
                    {
                        title: (
                            <Link href="/contracts">
                                租约管理
                            </Link>
                        ),
                    },
                    {
                        title: '合同详情',
                    },
                ]} />
            </div>
            <div className="mb-4">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                >
                    返回列表
                </Button>
            </div>
            <Card
                title="合同详情"
                extra={
                    <div>
                        <Tag color={contractStatusMap[contract.status].color}>
                            {contractStatusMap[contract.status].text}
                        </Tag>
                        {contract.status === 'ACTIVE' && (
                            <Tag color="blue">
                                {`距到期还有 ${dayjs(contract.endDate).diff(dayjs(), 'day')} 天`}
                            </Tag>
                        )}
                    </div>
                }
                actions={[
                    contract.status === 'ACTIVE' && (
                        <Popconfirm
                            title="终止合同"
                            description="确定要终止这份合同吗？终止后房间将变为空置状态"
                            okText="确认"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            onConfirm={handleTerminate}
                        >
                            <Button type="link" danger>
                                终止合同
                            </Button>
                        </Popconfirm>
                    )
                ]}
            >
                <Descriptions column={2}>
                    <Descriptions.Item label="租客姓名">{contract.tenant.name}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{contract.tenant.phone}</Descriptions.Item>
                    <Descriptions.Item label="身份证号">{contract.tenant.idCard || '暂无'}</Descriptions.Item>
                    <Descriptions.Item label="性别">{contract.tenant.gender ? genderMap[contract.tenant.gender] : '暂无'}</Descriptions.Item>

                    <Descriptions.Item label="房间号">{`${contract.room.building}-${contract.room.number}`}</Descriptions.Item>
                    <Descriptions.Item label="房间类型">{roomTypeMap[contract.room.type] || contract.room.type}</Descriptions.Item>
                    <Descriptions.Item label="面积">{`${contract.room.area}㎡`}</Descriptions.Item>
                    <Descriptions.Item label="楼层">{contract.room.floor}</Descriptions.Item>

                    <Descriptions.Item label="月租">{`¥${contract.rentAmount}`}</Descriptions.Item>
                    <Descriptions.Item label="押金">{`¥${contract.deposit}`}</Descriptions.Item>
                    <Descriptions.Item label="开始日期">{dayjs(contract.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
                    <Descriptions.Item label="结束日期">{dayjs(contract.endDate).format('YYYY-MM-DD')}</Descriptions.Item>

                    <Descriptions.Item label="创建时间">{dayjs(contract.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
} 