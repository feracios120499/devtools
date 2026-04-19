import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostBinding, Inject, PLATFORM_ID, ChangeDetectorRef, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { PageTitleService } from '../../services/page-title.service';
import { PrimeNgModule } from '../../shared/modules/primeng.module';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { SeoService, MetaData } from '../../services/seo.service';
import { IconsModule } from '../../shared/modules/icons.module';

interface ColorInfo {
  hex: string;
  rgb: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-image-color-picker',
  standalone: true,
  imports: [
    FormsModule,
    PrimeNgModule,
    PageHeaderComponent,
    IconsModule
],
  providers: [MessageService],
  templateUrl: './image-color-picker.component.html',
  styleUrl: './image-color-picker.component.scss'
})
export class ImageColorPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'dt-page';
  
  @ViewChild('mainCanvas', { static: false }) mainCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('zoomCanvas', { static: false }) zoomCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  // Image and canvas properties
  uploadedImage: HTMLImageElement | null = null;
  isDragOver = false;
  isImageLoaded = false;
  
  // Color information
  selectedColor: ColorInfo | null = null;
  hoverColor: ColorInfo | null = null;
  
  // Canvas context
  private mainCtx: CanvasRenderingContext2D | null = null;
  private zoomCtx: CanvasRenderingContext2D | null = null;
  
  // Zoom properties
  private zoomLevel = 10;
  private zoomSize = 100;
  
  // Mouse tracking
  mouseX = 0;
  mouseY = 0;
  showZoom = false;

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
    this.pageTitleService.setTitle('Image Color Picker – Extract Color from Any Image');
    this.setupSeo();
  }

  ngAfterViewInit() {
    // Canvas elements will be initialized when image is loaded
    if (this.isBrowser) {
      console.log('AfterViewInit - checking canvas availability');
      console.log('mainCanvasRef:', this.mainCanvasRef);
      console.log('zoomCanvasRef:', this.zoomCanvasRef);
      console.log('fileInputRef:', this.fileInputRef);
      
      // Initialize zoom canvas since it's always in DOM now
      setTimeout(() => {
        this.initializeZoomCanvas();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.seoService.destroy();
  }

  /**
   * Initialize canvas elements after view init
   */
  private initializeCanvasElements() {
    if (!this.isBrowser) return;

    console.log('Initializing canvas elements');
    console.log('mainCanvasRef:', this.mainCanvasRef);
    console.log('zoomCanvasRef:', this.zoomCanvasRef);
    console.log('fileInputRef:', this.fileInputRef);

    // Check if canvas elements are available
    if (this.zoomCanvasRef && this.zoomCanvasRef.nativeElement) {
      const zoomCanvas = this.zoomCanvasRef.nativeElement;
      zoomCanvas.width = this.zoomSize;
      zoomCanvas.height = this.zoomSize;
      this.zoomCtx = zoomCanvas.getContext('2d');
      console.log('Zoom canvas initialized');
    }
  }

  /**
   * Setup SEO for the page
   */
  private setupSeo() {
    const metaData: MetaData = {
      OgTitle: 'Image Color Picker | DevTools',
      OgDescription: 'Free online image color picker tool. Extract colors from images with magnifying glass preview and get HEX and RGB values.',
      description: 'Free online image color picker. Upload images via drag and drop, click to pick colors with magnifying glass preview. Get precise HEX and RGB color values from any image. Perfect for designers and developers.',
      keywords: ['image color picker', 'color extractor', 'hex color picker', 'rgb color picker', 'color from image', 'eyedropper tool', 'color sampling', 'image color analysis'],
      jsonLd: {
        name: 'Image Color Picker',
        description: 'Online tool to extract colors from images with magnifying glass preview',
        url: 'https://onlinewebdevtools.com/image-color-picker'
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
        console.log('Image loaded, calling loadImageToCanvas');
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
      this.initializeMainCanvas();
    }, 50);
  }

  /**
   * Initialize main canvas with retry logic
   */
  private initializeMainCanvas(retryCount = 0) {
    if (!this.isBrowser || !this.uploadedImage) return;

    console.log(`Attempt ${retryCount + 1}: Checking main canvas availability`);
    console.log('mainCanvasRef:', this.mainCanvasRef);

    if (!this.mainCanvasRef || !this.mainCanvasRef.nativeElement) {
      if (retryCount < 10) {
        console.log('Main canvas not available, retrying in 100ms...');
        setTimeout(() => {
          this.initializeMainCanvas(retryCount + 1);
        }, 100);
        return;
      } else {
        console.error('Failed to get main canvas after 10 attempts');
        return;
      }
    }

    const canvas = this.mainCanvasRef.nativeElement;
    console.log('Canvas element found:', canvas);
    
    this.mainCtx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!this.mainCtx) {
      console.log('Could not get canvas context');
      return;
    }

    // Set canvas size to fit image while maintaining aspect ratio
    const maxWidth = 800;
    const maxHeight = 600;
    
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
    this.mainCtx.drawImage(this.uploadedImage, 0, 0, width, height);

    console.log('Image drawn to canvas, size:', width, 'x', height);
  }

  /**
   * Initialize zoom canvas
   */
  private initializeZoomCanvas(retryCount = 0) {
    if (!this.isBrowser) return;

    console.log(`Zoom canvas init attempt ${retryCount + 1}, zoomCanvasRef:`, this.zoomCanvasRef);

    if (this.zoomCanvasRef && this.zoomCanvasRef.nativeElement) {
      const zoomCanvas = this.zoomCanvasRef.nativeElement;
      zoomCanvas.width = this.zoomSize;
      zoomCanvas.height = this.zoomSize;
      this.zoomCtx = zoomCanvas.getContext('2d', { willReadFrequently: true });
      console.log('Zoom canvas initialized successfully');
    } else {
      if (retryCount < 5) {
        console.log('Zoom canvas not available yet, retrying in 100ms...');
        setTimeout(() => {
          this.initializeZoomCanvas(retryCount + 1);
        }, 100);
      } else {
        console.log('Zoom canvas not available after 5 attempts');
      }
    }
  }

  /**
   * Handle mouse move on canvas
   */
  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isBrowser || !this.isImageLoaded || !this.mainCtx || !this.mainCanvasRef) return;

    const canvas = this.mainCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    
    // Calculate scale factors between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert to canvas coordinates
    this.mouseX = clientX * scaleX;
    this.mouseY = clientY * scaleY;
    
    // Get color under cursor for hover color
    const x = Math.floor(this.mouseX);
    const y = Math.floor(this.mouseY);
    
    // Ensure coordinates are within canvas bounds
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const imageData = this.mainCtx.getImageData(x, y, 1, 1);
      const pixel = imageData.data;
      
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      
      const hex = this.rgbToHex(r, g, b);
      const rgb = `rgb(${r}, ${g}, ${b})`;
      
      this.hoverColor = { hex, rgb, x, y };
    }
    
    this.showZoom = true;
    this.updateZoomCanvas();
  }

  /**
   * Handle mouse leave canvas
   */
  onCanvasMouseLeave() {
    this.showZoom = false;
    this.hoverColor = null;
  }

  /**
   * Handle canvas click to pick color
   */
  onCanvasClick(event: MouseEvent) {
    if (!this.isBrowser || !this.isImageLoaded || !this.mainCtx || !this.mainCanvasRef) return;

    const canvas = this.mainCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    
    // Calculate scale factors between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert to canvas coordinates
    const x = Math.floor(clientX * scaleX);
    const y = Math.floor(clientY * scaleY);
    
    // Get pixel data
    const imageData = this.mainCtx.getImageData(x, y, 1, 1);
    const pixel = imageData.data;
    
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    const hex = this.rgbToHex(r, g, b);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    
    this.selectedColor = { hex, rgb, x, y };
  }

  /**
   * Update zoom canvas
   */
  private updateZoomCanvas() {
    if (!this.isBrowser || !this.zoomCtx || !this.mainCtx || !this.isImageLoaded || !this.mainCanvasRef) return;

    const canvas = this.mainCanvasRef.nativeElement;
    const zoomCanvas = this.zoomCanvasRef.nativeElement;
    
    // Clear zoom canvas
    this.zoomCtx.clearRect(0, 0, this.zoomSize, this.zoomSize);
    
    // Calculate source region in canvas coordinates
    const sourceSize = this.zoomSize / this.zoomLevel;
    const sourceX = Math.max(0, Math.min(this.mouseX - sourceSize / 2, canvas.width - sourceSize));
    const sourceY = Math.max(0, Math.min(this.mouseY - sourceSize / 2, canvas.height - sourceSize));
    
    // Ensure we don't go beyond canvas boundaries
    const actualSourceWidth = Math.min(sourceSize, canvas.width - sourceX);
    const actualSourceHeight = Math.min(sourceSize, canvas.height - sourceY);
    
    // Get image data from main canvas
    const imageData = this.mainCtx.getImageData(
      sourceX, 
      sourceY, 
      actualSourceWidth,
      actualSourceHeight
    );
    
    // Create temporary canvas for scaling
    const tempCanvas = this.document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw scaled image on zoom canvas
    this.zoomCtx.imageSmoothingEnabled = false;
    this.zoomCtx.drawImage(tempCanvas, 0, 0, this.zoomSize, this.zoomSize);
    
    // Draw crosshair
    this.zoomCtx.strokeStyle = '#ff0000';
    this.zoomCtx.lineWidth = 1;
    this.zoomCtx.beginPath();
    this.zoomCtx.moveTo(this.zoomSize / 2, 0);
    this.zoomCtx.lineTo(this.zoomSize / 2, this.zoomSize);
    this.zoomCtx.moveTo(0, this.zoomSize / 2);
    this.zoomCtx.lineTo(this.zoomSize, this.zoomSize / 2);
    this.zoomCtx.stroke();
  }

  /**
   * Convert RGB to HEX
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Copy color value to clipboard
   */
  copyColor(value: string, type: string) {
    if (!this.isBrowser) return;

    navigator.clipboard.writeText(value).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: `${type} color copied to clipboard`
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard'
      });
    });
  }

  /**
   * Navigate to color converter with selected color
   */
  useColorInConverter(hexColor: string) {
    console.log('useColorInConverter', hexColor);
    this.router.navigate(['/color-converter'], {
      state: { selectedColor: hexColor }
    });
  }
} 