import { supabase } from "./supabase-client";

/**
 * Data structures for exhibit system
 */
export interface ExhibitData {
  id: string;
  exhibit_name: string;
  display_name: string;
  description?: string;
  image_url: string;
  case_id: string;
  storage_path?: string;
  file_type?: string;
  display_order?: number;
  metadata?: any;
  unlocked_at?: Date;
  auto_displayed?: boolean;
  is_active?: boolean;
}

export interface ExhibitDisplayState {
  isActive: boolean;
  currentExhibit: ExhibitData | null;
  currentZoom: number;
  isTranscriptCollapsed: boolean;
  availableExhibits: ExhibitData[];
}

/**
 * Helper function to upload sample exhibit images to Supabase Storage
 * This would typically be done through an admin interface
 */
export async function uploadSampleExhibits(caseId: string) {
  // Sample exhibit data - in production, these would be real images
  const sampleExhibits = [
    {
      name: "market_analysis_chart",
      displayName: "Market Analysis Chart",
      description: "Comprehensive market analysis showing competitive pricing trends and market positioning",
      // This would be a real image URL or file upload in production
      imageData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOWZmIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+TWFya2V0IEFuYWx5c2lzIENoYXJ0PC90ZXh0Pgo8L3N2Zz4K"
    },
    {
      name: "financial_projections", 
      displayName: "Financial Projections",
      description: "Five-year financial projections with revenue, costs, and profitability scenarios",
      imageData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmZGY0Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+RmluYW5jaWFsIFByb2plY3Rpb25zPC90ZXh0Pgo8L3N2Zz4K"
    },
    {
      name: "competitive_landscape",
      displayName: "Competitive Landscape Map", 
      description: "Visual map of key competitors, their market positions, and strategic advantages",
      imageData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmM2M3Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+Q29tcGV0aXRpdmUgTGFuZHNjYXBlPC90ZXh0Pgo8L3N2Zz4K"
    },
    {
      name: "customer_segments",
      displayName: "Customer Segmentation Analysis",
      description: "Detailed breakdown of customer segments, their needs, and value propositions", 
      imageData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmJmMWY5Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+Q3VzdG9tZXIgU2VnbWVudHM8L3RleHQ+Cjwvc3ZnPgo="
    }
  ];

  console.log("📸 Uploading sample exhibits for case:", caseId);

  for (const exhibit of sampleExhibits) {
    try {
      // Convert data URL to blob
      const response = await fetch(exhibit.imageData);
      const blob = await response.blob();
      
      // Upload to storage
      const storagePath = `exhibits/${caseId}/${exhibit.name}.svg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-exhibits')
        .upload(storagePath, blob, {
          contentType: 'image/svg+xml',
          upsert: true
        });

      if (uploadError) {
        console.error(`Failed to upload ${exhibit.name}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-exhibits')
        .getPublicUrl(storagePath);

      console.log(`✅ Uploaded exhibit: ${exhibit.name} -> ${urlData.publicUrl}`);

    } catch (error) {
      console.error(`Error uploading exhibit ${exhibit.name}:`, error);
    }
  }
}

/**
 * Get all unlocked exhibits for a case
 */
export async function getCaseExhibits(caseId: string) {
  const { data, error } = await supabase
    .from("case_exhibits")
    .select(`
      id,
      exhibit_name,
      display_name,
      description,
      storage_path,
      file_type,
      display_order,
      metadata
    `)
    .eq("case_id", caseId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching case exhibits:", error);
    return [];
  }

  // Generate public URLs for each exhibit
  const exhibitsWithUrls = (data || []).map(exhibit => {
    const { data: urlData } = supabase.storage
      .from('case-exhibits')
      .getPublicUrl(exhibit.storage_path);

    return {
      ...exhibit,
      image_url: urlData.publicUrl
    };
  });

  return exhibitsWithUrls;
}

/**
 * Transform exhibit data for the ExhibitManager
 */
export function transformExhibitForManager(exhibit: any): ExhibitData {
  return {
    id: exhibit.id,
    exhibit_name: exhibit.exhibit_name,
    display_name: exhibit.display_name || exhibit.exhibit_name,
    description: exhibit.description,
    image_url: exhibit.image_url,
    case_id: exhibit.case_id,
    storage_path: exhibit.storage_path,
    file_type: exhibit.file_type,
    display_order: exhibit.display_order,
    metadata: exhibit.metadata,
    unlocked_at: exhibit.unlocked_at,
    auto_displayed: exhibit.auto_displayed,
    is_active: exhibit.is_active
  };
}

/**
 * Create a "Case Exhibits" button trigger element
 */
export function createExhibitTriggerButton(exhibitId: string, text: string = "View Exhibit"): HTMLElement {
  const button = document.createElement('button');
  button.className = 'inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-md transition-colors cursor-pointer';
  button.setAttribute('data-exhibit-trigger', '');
  button.setAttribute('data-exhibit-id', exhibitId);
  button.innerHTML = `
    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    ${text}
  `;
  return button;
}

/**
 * Add exhibit trigger to a message or element
 */
export function addExhibitTriggerToElement(element: HTMLElement, exhibitId: string, text?: string) {
  const trigger = createExhibitTriggerButton(exhibitId, text);
  element.appendChild(trigger);
  return trigger;
}

/**
 * Initialize exhibit system for a specific case
 */
export async function initializeExhibitsForCase(caseId: string): Promise<ExhibitData[]> {
  try {
    const exhibits = await getCaseExhibits(caseId);
    return exhibits.map(transformExhibitForManager);
  } catch (error) {
    console.error('Failed to initialize exhibits for case:', caseId, error);
    return [];
  }
}

/**
 * Mock data for development/testing
 */
export function getMockExhibitData(caseId: string): ExhibitData[] {
  return [
    {
      id: '1',
      exhibit_name: 'market_analysis_chart',
      display_name: 'Market Analysis Chart',
      description: 'Comprehensive market analysis showing competitive pricing trends and market positioning',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOWZmIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+TWFya2V0IEFuYWx5c2lzIENoYXJ0PC90ZXh0Pgo8L3N2Zz4K',
      case_id: caseId,
      unlocked_at: new Date(),
      auto_displayed: false,
      is_active: true
    },
    {
      id: '2',
      exhibit_name: 'financial_projections',
      display_name: 'Financial Projections',
      description: 'Five-year financial projections with revenue, costs, and profitability scenarios',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmZGY0Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+RmluYW5jaWFsIFByb2plY3Rpb25zPC90ZXh0Pgo8L3N2Zz4K',
      case_id: caseId,
      unlocked_at: new Date(),
      auto_displayed: false,
      is_active: true
    },
    {
      id: '3',
      exhibit_name: 'competitive_landscape',
      display_name: 'Competitive Landscape Map',
      description: 'Visual map of key competitors, their market positions, and strategic advantages',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmM2M3Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzNyI+Q29tcGV0aXRpdmUgTGFuZHNjYXBlPC90ZXh0Pgo8L3N2Zz4K',
      case_id: caseId,
      unlocked_at: new Date(),
      auto_displayed: false,
      is_active: true
    }
  ];
}
