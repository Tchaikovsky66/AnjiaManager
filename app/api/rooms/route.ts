import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/rooms
export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rooms);
    } catch (error) {
        return NextResponse.json(
            { error: '获取房源列表失败' },
            { status: 500 }
        );
    }
}

// POST /api/rooms
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const RoomSchema = z.object({
            number: z.string().min(1, '房间号不能为空'),
            floor: z.number().min(1, '楼层必须大于0'),
            building: z.string().min(1, '楼栋不能为空'),
            type: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'SUITE']),
            area: z.number().min(1, '面积必须大于0'),
            direction: z.enum(['EAST', 'SOUTH', 'WEST', 'NORTH', 'SOUTHEAST', 'SOUTHWEST', 'NORTHEAST', 'NORTHWEST']),
            facilities: z.array(z.string()).or(z.record(z.boolean())),
            price: z.number().min(0, '租金不能为负'),
            deposit: z.number().min(0, '押金不能为负'),
        });

        const data = RoomSchema.parse(body);

        const room = await prisma.room.create({
            data: {
                ...data,
                facilities: typeof data.facilities === 'object' ? data.facilities : {},
                status: 'VACANT'
            }
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error('Room creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '数据验证失败', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: '添加房源失败', details: error },
            { status: 500 }
        );
    }
} 