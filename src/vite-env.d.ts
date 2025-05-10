
/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// This prevents TypeScript from trying to generate declaration files
declare module "*.tsx" {
  const content: React.ComponentType<any>;
  export default content;
}

declare module "*.ts" {
  const content: any;
  export default content;
}
