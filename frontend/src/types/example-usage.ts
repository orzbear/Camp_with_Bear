// Example usage of generated types to ensure compilation
// This file is for type checking only, no runtime code

import type { components } from './api';
import type { components as ragComponents } from './rag';

// Import one type from API
type Trip = components['schemas']['Trip'];
type HealthResponse = components['schemas']['HealthResponse'];

// Import one type from RAG
type SearchResponse = ragComponents['schemas']['SearchResponse'];
type AnswerResponse = ragComponents['schemas']['AnswerResponse'];

// Type-only exports to ensure they're used
export type { Trip, HealthResponse, SearchResponse, AnswerResponse };

