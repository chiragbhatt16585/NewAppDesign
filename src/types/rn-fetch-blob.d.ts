declare module 'rn-fetch-blob' {
  import { ReactNativeBlobUtilConfig } from 'react-native-blob-util';

  interface RNFetchBlobConfig {
    fileCache?: boolean;
    path?: string;
    addAndroidDownloads?: {
      useDownloadManager?: boolean;
      notification?: boolean;
      title?: string;
      description?: string;
      mime?: string;
      mediaScannable?: boolean;
      path?: string;
    };
  }

  interface RNFetchBlobResponse {
    info(): { status: number };
    path(): string | number;
  }

  interface RNFetchBlobFs {
    dirs: {
      DownloadDir: string;
      DocumentDir: string;
    };
    exists(path: string): Promise<boolean>;
    unlink(path: string): Promise<void>;
    scanFile(files: Array<{ path: string; mime: string }>): Promise<void>;
  }

  interface RNFetchBlobIos {
    previewDocument(path: string): void;
  }

  interface RNFetchBlobStatic {
    config(config: RNFetchBlobConfig): {
      fetch(method: string, url: string, headers?: Record<string, string>): Promise<RNFetchBlobResponse>;
    };
    fs: RNFetchBlobFs;
    ios: RNFetchBlobIos;
  }

  const RNFetchBlob: RNFetchBlobStatic;
  export default RNFetchBlob;
} 