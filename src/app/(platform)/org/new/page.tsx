// app/org/new/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useState, FormEvent } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'university',
    domain: '',
    initialCredits: '5000'
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      const data = await response.json();
      
      toast({
        title: "Organization created",
        description: `${formData.name} has been created successfully.`,
      });

      // Redirect to the organization page
      router.push(`/org/${data._id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-md">
      <div className="mb-8">
        <Link 
          href="/org" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Create Organization</CardTitle>
          <CardDescription className="text-center">
            Set up a new organization to manage GPU compute resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Stanford AI Research Lab" 
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Organization Type</Label>
                <Select 
                  name="type" 
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="research">Research Institute</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="domain">Email Domain (Optional)</Label>
                <Input 
                  id="domain" 
                  name="domain" 
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g. stanford.edu" 
                />
                <p className="text-sm text-muted-foreground">
                  Users with this email domain can request to join your organization
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="initialCredits">Initial Credits</Label>
                <Select 
                  name="initialCredits" 
                  value={formData.initialCredits}
                  onValueChange={(value) => handleSelectChange('initialCredits', value)}
                >
                  <SelectTrigger id="initialCredits">
                    <SelectValue placeholder="Select initial credits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1,000 Credits</SelectItem>
                    <SelectItem value="5000">5,000 Credits</SelectItem>
                    <SelectItem value="10000">10,000 Credits</SelectItem>
                    <SelectItem value="25000">25,000 Credits</SelectItem>
                    <SelectItem value="custom">Custom Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
              <Button variant="outline" type="button" asChild className="w-full">
                <Link href="/org">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}