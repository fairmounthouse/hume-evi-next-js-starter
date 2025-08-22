/**
 * ExhibitManager - Manages the exhibit display system for Zoom-like screen share experience
 * Transforms the interview interface layout when viewing case exhibits
 * 
 * Best Practices Implemented:
 * - TypeScript strict typing
 * - Proper event cleanup
 * - Accessibility support
 * - Error handling
 * - Performance optimization
 */

export interface ExhibitData {
  id: string;
  exhibit_name: string;
  display_name: string;
  description?: string;
  image_url: string;
  case_id: string;
  unlocked_at?: Date;
  auto_displayed?: boolean;
}

export interface ExhibitManagerConfig {
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
  enableKeyboardShortcuts?: boolean;
  enableTouchNavigation?: boolean;
  animationDuration?: number;
}

export class ExhibitManager {
  private isActive: boolean = false;
  private currentExhibit: ExhibitData | null = null;
  private currentZoom: number = 1;
  private exhibits: ExhibitData[] = [];
  private isTranscriptCollapsed: boolean = false;
  private onStateChange?: (state: ExhibitManagerState) => void;
  private panX: number = 0;
  private panY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private config: ExhibitManagerConfig;
  private eventListeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = [];
  private rafId: number | null = null;
  private debounceTimeout: number | null = null;

  constructor(onStateChange?: (state: ExhibitManagerState) => void, config?: ExhibitManagerConfig) {
    this.onStateChange = onStateChange;
    this.config = {
      maxZoom: 3,
      minZoom: 0.5,
      zoomStep: 1.2,
      enableKeyboardShortcuts: true,
      enableTouchNavigation: true,
      animationDuration: 300,
      ...config
    };
  }

  /**
   * Initialize the exhibit system with proper event management
   */
  init() {
    try {
      // Clean up any stale transcript toggle buttons from previous sessions
      const staleToggleButtons = document.querySelectorAll('.transcript-toggle');
      staleToggleButtons.forEach(btn => btn.remove());
      console.log('🧹 Cleaned up', staleToggleButtons.length, 'stale transcript toggle buttons');
      // Add event listeners to exhibit triggers with proper cleanup tracking
      // Only handle triggers that don't have React onClick handlers
      document.querySelectorAll('[data-exhibit-trigger]:not([data-react-handled])').forEach(trigger => {
        const handler = (e: Event) => {
          const exhibitId = (e.currentTarget as HTMLElement)?.getAttribute('data-exhibit-id');
          if (exhibitId) {
            console.log('🎯 ExhibitManager handling trigger for:', exhibitId);
            this.openExhibit(exhibitId);
          }
        };
        
        trigger.addEventListener('click', handler);
        this.eventListeners.push({ element: trigger, event: 'click', handler });
      });

      // Add keyboard shortcuts with proper cleanup
      if (this.config.enableKeyboardShortcuts) {
        const keyHandler = (e: KeyboardEvent) => {
          if (!this.isActive) return;
          
          switch (e.key) {
            case 'Escape':
              e.preventDefault();
              this.closeExhibit();
              break;
            case '+':
            case '=':
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.zoomIn();
              }
              break;
            case '-':
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.zoomOut();
              }
              break;
            case '0':
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.resetZoom();
              }
              break;
          }
        };
        
        document.addEventListener('keydown', keyHandler);
        this.eventListeners.push({ element: document, event: 'keydown', handler: keyHandler as unknown as EventListener });
      }
      
      console.log('✅ ExhibitManager initialized with', this.eventListeners.length, 'event listeners');
    } catch (error) {
      console.error('❌ Failed to initialize ExhibitManager:', error);
    }
  }

  /**
   * Open exhibit view with specific exhibit
   */
  openExhibit(exhibitId: string): boolean {
    try {
      const exhibit = this.exhibits.find(e => e.id === exhibitId);
      if (!exhibit) {
        console.error('❌ Exhibit not found:', exhibitId);
        return false;
      }

      console.log('🎯 Opening exhibit:', exhibit.display_name);

      if (!this.isActive) {
        if (!this.activateExhibitMode()) {
          return false;
        }
      }
      
      return this.loadExhibit(exhibit);
    } catch (error) {
      console.error('❌ Failed to open exhibit:', error);
      return false;
    }
  }

  /**
   * Activate exhibit mode - transform layout from 2-column to 3-column
   */
  activateExhibitMode(): boolean {
    try {
      const mainContainer = document.getElementById('mainContainer');
      if (!mainContainer) {
        console.error('❌ Main container not found');
        return false;
      }

      // Add class to transform grid
      mainContainer.classList.add('exhibit-active');
      
      // Create exhibit viewer with accessibility
      const exhibitViewer = this.createExhibitViewer();
      
      // Insert exhibit viewer as middle column
      const rightColumn = document.querySelector('.right-column');
      if (rightColumn) {
        mainContainer.insertBefore(exhibitViewer, rightColumn);
      } else {
        console.warn('⚠️ Right column not found, appending to main container');
        mainContainer.appendChild(exhibitViewer);
      }
      
      this.isActive = true;
      this.notifyStateChange();
      
      console.log('✅ Exhibit mode activated');
      return true;
    } catch (error) {
      console.error('❌ Failed to activate exhibit mode:', error);
      return false;
    }
  }

  /**
   * Create exhibit viewer element with accessibility and proper structure
   */
  createExhibitViewer(): HTMLElement {
    const viewer = document.createElement('div');
    viewer.className = 'exhibit-column';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-label', 'Exhibit Viewer');
    
    viewer.innerHTML = `
      <div class="exhibit-viewer" id="exhibitViewer" role="img" tabindex="0">
        <button 
          class="exhibit-close" 
          aria-label="Close exhibit"
          title="Close exhibit (Esc)"
        >
          ✕
        </button>
        <div class="exhibit-content" role="img">
          <img 
            class="exhibit-image" 
            id="exhibitImage" 
            src="" 
            alt="Exhibit" 
            loading="lazy"
            draggable="false"
          />
        </div>
        <div class="exhibit-controls" role="toolbar" aria-label="Zoom controls">
          <button 
            class="control-btn" 
            aria-label="Zoom out"
            title="Zoom out (Ctrl+-)"
          >
            − Zoom Out
          </button>
          <button 
            class="control-btn" 
            aria-label="Fit to container"
            title="Fit to container (Ctrl+0)"
          >
            Fit
          </button>
          <button 
            class="control-btn" 
            aria-label="Zoom in"
            title="Zoom in (Ctrl++)"
          >
            + Zoom In
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners with proper cleanup tracking
    const exhibitViewer = viewer.querySelector('.exhibit-viewer');
    const closeButton = viewer.querySelector('.exhibit-close') as HTMLButtonElement;
    const zoomOutBtn = viewer.querySelector('.control-btn:nth-child(1)') as HTMLButtonElement;
    const fitBtn = viewer.querySelector('.control-btn:nth-child(2)') as HTMLButtonElement;
    const zoomInBtn = viewer.querySelector('.control-btn:nth-child(3)') as HTMLButtonElement;
    
    if (closeButton) {
      const closeHandler = () => this.closeExhibit();
      closeButton.addEventListener('click', closeHandler);
      this.eventListeners.push({ element: closeButton, event: 'click', handler: closeHandler });
    }
    
    if (zoomOutBtn) {
      const zoomOutHandler = () => this.zoomOut();
      zoomOutBtn.addEventListener('click', zoomOutHandler);
      this.eventListeners.push({ element: zoomOutBtn, event: 'click', handler: zoomOutHandler });
    }
    
    if (fitBtn) {
      const fitHandler = () => this.resetZoom();
      fitBtn.addEventListener('click', fitHandler);
      this.eventListeners.push({ element: fitBtn, event: 'click', handler: fitHandler });
    }
    
    if (zoomInBtn) {
      const zoomInHandler = () => this.zoomIn();
      zoomInBtn.addEventListener('click', zoomInHandler);
      this.eventListeners.push({ element: zoomInBtn, event: 'click', handler: zoomInHandler });
    }
    
    return viewer;
  }



  /**
   * Load specific exhibit data and update UI
   */
  loadExhibit(exhibit: ExhibitData): boolean {
    try {
      const imageElement = document.getElementById('exhibitImage') as HTMLImageElement;
      
      if (!imageElement) {
        console.error('❌ Exhibit image element not found');
        return false;
      }
      
      // Update image with loading state
      imageElement.src = exhibit.image_url;
      imageElement.alt = exhibit.description || exhibit.display_name;
      imageElement.setAttribute('aria-label', `Exhibit: ${exhibit.display_name}`);
      
      // Add drag functionality
      this.setupImageNavigation(imageElement);
      

      
      this.currentExhibit = exhibit;
      this.resetZoom();
      this.notifyStateChange();
      
      console.log('✅ Exhibit loaded:', exhibit.display_name);
      return true;
    } catch (error) {
      console.error('❌ Failed to load exhibit:', error);
      return false;
    }
  }

  /**
   * Setup image navigation (panning when zoomed)
   */
  setupImageNavigation(imageElement: HTMLImageElement) {
    const contentElement = imageElement.parentElement;
    if (!contentElement) return;

    // Mouse events for dragging
    imageElement.addEventListener('mousedown', (e) => {
      if (this.currentZoom <= 1) return;
      
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      
      contentElement.classList.add('dragging');
      imageElement.classList.add('zoomed');
      imageElement.classList.add('dragging'); // Disable transitions during drag
      
      console.log('🖱️ Drag started:', { zoom: this.currentZoom, startX: this.dragStartX, startY: this.dragStartY });
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || this.currentZoom <= 1) return;
      
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      
      // Constrain panning to reasonable bounds
      const maxPan = 300 * this.currentZoom;
      this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX));
      this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY));
      
      // Apply transform immediately without RAF for instant response
      this.applyTransformImmediate();
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        contentElement.classList.remove('dragging');
        imageElement.classList.remove('dragging'); // Re-enable transitions
        
        if (this.currentZoom <= 1) {
          imageElement.classList.remove('zoomed');
        }
      }
    });

    // Touch events for mobile
    imageElement.addEventListener('touchstart', (e) => {
      if (this.currentZoom <= 1 || e.touches.length !== 1) return;
      
      this.isDragging = true;
      const touch = e.touches[0];
      this.dragStartX = touch.clientX - this.panX;
      this.dragStartY = touch.clientY - this.panY;
      
      contentElement.classList.add('dragging');
      imageElement.classList.add('zoomed');
      imageElement.classList.add('dragging'); // Disable transitions during drag
      
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!this.isDragging || this.currentZoom <= 1 || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      this.panX = touch.clientX - this.dragStartX;
      this.panY = touch.clientY - this.dragStartY;
      
      // Constrain panning
      const maxPan = 200 * this.currentZoom;
      this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX));
      this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY));
      
      this.applyTransformImmediate();
      e.preventDefault();
    });

    document.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        contentElement.classList.remove('dragging');
        imageElement.classList.remove('dragging'); // Re-enable transitions
        
        if (this.currentZoom <= 1) {
          imageElement.classList.remove('zoomed');
        }
      }
    });
  }



  /**
   * Switch to a different exhibit (deactivate current, activate new)
   * If clicking the same exhibit, close it
   */
  switchToExhibit(exhibitId: string) {
    // If clicking the currently active exhibit, close it
    if (this.currentExhibit && this.currentExhibit.id === exhibitId) {
      console.log('🔄 Closing active exhibit:', this.currentExhibit.display_name);
      this.closeExhibit();
      return;
    }

    const exhibit = this.exhibits.find(e => e.id === exhibitId);
    if (!exhibit) {
      console.error('Exhibit not found for switching:', exhibitId);
      return;
    }

    console.log('🔄 Switching to exhibit:', exhibit.display_name);
    
    // Reset zoom and pan for new exhibit
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
    
    // Load the new exhibit
    this.loadExhibit(exhibit);
  }

  /**
   * Zoom controls with configuration and bounds checking
   */
  zoomIn() {
    if (this.currentZoom >= this.config.maxZoom!) return;
    
    this.currentZoom = Math.min(this.currentZoom * this.config.zoomStep!, this.config.maxZoom!);
    this.applyTransform();
    this.updateCursorState();
    
    console.log('🔍 Zoomed in to:', Math.round(this.currentZoom * 100) + '%');
  }

  zoomOut() {
    if (this.currentZoom <= this.config.minZoom!) return;
    
    this.currentZoom = Math.max(this.currentZoom / this.config.zoomStep!, this.config.minZoom!);
    if (this.currentZoom <= 1) {
      this.panX = 0;
      this.panY = 0;
    }
    this.applyTransform();
    this.updateCursorState();
    
    console.log('🔍 Zoomed out to:', Math.round(this.currentZoom * 100) + '%');
  }

  resetZoom() {
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
    this.updateCursorState();
    
    console.log('🔍 Reset zoom to 100%');
  }

  /**
   * Apply transform with performance optimization using RAF
   */
  /**
   * Apply transform with RAF for smooth zoom operations
   */
  applyTransform() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      const image = document.getElementById('exhibitImage') as HTMLImageElement;
      if (image) {
        // Apply transform with proper order: translate first, then scale
        const scaleTransform = `scale(${this.currentZoom})`;
        const translateTransform = this.currentZoom > 1 ? `translate(${this.panX / this.currentZoom}px, ${this.panY / this.currentZoom}px)` : '';
        image.style.transform = `${translateTransform} ${scaleTransform}`.trim();
        
        // Update button states
        this.updateControlStates();
      }
      this.rafId = null;
    });
  }

  /**
   * Apply transform immediately for fast dragging (no RAF, no physics)
   */
  applyTransformImmediate() {
    const image = document.getElementById('exhibitImage') as HTMLImageElement;
    if (image) {
      // Apply transform instantly for responsive dragging
      const scaleTransform = `scale(${this.currentZoom})`;
      const translateTransform = this.currentZoom > 1 ? `translate(${this.panX / this.currentZoom}px, ${this.panY / this.currentZoom}px)` : '';
      image.style.transform = `${translateTransform} ${scaleTransform}`.trim();
    }
  }

  /**
   * Update control button states based on zoom level
   */
  private updateControlStates() {
    const zoomOutBtn = document.querySelector('.exhibit-controls .control-btn:nth-child(1)') as HTMLButtonElement;
    const zoomInBtn = document.querySelector('.exhibit-controls .control-btn:nth-child(3)') as HTMLButtonElement;
    
    if (zoomOutBtn) {
      zoomOutBtn.disabled = this.currentZoom <= this.config.minZoom!;
    }
    
    if (zoomInBtn) {
      zoomInBtn.disabled = this.currentZoom >= this.config.maxZoom!;
    }
  }

  updateCursorState() {
    const image = document.getElementById('exhibitImage') as HTMLImageElement;
    if (image) {
      if (this.currentZoom > 1) {
        image.classList.add('zoomed');
      } else {
        image.classList.remove('zoomed');
      }
    }
  }

  /**
   * Close exhibit and restore normal layout
   */
  closeExhibit() {
    const mainContainer = document.getElementById('mainContainer');
    const exhibitColumn = document.querySelector('.exhibit-column') as HTMLElement;
    
    if (!mainContainer || !exhibitColumn) return;
    
    // Animate out quickly to match page transitions
    exhibitColumn.style.animation = 'fadeOutScale 0.15s ease';
    
    setTimeout(() => {
      // Remove exhibit viewer
      exhibitColumn.remove();
      
      // Remove classes
      mainContainer.classList.remove('exhibit-active');
      
      this.isActive = false;
      this.currentExhibit = null;
      this.isTranscriptCollapsed = false;
      this.notifyStateChange();
    }, 150); // Faster timeout to match animation
  }

  /**
   * Set available exhibits
   */
  setExhibits(exhibits: ExhibitData[]) {
    this.exhibits = exhibits;
  }

  /**
   * Get current state
   */
  getState(): ExhibitManagerState {
    return {
      isActive: this.isActive,
      currentExhibit: this.currentExhibit,
      currentZoom: this.currentZoom,
      isTranscriptCollapsed: this.isTranscriptCollapsed,
      availableExhibits: this.exhibits
    };
  }

  /**
   * Notify state change
   */
  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Cleanup with proper event listener removal
   */
  destroy() {
    try {
      if (this.isActive) {
        this.closeExhibit();
      }
      
      // Remove all tracked event listeners
      this.eventListeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          console.warn('⚠️ Failed to remove event listener:', error);
        }
      });
      this.eventListeners = [];
      
      // Remove from global
      if ((window as any).exhibitManager === this) {
        delete (window as any).exhibitManager;
      }
      
      console.log('✅ ExhibitManager destroyed and cleaned up');
    } catch (error) {
      console.error('❌ Error during ExhibitManager cleanup:', error);
    }
  }
}

export interface ExhibitManagerState {
  isActive: boolean;
  currentExhibit: ExhibitData | null;
  currentZoom: number;
  isTranscriptCollapsed: boolean;
  availableExhibits: ExhibitData[];
}

/**
 * Initialize global exhibit manager
 */
export function initializeGlobalExhibitManager(onStateChange?: (state: ExhibitManagerState) => void): ExhibitManager {
  const manager = new ExhibitManager(onStateChange);
  (window as any).exhibitManager = manager;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.init());
  } else {
    manager.init();
  }
  
  return manager;
}
