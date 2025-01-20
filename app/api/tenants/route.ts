import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

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

        const TenantSchema = z.object({
            name: z.string().min(2, '姓名至少2个字符'),
            phone: z.string().min(11, '请输入正确的手机号'),
            idCard: z.string().min(18, '请输入正确的身份证号'),
            email: z.string().email('请输入正确的邮箱').optional().nullable(),
            emergencyContact: z.string().optional(),
            emergencyPhone: z.string().optional(),
        });

        const data = TenantSchema.parse(body);

        // 直接创建，让 Prisma 处理可选字段
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                phone: data.phone,
                idCard: data.idCard,
                email: data.email || null,
                emergencyContact: data.emergencyContact || null,
                emergencyPhone: data.emergencyPhone || null,
            }
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Tenant creation error:', error);

        // 返回更详细的错误信息
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '数据验证失败', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: '添加租户失败', details: error },
            { status: 500 }
        );
    }
} 