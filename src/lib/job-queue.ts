//@ts-nocheck
/**
 * Job queue and throttling system for notebook runs
 */

import { RateLimitError } from './error-handling';
import { runpodLogger } from './monitoring';

type JobPriority = 'high' | 'normal' | 'low';

interface Job<T> {
  id: string;
  fn: () => Promise<T>;
  priority: JobPriority;
  addedAt: Date;
  userId: string;
  organizationId?: string;
  description: string;
}

type JobResult<T> = {
  jobId: string;
  result: T;
} | {
  jobId: string;
  error: Error;
};

/**
 * Job queue with configurable concurrency limits, priorities, and rate limiting
 */
export class JobQueue {
  private queue: Job<any>[] = [];
  private running: Set<string> = new Set();
  private results: Map<string, JobResult<any>> = new Map();
  
  // Configuration
  private maxConcurrentJobs: number;
  private userRateLimit: {
    count: number;
    windowMs: number;
  };
  private organizationRateLimit: {
    count: number;
    windowMs: number;
  };
  
  // Rate limiting counters
  private userJobCounts: Map<string, { count: number, resetAt: number }> = new Map();
  private orgJobCounts: Map<string, { count: number, resetAt: number }> = new Map();
  
  constructor(options = {}) {
    this.maxConcurrentJobs = options.maxConcurrentJobs || 10;
    this.userRateLimit = {
      count: options.userRateLimit?.count || 5,
      windowMs: options.userRateLimit?.windowMs || 60000 // 1 minute
    };
    this.organizationRateLimit = {
      count: options.organizationRateLimit?.count || 20,
      windowMs: options.organizationRateLimit?.windowMs || 60000 // 1 minute
    };
    
    // Start processing the queue
    this.processQueue();
  }
  
  /**
   * Add a job to the queue
   */
  async addJob<T>(
    fn: () => Promise<T>,
    options: {
      priority?: JobPriority;
      userId: string;
      organizationId?: string;
      description: string;
    }
  ): Promise<string> {
    const { userId, organizationId, description } = options;
    const priority = options.priority || 'normal';
    
    // Check user rate limits
    this.enforceRateLimit(userId, organizationId);
    
    // Create job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: Job<T> = {
      id: jobId,
      fn,
      priority,
      addedAt: new Date(),
      userId,
      organizationId,
      description
    };
    
    // Add to queue with priority ordering
    // High priority at the beginning, low at the end
    if (priority === 'high') {
      this.queue.unshift(job);
    } else if (priority === 'low') {
      this.queue.push(job);
    } else {
      // For normal priority, find the insertion point after high priority jobs
      // but before low priority jobs
      const index = this.queue.findIndex(j => j.priority === 'low');
      if (index === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(index, 0, job);
      }
    }
    
    runpodLogger.info(`Job ${jobId} added to queue`, {
      priority,
      description,
      queueLength: this.queue.length
    });
    
    return jobId;
  }
  
  /**
   * Get the result of a job (waits for completion)
   */
  async getResult<T>(jobId: string): Promise<T> {
    // If job is already complete, return the result
    if (this.results.has(jobId)) {
      const result = this.results.get(jobId);
      
      // Clean up the result
      this.results.delete(jobId);
      
      // If there was an error, throw it
      if ('error' in result) {
        throw result.error;
      }
      
      // Return the result
      return result.result;
    }
    
    // Check if job is in the queue or running
    const isQueued = this.queue.some(job => job.id === jobId);
    const isRunning = this.running.has(jobId);
    
    if (!isQueued && !isRunning) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Wait for the job to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.results.has(jobId)) {
          clearInterval(checkInterval);
          
          const result = this.results.get(jobId);
          this.results.delete(jobId);
          
          if ('error' in result) {
            reject(result.error);
          } else {
            resolve(result.result);
          }
        }
      }, 500);
    });
  }
  
  /**
   * Get queue status
   */
  getStatus() {
    return {
      queuedJobs: this.queue.length,
      runningJobs: this.running.size,
      completedJobs: this.results.size
    };
  }
  
  /**
   * Process jobs in the queue
   */
  private async processQueue() {
    // If we're at max capacity, wait and check again
    if (this.running.size >= this.maxConcurrentJobs) {
      setTimeout(() => this.processQueue(), 1000);
      return;
    }
    
    // Get the next job
    const job = this.queue.shift();
    
    if (!job) {
      // No jobs to process, check again soon
      setTimeout(() => this.processQueue(), 1000);
      return;
    }
    
    // Mark job as running
    this.running.add(job.id);
    
    runpodLogger.info(`Starting job ${job.id}`, {
      description: job.description,
      queueLength: this.queue.length
    });
    
    // Run the job
    try {
      const result = await job.fn();
      
      // Store the result
      this.results.set(job.id, {
        jobId: job.id,
        result
      });
      
      runpodLogger.info(`Job ${job.id} completed successfully`, {
        description: job.description
      });
    } catch (error) {
      // Store the error
      this.results.set(job.id, {
        jobId: job.id,
        error
      });
      
      runpodLogger.error(`Job ${job.id} failed`, error, {
        description: job.description
      });
    } finally {
      // Mark job as no longer running
      this.running.delete(job.id);
      
      // Results are cleaned up when getResult is called or after a timeout
      setTimeout(() => {
        if (this.results.has(job.id)) {
          runpodLogger.info(`Cleaning up unclaimed result for job ${job.id}`);
          this.results.delete(job.id);
        }
      }, 3600000); // 1 hour
      
      // Process the next job
      this.processQueue();
    }
  }
  
  /**
   * Enforce rate limits for users and organizations
   */
  private enforceRateLimit(userId: string, organizationId?: string) {
    const now = Date.now();
    
    // Check user rate limit
    let userCount = this.userJobCounts.get(userId);
    
    if (!userCount || userCount.resetAt < now) {
      // Reset or initialize counter
      userCount = { count: 0, resetAt: now + this.userRateLimit.windowMs };
      this.userJobCounts.set(userId, userCount);
    }
    
    if (userCount.count >= this.userRateLimit.count) {
      const retryAfterMs = userCount.resetAt - now;
      throw new RateLimitError(
        `User rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
      );
    }
    
    // Increment user counter
    userCount.count++;
    
    // Check organization rate limit if applicable
    if (organizationId) {
      let orgCount = this.orgJobCounts.get(organizationId);
      
      if (!orgCount || orgCount.resetAt < now) {
        // Reset or initialize counter
        orgCount = { count: 0, resetAt: now + this.organizationRateLimit.windowMs };
        this.orgJobCounts.set(organizationId, orgCount);
      }
      
      if (orgCount.count >= this.organizationRateLimit.count) {
        const retryAfterMs = orgCount.resetAt - now;
        throw new RateLimitError(
          `Organization rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
        );
      }
      
      // Increment organization counter
      orgCount.count++;
    }
  }
}

// Create a singleton instance for app-wide usage
export const jobQueue = new JobQueue();