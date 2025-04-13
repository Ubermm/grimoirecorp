'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MemberActionsProps {
  organizationId: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  isOwner: boolean;
  isSelf: boolean;
}

export function MemberActions({
  organizationId,
  memberId,
  memberName,
  memberRole,
  isOwner,
  isSelf
}: MemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeRole = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const newRole = memberRole === 'Admin' ? 'Member' : 'Admin';
      
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
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
      
      // Refresh the page to show the updated role
      window.location.reload();
    } catch (err) {
      console.error('Error updating member role:', err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (isLoading) return;
    
    // Confirm removal
    if (!confirm(`Are you sure you want to remove ${memberName || 'this member'}?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
      
      // Refresh the page to show the changes
      window.location.reload();
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show actions for owners or for the current user
  if (isOwner || isSelf) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleChangeRole}
          disabled={isLoading}
        >
          {memberRole === 'Admin' ? 'Change to Member' : 'Change to Admin'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleRemoveMember}
          className="text-destructive"
          disabled={isLoading}
        >
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}