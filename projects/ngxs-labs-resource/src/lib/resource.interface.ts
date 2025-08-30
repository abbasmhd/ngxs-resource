import { Observable } from 'rxjs';
import { StateContext } from '@ngxs/store';

/**
 * Options for configuring a resource operation
 */
export interface ResourceOptions<T = any, R = any> {
  /** The service call to execute */
  service: Observable<R>;
  /** Callback executed on successful response */
  success?: (result: R, ctx: StateContext<T>) => void;
  /** Callback executed on error */
  error?: (error: any, ctx: StateContext<T>) => void;
  /** Callback executed before service call starts */
  start?: (ctx: StateContext<T>) => void;
  /** Callback executed after service call completes (success or error) */
  complete?: (ctx: StateContext<T>) => void;
  /** Transform error before passing to error callback */
  errorTransform?: (error: any) => any;
  /** Whether to cancel previous uncompleted calls */
  cancelUncompleted?: boolean;
  /** Custom loading state key */
  loadingKey?: string;
  /** Custom error state key */
  errorKey?: string;
}

/**
 * Base interface for states that can use resource operations
 */
export interface ResourceState {
  loading?: boolean;
  error?: any;
  [key: string]: any;
}

/**
 * Status of a resource operation
 */
export enum ResourceStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  RELOADING = 'reloading',
  RESOLVED = 'resolved',
  ERROR = 'error',
  LOCAL = 'local'
}

/**
 * Result of a resource operation
 */
export interface ResourceResult<T = any> {
  data?: T;
  error?: any;
  status: ResourceStatus;
  loading: boolean;
  hasValue: boolean;
}
