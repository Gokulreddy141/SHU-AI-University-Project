// Jest type definitions for tests
// This file provides type definitions when @types/jest is not installed

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
declare function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
declare function expect<T>(actual: T): {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toContain(expected: unknown): void;
  toMatch(expected: string | RegExp): void;
  toThrow(expected?: string | RegExp | Error): void;
  toBeInstanceOf(expected: unknown): void;
  toHaveProperty(property: string, value?: unknown): void;
  toHaveLength(expected: number): void;
};

declare namespace jest {
  function fn<T extends (...args: unknown[]) => unknown>(implementation?: T): T;
  function mock(moduleName: string): unknown;
  function spyOn<T extends Record<string, unknown>, M extends keyof T>(
    object: T,
    method: M
  ): T[M];
}
