//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { OrganizationService } from '@/services/organizationService';
import { generateUUID } from '@/lib/utils';

const organizationService = new OrganizationService();

// POST /api/organizations/[id]/invite-link
// Generate an invitation link for an organization
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
    const { email, role = 'Member' } = data;
    const Params = await params;
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if user is admin or owner of the organization
    const organization = await organizationService.getOrganization(Params.id);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const member = organization.members.find(m => m.userId === session.user.id);
    if (!member || (member.role !== 'Admin' && organization.ownerId !== session.user.id)) {
      return NextResponse.json({ 
        error: 'Only organization admins can generate invite links' 
      }, { status: 403 });
    }
    
    // Generate a unique token for this invitation
    const inviteToken = generateUUID();
    
    // Store the invitation in the database (simplified for this implementation)
    // In a real implementation, you would store this in a database with an expiration time
    const invitation = {
      token: inviteToken,
      organizationId: Params.id,
      email,
      role,
      createdAt: new Date(),
      invitedBy: session.user.id
    };
    
    // For now, we'll directly add the user to the organization
    // In a full implementation, this would be a separate endpoint that validates the token
    try {
      await organizationService.addMember(
        Params.id,
        email,
        role
      );
    } catch (error) {
      console.error('Error adding member to organization:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to add member to organization' 
      }, { status: 500 });
    }
    
    // Generate a frontend URL that would be used for the invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite?token=${inviteToken}&org=${Params.id}`;
    
    return NextResponse.json({ 
      success: true,
      message: `Invitation sent to ${email}`,
      inviteUrl
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}