/**
 * Utility functions for agent stream management
 * Simplified version without BMAD system for MVP
 */

import { EventEmitter } from 'events';

// Simplified fallback emitter (BMAD system removed for MVP)
const fallbackEmitter = new EventEmitter();
fallbackEmitter.setMaxListeners(50);

// Export the emitter for use by other parts of the application
export async function getGlobalAgentEmitter() {
  return fallbackEmitter;
}

// Broadcast agent activity (simplified for MVP)
export async function broadcastAgentActivity(eventType: string, data: any) {
  fallbackEmitter.emit(eventType, data);
}

// Store active connections for cleanup
const activeConnections = new Set<ReadableStreamDefaultController>();

// Add connection to active set
export function addActiveConnection(controller: ReadableStreamDefaultController) {
  activeConnections.add(controller);
}

// Remove connection from active set
export function removeActiveConnection(controller: ReadableStreamDefaultController) {
  activeConnections.delete(controller);
}

// Cleanup function for graceful shutdown
export function cleanupAgentStream() {
  activeConnections.forEach(controller => {
    if ((controller as any).cleanup) {
      (controller as any).cleanup();
    }
  });
  activeConnections.clear();
}