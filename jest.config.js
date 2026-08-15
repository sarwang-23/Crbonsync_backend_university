/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: { ignoreCodes: [151002, 2322] }
    }]
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
