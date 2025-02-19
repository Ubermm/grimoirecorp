import axios from 'axios';

export class EmbeddingGenerator {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    const baseUrl = process.env.AZURE_OPENAI_API_BASE;
    if (!baseUrl) {
      throw new Error('AZURE_OPENAI_API_BASE environment variable is missing');
    }
    
    // Ensure the base URL doesn't end with a trailing slash
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    this.apiUrl = `${cleanBaseUrl}/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-02-01`;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY as string;

    if (!this.apiKey) {
      throw new Error('AZURE_OPENAI_API_KEY environment variable is missing');
    }
  }

  async getEmbeddings(texts: string | string[]): Promise<number[][]> {
    const inputTexts = Array.isArray(texts) ? texts : [texts];

    // Validate input texts
    if (inputTexts.some(text => !text || text.trim().length === 0)) {
      throw new Error('Input texts cannot be empty');
    }

    // Clean and truncate texts if needed
    const cleanedTexts = inputTexts.map(text => text.trim().slice(0, 8191));

    const requestBody = {
      input: cleanedTexts,
      model: "text-embedding-3-small" // Explicitly specify the model
    };

    try {
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        timeout: 30000 // Add timeout of 30 seconds
      });

      if (!response.data?.data) {
        throw new Error('Invalid response format from Azure OpenAI API');
      }

      return response.data.data.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          console.error('API request error:', {
            status: error.response.status,
            data: error.response.data
          });
          throw new Error(`Bad request: ${error.response.data?.error?.message || 'Unknown error'}`);
        }
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }
}