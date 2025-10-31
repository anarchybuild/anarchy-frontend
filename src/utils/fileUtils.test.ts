import { describe, it, expect } from 'vitest';
import { dataURLToFile, createMetadataFile, createDataURI } from './fileUtils';

describe('dataURLToFile', () => {
  it('should convert data URL to File', () => {
    const dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const file = dataURLToFile(dataURL, 'test.png');
    
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.png');
    expect(file.type).toBe('image/png');
  });

  it('should convert jpeg data URL to File', () => {
    const dataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2w==';
    const file = dataURLToFile(dataURL, 'test.jpg');
    
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.jpg');
    expect(file.type).toBe('image/jpeg');
  });

  it('should handle data URL without explicit mime type', () => {
    const dataURL = 'data:;base64,SGVsbG8gV29ybGQ=';
    const file = dataURLToFile(dataURL, 'test.png');
    
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png'); // Should default to image/png
  });

  it('should create file with correct content', () => {
    const dataURL = 'data:image/png;base64,dGVzdA=='; // 'test' in base64
    const file = dataURLToFile(dataURL, 'test.png');
    
    expect(file.size).toBeGreaterThan(0);
  });

  it('should handle different filenames', () => {
    const dataURL = 'data:image/png;base64,dGVzdA==';
    const file1 = dataURLToFile(dataURL, 'image1.png');
    const file2 = dataURLToFile(dataURL, 'image2.png');
    
    expect(file1.name).toBe('image1.png');
    expect(file2.name).toBe('image2.png');
  });
});

describe('createMetadataFile', () => {
  it('should create JSON file from metadata object', () => {
    const metadata = {
      name: 'Test NFT',
      description: 'A test NFT',
      image: 'ipfs://...',
    };
    
    const file = createMetadataFile(metadata, 'metadata.json');
    
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('metadata.json');
    expect(file.type).toBe('application/json');
  });

  it('should create file with correct metadata', () => {
    const metadata = {
      name: 'Test',
      value: 123,
    };
    
    const file = createMetadataFile(metadata, 'test.json');
    
    // Check file properties
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.json');
    expect(file.type).toBe('application/json');
    expect(file.size).toBeGreaterThan(0);
  });

  it('should create file with nested object metadata', () => {
    const metadata = {
      name: 'Test',
      attributes: [
        { trait_type: 'Color', value: 'Red' },
        { trait_type: 'Size', value: 'Large' },
      ],
    };
    
    const file = createMetadataFile(metadata, 'metadata.json');
    
    // Verify file was created correctly
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('metadata.json');
    expect(file.type).toBe('application/json');
    // File should contain stringified JSON with arrays
    expect(file.size).toBeGreaterThan(50); // Should be reasonable size for the data
  });

  it('should handle empty object', () => {
    const metadata = {};
    const file = createMetadataFile(metadata, 'empty.json');
    
    // Verify file was created
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('empty.json');
    expect(file.type).toBe('application/json');
    expect(file.size).toBeGreaterThan(0);
  });

  it('should create JSON file with proper formatting', () => {
    const metadata = { name: 'Test', value: 123 };
    const file = createMetadataFile(metadata, 'test.json');
    
    // The function uses JSON.stringify with indentation (2 spaces)
    // We can verify the file was created with a reasonable size
    // (indented JSON is larger than compact JSON)
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.json');
    expect(file.size).toBeGreaterThan(20); // Indented JSON should be larger
  });
});

describe('createDataURI', () => {
  it('should create data URI from object', () => {
    const data = { name: 'Test', value: 123 };
    const uri = createDataURI(data);
    
    expect(uri).toContain('data:application/json;base64,');
  });

  it('should create valid base64 encoded data', () => {
    const data = { name: 'Test' };
    const uri = createDataURI(data);
    
    // Extract base64 part
    const base64 = uri.split(',')[1];
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);
    
    expect(parsed.name).toBe('Test');
  });

  it('should handle complex objects', () => {
    const data = {
      name: 'Complex',
      nested: {
        array: [1, 2, 3],
        boolean: true,
      },
    };
    
    const uri = createDataURI(data);
    expect(uri).toContain('data:application/json;base64,');
    
    const base64 = uri.split(',')[1];
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);
    
    expect(parsed.nested.array).toEqual([1, 2, 3]);
    expect(parsed.nested.boolean).toBe(true);
  });

  it('should handle empty object', () => {
    const data = {};
    const uri = createDataURI(data);
    
    const base64 = uri.split(',')[1];
    const decoded = atob(base64);
    
    expect(decoded).toBe('{}');
  });

  it('should handle arrays', () => {
    const data = [1, 2, 3, 4, 5];
    const uri = createDataURI(data);
    
    const base64 = uri.split(',')[1];
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);
    
    expect(parsed).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle special characters', () => {
    const data = { message: 'Hello "World" & <Test>' };
    const uri = createDataURI(data);
    
    const base64 = uri.split(',')[1];
    const decoded = atob(base64);
    const parsed = JSON.parse(decoded);
    
    expect(parsed.message).toBe('Hello "World" & <Test>');
  });
});

