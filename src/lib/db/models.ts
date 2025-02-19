//@ts-nocheck
// src/lib/db/models.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { generateUUID } from '../utils';
import type * as SchemaTypes from './schema';

// User Model
const UserSchema = new Schema<SchemaTypes.User>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  email: {
    type: String,
    required: true,
    maxlength: 100
  },
  password: {
    type: String,
    maxlength: 100
  }
}, {
  timestamps: true
});

export const CUser = models.User || model<SchemaTypes.User>('User', UserSchema);

// Chat Model
const ChatSchema = new Schema<SchemaTypes.Chat>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  title: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CChat = models.Chat || model<SchemaTypes.Chat>('Chat', ChatSchema);

// Attachment Model
const AttachmentSchema = new Schema<SchemaTypes.Attachment>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: { type: String, required: true, index: true },
  messagePosition: { type: String, required: false, index: true },
  url: { type: String, required: true },
  name: { type: String, required: true },
  contentType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CAttachment = models.Attachment || model<SchemaTypes.Attachment>('Attachment', AttachmentSchema);

// Message Model
const MessageSchema = new Schema<SchemaTypes.Message>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: {
    type: String,
    ref: 'Chat',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  content: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CMessage = models.Message || model<SchemaTypes.Message>('Message', MessageSchema);

// Vote Model
const VoteSchema = new Schema<SchemaTypes.Vote>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: {
    type: String,
    ref: 'Chat',
    required: true
  },
  messageId: {
    type: String,
    ref: 'Message',
    required: true
  },
  isUpvoted: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

VoteSchema.index({ chatId: 1, messageId: 1 });
export const CVote = models.Vote || model<SchemaTypes.Vote>('Vote', VoteSchema);

// Document Model
const DocumentSchema = new Schema<SchemaTypes.Document>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  title: {
    type: String,
    required: true
  },
  content: String,
  userId: {
    type: String,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CDocument = models.Document || model<SchemaTypes.Document>('Document', DocumentSchema);

// Suggestion Model
const SuggestionSchema = new Schema<SchemaTypes.Suggestion>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  documentId: {
    type: String,
    ref: 'Document',
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  suggestedText: {
    type: String,
    required: true
  },
  description: String,
  isResolved: {
    type: Boolean,
    default: false,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CSuggestion = models.Suggestion || model<SchemaTypes.Suggestion>('Suggestion', SuggestionSchema);

// Warning Letter Model
const WarningLetterSchema = new Schema<SchemaTypes.WarningLetter>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    unique: true
  },
  cfr_codes: {
    type: String,
    required: true
  },
  fdc_codes: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CWarningLetter = models.warning_letters || model<SchemaTypes.WarningLetter>('warning_letters', WarningLetterSchema);

// Module Model
const ModuleSchema = new Schema<SchemaTypes.Module>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: {
    type: String,
    ref: 'Chat',
    required: true
  },
  modules: {
    type: [String],
    required: true
  },
  reports: {
    type: [String],
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CModule = models.Module || model<SchemaTypes.Module>('Module', ModuleSchema);

// Context Model
const ContextSchema = new Schema<SchemaTypes.Context>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: {
    type: String,
    ref: 'Chat',
    required: true
  },
  context: {
    type: {
      warningLetter: {
        type: String,
        required: true
      },
      warningLetterUrl: {
        type: String,
        required: false
      },
      qaContext: [{
        question: {
          type: String,
          required: true
        },
        answer: {
          type: String,
          required: true
        }
      }],
      report: {
        type: String,
        required: true
      },
    },
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CContext = models.Context || model<SchemaTypes.Context>('Context', ContextSchema);

// Report Model
const ReportSchema = new Schema<SchemaTypes.Report>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  chatId: {
    type: String,
    ref: 'Chat',
    required: true
  },
  report: {
    type: String,
    required: true
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CReport = models.Report || model<SchemaTypes.Report>('Report', ReportSchema);

// Find Model
const FindSchema = new Schema<Find>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  userId: {
    type: String,
    required: true
  },
  results: {
    type: [],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  cfrVisualization: {
    type: String,
    required: true
  },
  fdcVisualization: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CFind = models.FindSimilar || model<SchemaTypes.Find>('FindSimilar', FindSchema);

// Compare Model
const CompareSchema = new Schema<SchemaTypes.Compare>({
  _id: {
      type: Schema.Types.Mixed,
      default: () => generateUUID()
  },
  userId: {
      type: String,
      required: true
  },
  content: {
      type: String,
      required: true
  },
  firstUrl: {
      type: String,
      required: true
  },
  secondUrl: {
      type: String,
      required: true
  },
  cfrVisualization: {
      type: String,
      required: true
  },
  fdcVisualization: {
      type: String,
      required: true
  },
  letterACodes: {
      cfrCodes: [String],
      fdcCodes: [String]
  },
  letterBCodes: {
      cfrCodes: [String],
      fdcCodes: [String]
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CCompare = models.Compare || model<SchemaTypes.Compare>('Compare', CompareSchema);

// Validate Model
const ValidateSchema = new Schema<Validate>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  userId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  flowchart: {
    type: String,
    required: true
  },
  prologGenText: {
    type: String,
    required: true
  },
  validationResults: {
    type: String,
    required: true
  },
  cfrVisualization: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const CValidate = models.Validate || model<SchemaTypes.Validate>('Validate', ValidateSchema);

// Contact Model
const ContactSchema = new Schema<SchemaTypes.Contact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

ContactSchema.index({ userId: 1, email: 1, createdAt: -1 });
export const CContact = models.Contact || model<SchemaTypes.Contact>('Contact', ContactSchema);

const AuditResponseSchema = new Schema({
  questionId: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const AuditSubsectionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  pos: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'flagged'],
    default: 'pending'
  },
  responses: [AuditResponseSchema],
  validationResults: {
    passed: [String],
    description: [String]
  },
  comment: {
    type: String,
    required: false
  },
});

const AuditSchema = new Schema<Audit>({
  _id: {
    type: Schema.Types.Mixed,
    default: () => generateUUID()
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'under_review', 'completed', 'archived'],
    default: 'draft'
  },
  checkpoint: {
    type: Number,
    default: 0,
    min: 0
  },
  subsections: [AuditSubsectionSchema],
  metadata: {
    facility: String,
    auditType: String,
    department: String,
    reviewer: String
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AuditSchema.index({ userId: 1, status: 1 });
AuditSchema.index({ createdAt: -1 });
AuditSchema.index({ 'subsections.code': 1 });

export const CAudit = models.Audit || model<Audit>('Audit', AuditSchema);

const regulationSchema = new mongoose.Schema({
  RegCode: {
    type: String,
    required: true,
    unique: true
  },
  RegText: {
    type: String,
    required: true
  },
  FormCode: {
    type: String,
    required: true
  }
});

// Define the Form Schema
const formSchema = new mongoose.Schema({
  FormCode: {
    type: String,
    required: true,
    unique: true
  },
  FormText: {
    type: String,
    required: true
  }
});

// Create models from the schemas
export const CRegulation = models.regulations || mongoose.model('regulations', regulationSchema);
export const CForm = models.forms || mongoose.model('forms', formSchema);