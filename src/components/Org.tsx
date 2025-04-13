//@ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, User, UserPlus, CreditCard, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { DeleteOrgDialog } from './delete-org-dialog';
import { InviteDialog } from './invite-dialog';
import { UsageChart } from './usage-chart';

// Custom button styling
const CustomButton = ({ children, className, ...props }) => {
  return (
    <Button
      className={`bg-black text-white border border-white hover:bg-white hover:text-black transition-all duration-200 shadow-sm ${className || ''}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export const OrganizationList = ({ initialOrganizations = [] }) => {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load organizations
    async function loadOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to load organizations');
        }
        const data = await response.json();
        console.log('Organizations loaded:', data);
        
        // Ensure organization IDs are correctly mapped
        const orgsWithIds = data.map(org => {
          // Make sure we have a valid ID in the standard format
          const validId = org.id || org._id;
          console.log(`Organization: ${org.name}, ID: ${validId}`);
          
          return {
            ...org,
            // Use the MongoDB ID format consistently
            id: validId 
          };
        });
        
        setOrganizations(orgsWithIds);
      } catch (err) {
        setError(err.message);
        console.error('Error loading organizations:', err);
      } finally {
        setLoading(false);
      }
    }

    if (organizations.length === 0) {
      loadOrganizations();
    } else {
      setLoading(false);
    }
  }, [organizations.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error loading organizations: {error}
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl">Your Organizations</CardTitle>
        <CardDescription className="text-sm mt-2">
          Organizations you belong to. Click on any organization to view details.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-3">Organization Name</TableHead>
              <TableHead className="py-3">Your Role</TableHead>
              <TableHead className="py-3">Members</TableHead>
              <TableHead className="py-3">Available Credits</TableHead>
              <TableHead className="py-3">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations && organizations.map((org) => {
              // Generate a unique key for each row
              const orgId = org.id;
              if (!orgId) {
                console.warn('Organization missing ID:', org);
                return null; // Skip rendering orgs without IDs
              }
              
              const key = orgId || `org-${org.name}-${Math.random().toString(36).substring(2, 9)}`;
              
              return (
                <TableRow key={key} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium py-4">
                    <Link href={`/org/${orgId}`} className="block w-full">
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/org/${orgId}`} className="block w-full">
                      <Badge variant={org.userRole === 'Admin' ? 'default' : 'outline'}>
                        {org.userRole || 'Member'}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/org/${orgId}`} className="block w-full">
                      {org.members?.length || 0}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/org/${orgId}`} className="block w-full">
                      {(org.creditsAvailable || 0).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/org/${orgId}`} className="block w-full">
                      {formatDate(new Date(org.createdAt || Date.now()))}
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const OrganizationDetail = ({ organizationId }) => {
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Log the received organization ID for debugging
    console.log('OrganizationDetail received ID:', organizationId);
    
    if (!organizationId || organizationId === 'undefined') {
      console.error('Invalid organization ID received');
      setError('Invalid organization ID');
      setLoading(false);
      return;
    }

    // Load current user information
    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    }

    // Load organization details
    async function loadOrganization() {
      try {
        console.log(`Fetching organization with ID: ${organizationId}`);
        const response = await fetch(`/api/organizations/${organizationId}`);
        if (!response.ok) {
          throw new Error('Failed to load organization details');
        }
        const data = await response.json();
        console.log('Organization details loaded:', data);
        setOrganization(data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading organization:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
    loadOrganization();
  }, [organizationId]);

  const handleInviteMember = async (email, role) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invite member');
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      setIsInviteDialogOpen(false);
    } catch (err) {
      console.error('Error inviting member:', err);
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.message);
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update member role');
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
    } catch (err) {
      console.error('Error updating member role:', err);
      alert(err.message);
    }
  };

  const handleDeleteOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organization');
      }

      router.push('/org');
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error loading organization: {error}
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        Organization not found
      </div>
    );
  }

  // Check if current user is admin or owner
  const isAdmin = organization.members.some(m => m.userId === currentUserId && (m.role === 'Admin' || m.role === 'Owner'));
  const isOwner = organization.ownerId === currentUserId;

  return (
    <div className="space-y-12 px-4 sm:px-6 md:px-8">
      {/* Organization header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground mt-3">
            Manage your organization settings, members, and resources
          </p>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <CustomButton onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="mr-3 h-4 w-4" />
              Invite Member
            </CustomButton>
          )}
          {isOwner && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-3 h-4 w-4" />
              Delete Organization
            </Button>
          )}
        </div>
      </div>

      {/* Usage cards */}
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Credits Available</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{organization.creditsAvailable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">GPU compute credits for your organization</p>
            <CustomButton size="sm" className="mt-6">
              <CreditCard className="mr-3 h-4 w-4" />
              Purchase Credits
            </CustomButton>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{organization.members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Users with access to your organization</p>
            {isAdmin && (
              <CustomButton size="sm" className="mt-6" onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-3 h-4 w-4" />
                Invite Member
              </CustomButton>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Recent Usage</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-20">
              <UsageChart data={organization.usage || []} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members list */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle>Organization Members</CardTitle>
          <CardDescription className="mt-2">
            Manage access and permissions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-3">Member</TableHead>
                <TableHead className="py-3">Role</TableHead>
                <TableHead className="py-3">Joined</TableHead>
                <TableHead className="text-right py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organization.members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{member.name || 'User'}</div>
                        <div className="text-sm text-muted-foreground mt-1">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={member.role === 'Admin' || member.role === 'Owner' ? 'default' : 'outline'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {member.joinedAt ? formatDate(new Date(member.joinedAt)) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    {isAdmin && member.userId !== organization.ownerId && member.userId !== currentUserId && (
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUpdateMemberRole(
                            member.userId, 
                            member.role === 'Admin' ? 'Member' : 'Admin'
                          )}
                        >
                          {member.role === 'Admin' ? 'Make Member' : 'Make Admin'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteDialog 
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteMember}
      />
      
      <DeleteOrgDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        organizationName={organization.name}
        onDelete={handleDeleteOrganization}
      />
    </div>
  );
};

export default function Org({ organizationId }) {
  return organizationId ? (
    <OrganizationDetail organizationId={organizationId} />
  ) : (
    <>
      <div className="flex justify-between items-center mb-12 px-4 sm:px-6 md:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-3">
            Manage your organization access and GPU compute resources
          </p>
        </div>
        <CustomButton asChild>
          <Link href="/org/new">
            <PlusCircle className="mr-3 h-4 w-4" />
            Create Organization
          </Link>
        </CustomButton>
      </div>
      
      <div className="px-4 sm:px-6 md:px-8">
        <OrganizationList />
      </div>
    </>
  );
}