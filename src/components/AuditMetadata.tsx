//@ts-nocheck
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const AuditMetadataForm = ({ 
  metadata, 
  onMetadataChange, 
  onNext, 
  onBack 
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Audit Details</CardTitle>
        <CardDescription>
          Please provide additional information about this audit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facility">Facility Name</Label>
            <Input
              id="facility"
              placeholder="Enter facility name"
              value={metadata.facility}
              onChange={(e) => onMetadataChange({
                ...metadata,
                facility: e.target.value
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="auditType">Audit Type</Label>
            <Input
              id="auditType"
              placeholder="e.g., Annual, Quarterly, Special"
              value={metadata.auditType}
              onChange={(e) => onMetadataChange({
                ...metadata,
                auditType: e.target.value
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="Enter department name"
              value={metadata.department}
              onChange={(e) => onMetadataChange({
                ...metadata,
                department: e.target.value
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewer">Lead Reviewer</Label>
            <Input
              id="reviewer"
              placeholder="Enter lead reviewer's name"
              value={metadata.reviewer}
              onChange={(e) => onMetadataChange({
                ...metadata,
                reviewer: e.target.value
              })}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!metadata.facility || !metadata.auditType || !metadata.department || !metadata.reviewer}
        >
          Create Audit
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AuditMetadataForm;