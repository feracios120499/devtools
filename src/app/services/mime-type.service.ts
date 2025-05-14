import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MimeTypeService {
  
  /**
   * Получает MIME-тип по расширению файла
   * @param extension Расширение файла (без точки)
   * @returns MIME-тип или application/octet-stream по умолчанию
   */
  getMimeTypeByExtension(extension: string | null): string {
    if (!extension) {
      return 'application/octet-stream';
    }
    
    // Убираем точку в начале, если она есть
    const ext = extension.startsWith('.') ? extension.substring(1) : extension;
    
    // Карта соответствия расширений MIME-типам
    const mimeTypes: { [key: string]: string } = {
      // Изображения
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'tif': 'image/tiff',
      'tiff': 'image/tiff',
      'ico': 'image/x-icon',
      
      // Аудио
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      
      // Видео
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mpeg': 'video/mpeg',
      'mpg': 'video/mpeg',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'wmv': 'video/x-ms-wmv',
      
      // Документы
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv',
      'rtf': 'application/rtf',
      
      // Текстовые форматы
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'xml': 'application/xml',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'md': 'text/markdown',
      
      // Архивы
      'zip': 'application/zip',
      'rar': 'application/vnd.rar',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      '7z': 'application/x-7z-compressed',
      
      // Шрифты
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      
      // Другие распространенные форматы
      'bin': 'application/octet-stream',
      'exe': 'application/octet-stream',
      'apk': 'application/vnd.android.package-archive',
      'iso': 'application/x-iso9660-image',
      'swf': 'application/x-shockwave-flash'
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}
