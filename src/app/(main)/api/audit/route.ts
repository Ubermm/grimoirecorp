//@ts-nocheck
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { CAudit } from '@/lib/db/models';
import { generateUUID } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific audit
      const audit = await CAudit.findOne({
        _id: id,
        userId: session.user.id
      });

      if (!audit) {
        return new Response('Audit not found', { status: 404 });
      }

      return Response.json(audit);
    } else {
      // Get all audits for user
      const audits = await CAudit.find({
        userId: session.user.id
      }).sort({ createdAt: -1 });

      return Response.json(audits);
    }
  } catch (error) {
    console.error('Error in GET /api/audit:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const audit = await CAudit.create({
      _id: generateUUID(),
      userId: session.user.id,
      ...data
    });

    return Response.json(audit);
  } catch (error) {
    console.error('Error in POST /api/audit:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    
    if (!data._id) {
      return new Response('Audit ID is required', { status: 400 });
    }

    // Ensure user owns this audit
    const existingAudit = await CAudit.findOne({
      _id: data._id,
      userId: session.user.id
    });

    if (!existingAudit) {
      return new Response('Audit not found', { status: 404 });
    }

    // Update audit
    const updatedAudit = await CAudit.findOneAndUpdate(
      { _id: data._id, userId: session.user.id },
      { $set: data },
      { new: true }
    );

    return Response.json(updatedAudit);
  } catch (error) {
    console.error('Error in PATCH /api/audit:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Audit ID is required', { status: 400 });
    }

    // Ensure user owns this audit
    const existingAudit = await CAudit.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!existingAudit) {
      return new Response('Audit not found', { status: 404 });
    }

    await CAudit.deleteOne({ _id: id, userId: session.user.id });

    return new Response('Audit deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/audit:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}