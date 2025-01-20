import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const contractId = parseInt(params.id);

        if (isNaN(contractId)) {
            console.error('Invalid contract ID:', params.id);
            return NextResponse.json(
                { error: '无效的合同ID' },
                { status: 400 }
            );
        }

        console.log('Fetching contract with ID:', contractId);

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        idCard: true,
                        gender: true,
                    },
                },
                room: {
                    select: {
                        id: true,
                        number: true,
                        building: true,
                        floor: true,
                        type: true,
                        area: true,
                        price: true,
                        deposit: true,
                    },
                },
            },
        });

        if (!contract) {
            console.log('Contract not found');
            return NextResponse.json(
                { error: '合同不存在' },
                { status: 404 }
            );
        }

        console.log('Found contract:', JSON.stringify(contract, null, 2));
        return NextResponse.json({ data: contract });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error('Get contract error:', errorMessage);

        return NextResponse.json(
            {
                error: '获取合同详情失败',
                message: errorMessage
            },
            { status: 500 }
        );
    }
} 