import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { StateContext } from '@ngxs/store';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Common test interfaces
export interface TestState {
  loading?: boolean;
  error?: any;
  data?: any;
  [key: string]: any;
}

// Common test utilities
export class TestUtils {
  /**
   * Creates a mock StateContext for testing
   */
  static createMockContext<T = TestState>(): jasmine.SpyObj<StateContext<T>> {
    return jasmine.createSpyObj<StateContext<T>>('StateContext', [
      'patchState',
      'getState',
      'setState',
      'dispatch'
    ]);
  }

  /**
   * Creates a mock StateContext with default behavior
   */
  static createMockContextWithDefaults<T = TestState>(defaultState: T): jasmine.SpyObj<StateContext<T>> {
    const mockContext = this.createMockContext<T>();
    mockContext.getState.and.returnValue(defaultState);
    return mockContext;
  }

  /**
   * Asserts that patchState was called with specific values
   */
  static expectPatchStateCalled(
    mockContext: jasmine.SpyObj<StateContext<any>>, 
    expectedCalls: any[]
  ): void {
    expect(mockContext.patchState).toHaveBeenCalledTimes(expectedCalls.length);
    expectedCalls.forEach((expectedCall, index) => {
      expect(mockContext.patchState).toHaveBeenCalledWith(expectedCall);
    });
  }

  /**
   * Asserts that dispatch was called with specific actions
   */
  static expectDispatchCalled(
    mockContext: jasmine.SpyObj<StateContext<any>>, 
    expectedActions: any[]
  ): void {
    expect(mockContext.dispatch).toHaveBeenCalledTimes(expectedActions.length);
    expectedActions.forEach((expectedAction, index) => {
      expect(mockContext.dispatch).toHaveBeenCalledWith(expectedAction);
    });
  }

  /**
   * Creates a simple success observable
   */
  static createSuccessObservable<T>(data: T) {
    return { subscribe: (observer: any) => observer.next(data) };
  }

  /**
   * Creates a simple error observable
   */
  static createErrorObservable(error: any) {
    return { subscribe: (observer: any) => observer.error(error) };
  }
}

// Common test data
export const TestData = {
  users: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ],
  plans: [
    { id: 1, name: 'Basic Plan', description: 'Basic features' },
    { id: 2, name: 'Premium Plan', description: 'Premium features' }
  ],
  apiResponse: {
    data: [
      { id: 1, name: 'Test Item', description: 'Test description' }
    ],
    hasErrors: false,
    messages: []
  },
  error: new Error('Test error'),
  networkError: { status: 0, message: 'Network error' },
  serverError: { status: 500, message: 'Server error' },
  notFoundError: { status: 404, message: 'Not found' }
};

// Common test configurations
export const TestConfigs = {
  basicResource: {
    service: TestData.createSuccessObservable(TestData.users)
  },
  resourceWithCallbacks: {
    service: TestData.createSuccessObservable(TestData.users),
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    start: jasmine.createSpy('start'),
    complete: jasmine.createSpy('complete')
  },
  resourceWithCustomKeys: {
    service: TestData.createSuccessObservable(TestData.users),
    loadingKey: 'customLoading',
    errorKey: 'customError'
  },
  resourceWithErrorTransform: {
    service: TestData.createErrorObservable(TestData.error),
    error: jasmine.createSpy('error'),
    errorTransform: (err: any) => ({ message: err.message, code: 'TRANSFORMED' })
  }
};
