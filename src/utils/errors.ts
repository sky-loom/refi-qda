/**
 * Custom Error Classes for REFI-QDA
 * 
 * Specialized error classes for different types of errors
 */

/**
 * Base error class for REFI-QDA errors
 */
export class REFIQDAError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // This is needed for proper stack traces in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for invalid QDPX files
 */
export class InvalidQDPXFileError extends REFIQDAError {
  details: string[];
  
  constructor(message: string, details: string[] = []) {
    super(message);
    this.details = details;
  }
}

/**
 * Error for missing QDPX files
 */
export class QDPXFileNotFoundError extends REFIQDAError {
  filePath: string;
  
  constructor(filePath: string) {
    super(`QDPX file not found: ${filePath}`);
    this.filePath = filePath;
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends REFIQDAError {
  details: string;
  
  constructor(message: string, details: string = '') {
    super(message);
    this.details = details;
  }
}

/**
 * Error for path resolution failures
 */
export class PathResolutionError extends REFIQDAError {
  details: string;
  
  constructor(message: string, details: string = '') {
    super(message);
    this.details = details;
  }
}

/**
 * Error for export failures
 */
export class ExportError extends REFIQDAError {
  details: string[];
  
  constructor(message: string, details: string[] = []) {
    super(message);
    this.details = details;
  }
}
