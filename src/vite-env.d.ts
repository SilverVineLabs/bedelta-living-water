/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASSCODE_DISABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
