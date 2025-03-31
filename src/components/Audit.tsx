//@ts-nocheck
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider,useFormContext } from "react-hook-form";
import { toast } from 'sonner';
import {
  FileSearch,
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle,
  XCircle,
  AlertCircle,
  Info,
  Trash2,
  FileText,
  Download,
  EyeIcon,
  Loader2,
  Save,
  Edit
} from 'lucide-react';
import { 
  Card,
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AutoFill from '@/components/AutoFill';
import AuditReport from '@/components/AuditReport';
import ValidationResults from '@/components/ValidationResults';
import AuditMetadataForm from '@/components/AuditMetadata';
import { generateUUID } from '@/lib/utils';

// Type Definitions (same as previous implementation)
interface Question {
  id: string;
  type: 'BOOLEAN' | 'NUMERIC' | 'DATE' | 'TIME' | 'SELECT' | 'CHECKBOX' | 'TEXT';
  text: string;
  options?: string[];
  range?: {
    min: number;
    max: number;
  };
  cfr_reference: string;
}

interface FormSchema {
  questions: Question[];
  facts: Array<{
    template: string;
    question_id: string;
    description: string;
  }>;
  validations: Array<{
    rule: string;
    description: string;
    operators_used: string[];
  }>;
  queries: Array<{
    query: string;
    description: string;
    validation_rule: string;
  }>;
}

interface AuditResponse {
  questionId: string;
  answer: string;
  lastModified: Date;
}

interface AuditSubsection {
  id: string;
  pos: string;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'flagged';
  responses: AuditResponse[];
  validationResults?: {
    passed: string[];
    description: string[];
  };
  deepValidationResults?: {
    passed: string[];
    description: string[];
  };
  comment?: string; // Add comment field
}

interface Audit {
  _id: string;
  name: string;
  userId: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'completed' | 'archived';
  checkpoint: number;
  subsections: AuditSubsection[];
  metadata: {
    facility: string;
    auditType: string;
    department: string;
    reviewer: string;
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface FormValues {
  responses: Record<string, string>;
  deepResponses: Record<string, string>;
}
let cachedRegulations: Record<string, string> | null = null;
let cachedForms: Record<string, FormSchema> | null = null;

const RegulationDialog= ({ 
  showRegulationDialog, 
  setShowRegulationDialog, 
  audit, 
  currentStep 
}) => {
  const [regulation, setRegulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  

  useEffect(() => {
    if (!audit?.subsections[currentStep]?.code || !showRegulationDialog) return;

    const fetchRegulation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const codeToFetch = audit.subsections[currentStep].code;
        const response = await fetch(`/api/regulations?code=${encodeURIComponent(codeToFetch)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch regulation');
        }
        
        const data = await response.json();
        setRegulation(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load regulation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegulation();
  }, [audit?.subsections[currentStep]?.code, showRegulationDialog]);

  if (!audit?.subsections[currentStep]?.code) return null;

  return (
    <Dialog open={showRegulationDialog} onOpenChange={setShowRegulationDialog}>
      <DialogContent className="min-w-[900px]">
        <DialogHeader>
          <DialogTitle>{audit.subsections[currentStep].code}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-auto min-w-[800px] p-8">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-sm whitespace-pre-wrap font-mono">
                {regulation?.RegText || 'Regulation text not found'}
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => setShowRegulationDialog(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MetadataDialog = ({
  showMetadataDialog,
  setShowMetadataDialog,
  audit,
  setAudit
}) => {

const [localMetadata, setLocalMetadata] = useState(audit?.metadata || {});

  const handleSave = async () => {
    if (!audit) return;

    try {
      const updatedAudit = {
        ...audit,
        metadata: localMetadata
      };

      const response = await fetch('/api/audit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAudit)
      });

      if (!response.ok) throw new Error('Failed to update metadata');

      const savedAudit = await response.json();
      setAudit(savedAudit);
      setShowMetadataDialog(false);
      toast.success('Audit details updated successfully');
    } catch (error) {
      console.error('Error updating audit details:', error);
      toast.error('Failed to update audit details');
    }
  };

  return (
    <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Audit Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facility">Facility Name</Label>
            <Input
              id="facility"
              placeholder="Enter facility name"
              value={localMetadata.facility || ''}
              onChange={(e) => setLocalMetadata({ ...localMetadata, facility: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auditType">Audit Type</Label>
            <Input
              id="auditType"
              placeholder="e.g., Annual, Quarterly, Special"
              value={localMetadata.auditType || ''}
              onChange={(e) => setLocalMetadata({ ...localMetadata, auditType: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="Enter department name"
              value={localMetadata.department || ''}
              onChange={(e) => setLocalMetadata({ ...localMetadata, department: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewer">Lead Reviewer</Label>
            <Input
              id="reviewer"
              placeholder="Enter lead reviewer's name"
              value={localMetadata.reviewer || ''}
              onChange={(e) => setLocalMetadata({ ...localMetadata, reviewer: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowMetadataDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  };

const AuditComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auditId = searchParams.get('id');

  // State Management
  const [existingAudits, setExistingAudits] = useState<Audit[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [regulations, setRegulations] = useState<Record<string, string>>({});
  const [forms, setForms] = useState<Record<string, FormSchema>>({});
  const [codesWithForms, setCodesWithForms] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAddCodes, setShowAddCodes] = useState(false);
  const [showExistingAudits, setShowExistingAudits] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null);
  const [newAuditName, setNewAuditName] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [hasEdited, sethasEdited] = useState(false);
  const [showRegulationDialog, setShowRegulationDialog] = useState(false);
  // Add to existing state management section
const [deepForm, setDeepForm] = useState<FormSchema | null>(null);
const [loadingDeepForm, setLoadingDeepForm] = useState(false);
  // Add new state for creation steps
  const [creationStep, setCreationStep] = useState(1); // 1: Name/Codes, 2: Metadata
  const [auditMetadata, setAuditMetadata] = useState({
    facility: '',
    auditType: '',
    department: '',
    reviewer: ''
  });
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  // Updated delete handler with confirmation


  useEffect(() => {
    if (!currentForm && !deepForm) return;
  
    let initialResponses = {};
  
    // First, try to get existing responses from audit for main form
    if (audit?.subsections[currentStep]?.responses) {
      initialResponses = audit.subsections[currentStep].responses.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.questionId]: curr.answer
        }),
        {}
      );
    }
  
    // Add existing deep responses if available
    if (audit?.subsections[currentStep]?.deepResponses) {
      initialResponses = {
        ...initialResponses,
        ...audit.subsections[currentStep].deepResponses.reduce(
          (acc, curr) => ({
            ...acc,
            [curr.questionId]: curr.answer
          }),
          {}
        )
      };
    }
  
    // For any missing responses, fill with defaults from main form
    if (currentForm) {
      currentForm.questions.forEach(question => {
        if (!initialResponses[question.id]) {
          initialResponses[question.id] = getDefaultFormFieldValue(question);
        }
      });
    }
  
    // Fill defaults for deep form questions
    if (deepForm) {
      deepForm.questions?.forEach(question => {
        if (!initialResponses[question.id]) {
          initialResponses[question.id] = getDefaultFormFieldValue(question);
        }
      });
    }
  
    methods.reset({ 
      responses: initialResponses,
      auditName: audit?.name || `Audit ${new Date().toLocaleDateString()}`
    });
  }, [currentForm, deepForm, currentStep, audit]);

  // Load existing audits
  useEffect(() => {
    const loadExistingAudits = async () => {
      try {
        const response = await fetch('/api/audit');
        if (!response.ok) throw new Error('Failed to fetch existing audits');
        const audits = await response.json();
        setExistingAudits(audits);
        
      } catch (error) {
        console.error('Error loading existing audits:', error);
        toast.info('Failed to load existing audits');
      }
    };

    if (showExistingAudits) {
      loadExistingAudits();
    }
  }, [showExistingAudits]);  

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
  
        // Load regulations if not cached
        if (!cachedRegulations) {
          const regsResponse = await fetch('/api/serveReg');
          if (!regsResponse.ok) throw new Error('Failed to fetch regulations');
          cachedRegulations = await regsResponse.json();
        }
        
        setRegulations(cachedRegulations.content.Keys);
  
        // Load existing audit if ID is provided
        if (auditId) {
          const auditResponse = await fetch(`/api/audit?id=${auditId}`);
          if (!auditResponse.ok) throw new Error('Failed to load audit');
          
          const auditData = await auditResponse.json();
          setAudit(auditData);
          setShowExistingAudits(false);
          
          if (auditData?.subsections) {
            setSelectedCodes(auditData.subsections.map((s: AuditSubsection) => s.code));
            setCurrentStep(auditData.checkpoint || 0);
            
            // Load form for current checkpoint
            const currentSubsection = auditData.subsections[auditData.checkpoint || 0];
            if (currentSubsection) {
              const codeToFetch = currentSubsection.code;
              const regsResponse = await fetch(`/api/regulations?code=${encodeURIComponent(codeToFetch)}`);
              if (!regsResponse.ok) throw new Error('Failed to fetch regulation');
              const regulation = await regsResponse.json();
  
              if (regulation?.FormCode) {
                const formsResponse = await fetch(`/api/forms?code=${encodeURIComponent(regulation.FormCode)}`);
                if (!formsResponse.ok) throw new Error('Failed to fetch form');
                const form = await formsResponse.json();
                setCurrentForm(form.FormText);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load audit data');
      } finally{
        setIsLoading(false);
      }
    };
  
    loadInitialData();
  }, [auditId, regulations]);

  // Load current form when step changes
  // Update the existing useEffect that loads forms when step changes
useEffect(() => {
  const loadForm = async () => {
    if (!audit || currentStep >= audit.subsections.length) return;
    
    try {
      const currentSubsection = audit.subsections[currentStep];
      if (!currentSubsection) return;

      const codeToFetch = currentSubsection.code;
      const regsResponse = await fetch(`/api/regulations?code=${encodeURIComponent(codeToFetch)}`);
      if (!regsResponse.ok) throw new Error('Failed to fetch regulation');
      const regulation = await regsResponse.json();

      if (regulation?.FormCode) {
        const formsResponse = await fetch(`/api/forms?code=${encodeURIComponent(regulation.FormCode)}`);
        if (!formsResponse.ok) throw new Error('Failed to fetch form');
        const form = await formsResponse.json();
        setCurrentForm(form.FormText);
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form');
    }
  };

  // Execute the async function
  loadForm();
}, [currentStep, audit]);

  
useEffect(() => {
  sethasEdited(false);
}, []);

useEffect(() => {
  sethasEdited(false);
}, [auditId]);



  // Define loadDeepQuestions as a regular function
const loadDeepQuestions = useCallback(async () => {
  try {
    setDeepForm({});
    // Check if audit and current subsection exist
    if (!audit?.subsections || !audit.subsections[currentStep]) {
      console.log('Audit or current subsection not available yet');
      return;
    }
    
    setIsLoading(true);
    
    const warnL = await fetch('/api/topk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cfrSubsection: audit?.subsections[currentStep]?.code
      })
    });
    
    console.log(warnL);
    const Ls = await warnL.json();
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cfrSubsection: audit?.subsections[currentStep]?.code,
        form: JSON.stringify(currentForm?.questions?.reduce((acc, question) => ({
          ...acc,
          [question.id]: {
            id: question.id,
            type: question.type.toLowerCase(),
            question: question.text,
            value: methods.getValues(`responses.${question.id}`)
          }
        }), {}) || {}),
        warningLetters: Ls.warningLetters || []
      })
    });
    
    if (!response.ok) throw new Error('Failed to load deep questions');
    
    const deepFormData = await response.json();
    console.log(deepFormData.form);
    setDeepForm(deepFormData.form);
  } catch (error) {
    console.error('Error loading deep questions:', error);
    toast.error('Failed to load additional validation questions');
  } finally {
    setIsLoading(false);
  }
}, [audit, currentStep, currentForm]);


useEffect(() => {
  if (audit?.subsections && audit.subsections[currentStep] && currentForm) {
    loadDeepQuestions();
  }
}, [currentStep, audit, currentForm, loadDeepQuestions]);

  // Filtered regulations for search
  const filteredRegulations = useMemo(() => {
    if (!searchTerm) return [];
    
    // Clean and normalize the search term
    const cleanedSearch = searchTerm.toLowerCase()
      .replace(/^21\s*cfr\s*/i, '')  // Remove "21 CFR" prefix if present
      .trim()
      .replace(/\s+/g, '');  // Remove all whitespace
    
    // If the search is empty after cleaning, return empty array
    if (!cleanedSearch) return [];

    // Helper function to normalize a CFR code for comparison
    const normalizeCfrCode = (code: string) => {
      return code.toLowerCase().replace(/\s+/g, '');
    };

    // Helper function to check if a search term matches a CFR code pattern
    const isNumberSearch = /^\d/.test(cleanedSearch);

     return regulations
      .filter(code => {
        const normalizedCode = normalizeCfrCode(code);
        
        // If searching with numbers, prioritize code matching
        if (isNumberSearch) {
          // Match partial numbers in the code
          // This will match "1" with "1.234", "12" with "12.345", etc.
          const codeNumbers = normalizedCode.match(/\d+\.?\d*/g) || [];
          const searchNumbers = cleanedSearch.match(/\d+\.?\d*/g) || [];
          
          return searchNumbers.every(searchNum => 
            codeNumbers.some(codeNum => codeNum.startsWith(searchNum))
          );
        } else {
          // For text searches, just check the code
          return normalizedCode.includes(cleanedSearch);
        }
      })
      .slice(0, 10)  // Limit to 10 results
      .map(code => ({
        code,
        description: '', // No description available
        hasForm: true
      }));
  }, [searchTerm]);

  // Form Management
  const methods = useForm({
    defaultValues: {
      responses: currentForm?.questions?.reduce((acc, question) => ({
        ...acc,
        [question.id]: question.type === 'CHECKBOX' ? [] : ''
      }), {}),
      deepResponses: deepForm?.questions?.reduce((acc, question) => ({
        ...acc,
        [question.id]: question.type === 'CHECKBOX' ? [] : ''
      }), {})
    },
    mode: "onChange",
  });

  const handleDeleteConfirm = async () => {
    if (!auditToDelete) return;
  
    try {
      const response = await fetch(`/api/audit?id=${auditToDelete}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) throw new Error('Failed to delete audit');
  
      // Remove the audit from the local state
      setExistingAudits(prev => prev.filter(a => a._id !== auditToDelete));
      setShowDeleteDialog(false);
      setAuditToDelete(null);
      toast.success('Audit deleted successfully');
  
      // If we're deleting the current audit, redirect to main page
      if (audit?._id === auditToDelete) {
        // Force a complete page reload to ensure clean state
        window.location.href = '/audit';
      }
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast.error('Failed to delete audit');
    }
  };


  const handleEditExistingAuditName = async (auditId: string) => {
    try {
      const auditToUpdate = existingAudits.find(a => a._id === auditId);
      if (!auditToUpdate) return;
  
      const updatedAudit = {
        ...auditToUpdate,
        name: editingName
      };
  
      const response = await fetch(`/api/audit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAudit)
      });
  
      if (!response.ok) throw new Error('Failed to update audit name');
      
      const savedAudit = await response.json();
      setExistingAudits(prev => 
        prev.map(a => a._id === auditId ? savedAudit : a)
      );
      setEditingNameId(null);
      setEditingName('');
      toast.success('Audit name updated successfully');
    } catch (error) {
      console.error('Error updating audit name:', error);
      toast.error('Failed to update audit name');
    }
  };

  // Add DeleteConfirmDialog component
  const DeleteConfirmDialog = () => (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this audit? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  
  const getDefaultFormFieldValue = (question: Question): string => {
    switch (question.type) {
      case 'BOOLEAN':
        return 'false';  // Default to 'No'
      case 'NUMERIC':
        return question.range?.min?.toString() || '0';
      case 'DATE':
        return new Date().toISOString().split('T')[0];
      case 'TIME':
        return '00:00';
      case 'SELECT':
        return question.options?.[0] || '';
      case 'CHECKBOX':
        // If options exist, check the first option by default
        return question.options && question.options.length > 0 
          ? JSON.stringify([question.options[0]]) 
          : JSON.stringify([]);
      case 'TEXT':
      default:
        return '';
    }
  };

  
  const handleDeleteAudit = async (id: string) => {
    try {
      const response = await fetch(`/api/audit?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete audit');
      }

      setExistingAudits(prev => prev.filter(a => a._id !== id));
      toast.info('Audit deleted successfully');
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast.info('Failed to delete audit');
    }
  };

  const downloadReport = () => {
    sethasEdited(false);
    setShowReportDialog(true);
  };
  
  const viewFullReport = () => {
      return(
        <Dialog 
          open={showReportDialog} 
          onOpenChange={setShowReportDialog}
          className="w-full mx-auto" // Fixed width in pixels
        >
          <DialogContent
            className="w-full min-w-[800px] min-h-[600px] overflow-y-auto p-8 bg-white rounded-lg shadow-lg"
          >
            <DialogTitle className="sr-only">Audit Report</DialogTitle>
            <button 
              className="absolute top-2 right-2 text-black hover:text-gray-800"
              onClick={() => setShowReportDialog(false)}
            >
              ✖
            </button>
            <AuditReport audit={audit} />
          </DialogContent>
        </Dialog>
      );
}

  const handleEditAuditName = async () => {
    if (!audit) return;

    try {
      const newName = methods.getValues('auditName');
      const updatedAudit = { ...audit, name: newName };

      const response = await fetch(`/api/audit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAudit)
      });

      if (!response.ok) throw new Error('Failed to update audit name');
      
      const savedAudit = await response.json();
      setAudit(savedAudit);
      setIsEditingName(false);
      toast.info('Audit name updated successfully');
    } catch (error) {
      console.error('Error updating audit name:', error);
      toast.info('Failed to update audit name');
    }
  };

  const viewPdfReport = () => {
    if (!audit) return;

    const reportContent = JSON.stringify({
      name: audit.name,
      status: audit.status,
      subsections: audit.subsections.map(section => ({
        code: section.code,
        status: section.status,
        validationResults: section.validationResults,
        deepValidationResults: section.deepValidationResults
      }))
    }, null, 2);

    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write(`<pre>${reportContent}</pre>`);
      pdfWindow.document.title = `Audit Report - ${audit.name}`;
    }
  };

  const handleNext = async () => {
    if (!audit) return;

    // If it's the last step, show the report dialog
    if (currentStep === audit.subsections.length - 1) {
      setShowReportDialog(true);
      return;
    }

    // Move to next step without validation
    setCurrentStep(prev => Math.min(prev + 1, audit.subsections.length - 1));
  };

  const validateAndContinue = async () => {
  if (!audit || !currentForm) return;
  sethasEdited(false);
  setIsValidating(true);
  try {
    // Get the current form values
    const formValues = methods.getValues('responses');
    const currentSubsection = audit.subsections[currentStep];
    
    // Regular validation
    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: currentSubsection.code,
        responses: formValues,
        form: currentForm
      })
    });

    if (!response.ok) throw new Error('Validation failed');
    const validationResults = await response.json();
    
    // Deep validation if deep form exists
    let deepValidationResults = { passed: [], description: [] };
    if (deepForm) {
      try {
        const deepResponse = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: currentSubsection.code,
            responses: formValues,
            form: deepForm
          })
        });
        
        if (deepResponse.ok) {
          deepValidationResults = await deepResponse.json();
        }
      } catch (error) {
        console.error('Error during deep validation:', error);
      }
    }
    
    // Separate responses into main and deep
    const mainResponses = [];
    const deepResponses = [];
    
    Object.entries(formValues).forEach(([questionId, answer]) => {
      const responseObj = {
        questionId,
        answer,
        lastModified: new Date()
      };
      
      if (deepForm?.questions.some(q => q.id === questionId)) {
        deepResponses.push(responseObj);
      } else {
        mainResponses.push(responseObj);
      }
    });
    
    // Determine overall status based on both validations
    const mainPassed = validationResults.passed.every(result => result === true);
    const deepPassed = deepValidationResults.passed.every(result => result === true);
    const overallStatus = mainPassed && deepPassed ? 'completed' : 'flagged';
    
    // Create updated subsections array with validation results
    const updatedSubsections = audit.subsections.map((s, idx) => 
      idx === currentStep
        ? { 
            ...s, 
            status: overallStatus,
            validationResults: {
              passed: validationResults.passed || [],
              description: validationResults.description || [],
            },
            deepValidationResults: {
              passed: deepValidationResults.passed || [],
              description: deepValidationResults.description || [],
            },
            responses: mainResponses,
            deepResponses: deepResponses
          }
        : s
    );

    const updatedAudit = {
      ...audit,
      checkpoint: currentStep,
      subsections: updatedSubsections
    };

    const saveResponse = await fetch(`/api/audit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAudit)
    });

    if (!saveResponse.ok) throw new Error('Failed to save validation results');

    const savedAudit = await saveResponse.json();
    setAudit(savedAudit);
    
    if (mainPassed && deepPassed) {
      toast.info('Section validated successfully');
      setShowReportDialog(true);
    } else {
      toast.info('Validation found issues. Please review.');
      setShowReportDialog(true);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    toast.info('Failed to validate section');
  } finally {
    setIsValidating(false);
  }
};

  
  // Handle adding CFR code

  const handleAddCode = (code: string) => {
    
    if (!selectedCodes.includes(code)) {
      setSelectedCodes(prev => [...prev, code]);
    }
  };

  // Handle removing CFR code
  const handleRemoveCode = (code: string) => {
    setSelectedCodes(prev => prev.filter(c => c !== code));
  };
  // Handle saving audit progress
  const handleSave = async () => {
    if (!audit) return;
    sethasEdited(true);
    setIsSaving(true);
    try {
      const formValues = methods.getValues().responses;
      
      // Separate deep responses from regular responses
      const mainResponses = [];
      const deepResponses = [];
      
      // Process all form values and categorize them
      Object.entries(formValues).forEach(([questionId, answer]) => {
        // Determine if this is a deep question based on question ID format
        // You may need to adjust this logic based on how you identify deep questions
        const responseObj = {
          questionId,
          answer,
          lastModified: new Date()
        };
        
        // Check if this is a deep question - adjust this condition based on your ID structure
        if (deepForm?.questions.some(q => q.id === questionId)) {
          deepResponses.push(responseObj);
        } else {
          mainResponses.push(responseObj);
        }
      });
  
      const updatedAudit = {
        ...audit,
        checkpoint: currentStep,
        subsections: audit.subsections.map((s, idx) => 
          idx === currentStep
            ? { 
                ...s, 
                responses: mainResponses, 
                deepResponses: deepResponses,
                status: 'in_progress',
                comment: s.comment // Preserve the comment
              }
            : s
        )
      };
  
      const response = await fetch(`/api/audit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAudit)
      });
  
      if (!response.ok) throw new Error('Failed to save audit');
      
      const savedAudit = await response.json();
      setAudit(savedAudit);
      toast.info('Progress saved successfully');
    } catch (error) {
      console.error('Error saving audit:', error);
      toast.info('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading animation
  if (isLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="text-center font-medium">
                {isLoading ? 'Loading audit data...' : 'Validating section...'}
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle form validation
  const handleValidate = async () => {
    if (!audit || !currentForm) return;
    sethasEdited(false);
    try {
      const formValues = methods.getValues().responses;

      const deepValue = methods.getValues().deepResponses;

      const currentSubsection = audit.subsections[currentStep];
      
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentSubsection.code,
          responses: formValues,
          form: currentForm
        })
      });

      if (!response.ok) throw new Error('Validation failed');

      const deepResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentSubsection.code,
          responses: deepValue,
          form: deepForm
        })
      });

      if (!deepResponse.ok) throw new Error('Validation failed');

      const validationResults = await response.json();
      const deepValidationResults = await deepResponse.json();
      const updatedAudit = {
        ...audit,
        checkpoint: currentStep,
        subsections: audit.subsections.map((s, idx) => 
          idx === currentStep
            ? { 
                ...s, 
                status: validationResults.passed.every(result => result === true) && deepValidationResults.passed.every(result => result === true) ? 'completed' : 'flagged',
                validationResults: {
                  passed: validationResults.passed || [],
                  description: validationResults.description || [],
                },
                deepValidationResults: {
                  passed: deepValidationResults.passed || [],
                  description: deepValidationResults.description || [],
                },
                responses: Object.entries(formValues).map(([questionId, answer]) => ({
                  questionId,
                  answer,
                  lastModified: new Date()
                }))
              }
            : s
        )
      };

      const saveResponse = await fetch(`/api/audit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAudit)
      });

      if (!saveResponse.ok) throw new Error('Failed to save validation results');

      const savedAudit = await saveResponse.json();
      setAudit(savedAudit);
      
      if (validationResults.passed.every(result => result === true) && deepValidationResults.passed.every(result => result === true)) {
        toast.info('Section validated successfully');
      } else {
        toast.info('Validation failed. Please review the issues.');
      }
    } catch (error) {
      console.error('Error during validation:', error);
      toast.info('Failed to validate section');
    }
  };

  // Handle creating new audit
  const handleCreateAudit = async () => {
    if (selectedCodes.length === 0 || !newAuditName.trim()) {
      toast.error('Please select at least one CFR code and provide an audit name');
      return;
    }
  
    try {
      const authResponse = await fetch('/api/auth/session');
      if (!authResponse.ok) {
        toast.error('Please sign in to create an audit');
        router.push('/login');
        return;
      }
  
      const newAudit = {
        name: newAuditName.trim(),
        status: 'in_progress' as const,
        checkpoint: 0,
        subsections: selectedCodes.map((code, index) => ({
          id: generateUUID(),
          pos: String(index + 1),
          code,
          status: 'pending' as const,
          responses: []
        })),
        metadata: auditMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAudit)
      });
  
      if (!response.ok) throw new Error('Failed to create audit');
  
      const createdAudit = await response.json();
      setAudit(createdAudit);
      setShowAddCodes(false);
      setShowExistingAudits(false);
      router.replace(`/audit?id=${createdAudit._id}`);
    } catch (error) {
      console.error('Error creating audit:', error);
      toast.error('Failed to create audit');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="text-center font-medium">Loading audit data...</div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show existing audits
if (showExistingAudits) {
  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-6xl mx-auto min-h-[700px]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Audits</CardTitle>
              <CardDescription>Continue an existing audit or start a new one</CardDescription>
            </div>
            <div className='flex space-x-4'>
              <Button onClick={() => {
                setShowExistingAudits(false); 
                setSelectedCodes(['21 CFR 56.104', '21 CFR 56.105', '21 CFR 56.106', '21 CFR 56.107', '21 CFR 56.108', 
                '21 CFR 56.109', '21 CFR 56.110', '21 CFR 56.111', '21 CFR 56.112', '21 CFR 56.113', '21 CFR 56.114',
                '21 CFR 56.115'
                ]);
                setNewAuditName('New IRB Protocol & Documentation Audit'); 
                setSearchTerm('21 CFR 56'); // Set initial search term
                setShowAddCodes(true);
              }}
              className='bg-black text-white hover:bg-gray-800'>
                <PlusCircle className="mr-2 h-4 w-4" />
                IRB Documentation Audit
              </Button>
              <Button onClick={() => {
                setShowExistingAudits(false); 
                setSelectedCodes([ '21 CFR 50.20', '21 CFR 50.25', '21 CFR 50.27']);
                setNewAuditName('New Protection of Trial Participants Audit'); 
                setSearchTerm('21 CFR 50'); // Set initial search term
                setShowAddCodes(true);
              }}
              className='bg-black text-white hover:bg-gray-800'>
                <PlusCircle className="mr-2 h-4 w-4" />
                Trial Participants Audit
              </Button>
              <Button onClick={() => {
                setShowExistingAudits(false); 
                setSelectedCodes([]);
                setNewAuditName('New Audit'); 
                setSearchTerm('1.1'); // Set initial search term
                setShowAddCodes(true);
              }}
              className='bg-black text-white hover:bg-gray-800'>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Audit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-full">
            {existingAudits.length > 0 ? (
              <div className="space-y-4">
                {existingAudits.map((existingAudit) => (
                  <Card key={existingAudit._id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2 flex-grow">
                          {existingAudit._id === editingNameId ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="max-w-md"
                              />
                              <Button 
                                size="sm"
                                onClick={() => handleEditExistingAuditName(existingAudit._id)}
                              >
                                Save
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingNameId(null);
                                  setEditingName('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{existingAudit.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingNameId(existingAudit._id);
                                  setEditingName(existingAudit.name);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(existingAudit.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {existingAudit.status.replace('_', ' ')}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {existingAudit.subsections.map((subsection) => (
                              <span 
                                key={subsection.id}
                                className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1"
                              >
                                {subsection.code}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setAuditToDelete(existingAudit._id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => router.replace(`/audit?id=${existingAudit._id}`)}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium">No Audits Yet</h3>
                  <p className="text-muted-foreground">Create your first audit to get started</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <DeleteConfirmDialog />
    </div>
  );
}
  
  // Modify the code selection UI
  if (showAddCodes) {
    return (
      <div className="container mx-auto p-6">
  {creationStep === 1 ? (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Audit</CardTitle>
        <CardDescription>
          Name your audit and select CFR codes to include
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auditName">Audit Name</Label>
            <Input
              id="auditName"
              placeholder="Enter audit name"
              value={newAuditName}
              onChange={(e) => setNewAuditName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cfrSearch">Search CFR Codes</Label>
            <Input
              id="cfrSearch"
              placeholder="Search CFR codes (eg. '211.113')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <ScrollArea className="h-96 w-full rounded-md border p-4">
            {filteredRegulations.length > 0 ? (
              filteredRegulations.map(({ code, description, hasForm }) => (
                <div
                  key={code}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {code}
                      {!hasForm && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Audit form not yet available for this code
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCode(code)}
                    disabled={selectedCodes.includes(code) || !hasForm}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No matching CFR codes found
              </div>
            )}
          </ScrollArea>

          <div className="mt-4">
            <div className="font-medium mb-2">Selected Codes:</div>
            <div className="flex flex-wrap gap-2">
              {selectedCodes.map((code) => (
                <div
                  key={code}
                  className="text-black flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                >
                  {code}
                  <button
                    onClick={() => handleRemoveCode(code)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setShowAddCodes(false);
            setShowExistingAudits(true);
            setNewAuditName('');
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setCreationStep(2)}
          disabled={selectedCodes.length === 0 || !newAuditName.trim()}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  ) : (
    <AuditMetadataForm
      metadata={auditMetadata}
      onMetadataChange={setAuditMetadata}
      onNext={handleCreateAudit}
      onBack={() => setCreationStep(1)}
    />
  )}
</div>
    );
  }


  // Main audit form UI
  return (
    <FormProvider {...methods}>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center justify-between">
                  {isEditingName ? (
                    <div className="flex items-center space-x-2 w-full">
                      <Input
                        value={audit?.name || ''}
                        onChange={(e) => methods.setValue('auditName', e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={handleEditAuditName}>Save</Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingName(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CardTitle>{audit?.name}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <CardDescription>
                    Section {currentStep + 1} of {audit?.subsections.length} -  
                    <span className="text-purple-700 text-xl"> 
                      {" "}{audit?.subsections[currentStep]?.code}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-black"
                        onClick={() => setShowRegulationDialog(true)}
                      >
                        Read Subsection Regulation
                        <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Progress
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setAuditToDelete(audit?._id || null);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                {/* Next Button without Validation */}
                <Button 
                  variant="secondary"
                  onClick={handleNext}
                  disabled={currentStep === audit?.subsections.length - 1}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                {/* View Report Button */}
                <Button
                  variant="outline"
                  onClick={() => {!hasEdited ? setShowReportDialog(true) : toast.info("You have made changes, validate the new form to view latest results.");}}
                  disabled={!audit}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Report
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {setShowExistingAudits(true); router.replace('/audit');}}
                >
                  View Existing Audits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowMetadataDialog(true);
                  }}
                >
                  Edit Metadata
                </Button>
                {/* Validate and Continue Button */}
                <Button 
                  onClick={validateAndContinue}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate'
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center pt-6">
              {(currentForm || deepForm) && (
                <AutoFill 
                  formFields={{
                    ...currentForm?.questions?.reduce((acc, question) => ({
                      ...acc,
                      [question.id]: {
                        id: question.id,
                        type: question.type.toLowerCase(),
                        question: question.text,
                        value: methods.getValues(`responses.${question.id}`)
                      }
                    }), {}),
                    ...deepForm?.questions?.reduce((acc, question) => ({
                      ...acc,
                      [`deep_${question.id}`]: {
                        id: `deep_${question.id}`,
                        type: question.type.toLowerCase(),
                        question: question.text,
                        value: methods.getValues(`deepResponses.${question.id}`)
                      }
                    }), {})
                  }}
                  currentValues={{
                    ...methods.getValues().responses,
                    ...methods.getValues().deepResponses
                  }}
                  onAutofill={(values) => {
                    Object.entries(values).forEach(([fieldId, value]) => {
                      if (fieldId.startsWith('deep_')) {
                        const actualId = fieldId.replace('deep_', '');
                        methods.setValue(`deepResponses.${actualId}`, value);
                      } else {
                        methods.setValue(`responses.${fieldId}`, value);
                      }
                    });
                    toast.success('Form fields updated');
                  }}
                />
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex gap-6">
              {/* Standard Form */}
              <div className="space-y-8 flex-1">
                <h3 className="text-lg font-semibold">Standard Form</h3>
                {/* Form Fields */}
                {currentForm && (
                  <div className="space-y-6">
                    {currentForm.questions.map((question) => (
                      <FormField
                        key={question.id}
                        control={methods.control}
                        name={`responses.${question.id}`}
                        render={({ field }) => {
                          const defaultValue = (() => {
                            switch (question.type) {
                              case 'BOOLEAN':
                                return 'false';
                              case 'NUMERIC':
                                return question.range?.min?.toString() || '0';
                              case 'DATE':
                                return new Date().toISOString().split('T')[0];
                              case 'TIME':
                                return '00:00';
                              case 'SELECT':
                                return question.options?.[0] || '';
                              case 'CHECKBOX':
                                return JSON.stringify([]);
                              case 'TEXT':
                              default:
                                return '';
                            }
                          })();

                          return (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                <span>
                                  {question.text}
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({question.cfr_reference})
                                  </span>
                                </span>
                              </FormLabel>
                              <div className="space-y-2">
                                {/* Does not apply checkbox */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value === "Does not apply"}
                                    onCheckedChange={(checked) => {
                                      sethasEdited(true);
                                      if (checked) {
                                        field.onChange("Does not apply");
                                      } else {
                                        // Reset to default value when unchecked
                                        field.onChange(getDefaultFormFieldValue(question));
                                      }
                                    }}
                                  />
                                  <Label>Does not apply</Label>
                                </div>

                                {/* Only show the actual form field if "Does not apply" is not checked */}
                                {field.value !== "Does not apply" && (
                                  <FormControl>
                                    {(() => {
                                      switch (question.type) {
                                        case 'NUMERIC':
                                          return (
                                            <Input
                                              type="number"
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              min={question.range?.min}
                                              max={question.range?.max}
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              placeholder={`Enter number ${question.range ? `(${question.range.min}-${question.range.max})` : ''}`}
                                            />
                                          );
                                        
                                        case 'DATE':
                                          return (
                                            <Input
                                              type="date"
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                            />
                                          );
                                        
                                        case 'TIME':
                                          return (
                                            <Input
                                              type="time"
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                            />
                                          );
                                        
                                        case 'SELECT':
                                          return (
                                            <Select
                                              onValueChange={(value) => {
                                                field.onChange(value);
                                                sethasEdited(true);
                                              }}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              defaultValue={question.options?.[0] || ''}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select an option" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {question.options?.map((option) => (
                                                  <SelectItem key={option} value={option} >
                                                    {option}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          );

                                        case 'CHECKBOX':
                                          return (
                                            <div className="space-y-2">
                                              {question.options?.map((option) => {
                                                // Parse the current value as JSON, defaulting to empty array if invalid
                                                const currentValues = (() => {
                                                  try {
                                                    return JSON.parse(field.value || '[]');
                                                  } catch {
                                                    return [];
                                                  }
                                                })();

                                                return (
                                                  <div key={option} className="flex items-center space-x-2">
                                                    <Checkbox
                                                      checked={currentValues.includes(option)}
                                                      onCheckedChange={(checked) => {
                                                        sethasEdited(true);
                                                        const updatedValues = checked
                                                          ? [...currentValues, option]
                                                          : currentValues.filter((v) => v !== option);
                                                        field.onChange(JSON.stringify(updatedValues));
                                                      }}
                                                    />
                                                    <span>{option}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        
                                        case 'BOOLEAN':
                                          return (
                                            <div className="flex items-center space-x-4">
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={field.value === 'true'}
                                                  onCheckedChange={(checked) => {
                                                    sethasEdited(true);
                                                    field.onChange(checked ? 'true' : 'false');
                                                  }}
                                                />
                                                <span>Yes</span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={field.value === 'false' || !field.value}  // Default to false if undefined
                                                  onCheckedChange={(checked) => {
                                                    sethasEdited(true);
                                                    field.onChange(checked ? 'false' : 'true');
                                                  }}
                                                />
                                                <span>No</span>
                                              </div>
                                            </div>
                                          );
                                        
                                        case 'TEXT':
                                        default:
                                          return (
                                            <Input
                                              {...field}
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              placeholder="Enter text"
                                            />
                                          );
                                      }
                                    })()}
                                  </FormControl>
                                )}
                              </div>
                              <FormDescription>
                                {question.type === 'NUMERIC' && question.range && (
                                  `Valid range: ${question.range.min} - ${question.range.max}`
                                )}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <ValidationResults 
                    validationResults={audit?.subsections[currentStep]?.validationResults}
                    subsectionStatus={audit?.subsections[currentStep]?.status}
                  />
                </div>
              </div>

              {/* Deep Form */}
              <div className="space-y-8 flex-1 border-l pl-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Edge Cases Form</h3>
                  {loadingDeepForm && (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading edge cases form...</span>
                    </div>
                  )}
                </div>
                
                {deepForm ? (
                  <div className="space-y-6">
                    {deepForm.questions?.map((question) => (
                      <FormField
                        key={`deep_${question.id}`}
                        control={methods.control}
                        name={`deepResponses.${question.id}`}
                        render={({ field }) => {
                          const defaultValue = (() => {
                            switch (question.type) {
                              case 'BOOLEAN':
                                return 'false';
                              case 'NUMERIC':
                                return question.range?.min?.toString() || '0';
                              case 'DATE':
                                return new Date().toISOString().split('T')[0];
                              case 'TIME':
                                return '00:00';
                              case 'SELECT':
                                return question.options[0] || '';
                              case 'CHECKBOX':
                                return JSON.stringify([]);
                              case 'TEXT':
                              default:
                                return '';
                            }
                          })();

                          return (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                <span>
                                  {question.text || question.question}
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({question.cfr_reference})
                                  </span>
                                </span>
                              </FormLabel>
                              <div className="space-y-2">
                                {/* Does not apply checkbox */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value === "Does not apply"}
                                    onCheckedChange={(checked) => {
                                      sethasEdited(true);
                                      if (checked) {
                                        field.onChange("Does not apply");
                                      } else {
                                        // Reset to default value when unchecked
                                        field.onChange(getDefaultFormFieldValue(question));
                                      }
                                    }}
                                  />
                                  <Label>Does not apply</Label>
                                </div>

                                {/* Only show the actual form field if "Does not apply" is not checked */}
                                {field.value !== "Does not apply" && (
                                  <FormControl>
                                    {(() => {
                                      switch (question.type) {
                                        case 'NUMERIC':
                                          return (
                                            <Input
                                              type="number"
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              min={question.range?.min}
                                              max={question.range?.max}
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              placeholder={`Enter number ${question.range ? `(${question.range.min}-${question.range.max})` : ''}`}
                                            />
                                          );
                                        
                                        case 'DATE':
                                          return (
                                            <Input
                                              type="date"
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                            />
                                          );
                                        
                                        case 'TIME':
                                          return (
                                            <Input
                                              type="time"
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              {...field}
                                              value={field.value || ''}  // Ensure value is never undefined
                                            />
                                          );
                                        
                                        case 'SELECT':
                                          return (
                                            <Select
                                              onValueChange={(value) => {
                                                field.onChange(value);
                                                sethasEdited(true);
                                              }}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              defaultValue={question.options?.[0] || ''}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select an option" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {question.options?.map((option) => (
                                                  <SelectItem key={option} value={option} >
                                                    {option}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          );

                                        case 'CHECKBOX':
                                          return (
                                            <div className="space-y-2">
                                              {question.options?.map((option) => {
                                                // Parse the current value as JSON, defaulting to empty array if invalid
                                                const currentValues = (() => {
                                                  try {
                                                    return JSON.parse(field.value || '[]');
                                                  } catch {
                                                    return [];
                                                  }
                                                })();

                                                return (
                                                  <div key={option} className="flex items-center space-x-2">
                                                    <Checkbox
                                                      checked={currentValues.includes(option)}
                                                      onCheckedChange={(checked) => {
                                                        sethasEdited(true);
                                                        const updatedValues = checked
                                                          ? [...currentValues, option]
                                                          : currentValues.filter((v) => v !== option);
                                                        field.onChange(JSON.stringify(updatedValues));
                                                      }}
                                                    />
                                                    <span>{option}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        
                                        case 'BOOLEAN':
                                          return (
                                            <div className="flex items-center space-x-4">
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={field.value === 'true'}
                                                  onCheckedChange={(checked) => {
                                                    sethasEdited(true);
                                                    field.onChange(checked ? 'true' : 'false');
                                                  }}
                                                />
                                                <span>Yes</span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={field.value === 'false' || !field.value}  // Default to false if undefined
                                                  onCheckedChange={(checked) => {
                                                    sethasEdited(true);
                                                    field.onChange(checked ? 'false' : 'true');
                                                  }}
                                                />
                                                <span>No</span>
                                              </div>
                                            </div>
                                          );
                                        
                                        case 'TEXT':
                                        default:
                                          return (
                                            <Input
                                              {...field}
                                              onChange={(e) => {
                                                sethasEdited(true);
                                                field.onChange(e);
                                              }}
                                              value={field.value || ''}  // Ensure value is never undefined
                                              placeholder="Enter text"
                                            />
                                          );
                                      }
                                    })()}
                                  </FormControl>
                                )}
                              </div>
                              <FormDescription>
                                {question.type === 'NUMERIC' && question.range && (
                                  `Valid range: ${question.range.min} - ${question.range.max}`
                                )}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <p className="text-muted-foreground text-center mb-4">No form available for this section.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => loadDeepQuestions()}
                      disabled={loadingDeepForm}
                    >
                      {loadingDeepForm ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <FileSearch className="mr-2 h-4 w-4" />
                          Load Deep Form
                        </>
                      )}
                    </Button>
                  </div>
                )}
              
              <div className="mt-4">
                <ValidationResults 
                  validationResults={audit?.subsections[currentStep]?.deepValidationResults}
                  subsectionStatus={audit?.subsections[currentStep]?.status}
                />
              </div>
              </div>
            </div>

            {/* Comments Section - Spans both columns */}
            <div className="mt-8 pt-6 border-t">
              <FormField
                control={methods.control}
                name={`subsectionComment`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Comments</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Enter comments for this section..."
                        value={audit?.subsections[currentStep]?.comment || ""}
                        onChange={(e) => {
                          if (!audit) return;
                          const updatedSubsections = [...audit.subsections];
                          updatedSubsections[currentStep] = {
                            ...updatedSubsections[currentStep],
                            comment: e.target.value
                          };
                          setAudit({
                            ...audit,
                            subsections: updatedSubsections
                          });
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            
          </CardContent>
        </Card>
      </div>
      {audit && showReportDialog && viewFullReport()}
      <DeleteConfirmDialog />
      <MetadataDialog 
        showMetadataDialog={showMetadataDialog}
        setShowMetadataDialog={setShowMetadataDialog}
        audit={audit}
        setAudit={setAudit}
      />
      <RegulationDialog 
        showRegulationDialog={showRegulationDialog}
        setShowRegulationDialog={setShowRegulationDialog}
        audit={audit}
        currentStep={currentStep}
      />
    </FormProvider>
  );
};

export default AuditComponent;