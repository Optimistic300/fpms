<?php

namespace App\Middleware;

use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Middleware to prevent overlapping jobs.
 * 
 * This middleware ensures that only one instance of a job with a given key
 * can be running at a time.
 */
class PreventOverlapping
{
    /**
     * The key to use for locking.
     */
    protected string $key;

    /**
     * Create a new middleware instance.
     */
    public function __construct(string $key)
    {
        $this->key = $key;
    }

    /**
     * Process the queued job.
     * 
     * @param  mixed  $job
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($job, Closure $next)
    {
        // If the job doesn't implement ShouldQueue, we don't need to prevent overlapping
        if (! $job instanceof ShouldQueue) {
            return $next($job);
        }

        $lockKey = 'job_overlap_lock:' . $this->key;
        
        // Try to acquire the lock
        if (Cache::add($lockKey, true, 30)) { // Lock for 30 seconds
            try {
                // Release the lock when the job is done
                return $next($job);
            } finally {
                Cache::forget($lockKey);
            }
        }

        // If we can't acquire the lock, release the job (it will be retried)
        if (method_exists($job, 'release')) {
            $job->release(10); // Retry after 10 seconds
        }

        // Don't process the job further
        return null;
    }
}