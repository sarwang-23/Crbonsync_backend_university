/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
