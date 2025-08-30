# @ngxs-labs/resource

A comprehensive resource management utility package for NGXS that provides convenient functions for handling HTTP resources in NGXS states.

## 🚀 Features

- **No Naming Conflicts**: Uses `ngxsResource` and `ngxsResourceAuto` to avoid conflicts with Angular's `resource()`
- **Type Safety**: Full TypeScript support with generic types
- **Flexible State Management**: Choose between manual and automatic state management
- **Consistent Patterns**: Standardizes HTTP operations across your NGXS states
- **Error Handling**: Centralized error handling for all resource operations
- **Loading States**: Automatic loading state management

## 📦 Installation

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

## 🛠️ Usage

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

## 📚 API Reference

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

## 🧪 Testing

Run the test suite:

```bash
ng test ngxs-labs-resource
```

## 🏗️ Building

Build the package:

```bash
ng build ngxs-labs-resource
```

## 📖 Migration Guide

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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NGXS team for the excellent state management library
- Angular team for the amazing framework
- All contributors who help improve this package
