import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileTypeService {

  getFileExtension(base64: string): string | null {
    const hex = this.base64ToHex(base64).toUpperCase();

    const signatures: { [key: string]: string } = {
      // === Images ===
      'FFD8FF': 'jpg',
      '89504E47': 'png',
      '47494638': 'gif',
      '424D': 'bmp',
      '49492A00': 'tif',
      '4D4D002A': 'tif',
      '52494646': 'webp', // May match RIFF container, check more if needed
      
      // === Documents ===
      '25504446': 'pdf',
      'D0CF11E0A1B11AE1': 'doc', // old .doc, .xls, .ppt
      '504B0304': 'docx', // or xlsx, pptx, jar, zip-based
      '7B5C727466': 'rtf',
      '3C3F786D6C': 'xml',
      '68746D6C3E': 'html',
      'EFBBBF': 'txt', // UTF-8 with BOM
      'FFFE': 'txt', // UTF-16 LE
      'FEFF': 'txt', // UTF-16 BE

      // === Archives ===
    //   '504B0304': 'zip',
      '52617221': 'rar',
      '1F8B08': 'gz',
      '425A68': 'bz2',
      '377ABCAF271C': '7z',

      // === Audio ===
      '494433': 'mp3',
      'FFF1': 'aac',
      'FFF8': 'aac',
      '4F676753': 'ogg',
      '664C6143': 'flac',
    //   '52494646': 'wav', // Also used by webp/avi, needs deeper check
      '2E736E64': 'au',
      '4D546864': 'mid',

      // === Video ===
      '000001BA': 'mpg',
      '000001B3': 'mpg',
      '1A45DFA3': 'mkv',
      '00000018': 'mp4',
      '00000020': 'mp4',
      '66747970': 'mp4',
    //   '52494646': 'avi', // Also RIFF format
      '3026B2758E66CF11': 'wmv',

      // === Fonts ===
      '00010000': 'ttf',
      '4F54544F': 'otf',
      '774F4646': 'woff',
      '774F4632': 'woff2',

      // === Others ===
      'CAFEBABE': 'class', // Java class
      '7F454C46': 'elf',   // Linux executable
      '3C21344E414D453E': 'xml',
    };

    // Match longest first
    const sortedSigs = Object.keys(signatures).sort((a, b) => b.length - a.length);
    for (const signature of sortedSigs) {
      if (hex.startsWith(signature)) {
        return signatures[signature];
      }
    }

    return null;
  }

  private base64ToHex(base64: string): string {
    const raw = atob(base64.slice(0, 50)); // Берём побольше байтов
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const hex = raw.charCodeAt(i).toString(16).padStart(2, '0');
      result += hex;
    }
    return result;
  }
}
