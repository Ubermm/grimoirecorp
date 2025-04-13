//@ts-nocheck

// app/org/[id]/page.tsx
'use server';
import { auth } from '@/app/(auth)/auth';
import { redirect, revalidatePath } from 'next/navigation';
import Link from 'next/link';
import { 
  UserPlus, 
  Trash2, 
  Download, 
  MoreHorizontal, 
  Users 
} from 'lucide-react';

// Server actions for organization operations

export async function updateMemberRole(organizationId: string, memberId: string, newRole: 'Admin' | 'Member') {
  // Validate IDs
  if (!organizationId || organizationId === 'undefined' || !memberId || memberId === 'undefined') {
    throw new Error('Invalid organization or member ID');
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: newRole }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update member role');
  }
  
  revalidatePath(`/org/${organizationId}`);
}

export async function removeMember(organizationId: string, memberId: string) {
  // Validate IDs
  if (!organizationId || organizationId === 'undefined' || !memberId || memberId === 'undefined') {
    throw new Error('Invalid organization or member ID');
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/organizations/${organizationId}/members/${memberId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove member');
  }
  
  revalidatePath(`/org/${organizationId}`);
}

export async function deleteOrganization(organizationId: string) {
  // Validate ID
  if (!organizationId || organizationId === 'undefined') {
    throw new Error('Invalid organization ID');
  }
  
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/organizations/${organizationId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete organization');
  }
  
  revalidatePath('/org');
  redirect('/org');
}
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteDialog } from '@/components/invite-dialog';
import { DeleteOrgDialog } from '@/components/delete-org-dialog';
import { UsageChart } from '@/components/usage-chart';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

// Import functions from the queries file
import {
  getOrganization,
  getOrganizationMembers,
  getOrganizationUsageData,
} from '@/lib/db/queries';

// Create a separate file for client component

export default async function OrganizationDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await auth();
  const Params = await params;
  if (!session?.user) {
    redirect('/login');
  }
  
  console.log('Page params received:', Params);
  
  // Handle undefined or invalid ID
  if (!Params.id || Params.id === 'undefined') {
    console.error('Organization ID is undefined or invalid:', Params.id);
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
          <h2 className="text-lg font-semibold">Invalid Organization ID</h2>
          <p>The organization ID is missing or invalid.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/org">Back to Organizations</Link>
        </Button>
      </div>
    );
  }
  
  try {
    console.log('Fetching organization with ID:', Params.id);
    const organization = await getOrganization(Params.id);
    
    if (!organization) {
      console.error('Organization not found for ID:', Params.id);
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
            <h2 className="text-lg font-semibold">Organization Not Found</h2>
            <p>The organization with ID {Params.id} could not be found or you don't have access to it.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/org">Back to Organizations</Link>
          </Button>
        </div>
      );
    }
    
    console.log('Organization found:', organization);
    const members = await getOrganizationMembers(Params.id);
    const usageData = await getOrganizationUsageData(Params.id);
    const isAdmin = organization.currentUserRole === 'Admin';

    return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {organization.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Organization dashboard and member management
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <div className="flex gap-3">
                <InviteDialog
                  organizationId={Params.id}
                  organizationName={organization.name}
                />
                
                <form action={deleteOrganization.bind(null, Params.id)}>
                  <Button type="submit" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.creditsAvailable.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              GPU compute credits
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.creditsUsed.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total credits consumed
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Active organization members
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="mb-6">
        <TabsList>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage</CardTitle>
              <CardDescription>
                GPU compute credits used over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <UsageChart data={usageData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  Manage organization members and permissions
                </CardDescription>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell>
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'Admin' ? 'default' : 'outline'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(member.joinedAt)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="text-right">
                            {/* Use server-side rendering to determine if this is the owner or current user */}
                            {organization.ownerId !== member.id && session.user.id !== member.id ? (
                              <form action={member.role === "Admin" 
                                ? updateMemberRole.bind(null, Params.id, member.id, "Member")
                                : updateMemberRole.bind(null, Params.id, member.id, "Admin")}
                              >
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="icon"
                                  title={member.role === "Admin" ? "Change to Member" : "Change to Admin"}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  } catch (error) {
    console.error('Error in OrganizationDetailPage:', error);
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
          <h2 className="text-lg font-semibold">Error Loading Organization</h2>
          <p>There was an error loading the organization details. Please try again later.</p>
          <p className="text-sm mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/org">Back to Organizations</Link>
        </Button>
      </div>
    );
  }
}