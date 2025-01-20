import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    // 等待参数
    const params = await context.params;
    const contractId = parseInt(params.id);

    try {
        // 先检查合同是否存在且状态为 ACTIVE
        const existingContract = await prisma.contract.findUnique({
            where: { id: contractId },
        });

        if (!existingContract) {
            return NextResponse.json(
                { error: '合同不存在' },
                { status: 404 }
            );
        }

        if (existingContract.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: '只能终止生效中的合同' },
                { status: 400 }
            );
        }

        const contract = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 更新合同状态
            const updatedContract = await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: 'TERMINATED',
                },
                include: {
                    room: true,
                },
            });

            // 将房间状态改为空置
            await tx.room.update({
                where: { id: updatedContract.roomId },
                data: {
                    status: 'VACANT',
                },
            });

            return updatedContract;
        });

        return NextResponse.json({ data: contract });
    } catch (error) {
        console.error('Contract termination error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '终止合同失败' },
            { status: 500 }
        );
    }
} 