import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET /api/tenants
export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tenants);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch tenants' },
            { status: 500 }
        );
    }
}

// POST /api/tenants
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Received tenant data:', body);

        const TenantSchema = z.object({
            name: z.string().min(2, '姓名至少2个字符'),
            phone: z.string().min(11, '请输入正确的手机号'),
            idCard: z.string().min(18, '请输入正确的身份证号'),
            gender: z.enum(['MALE', 'FEMALE']).optional().nullable(),
            email: z.string().email('请输入正确的邮箱').optional().nullable(),
            emergencyContact: z.string().optional().nullable(),
            emergencyPhone: z.string().optional().nullable(),
        });

        const data = TenantSchema.parse(body);
        console.log('Parsed tenant data:', data);

        // 确保所有可选字段都有正确的默认值
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                phone: data.phone,
                idCard: data.idCard,
                gender: data.gender || null,
                email: data.email || null,
                emergencyContact: data.emergencyContact || null,
                emergencyPhone: data.emergencyPhone || null,
                status: 'ACTIVE',  // 添加默认状态
            }
        });

        console.log('Created tenant:', tenant);
        return NextResponse.json(tenant);
    } catch (error) {
        // 更详细的错误日志
        console.error('Tenant creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: '数据验证失败',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        // Prisma 错误处理
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: '身份证号已存在' },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                error: '添加租户失败',
                message: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 