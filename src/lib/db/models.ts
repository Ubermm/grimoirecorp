//@ts-nocheck
// src/lib/db/models.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';
import { generateUUID } from '../utils';
import type * as SchemaTypes from './schema';
import { any } from 'zod';

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

export const User = models.User || model<SchemaTypes.User>('User', UserSchema);

// Organization Model
export interface IOrganization extends Document {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    role: 'Admin' | 'Member';
    email: string;
    name?: string;
  }>;
  creditsAvailable: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    name: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    members: [{
      userId: { type: String, required: true },
      role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
      email: { type: String, required: true },
      name: { type: String }
    }],
    creditsAvailable: { type: Number, default: 0 }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

OrganizationSchema.index({ 'members.userId': 1 });

export const Organization = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);

// Notebook/Pod Model
export interface INotebook extends Document {
  id: string;
  name: string;
  userId: string;
  organizationId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  content?: string;
  isPublic: boolean;
  inputContainerName?: string;
  inputContainerUrl?: string;
  mainFilePath?: string,
  datasetInputMethod?: 'files' | 'folder' | null;
}

const NotebookSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    lastRunAt: { type: Date },
    content: { type: String },
    isPublic: { type: Boolean, default: false },
    inputContainerName: { type: String },
    inputContainerUrl: { type: String },
    mainFilePath: {type: String},
    datasetInputMethod: {
      type: String,
      enum: ['files', 'folder', null],
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

NotebookSchema.index({ userId: 1, createdAt: -1 });
NotebookSchema.index({ organizationId: 1, createdAt: -1 });

export const Notebook = mongoose.models.Notebook || mongoose.model<INotebook>('Notebook', NotebookSchema);

// Notebook Run Model
export interface INotebookRun extends Document {
  id: string;
  notebookId: string;
  userId: string;
  organizationId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: string;
  gpuType: string;
  creditsUsed: number;
  error?: string;
  runpodJobId?: string;
  result?: string; // For AlphaFold3 and other models
  logs?: string[];
  progress?: number; // 0-100% completion
  podType?: 'custom' | 'alphafold3';
  podConfig?: Record<string, any>; // Contains GPU config
  inputContainerName?: string; // Name of container with input files
  inputContainerUrl?: string;  // SAS URL for input container
  outputContainerName?: string; // Name of container for output files
  outputContainerUrl?: string;  // SAS URL for output container
  executedNotebookUrl?: string; // URL to the executed notebook
}

const NotebookRunSchema: Schema = new Schema(
  {
    notebookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
      required: true,
      index: true
    },
    startedAt: { type: Date, default: Date.now, required: true },
    completedAt: { type: Date },
    duration: { type: String },
    gpuType: { type: String, required: true },
    creditsUsed: { type: Number, default: 0 },
    error: { type: String },
    runpodJobId: { type: String, index: true },
    result: { type: String }, // For AlphaFold3 and other models
    logs: [{ type: String }],
    progress: { type: Number, min: 0, max: 100 },
    podType: { 
      type: String, 
      enum: ['custom', 'alphafold3'],
      default: 'custom'
    },
    podConfig: { type: Schema.Types.Mixed, default: {} },
    inputContainerName: { type: String },
    inputContainerUrl: { type: String },
    outputContainerName: { type: String },
    outputContainerUrl: { type: String },
    executedNotebookUrl: { type: String }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

NotebookRunSchema.index({ userId: 1, startedAt: -1 });
NotebookRunSchema.index({ notebookId: 1, startedAt: -1 });
NotebookRunSchema.index({ organizationId: 1, startedAt: -1 });

export const NotebookRun = mongoose.models.NotebookRun || mongoose.model<INotebookRun>('NotebookRun', NotebookRunSchema);

// Model metadata
export interface IModel extends Document {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  isNew: boolean;
  apiEndpoint: string;
  parameters: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: [{ type: String }],
    imageUrl: { type: String },
    isNew: { type: Boolean, default: false },
    apiEndpoint: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed, default: {} }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

ModelSchema.index({ category: 1, name: 1 });
ModelSchema.index({ tags: 1 });

export const Model = mongoose.models.Model || mongoose.model<IModel>('Model', ModelSchema);

// Prediction Model
export interface IPrediction extends Document {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  originalFilename: string;
  blobUrl: string;
  resultBlobUrl?: string;
  fileSize?: number;
  resultFileSize?: number;
  progress?: number;
  error?: string;
  runpodJobId?: string;
}

const PredictionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
      index: true
    },
    originalFilename: { type: String, required: true },
    blobUrl: { type: String, required: true },
    resultBlobUrl: { type: String },
    fileSize: { type: Number },
    resultFileSize: { type: Number },
    progress: { type: Number, min: 0, max: 100 },
    error: { type: String },
    runpodJobId: { type: String, index: true }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

// Add indexes for better query performance
PredictionSchema.index({ userId: 1, createdAt: -1 });

export const Prediction = mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);
