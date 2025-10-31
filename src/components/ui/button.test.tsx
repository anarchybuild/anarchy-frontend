import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Button onClick={onClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply default variant styles', () => {
    render(<Button>Default</Button>);
    
    const button = screen.getByRole('button', { name: 'Default' });
    expect(button).toHaveClass('bg-primary');
  });

  it('should apply destructive variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive');
  });

  it('should apply outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toHaveClass('border');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button', { name: 'Secondary' });
    expect(button).toHaveClass('bg-secondary');
  });

  it('should apply ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button', { name: 'Ghost' });
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('should apply link variant styles', () => {
    render(<Button variant="link">Link</Button>);
    
    const button = screen.getByRole('button', { name: 'Link' });
    expect(button).toHaveClass('underline-offset-4');
  });

  it('should apply small size styles', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button', { name: 'Small' });
    expect(button).toHaveClass('h-9');
  });

  it('should apply large size styles', () => {
    render(<Button size="lg">Large</Button>);
    
    const button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('h-11');
  });

  it('should apply icon size styles', () => {
    render(<Button size="icon">🔍</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('should not trigger onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    await user.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should accept additional HTML attributes', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Test</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });

  it('should have proper focus styles', () => {
    render(<Button>Focus me</Button>);
    
    const button = screen.getByRole('button', { name: 'Focus me' });
    expect(button).toHaveClass('focus-visible:outline-none');
  });

  it('should combine multiple variants', () => {
    render(<Button variant="outline" size="lg">Combined</Button>);
    
    const button = screen.getByRole('button', { name: 'Combined' });
    expect(button).toHaveClass('border', 'h-11');
  });
});

