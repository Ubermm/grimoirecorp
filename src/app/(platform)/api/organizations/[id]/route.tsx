//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { OrganizationService } from '@/services/organizationService';

const organizationService = new OrganizationService();

// GET /api/organizations/[id]
// Retrieve a specific organization
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organization = await organizationService.getOrganization(params.id);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Check if user is a member of this organization
    const isMember = organization.members.some(member => member.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id]
// Update a specific organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Only allow updating name for now
    const allowedUpdates = ['name'];
    const updates = Object.entries(data)
      .filter(([key]) => allowedUpdates.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    // Update the organization
    const organization = await organizationService.updateOrganization(
      params.id,
      updates,
      session.user.id
    );
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]
// Delete a specific organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await organizationService.deleteOrganization(
      params.id,
      session.user.id
    );
    
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}