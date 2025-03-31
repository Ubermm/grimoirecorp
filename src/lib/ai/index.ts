//lib/ai/index.ts
import { createAzure } from '@ai-sdk/azure';
import { anthropic }  from '@ai-sdk/anthropic';
//import { createAnthropic } from '@ai-sdk/anthropic';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const azure = createAzure({
  baseURL: `https://${process.env.AZURE_RESOURCE_NAME}.openai.azure.com/openai/deployments`,
  apiKey: process.env.AZURE_API_KEY || "",
  apiVersion: "2024-08-01-preview",
});

export const AZURE = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: azure(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: anthropic(apiIdentifier),
    middleware: customMiddleware,
  });
};