/**
 * Mermaid Diagram Component
 * Renders Mermaid diagrams from markdown syntax
 */

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Arial, sans-serif'
});

export const MermaidDiagram = ({ chart, className = '' }) => {
    const containerRef = useRef(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (containerRef.current && chart) {
            try {
                // Clear previous content
                containerRef.current.innerHTML = '';

                // Render the diagram
                mermaid.render(idRef.current, chart).then(({ svg }) => {
                    if (containerRef.current) {
                        containerRef.current.innerHTML = svg;
                    }
                });
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `
            <div class="text-red-600 p-4 border border-red-300 rounded">
              <strong>Diagram Error:</strong> Failed to render diagram
            </div>
          `;
                }
            }
        }
    }, [chart]);

    return (
        <div
            ref={containerRef}
            className={`mermaid-container ${className}`}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                padding: '1rem'
            }}
        />
    );
};

export default MermaidDiagram;
