import { ResourceStatus } from './resource.interface';

describe('ResourceStatus', () => {
  it('should have correct enum values', () => {
    expect(ResourceStatus.IDLE).toBe('idle');
    expect(ResourceStatus.LOADING).toBe('loading');
    expect(ResourceStatus.RELOADING).toBe('reloading');
    expect(ResourceStatus.RESOLVED).toBe('resolved');
    expect(ResourceStatus.ERROR).toBe('error');
    expect(ResourceStatus.LOCAL).toBe('local');
  });

  it('should have 6 status values', () => {
    const statusValues = Object.values(ResourceStatus);
    expect(statusValues).toHaveSize(6);
  });
});
