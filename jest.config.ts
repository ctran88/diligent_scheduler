import type { Config } from '@jest/types';
const config: Config.InitialOptions = {
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: 'test/coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/main.ts',
    'jest.config.ts',
    'dist/',
    'test/coverage',
    'src/migrations',
    'src/seeders',
    'src/common/telemetry/telemetry-sdk.ts',
    'src/config/logger.config.ts',
    'src/config/swagger.config.ts',
  ],
  coverageReporters: ['json', 'lcov', 'html', 'text'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  modulePaths: ['<rootDir>/'],
  roots: ['<rootDir>/test', '<rootDir>/src', '<rootDir>/'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  testTimeout: 30000,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default config;
