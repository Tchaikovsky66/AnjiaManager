import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/contracts
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomNumber = searchParams.get('roomNumber');
        const tenantName = searchParams.get('tenantName');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const contracts = await prisma.contract.findMany({
            where: {
                AND: [
                    roomNumber ? {
                        room: {
                            number: { contains: roomNumber }
                        }
                    } : {},
                    tenantName ? {
                        tenant: {
                            name: { contains: tenantName }
                        }
                    } : {},
                    status ? { status: status as 'ACTIVE' | 'TERMINATED' | 'EXPIRED' } : {},
                    startDate ? {
                        startDate: { gte: new Date(startDate) }
                    } : {},
                    endDate ? {
                        endDate: { lte: new Date(endDate) }
                    } : {},
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                room: {
                    select: {
                        number: true,
                        building: true,
                    },
                },
            },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error('Get contracts error:', error);
        return NextResponse.json(
            { error: '获取合同列表失败' },
            { status: 500 }
        );
    }
}

// POST /api/contracts
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const ContractSchema = z.object({
            tenantId: z.number(),
            roomId: z.number(),
            startDate: z.string(),
            endDate: z.string(),
            rentAmount: z.number().min(0),
            deposit: z.number().min(0),
        });

        const data = ContractSchema.parse(body);

        // 检查租客是否已经租了这个房间
        const existingContract = await prisma.contract.findFirst({
            where: {
                tenantId: data.tenantId,
                roomId: data.roomId,
                status: 'ACTIVE',
            },
        });

        if (existingContract) {
            return NextResponse.json(
                { error: '该租客已经租用了这个房间' },
                { status: 400 }
            );
        }

        // 检查房间是否可用
        const room = await prisma.room.findUnique({
            where: { id: data.roomId },
        });

        if (!room) {
            return NextResponse.json(
                { error: '房间不存在' },
                { status: 400 }
            );
        }

        if (room.status !== 'VACANT') {
            return NextResponse.json(
                { error: '该房间已被租用' },
                { status: 400 }
            );
        }

        const contract = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            try {
                const newContract = await tx.contract.create({
                    data: {
                        tenantId: data.tenantId,
                        roomId: data.roomId,
                        startDate: new Date(data.startDate),
                        endDate: new Date(data.endDate),
                        rentAmount: new Decimal(data.rentAmount),
                        deposit: new Decimal(data.deposit),
                        status: 'ACTIVE',
                    },
                    include: {
                        tenant: {
                            select: {
                                name: true,
                                phone: true,
                            },
                        },
                        room: {
                            select: {
                                number: true,
                                building: true,
                            },
                        },
                    },
                });

                await tx.room.update({
                    where: { id: data.roomId },
                    data: { status: 'OCCUPIED' },
                });

                return newContract;
            } catch (txError) {
                throw new Error(txError instanceof Error ? txError.message : '创建合同失败');
            }
        });

        if (!contract) {
            return NextResponse.json({ error: '创建合同失败' }, { status: 500 });
        }

        return NextResponse.json({ data: contract });
    } catch (error) {
        console.error('Contract creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: '数据验证失败',
                details: error.errors
            }, { status: 400 });
        }

        return NextResponse.json({
            error: '添加合同失败',
            message: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 