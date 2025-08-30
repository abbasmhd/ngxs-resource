import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StateContext } from '@ngxs/store';
import { 
  ngxsResource, 
  ngxsResourceAuto, 
  xsResource, 
  xsResourceAuto 
} from './resource.operator';
import { ResourceOptions, ResourceState } from './resource.interface';
import { TestUtils, TestData, TestConfigs } from '../test-setup';

interface IntegrationTestState extends ResourceState {
  users: any[];
  plans: any[];
  currentUser: any;
  loading: boolean;
  error: any;
  customLoading: boolean;
  customError: any;
}

describe('Resource Integration Tests', () => {
  let mockContext: jasmine.SpyObj<StateContext<IntegrationTestState>>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContextWithDefaults<IntegrationTestState>({
      users: [],
      plans: [],
      currentUser: null,
      loading: false,
      error: null,
      customLoading: false,
      customError: null
    });
  });

  describe('Complete Resource Lifecycle', () => {
    it('should handle complete success flow with all callbacks', () => {
      const successSpy = jasmine.createSpy('success');
      const errorSpy = jasmine.createSpy('error');
      const startSpy = jasmine.createSpy('start');
      const completeSpy = jasmine.createSpy('complete');

      const options: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users),
        success: successSpy,
        error: errorSpy,
        start: startSpy,
        complete: completeSpy
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      // Verify start callback
      expect(startSpy).toHaveBeenCalledWith(mockContext);
      expect(startSpy).toHaveBeenCalledTimes(1);

      // Verify success callback
      expect(successSpy).toHaveBeenCalledWith(TestData.users, mockContext);
      expect(successSpy).toHaveBeenCalledTimes(1);

      // Verify complete callback
      expect(completeSpy).toHaveBeenCalledWith(mockContext);
      expect(completeSpy).toHaveBeenCalledTimes(1);

      // Verify error callback was not called
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle complete error flow with all callbacks', () => {
      const successSpy = jasmine.createSpy('success');
      const errorSpy = jasmine.createSpy('error');
      const startSpy = jasmine.createSpy('start');
      const completeSpy = jasmine.createSpy('complete');

      const options: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.error),
        success: successSpy,
        error: errorSpy,
        start: startSpy,
        complete: completeSpy
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      // Verify start callback
      expect(startSpy).toHaveBeenCalledWith(mockContext);
      expect(startSpy).toHaveBeenCalledTimes(1);

      // Verify error callback
      expect(errorSpy).toHaveBeenCalledWith(TestData.error, mockContext);
      expect(errorSpy).toHaveBeenCalledTimes(1);

      // Verify complete callback
      expect(completeSpy).toHaveBeenCalledWith(mockContext);
      expect(completeSpy).toHaveBeenCalledTimes(1);

      // Verify success callback was not called
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Management Integration', () => {
    it('should properly manage state transitions in success flow', () => {
      const options: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      // Verify state transitions
      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: null
      });
    });

    it('should properly manage state transitions in error flow', () => {
      const options: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.error)
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      // Verify state transitions
      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: TestData.error
      });
    });

    it('should use custom state keys when provided', () => {
      const options: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users),
        loadingKey: 'customLoading',
        errorKey: 'customError'
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      // Verify custom state keys are used
      expect(mockContext.patchState).toHaveBeenCalledWith({
        customLoading: true,
        customError: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        customLoading: false,
        customError: null
      });
    });
  });

  describe('Error Transformation Integration', () => {
    it('should transform errors before passing to error callback', () => {
      const errorSpy = jasmine.createSpy('error');
      const errorTransform = (err: any) => ({
        message: `Transformed: ${err.message}`,
        code: err.status || 'UNKNOWN'
      });

      const options: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.serverError),
        error: errorSpy,
        errorTransform
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      const transformedError = {
        message: 'Transformed: Server error',
        code: 500
      };

      expect(errorSpy).toHaveBeenCalledWith(transformedError, mockContext);
    });

    it('should handle complex error transformation scenarios', () => {
      const errorSpy = jasmine.createSpy('error');
      const errorTransform = (err: any) => {
        if (err.status === 0) {
          return { type: 'NETWORK_ERROR', message: 'Network connection failed' };
        }
        if (err.status >= 500) {
          return { type: 'SERVER_ERROR', message: 'Server is unavailable' };
        }
        if (err.status === 404) {
          return { type: 'NOT_FOUND', message: 'Resource not found' };
        }
        return { type: 'UNKNOWN_ERROR', message: err.message || 'Unknown error' };
      };

      const options: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.networkError),
        error: errorSpy,
        errorTransform
      };

      const result = ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      const expectedTransformedError = {
        type: 'NETWORK_ERROR',
        message: 'Network connection failed'
      };

      expect(errorSpy).toHaveBeenCalledWith(expectedTransformedError, mockContext);
    });
  });

  describe('Multiple Resource Operations', () => {
    it('should handle multiple concurrent resource operations', () => {
      const userOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users),
        success: (users) => mockContext.patchState({ users })
      };

      const planOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.plans),
        success: (plans) => mockContext.patchState({ plans })
      };

      const userResult = ngxsResource(userOptions);
      const planResult = ngxsResource(planOptions);

      const userOperator = userResult as any;
      const planOperator = planResult as any;

      // Execute both operations
      userOperator(mockContext).subscribe();
      planOperator(mockContext).subscribe();

      // Verify both operations completed successfully
      expect(mockContext.patchState).toHaveBeenCalledWith({ users: TestData.users });
      expect(mockContext.patchState).toHaveBeenCalledWith({ plans: TestData.plans });
    });

    it('should handle mixed success and error scenarios', () => {
      const successOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users),
        success: (users) => mockContext.patchState({ users })
      };

      const errorOptions: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.error),
        error: (error) => mockContext.patchState({ error })
      };

      const successResult = ngxsResource(successOptions);
      const errorResult = ngxsResource(errorOptions);

      const successOperator = successResult as any;
      const errorOperator = errorResult as any;

      // Execute both operations
      successOperator(mockContext).subscribe();
      errorOperator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      // Verify success operation
      expect(mockContext.patchState).toHaveBeenCalledWith({ users: TestData.users });

      // Verify error operation
      expect(mockContext.patchState).toHaveBeenCalledWith({ error: TestData.error });
    });
  });

  describe('Auto Resource Integration', () => {
    it('should automatically manage state in auto resource mode', () => {
      const options: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const result = ngxsResourceAuto(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      // Verify automatic state management
      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: null
      });
    });

    it('should handle errors automatically in auto resource mode', () => {
      const options: ResourceOptions<IntegrationTestState, any> = {
        service: throwError(() => TestData.error)
      };

      const result = ngxsResourceAuto(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      // Verify automatic error state management
      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: TestData.error
      });
    });
  });

  describe('Short Alias Integration', () => {
    it('should work identically to full function names', () => {
      const fullOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const shortOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const fullResult = ngxsResource(fullOptions);
      const shortResult = xsResource(shortOptions);

      const fullOperator = fullResult as any;
      const shortOperator = shortResult as any;

      // Execute both operations
      fullOperator(mockContext).subscribe();
      shortOperator(mockContext).subscribe();

      // Verify both work identically
      expect(mockContext.patchState).toHaveBeenCalledTimes(4); // 2 operations × 2 state updates each
    });

    it('should work identically for auto resource functions', () => {
      const fullOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const shortOptions: ResourceOptions<IntegrationTestState, any> = {
        service: of(TestData.users)
      };

      const fullResult = ngxsResourceAuto(fullOptions);
      const shortResult = xsResourceAuto(shortOptions);

      const fullOperator = fullResult as any;
      const shortOperator = shortResult as any;

      // Execute both operations
      fullOperator(mockContext).subscribe();
      shortOperator(mockContext).subscribe();

      // Verify both work identically
      expect(mockContext.patchState).toHaveBeenCalledTimes(4); // 2 operations × 2 state updates each
    });
  });
});
