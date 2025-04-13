# Grimoire Platform Module

This module implements the core functionality for running notebooks and models on GPU pods using RunPod.

## Features

- Custom notebook execution on GPU pods
- Pre-built models like AlphaFold3
- Dataset management
- Organization and credit management
- Result downloading

## Architecture

### Core Components

1. **RunpodService**: Interfaces with the RunPod API to create, monitor, and manage GPU pods
2. **BlobStorageService**: Manages Azure Blob Storage for notebooks, datasets, and results
3. **NotebookService**: Orchestrates notebook creation, running, and result processing
4. **ModelService**: Manages pre-built models like AlphaFold3

### Data Flow

1. User uploads a notebook (.ipynb file) and optional datasets
2. System creates an input container for datasets and an output container for results
3. System uploads notebook to blob storage
4. RunPod pod is created with the notebook URL and container SAS URLs as environment variables
5. Pod executes notebook, reading from /input and writing to /output
6. Results are stored in blob storage
7. User can download executed notebook and output files

## API Routes

- `POST /api/notebooks/[id]/runs`: Run a notebook with optional datasets
- `GET /api/notebooks/[id]/runs`: Get all runs for a notebook
- `GET /api/runs/[id]`: Get details for a specific run
- `GET /api/runs/[id]/download`: Get download links for run results

## Custom Notebook Container

The custom notebook container is a Docker image that:

1. Downloads the notebook from the provided URL
2. Downloads input datasets from the input container
3. Executes the notebook
4. Uploads the executed notebook and output files to the output container

See `CONTAINER.md` for details on the container structure and configuration.

## Production Readiness Checklist

- [x] RunPod API integration completed
- [x] Azure Blob Storage integration for datasets and results
- [x] API endpoints for running notebooks and downloading results
- [x] Database schema for tracking runs and results
- [x] Container specification for custom notebooks
- [x] Documentation for container builders
- [x] User interface for uploading datasets
- [x] Monitoring and logging
  - Added comprehensive structured logging system
  - Performance monitoring for tracking execution time
  - Method decorators for automatic monitoring
- [x] Error handling and retry logic
  - Standardized error types and codes
  - Exponential backoff retry mechanism
  - Proper error handling in API routes
- [x] Cost and credit management
  - Credit tracking per organization
  - Usage-based billing based on GPU type and runtime
  - Credit validation before running notebooks
- [x] Job throttling and queueing
  - Priority-based job queue
  - Rate limiting per user and organization
  - Configurable concurrency limits
  - Asynchronous job processing