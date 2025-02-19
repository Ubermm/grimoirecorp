// Define your models here.

export interface Model {
    id: string;
    label: string;
    apiIdentifier: string;
    description: string;
  }

/*  
export const models: Array<Model> = [
  {
    id: 'gpt-4o',
    label: 'Azure OpenAI',
    apiIdentifier: 'gpt-4o',
    description: 'Compliance assistant model',
  }
] as const;
  
export const DEFAULT_MODEL_NAME: string = 'gpt-4o';*/

export const models: Array<Model> = [
  {
    id: 'claude-3-haiku-20240307',
    label: 'Anthropic',
    apiIdentifier: 'claude-3-haiku-20240307',
    description: 'Compliance assistant model',
  }
] as const;
  
export const DEFAULT_MODEL_NAME: string = 'claude-3-haiku-20240307';