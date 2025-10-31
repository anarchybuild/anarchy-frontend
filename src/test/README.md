# Test Setup

This directory contains test configuration and setup files for the application.

## Files

### `setup.ts`
Global test setup file that runs before all tests. It includes:

- **Matchers Extension**: Adds jest-dom matchers to Vitest's expect
- **Cleanup**: Automatically cleans up after each test
- **Browser API Mocks**:
  - `window.matchMedia` - For responsive design tests
  - `IntersectionObserver` - For lazy loading tests
  - `ResizeObserver` - For component resize tests
  - `FileReader` - For file upload tests

## Usage

This setup file is automatically loaded by Vitest through the configuration in `vitest.config.ts`:

```typescript
setupFiles: ['./src/test/setup.ts']
```

## Adding New Global Mocks

To add new global mocks, add them to `setup.ts`:

```typescript
// Example: Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

## Custom Test Utilities

You can add custom test utilities here for reuse across tests:

```typescript
// Example: Custom render function with providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

## Notes

- Keep this directory minimal - only global setup should be here
- Test files should live alongside the code they test
- Don't add test data or fixtures here (create a separate `__fixtures__` directory if needed)

