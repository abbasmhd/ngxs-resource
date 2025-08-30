# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @ngxs-labs/resource package
- Core resource management utilities for NGXS
- Support for both manual and automatic state management
- Multiple function aliases to avoid naming conflicts
- Comprehensive error handling and transformation
- Custom loading and error state keys
- Full TypeScript support with generic types
- Complete lifecycle callbacks (start, success, error, complete)

### Features
- `ngxsResource()` - Main function for manual state management
- `ngxsResourceAuto()` - Auto-resource version with automatic state management
- `xsResource()` - Shorter alias for manual version
- `xsResourceAuto()` - Shorter alias for auto version
- `resource()` - Legacy alias for manual version
- `autoResource()` - Legacy alias for auto version

### Technical Details
- Built with Angular 18+ compatibility
- Uses RxJS 7+ for reactive programming
- Integrates seamlessly with NGXS Store
- Comprehensive unit and integration test coverage
- Built with ng-packagr for optimal package distribution
- Follows Angular library best practices

## [1.0.0] - 2024-12-19

### Added
- Initial release
- Core resource management functionality
- Type-safe interfaces and implementations
- Comprehensive documentation and examples
- Full test coverage with Jasmine/Karma
- Multiple build configurations for different environments

### Breaking Changes
- None (initial release)

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- No known security vulnerabilities
