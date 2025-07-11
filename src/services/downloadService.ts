import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { domainUrl } from './api';
import sessionManager from './sessionManager';

export interface DownloadOptions {
  id: string;
  type: 'invoice' | 'receipt' | 'proforma';
  invoiceNo: string;
}

class DownloadService {
  private getApiEndpoint(type: 'invoice' | 'receipt' | 'proforma'): string {
    switch (type) {
      case 'invoice':
        return 'selfcareGenerateInvoicePDF';
      case 'receipt':
        return 'selfcareGenerateReceiptPDF';
      case 'proforma':
        return 'selfcareGenerateInvoicePDF'; // Proforma uses same endpoint as invoice
      default:
        return 'selfcareGenerateInvoicePDF';
    }
  }

  private getFileName(type: 'invoice' | 'receipt' | 'proforma', invoiceNo: string): string {
    switch (type) {
      case 'invoice':
        return `Invoice_no_${invoiceNo}.pdf`;
      case 'receipt':
        return `Receipt_no_${invoiceNo}.pdf`;
      case 'proforma':
        return `Proforma_Invoice_no_${invoiceNo}.pdf`;
      default:
        return `Document_${invoiceNo}.pdf`;
    }
  }

  async downloadPdf(options: DownloadOptions): Promise<void> {
    const { id, type, invoiceNo } = options;
    
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        throw new Error('No user session found');
      }

      const apiEndpoint = this.getApiEndpoint(type);
      const fileName = this.getFileName(type, invoiceNo);
      
      // Build the complete URL
      const completeUrl = `https://${domainUrl}/l2s/api/${apiEndpoint}?id=${id.toString()}&username=${session.username}&request_app=user_app&request_source=app`;
      
      // console.log('=== DOWNLOAD SERVICE ===');
      // console.log('Type:', type);
      // console.log('API Endpoint:', apiEndpoint);
      // console.log('File Name:', fileName);
      // console.log('Complete URL:', completeUrl);
      // console.log('========================');

      if (Platform.OS === 'android') {
        await this.downloadForAndroid(completeUrl, fileName, session.token);
      } else {
        await this.downloadForIOS(completeUrl, fileName, session.token);
      }
    } catch (error: any) {
      // console.error('Download error:', error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  }

  private async downloadForAndroid(url: string, fileName: string, token: string): Promise<void> {
    try {
      const androidVersion = parseInt(Platform.Version.toString(), 10);
      
      // Request storage permission for Android < 33
      if (androidVersion < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Storage permission denied');
        }
      }

      const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
      
      // Check if file already exists and delete it
      if (await RNFetchBlob.fs.exists(downloadPath)) {
        await RNFetchBlob.fs.unlink(downloadPath);
      }

      const response = await RNFetchBlob.config({
        fileCache: true,
        path: downloadPath,
        addAndroidDownloads: {
          useDownloadManager: false,
          notification: true,
          title: fileName,
          description: 'Downloading document...',
          mime: 'application/pdf',
          mediaScannable: true,
          path: downloadPath,
        }
      }).fetch('GET', url, {
        'Cache-Control': 'no-store',
        'Accept': 'application/pdf',
        'Content-Type': 'multipart/form-data',
        'Authentication': token
      });

      if (response.info().status === 200) {
        const path = response.path();
        await RNFetchBlob.fs.scanFile([{ path: typeof path === 'string' ? path : path.toString(), mime: 'application/pdf' }]);
        Alert.alert('Success', `File saved to Downloads folder: ${fileName}`);
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      throw new Error(`Android download failed: ${error.message}`);
    }
  }

  private async downloadForIOS(url: string, fileName: string, token: string): Promise<void> {
    try {
      const destPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${fileName}`;
      
      // Check if file exists and delete it
      if (await RNFetchBlob.fs.exists(destPath)) {
        await RNFetchBlob.fs.unlink(destPath);
      }

      const response = await RNFetchBlob.config({
        fileCache: true,
        path: destPath,
      }).fetch('GET', url, {
        'Cache-Control': 'no-store',
        'Accept': 'application/pdf',
        'Content-Type': 'multipart/form-data',
        'Authentication': token
      });

      if (response.info().status === 200) {
        Alert.alert(
          'Success',
          'File downloaded successfully',
          [
            {
              text: 'View',
              onPress: () => {
                const path = response.path();
                RNFetchBlob.ios.previewDocument(typeof path === 'string' ? path : path.toString());
              },
            },
            { text: 'OK' }
          ]
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      throw new Error(`iOS download failed: ${error.message}`);
    }
  }
}

export const downloadService = new DownloadService(); 