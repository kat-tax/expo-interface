// Let Node `require()` Expo's TypeScript-entry packages from CommonJS builds.
import './node-typescript-requires';
// The web implementations are real DOM, so tests use @testing-library/react
// and the jest-dom matchers (`toBeDisabled`, `toHaveAttribute`, ...).
import '@testing-library/jest-dom/vitest';
