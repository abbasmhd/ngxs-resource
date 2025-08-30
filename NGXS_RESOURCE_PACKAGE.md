# @ngxs-labs/resource Package

A comprehensive resource management utility package for NGXS that provides convenient functions for handling HTTP resources in NGXS states.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Package Structure](#package-structure)
- [Core Files](#core-files)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Benefits](#benefits)
- [Migration Guide](#migration-guide)

## Overview

The `@ngxs-labs/resource` package provides utility functions to simplify HTTP resource management in NGXS states. It offers both manual and automatic state management options, with naming conventions that avoid conflicts with Angular's built-in `resource()` function.

### Key Features

- **No Naming Conflicts**: Uses `ngxsResource` and `ngxsResourceAuto` to avoid conflicts with Angular's `resource()`
- **Type Safety**: Full TypeScript support with generic types
- **Flexible State Management**: Choose between manual and automatic state management
- **Consistent Patterns**: Standardizes HTTP operations across your NGXS states
- **Error Handling**: Centralized error handling for all resource operations
- **Loading States**: Automatic loading state management

## Installation

### 1. Create Package Structure

Create the following directory structure in your project:

```
src/
  lib/
    resource/
      src/
        lib/
          resource.operator.ts
          resource.interface.ts
          index.ts
      package.json
      ng-package.json
      tsconfig.json
```

### 2. Install Dependencies

Navigate to the resource package directory and install dependencies:

```bash
cd src/lib/resource
npm install
```

### 3. Build and Link

```bash
# Build the package
ng build ngxs-labs-resource

# Link it to your main project
npm link
cd ../../..
npm link @ngxs-labs/resource
```

## Package Structure

### package.json

```json
{
  "name": "@ngxs-labs/resource",
  "version": "1.0.0",
  "description": "Resource management utilities for NGXS",
  "main": "bundles/ngxs-labs-resource.umd.js",
  "module": "fesm2015/ngxs-labs-resource.js",
  "es2015": "fesm2015/ngxs-labs-resource.js",
  "esm2015": "esm2015/ngxs-labs-resource.js",
  "fesm2015": "fesm2015/ngxs-labs-resource.js",
  "typings": "ngxs-labs-resource.d.ts",
  "metadata": "ngxs-labs-resource.metadata.json",
  "sideEffects": false,
  "dependencies": {
    "@ngxs/store": "^18.0.0",
    "rxjs": "^7.0.0"
  },
  "peerDependencies": {
    "@angular/core": "^18.0.0"
  }
}
```

### ng-package.json

```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../../dist/ngxs-labs-resource",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

## Core Files

### 1. Resource Interface (resource.interface.ts)

```typescript
import { Observable } from 'rxjs';
import { StateContext } from '@ngxs/store';

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

export interface ResourceState {
  loading?: boolean;
  error?: any;
  [key: string]: any;
}
```

### 2. Resource Operator (resource.operator.ts)

```typescript
import { Injectable } from '@angular/core';
import { Observable, of, throwError, finalize } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { StateContext } from '@ngxs/store';
import { ResourceOptions, ResourceState } from './resource.interface';

@Injectable()
export class ResourceOperator {
  
  /**
   * Creates a resource operator for NGXS actions
   * @param options Resource configuration options
   * @returns Observable that can be returned from NGXS actions
   */
  static ngxsResource<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): Observable<R> {
    return new Observable(observer => {
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

      // Create a context wrapper for the operator
      let context: StateContext<T> | null = null;

      const setContext = (ctx: StateContext<T>) => {
        context = ctx;
      };

      const executeResource = (ctx: StateContext<T>): Observable<R> => {
        setContext(ctx);
        
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

      // Return the operator function
      return executeResource;
    });
  }

  /**
   * Creates a resource operator with automatic state management
   * @param options Resource configuration options
   * @returns Observable that can be returned from NGXS actions
   */
  static ngxsResourceAuto<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): Observable<R> {
    return new Observable(observer => {
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

      const executeResource = (ctx: StateContext<T>): Observable<R> => {
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

      return executeResource;
    });
  }

  // Alternative shorter names
  static xsResource<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): Observable<R> {
    return ResourceOperator.ngxsResource(options);
  }

  static xsResourceAuto<T extends ResourceState, R = any>(
    options: ResourceOptions<T, R>
  ): Observable<R> {
    return ResourceOperator.ngxsResourceAuto(options);
  }
}

/**
 * Main factory function - renamed to avoid conflicts
 * @param options Resource configuration options
 * @returns Resource operator function
 */
export function ngxsResource<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
) {
  return ResourceOperator.ngxsResource(options);
}

/**
 * Auto-resource factory function - renamed to ngxsResourceAuto
 * @param options Resource configuration options
 * @returns Auto-resource operator function
 */
export function ngxsResourceAuto<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
) {
  return ResourceOperator.ngxsResourceAuto(options);
}

/**
 * Shorter alias for ngxsResource
 * @param options Resource configuration options
 * @returns Resource operator function
 */
export function xsResource<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
) {
  return ResourceOperator.xsResource(options);
}

/**
 * Shorter alias for ngxsResourceAuto
 * @param options Resource configuration options
 * @returns Auto-resource operator function
 */
export function xsResourceAuto<T extends ResourceState, R = any>(
  options: ResourceOptions<T, R>
) {
  return ResourceOperator.xsResourceAuto(options);
}

// Legacy aliases for backward compatibility (if needed)
export const resource = ngxsResource;
export const autoResource = ngxsResourceAuto;
```

### 3. Public API (public-api.ts)

```typescript
export * from './lib/resource.interface';
export * from './lib/resource.operator';
```

### 4. Main Index (index.ts)

```typescript
export * from './resource.interface';
export * from './resource.operator';
```

## Usage Examples

### Basic Usage with Manual State Management

```typescript
import { ngxsResource } from '@ngxs-labs/resource';

@Action(LoadUser, { cancelUncompleted: true })
loadUser(ctx: StateContext<AppStateModel>, action: LoadUser) {
  return ngxsResource({
    service: this.userService.login(),
    success: (response) => {
      ctx.patchState({ user: response.data });
    },
    error: (error) => {
      ctx.patchState({ user: undefined });
    },
    start: () => {
      ctx.patchState({ isLoading: true });
    }
  });
}
```

### Using Shorter Aliases

```typescript
import { xsResource } from '@ngxs-labs/resource';

@Action(LoadOwnerPlans, { cancelUncompleted: true })
loadOwnerPlans(ctx: StateContext<AppStateModel>, action: LoadOwnerPlans) {
  if (ctx.getState().ownerPlans.length > 0) {
    return of();
  }

  return xsResource({
    service: this.planService.getOwnerPlans(),
    success: (response) => {
      if (response?.hasErrors) {
        ctx.dispatch(new SetMessages(response.messages));
        return;
      }

      if (!response?.data) {
        console.warn('Invalid response data for Owner Plans');
        return;
      }
      ctx.patchState({ ownerPlans: response.data });
    },
    error: (response) => {
      StateUtils.processResponseMessages(ctx, response.error, action, this.route);
    },
    loadingKey: 'isLoading',
    errorKey: 'error'
  });
}
```

### Using Auto-Resource for Automatic State Management

```typescript
import { ngxsResourceAuto } from '@ngxs-labs/resource';

@Action(LoadSupervisorPlans, { cancelUncompleted: true })
loadSupervisorPlans(ctx: StateContext<AppStateModel>, action: LoadSupervisorPlans) {
  if (ctx.getState().supervisorPlans.length > 0) {
    return of();
  }

  return ngxsResourceAuto({
    service: this.planService.getSupervisorPlans(),
    success: (response) => {
      if (response?.hasErrors) {
        ctx.dispatch(new SetMessages(response.messages));
        return;
      }

      if (!response?.data) {
        console.warn('Invalid response data for Supervisor Plans');
        return;
      }
      ctx.patchState({ supervisorPlans: response.data });
    },
    error: (response) => {
      StateUtils.processResponseMessages(ctx, response.error, action, this.route);
    }
  });
}
```

### Advanced Usage with Custom Error Transformation

```typescript
@Action(LoadUsersWithFilters)
loadUsersWithFilters(ctx: StateContext<AppStateModel>, action: ReturnType<typeof UserActions.loadUsersWithFilters>) {
  return ngxsResource({
    service: this.userService.getUsersWithFilters(action.filters),
    success: (users: User[]) => {
      ctx.patchState({ users, loading: false, error: null });
    },
    error: (error: string) => {
      ctx.patchState({ error, loading: false });
      // You can also dispatch other actions here
      this.store.dispatch(new ShowNotification({ message: error, type: 'error' }));
    },
    start: () => {
      ctx.patchState({ loading: true, error: null });
    },
    // Optional: Custom error transformation
    errorTransform: (error: any) => error.message || 'An error occurred',
  });
}
```

## API Reference

### Available Functions

| Function | Description | State Management |
|----------|-------------|------------------|
| `ngxsResource()` | Main function for manual state management | Manual |
| `ngxsResourceAuto()` | Auto-resource version with automatic state management | Automatic |
| `xsResource()` | Shorter alias for manual version | Manual |
| `xsResourceAuto()` | Shorter alias for auto version | Automatic |
| `resource()` | Legacy alias for manual version | Manual |
| `autoResource()` | Legacy alias for auto version | Automatic |

### ResourceOptions Interface

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `service` | `Observable<R>` | Yes | - | The service call to execute |
| `success` | `(result: R, ctx: StateContext<T>) => void` | No | - | Success callback |
| `error` | `(error: any, ctx: StateContext<T>) => void` | No | - | Error callback |
| `start` | `(ctx: StateContext<T>) => void` | No | - | Start callback |
| `complete` | `(ctx: StateContext<T>) => void` | No | - | Complete callback |
| `errorTransform` | `(error: any) => any` | No | - | Error transformation |
| `cancelUncompleted` | `boolean` | No | - | Cancel uncompleted calls |
| `loadingKey` | `string` | No | `'loading'` | Loading state key |
| `errorKey` | `string` | No | `'error'` | Error state key |

## Benefits

### 1. **No Naming Conflicts**
- Uses `ngxsResource` and `ngxsResourceAuto` to avoid conflicts with Angular's `resource()`
- Clear, descriptive names that indicate NGXS-specific functionality

### 2. **Type Safety**
- Full TypeScript support with generic types
- Compile-time error checking for resource operations

### 3. **Consistent Patterns**
- Standardizes how you handle HTTP operations across your state
- Reduces code duplication and improves maintainability

### 4. **Flexible State Management**
- Choose between manual and automatic state management
- Customizable loading and error state keys

### 5. **Error Handling**
- Centralized error handling for all resource operations
- Custom error transformation capabilities

### 6. **Loading States**
- Automatic loading state management
- Consistent loading behavior across your application

## Migration Guide

### From Standard NGXS Patterns

**Before (Standard NGXS):**
```typescript
@Action(LoadUser, { cancelUncompleted: true })
loadUser(ctx: StateContext<AppStateModel>, action: LoadUser) {
  return this.userService.login().pipe(
    tap((response) => ctx.patchState({ user: response.data })),
    catchError(() => {
      ctx.patchState({ user: undefined });
      return of({});
    })
  );
}
```

**After (Using ngxsResource):**
```typescript
@Action(LoadUser, { cancelUncompleted: true })
loadUser(ctx: StateContext<AppStateModel>, action: LoadUser) {
  return ngxsResource({
    service: this.userService.login(),
    success: (response) => {
      ctx.patchState({ user: response.data });
    },
    error: (error) => {
      ctx.patchState({ user: undefined });
    }
  });
}
```

### From Custom Resource Patterns

**Before (Custom Resource):**
```typescript
@Action(LoadOwnerPlans)
loadOwnerPlans(ctx: StateContext<AppStateModel>, action: LoadOwnerPlans) {
  return this.planService.getOwnerPlans().pipe(
    tap((response) => {
      if (response?.hasErrors) {
        ctx.dispatch(new SetMessages(response.messages));
        return;
      }
      ctx.patchState({ ownerPlans: response.data });
    }),
    catchError((response) => {
      StateUtils.processResponseMessages(ctx, response.error, action, this.route);
      return of({});
    })
  );
}
```

**After (Using xsResource):**
```typescript
@Action(LoadOwnerPlans)
loadOwnerPlans(ctx: StateContext<AppStateModel>, action: LoadOwnerPlans) {
  return xsResource({
    service: this.planService.getOwnerPlans(),
    success: (response) => {
      if (response?.hasErrors) {
        ctx.dispatch(new SetMessages(response.messages));
        return;
      }
      ctx.patchState({ ownerPlans: response.data });
    },
    error: (response) => {
      StateUtils.processResponseMessages(ctx, response.error, action, this.route);
    }
  });
}
```

## Configuration

### Angular Configuration

Add to your `angular.json`:

```json
{
  "projects": {
    "my-project-angular": {
      "architect": {
        "build": {
          "options": {
            "projects": {
              "ngxs-labs-resource": "src/lib/resource"
            }
          }
        }
      }
    }
  }
}
```

### Import Examples

```typescript
// Import only what you need
import { ngxsResource } from '@ngxs-labs/resource';

// Or import multiple functions
import { ngxsResource, xsResource, ngxsResourceAuto } from '@ngxs-labs/resource';

// Or import with aliases
import { ngxsResource as resource } from '@ngxs-labs/resource';
```

## Best Practices

### 1. **Choose the Right Function**
- Use `ngxsResource` when you need full control over state management
- Use `ngxsResourceAuto` when you want automatic loading/error state management

### 2. **Consistent Naming**
- Use the same loading and error keys across related actions
- Follow a consistent pattern for your resource operations

### 3. **Error Handling**
- Always provide error callbacks for proper error handling
- Use `errorTransform` for consistent error message formatting

### 4. **State Keys**
- Use descriptive keys like `isLoading` instead of generic `loading`
- Consider using action-specific keys for complex states

### 5. **Type Safety**
- Always specify generic types for better type safety
- Use interfaces that extend `ResourceState` for your state models

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure the package is properly built and linked
2. **Import Errors**: Check that the package is correctly installed and imported
3. **Type Errors**: Verify that your state models extend `ResourceState`
4. **Runtime Errors**: Ensure all required callbacks are provided

### Debug Tips

1. **Console Logging**: Add console logs in your callbacks to debug issues
2. **Type Checking**: Use TypeScript strict mode to catch type errors early
3. **State Inspection**: Use Redux DevTools to inspect state changes

## Conclusion

The `@ngxs-labs/resource` package provides a powerful and flexible way to manage HTTP resources in your NGXS states. With its clear naming conventions, type safety, and flexible configuration options, it can significantly improve the maintainability and consistency of your NGXS-based applications.

By following the patterns and examples provided in this documentation, you can effectively integrate the package into your existing NGXS states and enjoy the benefits of simplified resource management.
