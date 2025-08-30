import { Injectable } from '@angular/core';
import { Observable, of, throwError, finalize } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { StateContext } from '@ngxs/store';
import { ResourceOptions, ResourceState, ResourceStatus } from './resource.interface';

/**
 * Resource operator for NGXS actions
 * Provides utility functions for managing HTTP resources in NGXS states
 */
@Injectable()
export class ResourceOperator {
  
  /**
   * Creates a resource operator for NGXS actions with manual state management
   * @param options Resource configuration options
   * @returns Function that takes StateContext and returns Observable
   */
  static ngxsResource<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): (ctx: StateContext<T>) => Observable<R> {
    const {
      service,
      success,
      error,
      start,
      complete,
      errorTransform,
      loadingKey = 'loading',
      errorKey = 'error'
    } = options;

    return (ctx: StateContext<T>): Observable<R> => {
      // Execute start callback
      if (start) {
        start(ctx);
      } else {
        // Default loading state management
        ctx.patchState({ [loadingKey]: true, [errorKey]: null } as any);
      }

      return service.pipe(
        tap((result: R) => {
          // Execute success callback
          if (success) {
            success(result, ctx);
          } else {
            // Default success state management
            ctx.patchState({ [loadingKey]: false, [errorKey]: null } as any);
          }
        }),
        catchError((err: any) => {
          const transformedError = errorTransform ? errorTransform(err) : err;
          
          // Execute error callback
          if (error) {
            error(transformedError, ctx);
          } else {
            // Default error state management
            ctx.patchState({ 
              [loadingKey]: false, 
              [errorKey]: transformedError 
            } as any);
          }
          
          return throwError(() => transformedError);
        }),
        finalize(() => {
          // Execute complete callback
          if (complete) {
            complete(ctx);
          }
        })
      );
    };
  }

  /**
   * Creates a resource operator with automatic state management
   * @param options Resource configuration options
   * @returns Function that takes StateContext and returns Observable
   */
  static ngxsResourceAuto<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): (ctx: StateContext<T>) => Observable<R> {
    const {
      service,
      success,
      error,
      start,
      complete,
      errorTransform,
      loadingKey = 'loading',
      errorKey = 'error'
    } = options;

    return (ctx: StateContext<T>): Observable<R> => {
      // Execute start callback or set default loading state
      if (start) {
        start(ctx);
      } else {
        ctx.patchState({ [loadingKey]: true, [errorKey]: null } as any);
      }

      return service.pipe(
        tap((result: R) => {
          // Execute success callback or set default success state
          if (success) {
            success(result, ctx);
          } else {
            ctx.patchState({ [loadingKey]: false, [errorKey]: null } as any);
          }
        }),
        catchError((err: any) => {
          const transformedError = errorTransform ? errorTransform(err) : err;
          
          // Execute error callback or set default error state
          if (error) {
            error(transformedError, ctx);
          } else {
            ctx.patchState({ 
              [loadingKey]: false, 
              [errorKey]: transformedError 
            } as any);
          }
          
          return throwError(() => transformedError);
        }),
        finalize(() => {
          if (complete) {
            complete(ctx);
          }
        })
      );
    };
  }

  /**
   * Shorter alias for ngxsResource
   * @param options Resource configuration options
   * @returns Resource operator function
   */
  static xsResource<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): (ctx: StateContext<T>) => Observable<R> {
    return ResourceOperator.ngxsResource(options);
  }

  /**
   * Shorter alias for ngxsResourceAuto
   * @param options Resource configuration options
   * @returns Auto-resource operator function
   */
  static xsResourceAuto<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): (ctx: StateContext<T>) => Observable<R> {
    return ResourceOperator.ngxsResourceAuto(options);
  }
}

/**
 * Main factory function - renamed to avoid conflicts with Angular's resource()
 * @param options Resource configuration options
 * @returns Resource operator function
 */
export function ngxsResource<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
): (ctx: StateContext<T>) => Observable<R> {
  return ResourceOperator.ngxsResource(options);
}

/**
 * Auto-resource factory function - renamed to ngxsResourceAuto
 * @param options Resource configuration options
 * @returns Auto-resource operator function
 */
export function ngxsResourceAuto<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
): (ctx: StateContext<T>) => Observable<R> {
  return ResourceOperator.ngxsResourceAuto(options);
}

/**
 * Shorter alias for ngxsResource
 * @param options Resource configuration options
 * @returns Resource operator function
 */
export function xsResource<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
): (ctx: StateContext<T>) => Observable<R> {
  return ResourceOperator.xsResource(options);
}

/**
 * Shorter alias for ngxsResourceAuto
 * @param options Resource configuration options
 * @returns Auto-resource operator function
 */
export function xsResourceAuto<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
): (ctx: StateContext<T>) => Observable<R> {
  return ResourceOperator.xsResourceAuto(options);
}

// Legacy aliases for backward compatibility (if needed)
export const resource = ngxsResource;
export const autoResource = ngxsResourceAuto;
