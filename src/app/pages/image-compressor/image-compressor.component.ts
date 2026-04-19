import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostBinding, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

interface CompressionSettings {
  quality: number;
  originalSize: number;
  compressedSize: number;
  format: string;
}

@Component({
  selector: 'app-image-compressor',
  standalone: true,
  imports: [
    FormsModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule
],
  providers: [MessageService],
  templateUrl: './image-compressor.component.html',
  styleUrl: './image-compressor.component.scss'
})
export class ImageCompressorComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  
  @ViewChild('originalCanvas', { static: false }) originalCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('compressedCanvas', { static: false }) compressedCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  // Image and canvas properties
  uploadedImage: HTMLImageElement | null = null;
  isDragOver = false;
  isImageLoaded = false;
  
  // Compression settings
  compressionSettings: CompressionSettings = {
    quality: 50,
    originalSize: 0,
    compressedSize: 0,
    format: 'image/jpeg'
  };
  
  // Canvas context
  private originalCtx: CanvasRenderingContext2D | null = null;
  private compressedCtx: CanvasRenderingContext2D | null = null;
  
  // File handling
  private originalFile: File | null = null;

  // Browser check
  isBrowser: boolean;

  // Subject for debounce
  private qualityChangeSubject = new Subject<void>();

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
    
    // Setup debounced quality change
    this.qualityChangeSubject
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.updateCompressedCanvas();
        this.calculateCompressedSize();
      });
  }

  ngOnInit() {
    this.pageTitleService.setTitle('Image Compressor – Compress Images with Quality Control');
    this.setupSeo();
  }

  ngAfterViewInit() {
    // Canvas elements will be initialized when image is loaded
    if (this.isBrowser) {
      console.log('AfterViewInit - checking canvas availability');
    }
  }

  ngOnDestroy() {
    // Cleanup
    this.qualityChangeSubject.complete();
  }

  /**
   * Setup SEO for the page
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Image Compressor | DevTools',
      OgDescription: 'Free online image compression tool. Reduce image file sizes with quality control slider. Support for JPEG and WebP formats with real-time preview.',
      description: 'Free online image compressor. Upload images via drag and drop, adjust compression quality from 1-10, reduce file sizes while maintaining visual quality. Support for JPEG and WebP formats.',
      keywords: ['image compress', 'image compression', 'reduce image size', 'image optimizer', 'jpeg compression', 'webp compression', 'image quality'],
      jsonLd: {
        name: 'Image Compressor',
        description: 'Online tool to compress images with quality control for optimal file size reduction',
        url: 'https://onlinewebdevtools.com/image-compressor'
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

    // Only allow JPEG and WebP formats for compression
    if (file.type !== 'image/jpeg' && file.type !== 'image/webp') {
      this.messageService.add({
        severity: 'error',
        summary: 'Unsupported Format',
        detail: 'Please select a JPEG or WebP image file for compression'
      });
      return;
    }

    this.originalFile = file;
    this.compressionSettings.originalSize = file.size;
    this.compressionSettings.format = file.type;

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
        !this.compressedCanvasRef || !this.compressedCanvasRef.nativeElement) {
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
    this.initializeCompressedCanvas();
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
   * Initialize and update compressed canvas
   */
  private initializeCompressedCanvas() {
    this.updateCompressedCanvas();
    // Calculate initial compressed size with small delay to ensure DOM is ready
    setTimeout(() => {
      this.calculateCompressedSize();
    }, 100);
  }

  /**
   * Update compressed canvas with current settings
   */
  private updateCompressedCanvas() {
    if (!this.compressedCanvasRef || !this.uploadedImage || !this.isBrowser) return;

    const canvas = this.compressedCanvasRef.nativeElement;
    this.compressedCtx = canvas.getContext('2d');
    
    if (!this.compressedCtx) return;

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

    // For quality 100%, show original image
    if (this.compressionSettings.quality === 100) {
      this.compressedCtx.drawImage(this.uploadedImage, 0, 0, width, height);
      return;
    }

    // Create temporary canvas with original dimensions for compression
    const tempCanvas = this.document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    tempCanvas.width = this.uploadedImage.width;
    tempCanvas.height = this.uploadedImage.height;
    tempCtx.drawImage(this.uploadedImage, 0, 0);

    const quality = this.compressionSettings.quality / 100;

    // Use toDataURL instead of toBlob to avoid CSP issues
    try {
      const compressedDataURL = tempCanvas.toDataURL(this.compressionSettings.format, quality);
      const img = new Image();
      img.onload = () => {
        // Draw compressed image to preview canvas
        this.compressedCtx!.drawImage(img, 0, 0, width, height);
      };
      img.src = compressedDataURL;
    } catch (error) {
      console.error('Failed to compress image for preview:', error);
      // Fallback to original image if compression fails
      this.compressedCtx.drawImage(this.uploadedImage, 0, 0, width, height);
    }
  }

  /**
   * Calculate compressed file size
   */
  private calculateCompressedSize() {
    if (!this.uploadedImage || !this.isBrowser) return;

    // For quality 100%, show original file size (no additional compression)
    if (this.compressionSettings.quality === 100) {
      this.compressionSettings.compressedSize = this.compressionSettings.originalSize;
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

    const quality = this.compressionSettings.quality / 100; // Convert 1-100 to 0.01-1.00

    canvas.toBlob((blob) => {
      if (blob) {
        // Run in Angular zone to trigger change detection
        this.ngZone.run(() => {
          // Don't allow compressed size to be larger than original
          this.compressionSettings.compressedSize = Math.min(blob.size, this.compressionSettings.originalSize);
          this.cdr.detectChanges();
        });
      }
    }, this.compressionSettings.format, quality);
  }

  /**
   * Handle quality change
   */
  onQualityChange() {
    this.qualityChangeSubject.next();
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
   * Get compression ratio
   */
  getCompressionRatio(): number {
    if (this.compressionSettings.originalSize === 0) return 0;
    return Math.round((1 - this.compressionSettings.compressedSize / this.compressionSettings.originalSize) * 100);
  }

  /**
   * Download compressed image
   */
  downloadImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    // For quality 100%, try to download original file if available
    if (this.compressionSettings.quality === 100 && this.originalFile) {
      const url = URL.createObjectURL(this.originalFile);
      const a = this.document.createElement('a');
      a.href = url;
      const extension = this.compressionSettings.format === 'image/jpeg' ? 'jpg' : 'webp';
      a.download = `compressed-image-q${this.compressionSettings.quality}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Download Started',
        detail: 'Original quality image download has started'
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

    const quality = this.compressionSettings.quality / 100; // Convert 1-100 to 0.01-1.00
    const format = this.compressionSettings.format;
    const extension = format === 'image/jpeg' ? 'jpg' : 'webp';

    // Download compressed version
    canvas.toBlob((blob) => {
      if (blob) {
        this.ngZone.run(() => {
          const url = URL.createObjectURL(blob);
          const a = this.document.createElement('a');
          a.href = url;
          a.download = `compressed-image-q${this.compressionSettings.quality}.${extension}`;
          a.click();
          URL.revokeObjectURL(url);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Download Started',
            detail: 'Compressed image download has started'
          });
        });
      }
    }, format, quality);
  }

  /**
   * Copy compressed image to clipboard
   */
  async copyImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    try {
      // For quality 100%, try to copy original file if available
      if (this.compressionSettings.quality === 100 && this.originalFile) {
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [this.compressionSettings.format]: this.originalFile })
            ]);
            
            this.messageService.add({
              severity: 'success',
              summary: 'Copied',
              detail: 'Original quality image copied to clipboard'
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

      const quality = this.compressionSettings.quality / 100; // Convert 1-100 to 0.01-1.00
      const format = this.compressionSettings.format;

      // Convert to blob with compression
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
                detail: 'Compressed image copied to clipboard'
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
      }, format, quality);
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