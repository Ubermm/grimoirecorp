//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { OrganizationService } from '@/services/organizationService';

const organizationService = new OrganizationService();

// PATCH /api/organizations/[id]/members/[userId]
// Update a member's role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate the request
    if (!data.role || !['Admin', 'Member'].includes(data.role)) {
      return NextResponse.json({ error: 'Valid role (Admin or Member) is required' }, { status: 400 });
    }
    
    // Update the member's role
    const organization = await organizationService.updateMemberRole(
      params.id,
      params.userId,
      data.role,
      session.user.id
    );
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members/[userId]
// Remove a member from an organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Remove the member
    const organization = await organizationService.removeMember(
      params.id,
      params.userId,
      session.user.id
    );
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found or removal failed' }, { status: 404 });
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}