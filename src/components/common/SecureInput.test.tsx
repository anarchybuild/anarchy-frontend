import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecureInput, SecureTextarea } from './SecureInput';

describe('SecureInput', () => {
  it('should render input element', () => {
    render(<SecureInput placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should sanitize input value', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    
    render(<SecureInput onSecureChange={onSecureChange} />);
    
    const input = screen.getByRole('textbox');
    // Use shorter text for performance
    await user.type(input, '<script>test');
    
    expect(onSecureChange).toHaveBeenCalled();
    // Check that the last call doesn't include script tags
    const lastCall = onSecureChange.mock.calls[onSecureChange.mock.calls.length - 1][0];
    expect(lastCall).not.toContain('<script>');
  });

  it('should respect maxLength prop', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    
    render(<SecureInput maxLength={10} onSecureChange={onSecureChange} />);
    
    const input = screen.getByRole('textbox');
    // Use shorter text for better performance
    await user.type(input, 'This is long');
    
    // The sanitized value should be truncated
    expect(onSecureChange).toHaveBeenCalled();
    const lastCall = onSecureChange.mock.calls[onSecureChange.mock.calls.length - 1][0];
    expect(lastCall.length).toBeLessThanOrEqual(10);
  });

  it('should call onChange callback', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SecureInput onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(onChange).toHaveBeenCalled();
  });

  it('should call both onSecureChange and onChange', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    const onChange = vi.fn();
    
    render(<SecureInput onSecureChange={onSecureChange} onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(onSecureChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<SecureInput ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should accept additional props', () => {
    render(<SecureInput disabled={true} data-testid="secure-input" />);
    
    const input = screen.getByTestId('secure-input');
    expect(input).toBeDisabled();
  });
});

describe('SecureTextarea', () => {
  it('should render textarea element', () => {
    render(<SecureTextarea placeholder="Enter text" />);
    
    const textarea = screen.getByPlaceholderText('Enter text');
    expect(textarea).toBeInTheDocument();
  });

  it('should sanitize textarea value', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    
    render(<SecureTextarea onSecureChange={onSecureChange} />);
    
    const textarea = screen.getByRole('textbox');
    // Use shorter text for performance
    await user.type(textarea, '<script>test');
    
    expect(onSecureChange).toHaveBeenCalled();
    // Check that the last call doesn't include script tags
    const lastCall = onSecureChange.mock.calls[onSecureChange.mock.calls.length - 1][0];
    expect(lastCall).not.toContain('<script>');
  });

  it('should respect maxLength prop with default 2000', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    
    render(<SecureTextarea onSecureChange={onSecureChange} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const longText = 'A'.repeat(2500);
    
    // Use paste instead of type for performance (typing 2500 chars is too slow)
    await user.click(textarea);
    await user.paste(longText);
    
    // The sanitized value should be truncated to 2000
    expect(onSecureChange).toHaveBeenCalled();
    const lastCall = onSecureChange.mock.calls[onSecureChange.mock.calls.length - 1][0];
    expect(lastCall.length).toBeLessThanOrEqual(2000);
  });

  it('should call onChange callback', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SecureTextarea onChange={onChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test');
    
    expect(onChange).toHaveBeenCalled();
  });

  it('should call both onSecureChange and onChange', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    const onChange = vi.fn();
    
    render(<SecureTextarea onSecureChange={onSecureChange} onChange={onChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test');
    
    expect(onSecureChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<SecureTextarea ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should accept custom maxLength', async () => {
    const user = userEvent.setup();
    const onSecureChange = vi.fn();
    
    render(<SecureTextarea maxLength={100} onSecureChange={onSecureChange} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const longText = 'A'.repeat(150);
    
    // Use paste instead of type for performance
    await user.click(textarea);
    await user.paste(longText);
    
    // The sanitized value should be truncated to 100
    expect(onSecureChange).toHaveBeenCalled();
    const lastCall = onSecureChange.mock.calls[onSecureChange.mock.calls.length - 1][0];
    expect(lastCall.length).toBeLessThanOrEqual(100);
  });
});

