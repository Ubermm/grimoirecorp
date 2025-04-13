//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { OrganizationService } from '@/services/organizationService';

const organizationService = new OrganizationService();

// POST /api/organizations/[id]/members
// Add a member to an organization
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate the request
    if (!data.email) {
      return NextResponse.json({ error: 'Member email is required' }, { status: 400 });
    }
    
    // Get organization to check if user is an admin
    const organization = await organizationService.getOrganization(params.id);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const userMember = organization.members.find(member => member.userId === session.user.id);
    
    if (!userMember || userMember.role !== 'Admin') {
      return NextResponse.json({ error: 'Only organization admins can add members' }, { status: 403 });
    }
    
    // Add the member
    const updatedOrg = await organizationService.addMember(
      params.id,
      data.email,
      data.role || 'Member'
    );
    
    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}