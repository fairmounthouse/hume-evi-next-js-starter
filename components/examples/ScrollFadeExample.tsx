"use client";

import React, { useState } from 'react';
import ScrollFadeIndicator, { useScrollFade, ScrollFadeGrid } from '../ScrollFadeIndicator';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Example usage of ScrollFadeIndicator components
 * Shows different implementation patterns for setup pages
 */
export default function ScrollFadeExample() {
  const [itemCount, setItemCount] = useState(3);
  
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">ScrollFadeIndicator Examples</h1>
        <p className="text-gray-600">
          Smart scroll fade indicators that only show when content is scrollable
          and disappear at scroll boundaries. Perfect for setup pages!
        </p>
        
        <div className="flex gap-4">
          <Button
            onClick={() => setItemCount(Math.max(1, itemCount - 1))}
            variant="outline"
          >
            Remove Item
          </Button>
          <Button
            onClick={() => setItemCount(itemCount + 1)}
            variant="outline"
          >
            Add Item
          </Button>
          <span className="py-2 text-gray-600">
            Items: {itemCount} {itemCount <= 4 ? '(No scroll needed)' : '(Scrollable)'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Example 1: Basic Grid Layout (like InterviewSetup cases) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grid Layout (Cases/Profiles)</CardTitle>
            <p className="text-sm text-gray-600">
              Perfect for InterviewSetup cases and profile grids
            </p>
          </CardHeader>
          <CardContent>
            <ScrollFadeGrid
              className="h-64 bg-gray-50 rounded-lg"
              gridClassName="grid-cols-2 gap-3 p-4"
              fadeHeight={40}
              fadeColor="rgb(249 250 251)"
            >
              {Array.from({ length: itemCount }, (_, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-sm">Item {i + 1}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    This is a grid item that would represent a case or profile card.
                  </p>
                </div>
              ))}
            </ScrollFadeGrid>
          </CardContent>
        </Card>
        
        {/* Example 2: Document Content (like SessionDocuments) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Content</CardTitle>
            <p className="text-sm text-gray-600">
              Perfect for document previews and text content
            </p>
          </CardHeader>
          <CardContent>
            <ScrollFadeIndicator 
              className="h-64 bg-gray-50 rounded-lg border p-4"
              fadeHeight={30}
              fadeColor="rgb(249 250 251)"
            >
              <div className="space-y-4">
                <h4 className="font-semibold">Document Content Preview</h4>
                {Array.from({ length: itemCount * 3 }, (_, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    This is paragraph {i + 1} of the document content. In a real scenario, 
                    this would be extracted text from uploaded documents like resumes or 
                    job descriptions. The fade indicators will only show when there's 
                    scrollable content and will disappear when you reach the top or bottom.
                  </p>
                ))}
              </div>
            </ScrollFadeIndicator>
          </CardContent>
        </Card>
        
        {/* Example 3: List Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">List Layout</CardTitle>
            <p className="text-sm text-gray-600">
              Perfect for session selectors and option lists
            </p>
          </CardHeader>
          <CardContent>
            <ScrollFadeIndicator 
              className="h-64 space-y-2"
              fadeHeight={35}
              fadeColor="white"
            >
              {Array.from({ length: itemCount * 2 }, (_, i) => (
                <div key={i} className="p-3 bg-gray-100 rounded-lg border hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">List Item {i + 1}</h4>
                      <p className="text-xs text-gray-600">
                        Description for item {i + 1}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollFadeIndicator>
          </CardContent>
        </Card>
        
        {/* Example 4: Custom Hook Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Hook Usage</CardTitle>
            <p className="text-sm text-gray-600">
              Using the useScrollFade hook for custom implementations
            </p>
          </CardHeader>
          <CardContent>
            <CustomHookExample itemCount={itemCount} />
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Implementation Notes:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ <strong>Smart Detection:</strong> Only shows fade when content is scrollable</li>
          <li>✅ <strong>Boundary Aware:</strong> Fades disappear at top/bottom</li>
          <li>✅ <strong>Dynamic Content:</strong> Handles content changes automatically</li>
          <li>✅ <strong>Responsive:</strong> Adapts to window resizing</li>
          <li>✅ <strong>Performance:</strong> Uses ResizeObserver for efficient updates</li>
          <li>✅ <strong>Customizable:</strong> Adjustable fade height, color, and threshold</li>
          <li>✅ <strong>Accessible:</strong> Proper pointer-events handling</li>
        </ul>
      </div>
    </div>
  );
}

// Example using the custom hook
function CustomHookExample({ itemCount }: { itemCount: number }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { showTop, showBottom } = useScrollFade(scrollRef);
  
  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg"
      >
        {Array.from({ length: itemCount * 2 }, (_, i) => (
          <div key={i} className="p-3 bg-white rounded shadow-sm">
            <h4 className="font-medium text-sm">Custom Hook Item {i + 1}</h4>
            <p className="text-xs text-gray-600 mt-1">
              This example uses the useScrollFade hook for full control
            </p>
          </div>
        ))}
      </div>
      
      {/* Custom fade overlays */}
      {showTop && (
        <div 
          className="absolute top-0 left-0 right-0 h-10 pointer-events-none transition-opacity duration-300 rounded-t-lg"
          style={{
            background: 'linear-gradient(to bottom, rgb(249 250 251) 0%, transparent 100%)'
          }}
        />
      )}
      {showBottom && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none transition-opacity duration-300 rounded-b-lg"
          style={{
            background: 'linear-gradient(to top, rgb(249 250 251) 0%, transparent 100%)'
          }}
        />
      )}
      
      {/* Status indicators */}
      <div className="mt-2 text-xs text-gray-500 flex gap-4">
        <span>Top fade: {showTop ? '✅' : '❌'}</span>
        <span>Bottom fade: {showBottom ? '✅' : '❌'}</span>
      </div>
    </div>
  );
}
