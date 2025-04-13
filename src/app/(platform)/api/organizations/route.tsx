//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { OrganizationService } from '@/services/organizationService';

const organizationService = new OrganizationService();

// GET /api/organizations
// Retrieve all organizations for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizations = await organizationService.getUserOrganizations(session.user.id);
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/organizations
// Create a new organization
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate the request
    if (!data.name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }
    
    // Create the organization
    const organization = await organizationService.createOrganization(
      data.name,
      session.user.id,
      session.user.email,
      session.user.name
    );
    
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}