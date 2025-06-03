import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostBinding, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

interface ResizeSettings {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  originalWidth: number;
  originalHeight: number;
}

@Component({
  selector: 'app-image-resize',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule 
  ],
  providers: [MessageService],
  templateUrl: './image-resize.component.html',
  styleUrl: './image-resize.component.scss'
})
export class ImageResizeComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  
  @ViewChild('originalCanvas', { static: false }) originalCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resizedCanvas', { static: false }) resizedCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  // Image and canvas properties
  uploadedImage: HTMLImageElement | null = null;
  isDragOver = false;
  isImageLoaded = false;
  
  // Resize settings
  resizeSettings: ResizeSettings = {
    width: 0,
    height: 0,
    lockAspectRatio: true,
    originalWidth: 0,
    originalHeight: 0
  };
  
  // Canvas context
  private originalCtx: CanvasRenderingContext2D | null = null;
  private resizedCtx: CanvasRenderingContext2D | null = null;
  
  // Current rotation angle
  rotationAngle = 0;

  // Browser check
  isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private pageTitleService: PageTitleService,
    private messageService: MessageService,
    private seoService: SeoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.pageTitleService.setTitle('Image Resize – Resize Images with Custom Dimensions');
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
  }

  /**
   * Setup SEO for the page
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Image Resize | DevTools',
      OgDescription: 'Free online image resize tool. Resize images with custom width and height, maintain aspect ratio, rotate, download and copy resized images.',
      description: 'Free online image resize tool. Upload images via drag and drop, resize with custom dimensions, maintain aspect ratio option. Rotate, download and copy resized images. Perfect for web optimization and image processing.',
      keywords: ['image resize', 'image resizer', 'resize image online', 'image dimensions', 'image scaling', 'image width height', 'aspect ratio', 'image rotate'],
      jsonLd: {
        name: 'Image Resize',
        description: 'Online tool to resize images with custom dimensions and aspect ratio control',
        url: 'https://onlinewebdevtools.com/image-resize'
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

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select an image file'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        this.setupResizeSettings();
        this.loadImageToCanvas();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Setup initial resize settings
   */
  private setupResizeSettings() {
    if (!this.uploadedImage) return;
    
    this.resizeSettings = {
      width: this.uploadedImage.width,
      height: this.uploadedImage.height,
      lockAspectRatio: true,
      originalWidth: this.uploadedImage.width,
      originalHeight: this.uploadedImage.height
    };
    
    this.rotationAngle = 0;
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
        !this.resizedCanvasRef || !this.resizedCanvasRef.nativeElement) {
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
    this.initializeResizedCanvas();
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
    // Increased to better utilize 600px canvas-wrapper height
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
   * Initialize and update resized canvas
   */
  private initializeResizedCanvas() {
    this.updateResizedCanvas();
  }

  /**
   * Update resized canvas with current settings
   */
  private updateResizedCanvas() {
    if (!this.resizedCanvasRef || !this.uploadedImage || !this.isBrowser) return;

    const canvas = this.resizedCanvasRef.nativeElement;
    this.resizedCtx = canvas.getContext('2d');
    
    if (!this.resizedCtx) return;

    // Clear canvas
    this.resizedCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate display size (constrained for UI)
    // Increased to better utilize 600px canvas-wrapper height
    const maxDisplayWidth = 500;
    const maxDisplayHeight = 500;
    
    let displayWidth = this.resizeSettings.width;
    let displayHeight = this.resizeSettings.height;
    
    // For 90° and 270° rotations, we need to consider rotated dimensions for display scaling
    let scalingWidth = displayWidth;
    let scalingHeight = displayHeight;
    
    if (this.rotationAngle === 90 || this.rotationAngle === 270) {
      // For rotated images, swap dimensions for scaling calculation
      scalingWidth = displayHeight;
      scalingHeight = displayWidth;
    }
    
    if (scalingWidth > maxDisplayWidth) {
      scalingHeight = (scalingHeight * maxDisplayWidth) / scalingWidth;
      scalingWidth = maxDisplayWidth;
    }
    
    if (scalingHeight > maxDisplayHeight) {
      scalingWidth = (scalingWidth * maxDisplayHeight) / scalingHeight;
      scalingHeight = maxDisplayHeight;
    }

    // Set canvas size based on rotation
    if (this.rotationAngle === 90 || this.rotationAngle === 270) {
      canvas.width = scalingHeight;  // Swapped for rotation
      canvas.height = scalingWidth;  // Swapped for rotation
    } else {
      canvas.width = scalingWidth;
      canvas.height = scalingHeight;
    }

    // Save context for rotation
    this.resizedCtx.save();
    
    // Apply rotation if needed
    if (this.rotationAngle !== 0) {
      this.resizedCtx.translate(canvas.width / 2, canvas.height / 2);
      this.resizedCtx.rotate((this.rotationAngle * Math.PI) / 180);
      this.resizedCtx.translate(-scalingWidth / 2, -scalingHeight / 2);
    } else {
      this.resizedCtx.translate(0, 0);
    }

    // Draw resized image with correct dimensions
    this.resizedCtx.drawImage(this.uploadedImage, 0, 0, scalingWidth, scalingHeight);
    
    // Restore context
    this.resizedCtx.restore();
  }

  /**
   * Handle width change
   */
  onWidthChange() {
    if (this.resizeSettings.lockAspectRatio && this.resizeSettings.originalWidth > 0) {
      const ratio = this.resizeSettings.originalHeight / this.resizeSettings.originalWidth;
      this.resizeSettings.height = Math.round(this.resizeSettings.width * ratio);
    }
    this.updateResizedCanvas();
  }

  /**
   * Handle height change
   */
  onHeightChange() {
    if (this.resizeSettings.lockAspectRatio && this.resizeSettings.originalHeight > 0) {
      const ratio = this.resizeSettings.originalWidth / this.resizeSettings.originalHeight;
      this.resizeSettings.width = Math.round(this.resizeSettings.height * ratio);
    }
    this.updateResizedCanvas();
  }

  /**
   * Handle aspect ratio lock toggle
   */
  onAspectRatioToggle() {
    if (this.resizeSettings.lockAspectRatio) {
      // If locking aspect ratio, adjust height to match width
      this.onWidthChange();
    }
  }

  /**
   * Rotate image
   */
  rotateImage() {
    const previousAngle = this.rotationAngle;
    this.rotationAngle = (this.rotationAngle + 90) % 360;
    
    // Swap width and height for 90° and 270° rotations
    if (this.rotationAngle === 90 || this.rotationAngle === 270) {
      // If rotating from 0° or 180° to 90° or 270°, swap dimensions
      if (previousAngle === 0 || previousAngle === 180) {
        const tempWidth = this.resizeSettings.width;
        this.resizeSettings.width = this.resizeSettings.height;
        this.resizeSettings.height = tempWidth;
      }
    } else {
      // If rotating from 90° or 270° to 0° or 180°, swap dimensions back
      if (previousAngle === 90 || previousAngle === 270) {
        const tempWidth = this.resizeSettings.width;
        this.resizeSettings.width = this.resizeSettings.height;
        this.resizeSettings.height = tempWidth;
      }
    }
    
    this.updateResizedCanvas();
  }

  /**
   * Download resized image
   */
  downloadImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    // Create a new canvas with exact resize dimensions
    const canvas = this.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size based on rotation
    if (this.rotationAngle === 90 || this.rotationAngle === 270) {
      canvas.width = this.resizeSettings.height;
      canvas.height = this.resizeSettings.width;
    } else {
      canvas.width = this.resizeSettings.width;
      canvas.height = this.resizeSettings.height;
    }

    // Save context for rotation
    ctx.save();
    
    // Apply rotation if needed
    if (this.rotationAngle !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((this.rotationAngle * Math.PI) / 180);
      ctx.translate(-this.resizeSettings.width / 2, -this.resizeSettings.height / 2);
    }

    // Draw resized image
    ctx.drawImage(this.uploadedImage, 0, 0, this.resizeSettings.width, this.resizeSettings.height);
    
    // Restore context
    ctx.restore();

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = this.document.createElement('a');
        a.href = url;
        a.download = `resized-image-${this.resizeSettings.width}x${this.resizeSettings.height}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Download Started',
          detail: 'Resized image download has started'
        });
      }
    }, 'image/png');
  }

  /**
   * Copy resized image to clipboard
   */
  async copyImage() {
    if (!this.uploadedImage || !this.isBrowser) return;

    try {
      // Create a new canvas with exact resize dimensions
      const canvas = this.document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size based on rotation
      if (this.rotationAngle === 90 || this.rotationAngle === 270) {
        canvas.width = this.resizeSettings.height;
        canvas.height = this.resizeSettings.width;
      } else {
        canvas.width = this.resizeSettings.width;
        canvas.height = this.resizeSettings.height;
      }

      // Save context for rotation
      ctx.save();
      
      // Apply rotation if needed
      if (this.rotationAngle !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((this.rotationAngle * Math.PI) / 180);
        ctx.translate(-this.resizeSettings.width / 2, -this.resizeSettings.height / 2);
      }

      // Draw resized image
      ctx.drawImage(this.uploadedImage, 0, 0, this.resizeSettings.width, this.resizeSettings.height);
      
      // Restore context
      ctx.restore();

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            
            this.messageService.add({
              severity: 'success',
              summary: 'Copied',
              detail: 'Resized image copied to clipboard'
            });
          } catch (error) {
            console.error('Failed to copy image:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Copy Failed',
              detail: 'Failed to copy image to clipboard'
            });
          }
        }
      }, 'image/png');
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