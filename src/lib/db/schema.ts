//@ts-nocheck
// // src/lib/db/schema.ts

export type ObjectId = string;

// User Schema
export interface User {
  _id: ObjectId;
  email: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Chat Schema
export interface Chat {
  _id: ObjectId;
  title: string;
  userId: string;
  createdAt: Date;
  visibility?: 'private' | 'public';
}

// Message Schema
export interface Message {
  _id: ObjectId;
  chatId: string;
  role: string;
  content: any;
  createdAt: Date;
}

// Attachment Schema
export interface Attachment {
  _id?: ObjectId;
  chatId: string;
  messagePosition?: string;
  url: string;
  name?: string;
  contentType?: string;
  createdAt: Date;
}

// Vote Schema
export interface Vote {
  _id: ObjectId;
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
  createdAt: Date;
}

// Document Schema
export interface Document {
  _id: ObjectId;
  title: string;
  content?: string;
  userId: string;
  createdAt: Date;
}

// Suggestion Schema
export interface Suggestion {
  _id: ObjectId;
  documentId: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
}

// Warning Letter Schema
export interface WarningLetter {
  _id: ObjectId;
  url: string;
  title: string;
  cfr_codes: string;
  fdc_codes: string;
}

// Module Schema
export interface Module {
  _id: ObjectId;
  chatId: string;
  modules: string[];
  reports?: string[];
}

// Context Schema
export interface QAContext {
  question: string;
  answer: string;
}

export interface Context {
  _id: ObjectId;
  chatId: string;
  context: {
    warningLetter: string;
    warningLetterUrl: string;
    qaContext: QAContext[];
    report: string;
  };
}

// Report Schema
export interface Report {
  _id: ObjectId;
  chatId: string;
  report: string;
}

// Updated Find Schema
export interface Find {
  _id: string;
  userId: string;
  results: any[];
  summary: string;
  cfrVisualization: string;
  fdcVisualization: string;
}

// Compare Schema
export interface Compare {
  _id: ObjectId;
  userId: string;
  content: string;
  firstUrl: string;
  secondUrl: string;
  cfrVisualization: string;
  fdcVisualization: string;
  letterACodes: {
      cfrCodes: string[];
      fdcCodes: string[];
  };
  letterBCodes: {
      cfrCodes: string[];
      fdcCodes: string[];
  };
}

// Validate Schema
export interface Validate {
  _id: string;
  userId: string;
  content: string;
  prologGenText: string;
  validationResults: string;
  flowchart: string;
  cfrVisualization: string;
}

// Contact Schema
export interface Contact {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message?: string;
  createdAt: Date;
}

// Audit Schema Types
export interface AuditResponse {
  questionId: string;
  answer: string;
  lastModified: Date;
}

export interface AuditSubsection {
  id: string;
  pos: string;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'flagged';
  responses: AuditResponse[];
  validationResults?: {
    passed: string[];
    description: string[];
  };
  comment: string;
}

export interface Audit {
  _id: ObjectId;
  name: string;
  userId: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'completed' | 'archived';
  checkpoint: number;
  subsections: AuditSubsection[];
  metadata: {
    facility?: string;
    auditType?: string;
    department?: string;
    reviewer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
