// components/invite-dialog.tsx
"use client";

import { useState } from 'react';
import { UserPlus, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InviteDialogProps {
  organizationId: string;
  organizationName: string;
}

export function InviteDialog({
  organizationId,
  organizationName
}: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [inviteState, setInviteState] = useState<'form' | 'success'>('form');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          role 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate invite link');
      }
      
      const data = await response.json();
      
      // Update state to show success view with invite link
      setInviteUrl(data.inviteUrl);
      setInviteState('success');
    } catch (error) {
      console.error('Failed to invite member:', error);
      setEmailError(error instanceof Error ? error.message : 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const resetDialog = () => {
    setEmail('');
    setRole('Member');
    setEmailError('');
    setInviteState('form');
    setInviteUrl('');
    setCopied(false);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          resetDialog();
        }
        setIsOpen(open);
      }}>
        <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {inviteState === 'form' ? 'Invite a team member' : 'Invitation created'}
            </DialogTitle>
            <DialogDescription>
              {inviteState === 'form' 
                ? `Send an invitation to join ${organizationName}.`
                : `Share this invite link with your teammate to join ${organizationName}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {inviteState === 'form' ? (
            <form onSubmit={handleInvite}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={emailError ? 'border-red-500' : ''}
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm">{emailError}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {role === 'Admin' 
                      ? 'Admins can manage members, billing, and organization settings.' 
                      : 'Members can create and run notebooks but cannot manage the organization.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">⟳</span> Inviting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4 mr-1" /> Invite Member
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4">
              <Alert className="mb-4">
                <AlertDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Invitation sent to <strong>{email}</strong></span>
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-2">
                <Label htmlFor="invite-link">Invite link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="invite-link"
                    value={inviteUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyInviteLink}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This link can be used by anyone to join your organization as a {role.toLowerCase()}.
                </p>
              </div>
              
              <DialogFooter className="mt-6">
                <Button onClick={() => setIsOpen(false)} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}