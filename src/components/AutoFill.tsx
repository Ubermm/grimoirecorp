//@ts-nocheck
"use client";
import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { PaperclipIcon, ArrowUpIcon, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PreviewAttachment } from './preview-attachment';
import type { Attachment, CreateMessage } from 'ai';
import { generateUUID } from '@/lib/utils';

interface FormField {
  id: string;
  type: string;
  question: any;
  value?: any;
}

interface AutoFillProps {
  formFields: Record<string, FormField>;
  onAutofill: (fieldValues: Record<string, any>) => void;
  className?: string;
}

const AutoFill = memo(({ formFields, onAutofill, className }: AutoFillProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Adjust textarea height on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, [input]);

  // Close the popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    const formData = new FormData();
    const uniqueId = generateUUID();
    const fileExtension = file.name.includes('.') ? file.name.split('.').pop() : '';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}-${uniqueId}${fileExtension ? `.${fileExtension}` : ''}`;
    const renamedFile = new File([file], newFileName, { type: file.type });
    
    formData.append('file', renamedFile);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          name: data.pathname,
          contentType: data.contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadQueue(files.map(file => file.name));

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);
      const successfulUploads = uploadedAttachments.filter((a): a is Attachment => a !== undefined);
      setAttachments(current => [...current, ...successfulUploads]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload one or more files');
    } finally {
      setUploadQueue([]);
      // Optionally clear the file input value here if needed:
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const processAutofill = async () => {
    setIsLoading(true);
    try {
      // Build the message object for the AI
      const message: CreateMessage = {
        id: generateUUID(),
        role: 'user',
        content: input,
        experimental_attachments: attachments,
      };

      // Build the structured form fields data
      const fieldsData = Object.entries(formFields).map(([id, field]) => ({
        id,
        type: field.type,
        currentValue: field.value || '',
      }));

      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          fields: fieldsData,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to process autofill request!');
        throw new Error('Failed to process autofill request!');
      }

      const fieldValues = await response.json();
      onAutofill(fieldValues);
      
      // Reset and close the popover
      setInput('');
      setAttachments([]);
      setIsOpen(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('Failed to process autofill request');
    } finally {
      setIsLoading(false);
    }
  };

  // If the popover is closed, render just a button
  if (!isOpen) {
    return (
      <div className="relative group">
        {/* Button with darker purple background and larger icon */}
        <Button
          className="rounded-full p-3 bg-purple-700 hover:bg-purple-800 transition-colors"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          AutoFill 
          <Brush className="h-8 w-8 text-white" />
        </Button>
    
        {/* Tooltip positioned ABOVE the button */}
        <span className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 w-max bg-gray-900 text-white text-xs rounded-md px-3 py-2 
          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Autofill: Fill form values based on text or documents
        </span>
      </div>
    );            
  }

  // When open, render the full popover view
  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-4">
      {/* Hidden file input */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* Attachments preview */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{ url: '', name: filename, contentType: '' }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* Textarea for autofill content */}
      <Textarea
        ref={textareaRef}
        placeholder="Enter text or upload files by clicking on the paperclip icon at the bottom right..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={`min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl !text-base bg-muted ${className}`}
        rows={3}
      />

      {/* Button to trigger file upload */}
      <Button
        className="rounded-full p-1.5 h-fit absolute bottom-2 right-11 m-0.5 dark:border-zinc-700"
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        disabled={isLoading}
      >
        <PaperclipIcon size={14} />
      </Button>

      {/* Button to process the autofill */}
      <Button
        className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
        onClick={processAutofill}
        disabled={
          isLoading ||
          (input.length === 0 && attachments.length === 0) ||
          uploadQueue.length > 0
        }
      >
        <ArrowUpIcon size={14} />
      </Button>
    </div>
  );
});

AutoFill.displayName = 'AutoFill';

export default AutoFill;
