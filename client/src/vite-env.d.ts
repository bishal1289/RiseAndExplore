/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GIVEBUTTER_ACCOUNT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'heic2any' {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }): Promise<Blob | Blob[]>;
}
