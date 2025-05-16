import { Injectable } from '@angular/core';

export interface FileTypeInfo {
  extension: string;
  description: string;
  priority: number; // чем выше, тем приоритетнее (для выбора по умолчанию)
}

export interface FileSignatureResult {
  detectedTypes: FileTypeInfo[];
  defaultType: FileTypeInfo | null;
}

@Injectable({
  providedIn: 'root'
})
export class FileTypeService {

  /**
   * Определяет возможные типы файлов по сигнатуре в base64
   * @param base64 Строка base64 для анализа
   * @returns Объект с обнаруженными типами файлов и типом по умолчанию
   */
  getFileTypes(base64: string): FileSignatureResult {
    const hex = this.base64ToHex(base64).toUpperCase();
    const result: FileSignatureResult = {
      detectedTypes: [],
      defaultType: null
    };
    console.log('hex', hex);
    // Сопоставление сигнатур с возможными типами файлов
    // Для каждой сигнатуры - массив объектов с расширением, описанием и приоритетом
    const signatures: { [key: string]: FileTypeInfo[] } = {
      // === Images ===
      'FFD8FF': [
        { extension: 'jpg', description: 'JPEG Image', priority: 100 },
        { extension: 'jpeg', description: 'JPEG Image', priority: 90 }
      ],
      '89504E47': [
        { extension: 'png', description: 'PNG Image', priority: 100 }
      ],
      '47494638': [
        { extension: 'gif', description: 'GIF Image', priority: 100 }
      ],
      '424D': [
        { extension: 'bmp', description: 'Bitmap Image', priority: 100 }
      ],
      '49492A00': [
        { extension: 'tif', description: 'TIFF Image (Intel)', priority: 100 },
        { extension: 'tiff', description: 'TIFF Image (Intel)', priority: 90 }
      ],
      '4D4D002A': [
        { extension: 'tif', description: 'TIFF Image (Motorola)', priority: 100 },
        { extension: 'tiff', description: 'TIFF Image (Motorola)', priority: 90 }
      ],
      '52494646': [
        { extension: 'webp', description: 'WebP Image', priority: 80 },
        { extension: 'wav', description: 'WAV Audio', priority: 70 },
        { extension: 'avi', description: 'AVI Video', priority: 60 }
      ],
      
      // === Documents ===
      '25504446': [
        { extension: 'pdf', description: 'PDF Document', priority: 100 }
      ],
      'D0CF11E0A1B11AE1': [
        { extension: 'doc', description: 'Microsoft Word Document', priority: 100 },
        { extension: 'xls', description: 'Microsoft Excel Spreadsheet', priority: 90 },
        { extension: 'ppt', description: 'Microsoft PowerPoint Presentation', priority: 80 },
        { extension: 'msg', description: 'Microsoft Outlook Message', priority: 70 }
      ],
      '504B0304': [
        { extension: 'zip', description: 'ZIP Archive', priority: 100 },
        { extension: 'docx', description: 'Microsoft Word Document (OOXML)', priority: 95 },
        { extension: 'xlsx', description: 'Microsoft Excel Spreadsheet (OOXML)', priority: 90 },
        { extension: 'pptx', description: 'Microsoft PowerPoint Presentation (OOXML)', priority: 85 },
        { extension: 'jar', description: 'Java Archive', priority: 80 },
        { extension: 'apk', description: 'Android Package', priority: 75 },
        { extension: 'odt', description: 'OpenDocument Text', priority: 70 }
      ],
      '7B5C727466': [
        { extension: 'rtf', description: 'Rich Text Format', priority: 100 }
      ],
      '3C3F786D6C': [
        { extension: 'xml', description: 'XML Document', priority: 100 },
        { extension: 'svg', description: 'SVG Image', priority: 90 },
        { extension: 'xhtml', description: 'XHTML Document', priority: 80 }
      ],
      '68746D6C3E': [
        { extension: 'html', description: 'HTML Document', priority: 100 },
        { extension: 'htm', description: 'HTML Document', priority: 90 }
      ],
      'EFBBBF': [
        { extension: 'txt', description: 'Text File (UTF-8 with BOM)', priority: 100 }
      ],
      'FFFE': [
        { extension: 'txt', description: 'Text File (UTF-16 LE)', priority: 100 }
      ],
      'FEFF': [
        { extension: 'txt', description: 'Text File (UTF-16 BE)', priority: 100 }
      ],

      // === Archives ===
      '52617221': [
        { extension: 'rar', description: 'RAR Archive', priority: 100 }
      ],
      '1F8B08': [
        { extension: 'gz', description: 'GZIP Archive', priority: 100 },
        { extension: 'tgz', description: 'Tar GZip Archive', priority: 90 }
      ],
      '425A68': [
        { extension: 'bz2', description: 'BZip2 Archive', priority: 100 }
      ],
      '377ABCAF271C': [
        { extension: '7z', description: '7-Zip Archive', priority: 100 }
      ],

      // === Audio ===
      '494433': [
        { extension: 'mp3', description: 'MP3 Audio', priority: 100 }
      ],
      'FFF1': [
        { extension: 'aac', description: 'AAC Audio (ADTS)', priority: 100 }
      ],
      'FFF8': [
        { extension: 'aac', description: 'AAC Audio (ADTS)', priority: 100 }
      ],
      '4F676753': [
        { extension: 'ogg', description: 'OGG Audio/Video', priority: 100 },
        { extension: 'ogv', description: 'OGG Video', priority: 90 },
        { extension: 'oga', description: 'OGG Audio', priority: 80 }
      ],
      '664C6143': [
        { extension: 'flac', description: 'FLAC Audio', priority: 100 }
      ],
      '2E736E64': [
        { extension: 'au', description: 'AU Audio', priority: 100 }
      ],
      '4D546864': [
        { extension: 'mid', description: 'MIDI Audio', priority: 100 },
        { extension: 'midi', description: 'MIDI Audio', priority: 90 }
      ],

      // === Video ===
      '000001BA': [
        { extension: 'mpg', description: 'MPEG Video (Program Stream)', priority: 100 },
        { extension: 'mpeg', description: 'MPEG Video', priority: 90 }
      ],
      '000001B3': [
        { extension: 'mpg', description: 'MPEG Video', priority: 100 },
        { extension: 'mpeg', description: 'MPEG Video', priority: 90 }
      ],
      '1A45DFA3': [
        { extension: 'mkv', description: 'Matroska Video', priority: 100 },
        { extension: 'webm', description: 'WebM Video', priority: 90 }
      ],
      '00000018': [
        { extension: 'mp4', description: 'MP4 Video', priority: 100 }
      ],
      '00000020': [
        { extension: 'mp4', description: 'MP4 Video', priority: 100 }
      ],
      '66747970': [
        { extension: 'mp4', description: 'MP4 Video', priority: 100 },
        { extension: 'm4v', description: 'M4V Video', priority: 90 },
        { extension: 'm4a', description: 'M4A Audio', priority: 80 },
        { extension: 'mov', description: 'QuickTime Video', priority: 70 }
      ],
      '3026B2758E66CF11': [
        { extension: 'wmv', description: 'Windows Media Video', priority: 100 },
        { extension: 'asf', description: 'Advanced Systems Format', priority: 90 }
      ],

      // === Fonts ===
      '00010000': [
        { extension: 'ttf', description: 'TrueType Font', priority: 100 }
      ],
      '4F54544F': [
        { extension: 'otf', description: 'OpenType Font', priority: 100 }
      ],
      '774F4646': [
        { extension: 'woff', description: 'Web Open Font Format', priority: 100 }
      ],
      '774F4632': [
        { extension: 'woff2', description: 'Web Open Font Format 2', priority: 100 }
      ],

      // === Others ===
      'CAFEBABE': [
        { extension: 'class', description: 'Java Class File', priority: 100 }
      ],
      '7F454C46': [
        { extension: 'elf', description: 'Linux Executable', priority: 100 }
      ],
      '3C21344E414D453E': [
        { extension: 'xml', description: 'XML Document', priority: 100 }
      ],
      '4D5A': [
        { extension: 'exe', description: 'Windows Executable', priority: 100 },
        { extension: 'dll', description: 'Windows Dynamic Link Library', priority: 90 }
      ],
      '255044462': [
        { extension: 'pdf', description: 'PDF Document', priority: 100 }
      ],
      '1F8B': [
        { extension: 'gz', description: 'GZip Archive', priority: 100 }
      ],
      '526172211A': [
        { extension: 'rar', description: 'RAR Archive (v5+)', priority: 100 }
      ],
      'CAFED00D': [
        { extension: 'java', description: 'Java Serialized Object', priority: 100 }
      ],
      '5F27A889': [
        { extension: 'jar', description: 'JAR Archive', priority: 100 }
      ],
      '504B0506': [
        { extension: 'zip', description: 'ZIP Archive (Empty)', priority: 100 }
      ],
      '504B0708': [
        { extension: 'zip', description: 'ZIP Archive (Spanning)', priority: 100 }
      ],
      '0000001C667479703367': [
        { extension: '3gp', description: '3GPP Multimedia', priority: 100 }
      ],
      '0000001C667479704D5034': [
        { extension: 'mp4', description: 'MP4 Video', priority: 100 }
      ],
      '53514C69746520666F726D6174203300': [
        { extension: 'sqlite', description: 'SQLite Database', priority: 100 }
      ],
      '3C737667': [
        { extension: 'svg', description: 'SVG Image', priority: 100 }
      ],
      '1A45DFA3A3428880': [
        { extension: 'webm', description: 'WebM Video', priority: 100 }
      ],
      '4250472FB': [
        { extension: 'bpg', description: 'Better Portable Graphics', priority: 100 }
      ],
      '00000100': [
        { extension: 'ico', description: 'Icon File', priority: 100 }
      ]
    };

    // Match longest first
    const sortedSigs = Object.keys(signatures).sort((a, b) => b.length - a.length);
    for (const signature of sortedSigs) {
      if (hex.startsWith(signature)) {
        const types = signatures[signature];
        result.detectedTypes = [...types]; // Копируем массив типов
        
        // Находим тип с наивысшим приоритетом
        if (types.length > 0) {
          result.defaultType = types.reduce((prev, current) => 
            (current.priority > prev.priority) ? current : prev, types[0]);
        }
        
        break; // Нашли первое совпадение, выходим из цикла
      }
    }

    return result;
  }

  /**
   * Упрощенный метод для получения только расширения файла по умолчанию
   * @param base64 Строка base64 для анализа
   * @returns Расширение файла или null, если не удалось определить
   */
  getFileExtension(base64: string): string | null {
    const result = this.getFileTypes(base64);
    return result.defaultType?.extension || null;
  }

  private base64ToHex(base64: string): string {
    try {
      // Удаляем префикс data:*/*;base64, если он есть
      let cleanBase64 = base64;
      if (base64.includes('base64,')) {
        cleanBase64 = base64.split('base64,')[1];
      }
      
      const raw = atob(cleanBase64.slice(0, 100)); // Берём больше байтов для более точного определения
      let result = '';
      for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16).padStart(2, '0');
        result += hex;
      }
      return result;
    } catch (e) {
      // В случае ошибки декодирования возвращаем пустую строку
      console.error('Error decoding base64:', e);
      return '';
    }
  }
}
