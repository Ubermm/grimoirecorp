//@ts-nocheck
import { Model, IModel } from '@/lib/db/models';

export class ModelService {
  // Get all available models
  async getModels(category?: string): Promise<IModel[]> {
    // Build query - filter by category if provided
    const query = category && category !== 'All' ? { category } : {};
    
    return await Model.find(query)
      .sort({ isNew: -1, name: 1 })
      .lean();
  }
  
  // Get a single model by ID
  async getModel(modelId: string): Promise<IModel | null> {
    return await Model.findById(modelId).lean();
  }
  
  // Seed initial models (for development/testing)
  async seedModels(): Promise<void> {
    const modelsCount = await Model.countDocuments();
    
    // Only seed if no models exist
    if (modelsCount === 0) {
      await Model.create([
        {
          name: 'AlphaFold 3',
          description: 'State-of-the-art protein structure prediction',
          category: 'Structural Biology',
          tags: ['Protein Folding', 'DeepMind', 'Latest'],
          imageUrl: '/api/placeholder/600/400',
          isNew: true,
          apiEndpoint: '/api/models/alphafold3/predict',
          parameters: {
            temperature: { type: 'float', default: 0.7, min: 0, max: 1 },
            maxLength: { type: 'int', default: 1000, min: 100, max: 10000 }
          }
        },
        {
          name: 'DeepVariant',
          description: 'Variant calling for next-generation sequencing',
          category: 'Genomics',
          tags: ['Genomics', 'Sequencing', 'Stable'],
          imageUrl: '/api/placeholder/600/400',
          isNew: false,
          apiEndpoint: '/api/models/deepvariant/predict',
          parameters: {
            readDepth: { type: 'int', default: 30, min: 10, max: 100 },
            quality: { type: 'string', default: 'high', options: ['low', 'medium', 'high'] }
          }
        },
        {
          name: 'MedicalVQA',
          description: 'Visual question answering for medical images',
          category: 'Computer Vision',
          tags: ['Medical', 'VQA', 'Beta'],
          imageUrl: '/api/placeholder/600/400',
          isNew: true,
          apiEndpoint: '/api/models/medicalvqa/predict',
          parameters: {
            maxTokens: { type: 'int', default: 50, min: 10, max: 200 },
            detailLevel: { type: 'string', default: 'detailed', options: ['simple', 'detailed', 'comprehensive'] }
          }
        }
      ]);
    }
  }
  
  // Add a new model (admin only)
  async addModel(modelData: Omit<IModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<IModel> {
    const model = await Model.create(modelData);
    return model;
  }
  
  // Update a model (admin only)
  async updateModel(
    modelId: string,
    updates: Partial<Omit<IModel, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<IModel | null> {
    const updatedModel = await Model.findByIdAndUpdate(
      modelId,
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedModel;
  }
  
  // Delete a model (admin only)
  async deleteModel(modelId: string): Promise<boolean> {
    await Model.findByIdAndDelete(modelId);
    return true;
  }
  
  // Get all available categories
  async getCategories(): Promise<string[]> {
    const categories = await Model.distinct('category');
    return ['All', ...categories];
  }
}