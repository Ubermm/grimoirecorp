//@ts-nocheck
import { Organization, IOrganization, User } from '@/lib/db/models';

export class OrganizationService {
  // Get all organizations for a user
  async getUserOrganizations(userId: string): Promise<IOrganization[]> {
    return await Organization.find({ 
      'members.userId': userId 
    })
    .sort({ createdAt: -1 })
    .lean();
  }
  
  // Get a single organization
  async getOrganization(organizationId: string): Promise<IOrganization | null> {
    try {
      if (!organizationId || organizationId === 'undefined') {
        console.log('Invalid organization ID provided:', organizationId);
        return null;
      }
      
      const org = await Organization.findById(organizationId).lean();
      
      if (!org) {
        console.log('Organization:', org);
        console.log('Organization not found for ID:', organizationId);
      }
      
      return org;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }
  
  // Create a new organization
  async createOrganization(
    name: string,
    ownerId: string,
    ownerEmail: string,
    ownerName?: string
  ): Promise<IOrganization> {
    // Create the organization with the owner as the first admin member
    const organization = await Organization.create({
      name,
      ownerId,
      creditsAvailable: 10000, // Default starting credits
      members: [{
        userId: ownerId,
        role: 'Admin',
        email: ownerEmail,
        name: ownerName
      }]
    });
    
    return organization;
  }
  
  // Add a member to an organization
  async addMember(
    organizationId: string,
    email: string,
    role: 'Admin' | 'Member' = 'Member'
  ): Promise<IOrganization | null> {
    // First check if the user exists
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Then add them to the organization
    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      {
        $addToSet: {
          members: {
            userId: user._id,
            role,
            email,
            name: user.name
          }
        }
      },
      { new: true }
    ).lean();
    
    return updatedOrg;
  }
  
  // Remove a member from an organization
  async removeMember(
    organizationId: string,
    userId: string,
    requestorId: string
  ): Promise<IOrganization | null> {
    // First check if the requestor is an admin
    const organization = await Organization.findById(organizationId).lean();
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    const requestorMember = organization.members.find(m => m.userId === requestorId);
    
    if (!requestorMember || requestorMember.role !== 'Admin') {
      throw new Error('Only organization admins can remove members');
    }
    
    // Don't allow removing the owner
    if (userId === organization.ownerId) {
      throw new Error('Cannot remove the organization owner');
    }
    
    // Remove the member
    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      {
        $pull: {
          members: {
            userId
          }
        }
      },
      { new: true }
    ).lean();
    
    return updatedOrg;
  }
  
  // Update organization details
  async updateOrganization(
    organizationId: string,
    updates: Partial<Pick<IOrganization, 'name' | 'creditsAvailable'>>,
    requestorId: string
  ): Promise<IOrganization | null> {
    // First check if the requestor is an admin
    const organization = await Organization.findById(organizationId).lean();
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    const requestorMember = organization.members.find(m => m.userId === requestorId);
    
    if (!requestorMember || requestorMember.role !== 'Admin') {
      throw new Error('Only organization admins can update organization details');
    }
    
    // Update the organization
    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedOrg;
  }
  
  // Update member role
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: 'Admin' | 'Member',
    requestorId: string
  ): Promise<IOrganization | null> {
    // First check if the requestor is an admin
    const organization = await Organization.findById(organizationId).lean();
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    const requestorMember = organization.members.find(m => m.userId === requestorId);
    
    if (!requestorMember || requestorMember.role !== 'Admin') {
      throw new Error('Only organization admins can update member roles');
    }
    
    // Don't allow changing the owner's role
    if (memberId === organization.ownerId && newRole !== 'Admin') {
      throw new Error('Cannot change the owner\'s role from Admin');
    }
    
    // Update the member's role
    const updatedOrg = await Organization.findOneAndUpdate(
      { 
        _id: organizationId,
        'members.userId': memberId
      },
      {
        $set: {
          'members.$.role': newRole
        }
      },
      { new: true }
    ).lean();
    
    return updatedOrg;
  }
  
  // Delete an organization (only the owner can do this)
  async deleteOrganization(
    organizationId: string,
    requestorId: string
  ): Promise<boolean> {
    // First check if the requestor is the owner
    const organization = await Organization.findById(organizationId).lean();
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    if (organization.ownerId !== requestorId) {
      throw new Error('Only the organization owner can delete the organization');
    }
    
    // Delete the organization
    await Organization.findByIdAndDelete(organizationId);
    
    return true;
  }
}