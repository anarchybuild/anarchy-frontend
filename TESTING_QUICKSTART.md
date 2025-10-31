# Testing Quick Start Guide

## Running Tests

### Run all tests (watch mode - interactive)
```bash
npm test
```
This will run tests in watch mode, automatically re-running when you make changes.

### Run all tests once (CI mode)
```bash
npm run test:run
```
Perfect for CI/CD pipelines or when you just want to verify everything passes.

### Run tests with UI
```bash
npm run test:ui
```
Opens an interactive browser-based UI showing test results, coverage, and more.

### Run tests with coverage
```bash
npm run test:coverage
```
Generates a coverage report showing which lines of code are tested.

## Running Specific Tests

### Run a specific test file
```bash
npm test src/utils/usernameValidation.test.ts
```

### Run tests matching a pattern
```bash
npm test -- -t "should validate"
```

### Run tests in a specific directory
```bash
npm test src/utils/
```

## Test File Structure

```
src/
├── utils/
│   ├── usernameValidation.ts
│   └── usernameValidation.test.ts  ← Test file
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx             ← Test file
└── test/
    ├── setup.ts                     ← Global test setup
    └── README.md                    ← Setup documentation
```

## Quick Examples

### Testing a Utility Function
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Testing a React Component
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ name: 'test' });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(20);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/pattern/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// DOM (with jest-dom)
expect(element).toBeInTheDocument();
expect(element).toHaveClass('className');
expect(element).toHaveAttribute('href', '/link');
expect(input).toBeDisabled();
expect(input).toHaveValue('text');
```

## Debugging Tests

### VS Code Debugging
1. Set breakpoint in test file
2. Run "Debug Test" from command palette
3. Step through code

### Console Debugging
```typescript
it('should do something', () => {
  const result = myFunction();
  console.log('Result:', result); // Will show in test output
  expect(result).toBeDefined();
});
```

### Screen Debug
```typescript
it('should render correctly', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Prints the DOM tree
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Test Coverage

View coverage in browser:
```bash
npm run test:coverage
open coverage/index.html
```

The report shows:
- **Statements**: Percentage of statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

## Common Issues & Solutions

### Issue: "Cannot find module '@/...'"
**Solution**: Check that `vitest.config.ts` has the correct path alias configuration.

### Issue: "window is not defined"
**Solution**: Add mock to `src/test/setup.ts`.

### Issue: "Test timeout"
**Solution**: Increase timeout:
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: "Element not found"
**Solution**: Use `waitFor` for async elements:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Best Practices

1. **One assertion per test** (when practical)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Clean up after tests** (automatic with setup.ts)
5. **Mock external dependencies**
6. **Test edge cases and errors**
7. **Keep tests fast** (avoid real API calls)
8. **Use semantic queries** (getByRole, getByLabelText)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/react)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)
- [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md) - Full documentation
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Implementation summary

## Current Test Stats

- ✅ **177 tests** passing
- ✅ **11 test files**
- ✅ **100% success rate**
- ⚡ **~7 seconds** execution time

---

**Need Help?** Check the full documentation in `TEST_DOCUMENTATION.md` or review existing test files for examples.

