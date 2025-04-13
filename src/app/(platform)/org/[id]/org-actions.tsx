//@ts-nocheck
'use client';

import { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteDialog } from '@/components/invite-dialog';
import { DeleteOrgDialog } from '@/components/delete-org-dialog';

interface OrgActionsProps {
  organizationId: string;
  organizationName: string;
  onDelete: () => Promise<void>;
}

export function OrgActions({ organizationId, organizationName, onDelete }: OrgActionsProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleInviteMember = async (email: string, role: string) => {
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
      
      // Force a refresh of the page
      window.location.reload();
    } catch (err) {
      console.error('Error inviting member:', err);
      alert(err.message);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsInviteDialogOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Member
      </Button>
      <Button 
        variant="destructive" 
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Organization
      </Button>
      
      <InviteDialog 
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteMember}
      />
      
      <DeleteOrgDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        organizationName={organizationName}
        onDelete={onDelete}
      />
    </>
  );
}