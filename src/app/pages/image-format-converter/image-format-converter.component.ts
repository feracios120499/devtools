import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostBinding, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

interface ConversionSettings {
  targetFormat: string;
  originalFormat: string;
  originalSize: number;
  convertedSize: number;
}

@Component({
  selector: 'app-image-format-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule 
  ],
  providers: [MessageService],
  templateUrl: './image-format-converter.component.html',
  styleUrl: './image-format-converter.component.scss'
})
export class ImageFormatConverterComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  
  @ViewChild('originalCanvas', { static: false }) originalCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('convertedCanvas', { static: false }) convertedCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  // Image and canvas properties
  uploadedImage: HTMLImageElement | null = null;
  isDragOver = false;
  isImageLoaded = false;
  
  // Conversion settings
  conversionSettings: ConversionSettings = {
    targetFormat: 'image/png',
    originalFormat: '',
    originalSize: 0,
    convertedSize: 0
  };
  
  // Available formats
  availableFormats = [
    { label: 'JPG', value: 'image/jpeg', extension: 'jpg' },
    { label: 'PNG', value: 'image/png', extension: 'png' },
    { label: 'WebP', value: 'image/webp', extension: 'webp' },
    { label: 'BMP', value: 'image/bmp', extension: 'bmp' },
    { label: 'GIF', value: 'image/gif', extension: 'gif' }
  ];
  
  // Canvas context
  private originalCtx: CanvasRenderingContext2D | null = null;
  private convertedCtx: CanvasRenderingContext2D | null = null;
  
  // File handling
  private originalFile: File | null = null;

  // Browser check
  isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private pageTitleService: PageTitleService,
    private messageService: MessageService,
    private seoService: SeoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.pageTitleService.setTitle('Image Format Converter – Convert Images Between Formats');
    this.setupSeo();
  }

  ngAfterViewInit() {
    // Canvas elements will be initialized when image is loaded
    if (this.isBrowser) {
      console.log('AfterViewInit - checking canvas availability');
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Setup SEO for the page
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Image Format Converter | DevTools',
      OgDescription: 'Free online image format converter. Convert images between JPG, PNG, WebP, BMP, and GIF formats with drag and drop interface.',
      description: 'Free online image format converter. Upload images via drag and drop, convert between JPG, PNG, WebP, BMP, and GIF formats. Fast and secure image conversion tool.',
      keywords: ['image convert', 'image format converter', 'jpg to png', 'png to webp', 'webp converter', 'image format change', 'bmp converter', 'gif converter'],
      jsonLd: {
        name: 'Image Format Converter',
        description: 'Online tool to convert images between different formats including JPG, PNG, WebP, BMP, and GIF',
        url: 'https://onlinewebdevtools.com/image-format-converter'
      }
    };
    
    this.seoService.setupSeo(metaData);
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Handle drop event
   */
  onDrop(event: DragEvent) {
    if (!this.isBrowser) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event) {
    if (!this.isBrowser) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Open file dialog
   */
  openFileDialog() {
    if (!this.isBrowser || !this.fileInputRef) return;
    this.fileInputRef.nativeElement.click();
  }

  /**
   * Process uploaded file
   */
  private handleFile(file: File) {
    if (!this.isBrowser) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select an image file'
      });
      return;
    }

    this.originalFile = file;
    this.conversionSettings.originalSize = file.size;
    this.conversionSettings.originalFormat = file.type;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        this.loadImageToCanvas();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Load image to canvas
   */
  private loadImageToCanvas() {
    if (!this.isBrowser) {
      console.log('Not in browser, skipping canvas load');
      return;
    }

    if (!this.uploadedImage) {
      console.log('No uploaded image');
      return;
    }

    // First trigger change detection to ensure DOM is updated
    this.isImageLoaded = true;
    this.cdr.detectChanges();

    // Wait for DOM to update, then check canvas availability
    setTimeout(() => {
      this.initializeCanvases();
    }, 50);
  }

  /**
   * Initialize both canvases with retry logic
   */
  private initializeCanvases(retryCount = 0) {
    if (!this.isBrowser || !this.uploadedImage) return;

    console.log(`Attempt ${retryCount + 1}: Checking canvas availability`);

    if (!this.originalCanvasRef || !this.originalCanvasRef.nativeElement ||
        !this.convertedCanvasRef || !this.convertedCanvasRef.nativeElement) {
      if (retryCount < 10) {
        console.log('Canvases not available, retrying in 100ms...');
        setTimeout(() => {
          this.initializeCanvases(retryCount + 1);
        }, 100);
        return;
      } else {
        console.error('Failed to get canvases after 10 attempts');
        return;
      }
    }

    this.initializeOriginalCanvas();
    this.initializeConvertedCanvas();
  }

  /**
   * Initialize original canvas
   */
  private initializeOriginalCanvas() {
    if (!this.originalCanvasRef || !this.uploadedImage) return;

    const canvas = this.originalCanvasRef.nativeElement;
    this.originalCtx = canvas.getContext('2d');
    
    if (!this.originalCtx) return;

    // Set canvas size to fit image while maintaining aspect ratio
    const maxWidth = 500;
    const maxHeight = 500;
    
    let { width, height } = this.uploadedImage;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image
    this.originalCtx.drawImage(this.uploadedImage, 0, 0, width, height);
  }

  /**
   * Initialize and update converted canvas
   */
  private initializeConvertedCanvas() {
    this.updateConvertedCanvas();
    // Calculate initial converted size
    setTimeout(() => {
      this.calculateConvertedSize();
    }, 100);
  }

  /**
   * Update converted canvas with current settings
   */
  private updateConvertedCanvas() {
    if (!this.convertedCanvasRef || !this.uploadedImage || !this.isBrowser) return;

    const canvas = this.convertedCanvasRef.nativeElement;
    this.convertedCtx = canvas.getContext('2d');
    
    if (!this.convertedCtx) return;

    // Set canvas size same as original for preview
    const maxWidth = 500;
    const maxHeight = 500;
    
    let { width, height } = this.uploadedImage;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw converted image (same visual as original for preview)
    this.convertedCtx.drawImage(this.uploadedImage, 0, 0, width, height);
  }

  /**
   * Calculate converted file size
   */
  private calculateConvertedSize() {
    if (!this.uploadedImage || !this.isBrowser) return;

    // If target format is the same as original, show original file size
    if (this.conversionSettings.targetFormat === this.conversionSettings.originalFormat) {
      this.conversionSettings.convertedSize = this.conversionSettings.originalSize;
      this.cdr.detectChanges();
      return;
    }

    // Create a canvas with original image dimensions to calculate actual file size
    const canvas = this.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = this.uploadedImage.width;
    canvas.height = this.uploadedImage.height;

    // Draw original image
    ctx.drawImage(this.uploadedImage, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        this.ngZone.run(() => {
          this.conversionSettings.convertedSize = blob.size;
          this.cdr.detectChanges();
        });
      }
    }, this.conversionSettings.targetFormat, 1.0);
  }

  /**
   * Handle format change
   */
  onFormatChange() {
    this.updateConvertedCanvas();
    this.calculateConvertedSize();
  }

  /**
   * Get format label by value
   */
  getFormatLabel(format: string): string {
    const found = this.availableFormats.find(f => f.value === format);
    return found ? found.label : format;
  }

  /**
   * Get format extension by value
   */
  getFormatExtension(format: string): string {
    const found = this.availableFormats.find(f => f.value === format);
    return found ? found.extension : 'img';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Download converted image
   */
  downloadImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    // If target format is the same as original, download original file
    if (this.conversionSettings.targetFormat === this.conversionSettings.originalFormat && this.originalFile) {
      const url = URL.createObjectURL(this.originalFile);
      const a = this.document.createElement('a');
      a.href = url;
      const extension = this.getFormatExtension(this.conversionSettings.targetFormat);
      a.download = `image.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Download Started',
        detail: `${this.getFormatLabel(this.conversionSettings.targetFormat)} image download has started`
      });
      return;
    }

    // Create a new canvas with original image dimensions
    const canvas = this.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = this.uploadedImage.width;
    canvas.height = this.uploadedImage.height;

    // Draw original image
    ctx.drawImage(this.uploadedImage, 0, 0);

    const format = this.conversionSettings.targetFormat;
    const extension = this.getFormatExtension(format);

    // Download converted version
    canvas.toBlob((blob) => {
      if (blob) {
        this.ngZone.run(() => {
          const url = URL.createObjectURL(blob);
          const a = this.document.createElement('a');
          a.href = url;
          a.download = `converted-image.${extension}`;
          a.click();
          URL.revokeObjectURL(url);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Download Started',
            detail: `Converted ${this.getFormatLabel(format)} image download has started`
          });
        });
      }
    }, format, 1.0);
  }

  /**
   * Copy converted image to clipboard
   */
  async copyImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    try {
      // If target format is the same as original, copy original file
      if (this.conversionSettings.targetFormat === this.conversionSettings.originalFormat && this.originalFile) {
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [this.conversionSettings.targetFormat]: this.originalFile })
            ]);
            
            this.messageService.add({
              severity: 'success',
              summary: 'Copied',
              detail: `${this.getFormatLabel(this.conversionSettings.targetFormat)} image copied to clipboard`
            });
            return;
          } catch (error) {
            console.error('Failed to copy original file, falling back to canvas:', error);
          }
        }
      }

      // Create a new canvas with original image dimensions
      const canvas = this.document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = this.uploadedImage.width;
      canvas.height = this.uploadedImage.height;

      // Draw original image
      ctx.drawImage(this.uploadedImage, 0, 0);

      const format = this.conversionSettings.targetFormat;

      // Convert to blob with new format
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard) {
          this.ngZone.run(async () => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ [format]: blob })
              ]);
              
              this.messageService.add({
                severity: 'success',
                summary: 'Copied',
                detail: `Converted ${this.getFormatLabel(format)} image copied to clipboard`
              });
            } catch (error) {
              console.error('Failed to copy image:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Copy Failed',
                detail: 'Failed to copy image to clipboard'
              });
            }
          });
        }
      }, format, 1.0);
    } catch (error) {
      console.error('Failed to copy image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Copy Failed',
        detail: 'Failed to copy image to clipboard'
      });
    }
  }
} 