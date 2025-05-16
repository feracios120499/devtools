import { Injectable } from '@angular/core';

export interface MimeTypeInfo {
  mimeType: string;
  description: string;
  priority: number; // чем выше, тем приоритетнее (для выбора по умолчанию)
}

@Injectable({
  providedIn: 'root'
})
export class MimeTypeService {
  // Карта соответствия расширений MIME-типам
  private mimeTypeMap: { [key: string]: MimeTypeInfo[] } = {
    // Изображения
    'jpg': [
      { mimeType: 'image/jpeg', description: 'JPEG Image', priority: 100 }
    ],
    'jpeg': [
      { mimeType: 'image/jpeg', description: 'JPEG Image', priority: 100 }
    ],
    'png': [
      { mimeType: 'image/png', description: 'PNG Image', priority: 100 }
    ],
    'gif': [
      { mimeType: 'image/gif', description: 'GIF Image', priority: 100 }
    ],
    'bmp': [
      { mimeType: 'image/bmp', description: 'Bitmap Image', priority: 100 }
    ],
    'webp': [
      { mimeType: 'image/webp', description: 'WebP Image', priority: 100 }
    ],
    'svg': [
      { mimeType: 'image/svg+xml', description: 'SVG Image', priority: 100 }
    ],
    'tif': [
      { mimeType: 'image/tiff', description: 'TIFF Image', priority: 100 }
    ],
    'tiff': [
      { mimeType: 'image/tiff', description: 'TIFF Image', priority: 100 }
    ],
    'ico': [
      { mimeType: 'image/x-icon', description: 'Icon Image', priority: 100 },
      { mimeType: 'image/vnd.microsoft.icon', description: 'Microsoft Icon', priority: 90 }
    ],
    'heic': [
      { mimeType: 'image/heic', description: 'HEIC Image', priority: 100 }
    ],
    'heif': [
      { mimeType: 'image/heif', description: 'HEIF Image', priority: 100 }
    ],
    
    // Аудио
    'mp3': [
      { mimeType: 'audio/mpeg', description: 'MP3 Audio', priority: 100 }
    ],
    'wav': [
      { mimeType: 'audio/wav', description: 'WAV Audio', priority: 100 },
      { mimeType: 'audio/x-wav', description: 'WAV Audio (Alternative)', priority: 90 }
    ],
    'ogg': [
      { mimeType: 'audio/ogg', description: 'OGG Audio', priority: 100 },
      { mimeType: 'application/ogg', description: 'OGG Container', priority: 90 }
    ],
    'oga': [
      { mimeType: 'audio/ogg', description: 'OGG Audio', priority: 100 }
    ],
    'flac': [
      { mimeType: 'audio/flac', description: 'FLAC Audio', priority: 100 },
      { mimeType: 'audio/x-flac', description: 'FLAC Audio (Alternative)', priority: 90 }
    ],
    'aac': [
      { mimeType: 'audio/aac', description: 'AAC Audio', priority: 100 }
    ],
    'm4a': [
      { mimeType: 'audio/mp4', description: 'MP4 Audio', priority: 100 },
      { mimeType: 'audio/x-m4a', description: 'Apple Audio', priority: 90 }
    ],
    'opus': [
      { mimeType: 'audio/opus', description: 'Opus Audio', priority: 100 }
    ],
    'weba': [
      { mimeType: 'audio/webm', description: 'WebM Audio', priority: 100 }
    ],
    'mid': [
      { mimeType: 'audio/midi', description: 'MIDI Audio', priority: 100 }
    ],
    'midi': [
      { mimeType: 'audio/midi', description: 'MIDI Audio', priority: 100 }
    ],
    
    // Видео
    'mp4': [
      { mimeType: 'video/mp4', description: 'MP4 Video', priority: 100 }
    ],
    'webm': [
      { mimeType: 'video/webm', description: 'WebM Video', priority: 100 }
    ],
    'ogv': [
      { mimeType: 'video/ogg', description: 'OGG Video', priority: 100 }
    ],
    'avi': [
      { mimeType: 'video/x-msvideo', description: 'AVI Video', priority: 100 },
      { mimeType: 'video/avi', description: 'AVI Video (Alternative)', priority: 90 }
    ],
    'mpeg': [
      { mimeType: 'video/mpeg', description: 'MPEG Video', priority: 100 }
    ],
    'mpg': [
      { mimeType: 'video/mpeg', description: 'MPEG Video', priority: 100 }
    ],
    'mov': [
      { mimeType: 'video/quicktime', description: 'QuickTime Video', priority: 100 }
    ],
    'mkv': [
      { mimeType: 'video/x-matroska', description: 'Matroska Video', priority: 100 }
    ],
    'wmv': [
      { mimeType: 'video/x-ms-wmv', description: 'Windows Media Video', priority: 100 }
    ],
    'm4v': [
      { mimeType: 'video/mp4', description: 'MP4 Video', priority: 100 },
      { mimeType: 'video/x-m4v', description: 'Apple Video', priority: 90 }
    ],
    '3gp': [
      { mimeType: 'video/3gpp', description: '3GPP Video', priority: 100 },
      { mimeType: 'audio/3gpp', description: '3GPP Audio', priority: 90 }
    ],
    '3g2': [
      { mimeType: 'video/3gpp2', description: '3GPP2 Video', priority: 100 },
      { mimeType: 'audio/3gpp2', description: '3GPP2 Audio', priority: 90 }
    ],
    'ts': [
      { mimeType: 'video/mp2t', description: 'MPEG Transport Stream', priority: 100 }
    ],
    
    // Документы
    'pdf': [
      { mimeType: 'application/pdf', description: 'PDF Document', priority: 100 }
    ],
    'doc': [
      { mimeType: 'application/msword', description: 'Microsoft Word Document', priority: 100 }
    ],
    'docx': [
      { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word Document (OOXML)', priority: 100 }
    ],
    'xls': [
      { mimeType: 'application/vnd.ms-excel', description: 'Microsoft Excel Spreadsheet', priority: 100 }
    ],
    'xlsx': [
      { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Microsoft Excel Spreadsheet (OOXML)', priority: 100 }
    ],
    'ppt': [
      { mimeType: 'application/vnd.ms-powerpoint', description: 'Microsoft PowerPoint Presentation', priority: 100 }
    ],
    'pptx': [
      { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'Microsoft PowerPoint Presentation (OOXML)', priority: 100 }
    ],
    'csv': [
      { mimeType: 'text/csv', description: 'CSV File', priority: 100 }
    ],
    'rtf': [
      { mimeType: 'application/rtf', description: 'Rich Text Format', priority: 100 },
      { mimeType: 'text/rtf', description: 'Rich Text Format (Alternative)', priority: 90 }
    ],
    'odt': [
      { mimeType: 'application/vnd.oasis.opendocument.text', description: 'OpenDocument Text', priority: 100 }
    ],
    'ods': [
      { mimeType: 'application/vnd.oasis.opendocument.spreadsheet', description: 'OpenDocument Spreadsheet', priority: 100 }
    ],
    'odp': [
      { mimeType: 'application/vnd.oasis.opendocument.presentation', description: 'OpenDocument Presentation', priority: 100 }
    ],
    
    // Текстовые форматы
    'txt': [
      { mimeType: 'text/plain', description: 'Plain Text', priority: 100 }
    ],
    'html': [
      { mimeType: 'text/html', description: 'HTML Document', priority: 100 }
    ],
    'htm': [
      { mimeType: 'text/html', description: 'HTML Document', priority: 100 }
    ],
    'xml': [
      { mimeType: 'application/xml', description: 'XML Document', priority: 100 },
      { mimeType: 'text/xml', description: 'XML Document (Text)', priority: 90 }
    ],
    'css': [
      { mimeType: 'text/css', description: 'CSS Stylesheet', priority: 100 }
    ],
    'js': [
      { mimeType: 'application/javascript', description: 'JavaScript', priority: 100 },
      { mimeType: 'text/javascript', description: 'JavaScript (Text)', priority: 90 }
    ],
    'json': [
      { mimeType: 'application/json', description: 'JSON Data', priority: 100 }
    ],
    'md': [
      { mimeType: 'text/markdown', description: 'Markdown', priority: 100 },
      { mimeType: 'text/x-markdown', description: 'Markdown (Alternative)', priority: 90 }
    ],
    
    // Архивы
    'zip': [
      { mimeType: 'application/zip', description: 'ZIP Archive', priority: 100 }
    ],
    'rar': [
      { mimeType: 'application/vnd.rar', description: 'RAR Archive', priority: 100 },
      { mimeType: 'application/x-rar-compressed', description: 'RAR Archive (Alternative)', priority: 90 }
    ],
    'tar': [
      { mimeType: 'application/x-tar', description: 'TAR Archive', priority: 100 }
    ],
    'gz': [
      { mimeType: 'application/gzip', description: 'GZIP Archive', priority: 100 }
    ],
    'tgz': [
      { mimeType: 'application/gzip', description: 'TAR GZIP Archive', priority: 100 }
    ],
    '7z': [
      { mimeType: 'application/x-7z-compressed', description: '7-Zip Archive', priority: 100 }
    ],
    'bz2': [
      { mimeType: 'application/x-bzip2', description: 'BZip2 Archive', priority: 100 }
    ],
    
    // Шрифты
    'ttf': [
      { mimeType: 'font/ttf', description: 'TrueType Font', priority: 100 },
      { mimeType: 'application/x-font-ttf', description: 'TrueType Font (Alternative)', priority: 90 }
    ],
    'otf': [
      { mimeType: 'font/otf', description: 'OpenType Font', priority: 100 },
      { mimeType: 'application/x-font-otf', description: 'OpenType Font (Alternative)', priority: 90 }
    ],
    'woff': [
      { mimeType: 'font/woff', description: 'Web Open Font Format', priority: 100 }
    ],
    'woff2': [
      { mimeType: 'font/woff2', description: 'Web Open Font Format 2', priority: 100 }
    ],
    'eot': [
      { mimeType: 'application/vnd.ms-fontobject', description: 'Embedded OpenType Font', priority: 100 }
    ],
    
    // Другие распространенные форматы
    'bin': [
      { mimeType: 'application/octet-stream', description: 'Binary File', priority: 100 }
    ],
    'exe': [
      { mimeType: 'application/x-msdownload', description: 'Windows Executable', priority: 100 },
      { mimeType: 'application/octet-stream', description: 'Binary Executable', priority: 90 }
    ],
    'dll': [
      { mimeType: 'application/x-msdownload', description: 'Windows Dynamic Link Library', priority: 100 },
      { mimeType: 'application/octet-stream', description: 'Binary Library', priority: 90 }
    ],
    'apk': [
      { mimeType: 'application/vnd.android.package-archive', description: 'Android Package', priority: 100 }
    ],
    'iso': [
      { mimeType: 'application/x-iso9660-image', description: 'ISO Disk Image', priority: 100 }
    ],
    'swf': [
      { mimeType: 'application/x-shockwave-flash', description: 'Flash', priority: 100 }
    ],
    'jar': [
      { mimeType: 'application/java-archive', description: 'Java Archive', priority: 100 }
    ],
    'class': [
      { mimeType: 'application/java-vm', description: 'Java Class', priority: 100 }
    ],
    'sqlite': [
      { mimeType: 'application/x-sqlite3', description: 'SQLite Database', priority: 100 }
    ],
    'db': [
      { mimeType: 'application/octet-stream', description: 'Database File', priority: 100 }
    ]
  };
  
  /**
   * Получает все возможные MIME-типы для указанного расширения
   * @param extension Расширение файла (с точкой или без)
   * @returns Массив объектов с информацией о MIME-типах
   */
  getMimeTypesForExtension(extension: string | null | undefined): MimeTypeInfo[] {
    if (!extension) {
      return [{ mimeType: 'application/octet-stream', description: 'Binary File', priority: 100 }];
    }
    
    // Убираем точку в начале, если она есть
    const ext = extension.startsWith('.') ? extension.substring(1) : extension;
    
    // Получаем информацию о MIME-типах для расширения
    const mimeTypes = this.mimeTypeMap[ext.toLowerCase()];
    
    return mimeTypes || [{ mimeType: 'application/octet-stream', description: 'Binary File', priority: 100 }];
  }
  
  /**
   * Получает MIME-тип по умолчанию для указанного расширения
   * @param extension Расширение файла (с точкой или без)
   * @returns MIME-тип с наивысшим приоритетом или application/octet-stream
   */
  getMimeTypeByExtension(extension: string | null | undefined): string {
    const mimeTypes = this.getMimeTypesForExtension(extension);
    
    if (mimeTypes.length === 0) {
      return 'application/octet-stream';
    }
    
    // Находим MIME-тип с наивысшим приоритетом
    const defaultMimeType = mimeTypes.reduce((prev, current) => 
      (current.priority > prev.priority) ? current : prev, mimeTypes[0]);
    
    return defaultMimeType.mimeType;
  }
  
  /**
   * Получает описание MIME-типа по умолчанию для указанного расширения
   * @param extension Расширение файла (с точкой или без)
   * @returns Описание MIME-типа с наивысшим приоритетом
   */
  getDescriptionForExtension(extension: string | null): string {
    const mimeTypes = this.getMimeTypesForExtension(extension);
    
    if (mimeTypes.length === 0) {
      return 'Binary File';
    }
    
    // Находим MIME-тип с наивысшим приоритетом
    const defaultMimeType = mimeTypes.reduce((prev, current) => 
      (current.priority > prev.priority) ? current : prev, mimeTypes[0]);
    
    return defaultMimeType.description;
  }
}
