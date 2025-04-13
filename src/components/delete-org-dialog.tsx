// components/delete-org-dialog.tsx
"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  onDelete: () => Promise<void>;
}

export function DeleteOrgDialog({
  open,
  onOpenChange,
  organizationName,
  onDelete
}: DeleteOrgDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onOpenChange(false);
      setConfirmText('');
    } catch (error) {
      console.error('Failed to delete organization:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setConfirmText('');
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            organization <span className="font-semibold">{organizationName}</span>, its data, and remove all members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="confirm">
              Please type <span className="font-semibold">delete</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'delete' || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}