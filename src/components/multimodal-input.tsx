//multimodal-input.tsx
'use client';
import {v4 as uuidv4} from 'uuid';
import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  attachmentPositions,
  setAttachmentPositions,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  initialMessages = [],
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  attachmentPositions: Map<string, number>;
  setAttachmentPositions: Dispatch<SetStateAction<Map<string, number>>>;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  append: (message: Message | CreateMessage, chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  handleSubmit: (event?: { preventDefault?: () => void }, chatRequestOptions?: ChatRequestOptions) => void;
  className?: string;
  initialMessages: Message[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const currentPosition = initialMessages.length || 0;

  const submitForm = useCallback(() => {
    // Group attachments by position
    const currentAttachments = attachments.filter(
      attachment => attachmentPositions.get(attachment.url) === currentPosition
    );
    
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: currentAttachments,
    });

    // Store attachments in the backend
    attachments.forEach(async (attachment) => {
      try {
        const response = await fetch('/api/attachments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: attachment.url,
            name: attachment.name,
            contentType: attachment.contentType,
            chatId,
            messagePosition: attachmentPositions.get(attachment.url),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save attachment');
        }
      } catch (error) {
        console.error('Failed to save attachment:', error);
      }
    });

    setAttachments([]);
    setAttachmentPositions(new Map());
    setLocalStorageInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    attachmentPositions,
    handleSubmit,
    setAttachments,
    setAttachmentPositions,
    setLocalStorageInput,
    width,
    chatId,
    currentPosition,
    initialMessages.length
  ]);

  const uploadFile = async (file: File, chatId: string): Promise<Attachment | undefined> => {
    const formData = new FormData();

    const uniqueId = uuidv4().split('-')[0];

    // Extract the original file name and extension
    const originalName = file.name;
    const fileExtension = originalName.includes('.') ? originalName.split('.').pop() : '';
    const baseName = originalName.replace(/\.[^/.]+$/, '');

    // Create the new file name
    const newFileName = `${baseName}-${uniqueId}${fileExtension ? `.${fileExtension}` : ''}`;

    // Create a new File object with the modified name
    const renamedFile = new File([file], newFileName, { type: file.type });

    // Append the renamed file and other fields to FormData
    formData.append('file', renamedFile);
    formData.append('chatId', chatId);
    formData.append('messagePosition', currentPosition.toString());
  
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;
  
        // Track position separately
        setAttachmentPositions(prev => {
          const newMap = new Map(prev);
          newMap.set(url, currentPosition);
          return newMap;
        });

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file, chatId));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => 
            attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
        toast.error('Failed to upload one or more files');
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, chatId],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} chatId={chatId} />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="Send a message..."
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl !text-base bg-muted',
          className,
        )}
        rows={3}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
      />

      {isLoading ? (
        <StopButton stop={stop} setMessages={setMessages} />
      ) : (
        <SendButton
          input={input}
          submitForm={submitForm}
          uploadQueue={uploadQueue}
        />
      )}

      <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit absolute bottom-2 right-11 m-0.5 dark:border-zinc-700"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="outline"
      disabled={isLoading}
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (!prevProps.input !== !nextProps.input) return false;
  return true;
});
