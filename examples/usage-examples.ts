import { Injectable } from '@angular/core';
import { Action, State, StateContext, Selector } from '@ngxs/store';
import { of } from 'rxjs';
import { 
  ngxsResource, 
  ngxsResourceAuto, 
  xsResource, 
  xsResourceAuto,
  resource,
  autoResource
} from '@ngxs-labs/resource';
import { ResourceState } from '@ngxs-labs/resource';

// Example User interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Example Plan interface
interface Plan {
  id: number;
  name: string;
  description: string;
}

// Example API Response interface
interface ApiResponse<T> {
  data: T;
  hasErrors: boolean;
  messages: string[];
}

// Example State Model
interface AppStateModel extends ResourceState {
  users: User[];
  currentUser: User | null;
  plans: Plan[];
  ownerPlans: Plan[];
  supervisorPlans: Plan[];
  isLoading: boolean;
  error: any;
}

// Example Actions
export class LoadUsers {
  static readonly type = '[Users] Load Users';
}

export class LoadUser {
  static readonly type = '[Users] Load User';
  constructor(public id: number) {}
}

export class LoadPlans {
  static readonly type = '[Plans] Load Plans';
}

export class LoadOwnerPlans {
  static readonly type = '[Plans] Load Owner Plans';
}

export class LoadSupervisorPlans {
  static readonly type = '[Plans] Load Supervisor Plans';
}

export class SetMessages {
  static readonly type = '[App] Set Messages';
  constructor(public messages: string[]) {}
}

// Example Service
@Injectable()
export class UserService {
  getUsers(): Observable<User[]> {
    // Simulate API call
    return of([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  }

  getUser(id: number): Observable<User> {
    // Simulate API call
    return of({ id, name: 'John Doe', email: 'john@example.com' });
  }
}

@Injectable()
export class PlanService {
  getPlans(): Observable<ApiResponse<Plan[]>> {
    // Simulate API call
    return of({
      data: [
        { id: 1, name: 'Basic Plan', description: 'Basic features' },
        { id: 2, name: 'Premium Plan', description: 'Premium features' }
      ],
      hasErrors: false,
      messages: []
    });
  }

  getOwnerPlans(): Observable<ApiResponse<Plan[]>> {
    // Simulate API call
    return of({
      data: [
        { id: 1, name: 'Owner Plan 1', description: 'Owner specific features' }
      ],
      hasErrors: false,
      messages: []
    });
  }

  getSupervisorPlans(): Observable<ApiResponse<Plan[]>> {
    // Simulate API call
    return of({
      data: [
        { id: 1, name: 'Supervisor Plan 1', description: 'Supervisor specific features' }
      ],
      hasErrors: false,
      messages: []
    });
  }
}

// Example State
@State<AppStateModel>({
  name: 'app',
  defaults: {
    users: [],
    currentUser: null,
    plans: [],
    ownerPlans: [],
    supervisorPlans: [],
    loading: false,
    error: null
  }
})
@Injectable()
export class AppState {
  constructor(
    private userService: UserService,
    private planService: PlanService
  ) {}

  // Example 1: Basic usage with manual state management
  @Action(LoadUsers, { cancelUncompleted: true })
  loadUsers(ctx: StateContext<AppStateModel>, action: LoadUsers) {
    return ngxsResource({
      service: this.userService.getUsers(),
      success: (users: User[]) => {
        ctx.patchState({ users });
      },
      error: (error) => {
        ctx.patchState({ users: [] });
        console.error('Failed to load users:', error);
      },
      start: () => {
        ctx.patchState({ isLoading: true, error: null });
      }
    });
  }

  // Example 2: Using shorter alias with custom loading/error keys
  @Action(LoadOwnerPlans, { cancelUncompleted: true })
  loadOwnerPlans(ctx: StateContext<AppStateModel>, action: LoadOwnerPlans) {
    if (ctx.getState().ownerPlans.length > 0) {
      return of();
    }

    return xsResource({
      service: this.planService.getOwnerPlans(),
      success: (response: ApiResponse<Plan[]>) => {
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
        // Handle error response
        console.error('Failed to load owner plans:', response);
        ctx.patchState({ ownerPlans: [] });
      },
      loadingKey: 'isLoading',
      errorKey: 'error'
    });
  }

  // Example 3: Using auto-resource for automatic state management
  @Action(LoadSupervisorPlans, { cancelUncompleted: true })
  loadSupervisorPlans(ctx: StateContext<AppStateModel>, action: LoadSupervisorPlans) {
    if (ctx.getState().supervisorPlans.length > 0) {
      return of();
    }

    return ngxsResourceAuto({
      service: this.planService.getSupervisorPlans(),
      success: (response: ApiResponse<Plan[]>) => {
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
        // Handle error response
        console.error('Failed to load supervisor plans:', response);
        ctx.patchState({ supervisorPlans: [] });
      }
    });
  }

  // Example 4: Advanced usage with error transformation
  @Action(LoadUser, { cancelUncompleted: true })
  loadUser(ctx: StateContext<AppStateModel>, action: LoadUser) {
    return ngxsResource({
      service: this.userService.getUser(action.id),
      success: (user: User) => {
        ctx.patchState({ currentUser: user });
      },
      error: (error: any) => {
        ctx.patchState({ currentUser: null });
        // You can also dispatch other actions here
        // this.store.dispatch(new ShowNotification({ message: error.message, type: 'error' }));
      },
      start: () => {
        ctx.patchState({ isLoading: true, error: null });
      },
      // Optional: Custom error transformation
      errorTransform: (error: any) => {
        if (error.status === 404) {
          return { message: 'User not found', code: 404 };
        }
        if (error.status === 500) {
          return { message: 'Server error', code: 500 };
        }
        return { message: error.message || 'An error occurred', code: error.status || 0 };
      },
    });
  }

  // Example 5: Using legacy aliases for backward compatibility
  @Action(LoadPlans, { cancelUncompleted: true })
  loadPlans(ctx: StateContext<AppStateModel>, action: LoadPlans) {
    return resource({
      service: this.planService.getPlans(),
      success: (response: ApiResponse<Plan[]>) => {
        if (response?.hasErrors) {
          ctx.dispatch(new SetMessages(response.messages));
          return;
        }
        ctx.patchState({ plans: response.data || [] });
      },
      error: (error) => {
        ctx.patchState({ plans: [] });
        console.error('Failed to load plans:', error);
      }
    });
  }

  // Example 6: Using autoResource for automatic state management
  @Action(LoadPlans, { cancelUncompleted: true })
  loadPlansAuto(ctx: StateContext<AppStateModel>, action: LoadPlans) {
    return autoResource({
      service: this.planService.getPlans(),
      success: (response: ApiResponse<Plan[]>) => {
        if (response?.hasErrors) {
          ctx.dispatch(new SetMessages(response.messages));
          return;
        }
        ctx.patchState({ plans: response.data || [] });
      },
      error: (error) => {
        ctx.patchState({ plans: [] });
        console.error('Failed to load plans:', error);
      }
    });
  }

  // Example 7: Using xsResourceAuto for shorter syntax
  @Action(LoadPlans, { cancelUncompleted: true })
  loadPlansShort(ctx: StateContext<AppStateModel>, action: LoadPlans) {
    return xsResourceAuto({
      service: this.planService.getPlans(),
      success: (response: ApiResponse<Plan[]>) => {
        if (response?.hasErrors) {
          ctx.dispatch(new SetMessages(response.messages));
          return;
        }
        ctx.patchState({ plans: response.data || [] });
      },
      error: (error) => {
        ctx.patchState({ plans: [] });
        console.error('Failed to load plans:', error);
      }
    });
  }

  // Example 8: Complete lifecycle with all callbacks
  @Action(LoadUsers, { cancelUncompleted: true })
  loadUsersComplete(ctx: StateContext<AppStateModel>, action: LoadUsers) {
    return ngxsResource({
      service: this.userService.getUsers(),
      success: (users: User[]) => {
        ctx.patchState({ users });
        console.log('Users loaded successfully:', users.length);
      },
      error: (error) => {
        ctx.patchState({ users: [], error });
        console.error('Failed to load users:', error);
      },
      start: () => {
        ctx.patchState({ isLoading: true, error: null });
        console.log('Starting to load users...');
      },
      complete: () => {
        console.log('User loading operation completed');
      },
      errorTransform: (error: any) => {
        // Transform error to a more user-friendly format
        if (error.status === 0) {
          return { message: 'Network error - please check your connection', code: 'NETWORK_ERROR' };
        }
        if (error.status >= 500) {
          return { message: 'Server error - please try again later', code: 'SERVER_ERROR' };
        }
        return error;
      }
    });
  }

  // Selectors
  @Selector()
  static getUsers(state: AppStateModel): User[] {
    return state.users;
  }

  @Selector()
  static getCurrentUser(state: AppStateModel): User | null {
    return state.currentUser;
  }

  @Selector()
  static getPlans(state: AppStateModel): Plan[] {
    return state.plans;
  }

  @Selector()
  static getOwnerPlans(state: AppStateModel): Plan[] {
    return state.ownerPlans;
  }

  @Selector()
  static getSupervisorPlans(state: AppStateModel): Plan[] {
    return state.supervisorPlans;
  }

  @Selector()
  static isLoading(state: AppStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getError(state: AppStateModel): any {
    return state.error;
  }
}
