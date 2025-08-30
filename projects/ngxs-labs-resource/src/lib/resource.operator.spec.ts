import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StateContext } from '@ngxs/store';
import { 
  ResourceOperator, 
  ngxsResource, 
  ngxsResourceAuto, 
  xsResource, 
  xsResourceAuto,
  resource,
  autoResource
} from './resource.operator';
import { ResourceOptions, ResourceState } from './resource.interface';

interface TestState extends ResourceState {
  data?: any;
  customLoading?: boolean;
  customError?: any;
}

describe('ResourceOperator', () => {
  let mockContext: jasmine.SpyObj<StateContext<TestState>>;

  beforeEach(() => {
    mockContext = jasmine.createSpyObj<StateContext<TestState>>('StateContext', [
      'patchState',
      'getState',
      'setState',
      'dispatch'
    ]);
    
    // Setup default mock behavior
    mockContext.getState.and.returnValue({} as TestState);
  });

  describe('ngxsResource', () => {
    it('should create resource operator with default state management', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResource(options);
      expect(result).toBeDefined();
    });

    it('should execute start callback when provided', () => {
      const service = of({ id: 1, name: 'Test' });
      const startSpy = jasmine.createSpy('start');
      const options: ResourceOptions<TestState, any> = { 
        service, 
        start: startSpy 
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext);

      expect(startSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should set default loading state when no start callback provided', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext);

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });
    });

    it('should execute success callback when provided', () => {
      const data = { id: 1, name: 'Test' };
      const service = of(data);
      const successSpy = jasmine.createSpy('success');
      const options: ResourceOptions<TestState, any> = { 
        service, 
        success: successSpy 
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      expect(successSpy).toHaveBeenCalledWith(data, mockContext);
    });

    it('should set default success state when no success callback provided', () => {
      const data = { id: 1, name: 'Test' };
      const service = of(data);
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: null
      });
    });

    it('should execute error callback when provided', () => {
      const error = new Error('Test error');
      const service = throwError(() => error);
      const errorSpy = jasmine.createSpy('error');
      const options: ResourceOptions<TestState, any> = { 
        service, 
        error: errorSpy 
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      expect(errorSpy).toHaveBeenCalledWith(error, mockContext);
    });

    it('should set default error state when no error callback provided', () => {
      const error = new Error('Test error');
      const service = throwError(() => error);
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: error
      });
    });

    it('should execute complete callback when provided', () => {
      const service = of({ id: 1, name: 'Test' });
      const completeSpy = jasmine.createSpy('complete');
      const options: ResourceOptions<TestState, any> = { 
        service, 
        complete: completeSpy 
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      expect(completeSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should use custom loading and error keys', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { 
        service,
        loadingKey: 'customLoading',
        errorKey: 'customError'
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      expect(mockContext.patchState).toHaveBeenCalledWith({
        customLoading: false,
        customError: null
      });
    });

    it('should transform error when errorTransform provided', () => {
      const originalError = { status: 500, message: 'Server error' };
      const service = throwError(() => originalError);
      const errorSpy = jasmine.createSpy('error');
      const errorTransform = (err: any) => ({ message: err.message, code: err.status });
      const options: ResourceOptions<TestState, any> = { 
        service, 
        error: errorSpy,
        errorTransform
      };

      const result = ResourceOperator.ngxsResource(options);
      const operator = result as any;
      operator(mockContext).subscribe({
        error: () => {} // Handle error to avoid test failure
      });

      const transformedError = { message: 'Server error', code: 500 };
      expect(errorSpy).toHaveBeenCalledWith(transformedError, mockContext);
    });
  });

  describe('ngxsResourceAuto', () => {
    it('should create auto resource operator', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResourceAuto(options);
      expect(result).toBeDefined();
    });

    it('should automatically manage loading and error states', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.ngxsResourceAuto(options);
      const operator = result as any;
      operator(mockContext).subscribe();

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: true,
        error: null
      });

      expect(mockContext.patchState).toHaveBeenCalledWith({
        loading: false,
        error: null
      });
    });
  });

  describe('xsResource', () => {
    it('should be an alias for ngxsResource', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.xsResource(options);
      expect(result).toBeDefined();
    });
  });

  describe('xsResourceAuto', () => {
    it('should be an alias for ngxsResourceAuto', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ResourceOperator.xsResourceAuto(options);
      expect(result).toBeDefined();
    });
  });
});

describe('Factory Functions', () => {
  let mockContext: jasmine.SpyObj<StateContext<TestState>>;

  beforeEach(() => {
    mockContext = jasmine.createSpyObj<StateContext<TestState>>('StateContext', [
      'patchState',
      'getState',
      'setState',
      'dispatch'
    ]);
    
    mockContext.getState.and.returnValue({} as TestState);
  });

  describe('ngxsResource', () => {
    it('should create resource operator', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ngxsResource(options);
      expect(result).toBeDefined();
    });
  });

  describe('ngxsResourceAuto', () => {
    it('should create auto resource operator', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = ngxsResourceAuto(options);
      expect(result).toBeDefined();
    });
  });

  describe('xsResource', () => {
    it('should create resource operator', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = xsResource(options);
      expect(result).toBeDefined();
    });
  });

  describe('xsResourceAuto', () => {
    it('should create auto resource operator', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = xsResourceAuto(options);
      expect(result).toBeDefined();
    });
  });

  describe('Legacy aliases', () => {
    it('should have resource alias for ngxsResource', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = resource(options);
      expect(result).toBeDefined();
    });

    it('should have autoResource alias for ngxsResourceAuto', () => {
      const service = of({ id: 1, name: 'Test' });
      const options: ResourceOptions<TestState, any> = { service };

      const result = autoResource(options);
      expect(result).toBeDefined();
    });
  });
});
