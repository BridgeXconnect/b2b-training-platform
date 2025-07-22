'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InteractiveElement, InteractiveComponent, FeedbackType, AccessibilityFeatures } from '../../lib/content/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

interface DragDropProps {
  element: InteractiveElement;
  onComplete: (success: boolean, score: number) => void;
  onFeedback?: (feedback: string) => void;
}

interface DragItem {
  id: string;
  content: string;
  correctZone: string;
  currentZone?: string;
  position: { x: number; y: number };
}

interface DropZone {
  id: string;
  label: string;
  acceptsTypes: string[];
  position: { x: number; y: number; width: number; height: number };
  items: string[];
}

export default function DragDropExercise({ element, onComplete, onFeedback }: DragDropProps) {
  const [dragItems, setDragItems] = useState<DragItem[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize the exercise from element configuration
  useEffect(() => {
    initializeExercise();
  }, [element]);

  const initializeExercise = () => {
    // Extract drag items and drop zones from element configuration
    const items: DragItem[] = element.configuration.elements
      .filter(el => el.type === 'drag-item')
      .map(el => ({
        id: el.id,
        content: el.properties.content || '',
        correctZone: el.properties.correctZone || '',
        position: el.position,
      }));

    const zones: DropZone[] = element.configuration.elements
      .filter(el => el.type === 'drop-zone')
      .map(el => ({
        id: el.id,
        label: el.properties.label || '',
        acceptsTypes: el.properties.acceptsTypes || [],
        position: { 
          x: el.position.x, 
          y: el.position.y, 
          width: el.properties.width || 200,
          height: el.properties.height || 100
        },
        items: [],
      }));

    setDragItems(items);
    setDropZones(zones);
    setIsCompleted(false);
    setScore(0);
    setAttempts(0);
    setFeedback('');
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.setData('text/plain', itemId);
    
    // Accessibility: Announce drag start
    if (element.accessibility.screenReader) {
      const item = dragItems.find(item => item.id === itemId);
      onFeedback?.(`Started dragging ${item?.content}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    
    if (!itemId || !draggedItem) return;

    // Move item to drop zone
    setDragItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, currentZone: zoneId }
          : item
      )
    );

    setDropZones(prev =>
      prev.map(zone => {
        if (zone.id === zoneId) {
          return { ...zone, items: [...zone.items.filter(id => id !== itemId), itemId] };
        }
        return { ...zone, items: zone.items.filter(id => id !== itemId) };
      })
    );

    setDraggedItem(null);
    checkCompletion();
  };

  const checkCompletion = () => {
    // Check if all items are placed
    const allItemsPlaced = dragItems.every(item => item.currentZone);
    if (!allItemsPlaced) return;

    // Check correctness
    const correctPlacements = dragItems.filter(item => item.currentZone === item.correctZone).length;
    const totalItems = dragItems.length;
    const currentScore = Math.round((correctPlacements / totalItems) * 100);
    const isSuccess = correctPlacements === totalItems;

    setScore(currentScore);
    setAttempts(prev => prev + 1);
    setIsCompleted(true);

    // Generate feedback
    let feedbackMessage = '';
    if (isSuccess) {
      feedbackMessage = element.feedback.customMessages['success'] || 'Excellent! All items are correctly placed.';
    } else if (currentScore >= 70) {
      feedbackMessage = element.feedback.customMessages['partial'] || 'Good job! Most items are correct.';
    } else {
      feedbackMessage = element.feedback.customMessages['retry'] || 'Try again! Check the placement of your items.';
    }

    setFeedback(feedbackMessage);
    onFeedback?.(feedbackMessage);
    onComplete(isSuccess, currentScore);
  };

  const handleReset = () => {
    setDragItems(prev => 
      prev.map(item => ({ ...item, currentZone: undefined }))
    );
    setDropZones(prev =>
      prev.map(zone => ({ ...zone, items: [] }))
    );
    setIsCompleted(false);
    setScore(0);
    setFeedback('');
  };

  const handleHint = () => {
    setShowHints(!showHints);
    if (!showHints && element.configuration.settings.hintSystem) {
      const incorrectItems = dragItems.filter(item => 
        item.currentZone && item.currentZone !== item.correctZone
      );
      
      if (incorrectItems.length > 0) {
        const hintItem = incorrectItems[0];
        const correctZone = dropZones.find(zone => zone.id === hintItem.correctZone);
        onFeedback?.(`Hint: "${hintItem.content}" belongs in "${correctZone?.label}"`);
      }
    }
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (!element.accessibility.keyboardNavigation) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Cycle through drop zones
        const item = dragItems.find(item => item.id === itemId);
        if (item) {
          const currentZoneIndex = dropZones.findIndex(zone => zone.id === item.currentZone);
          const nextZoneIndex = (currentZoneIndex + 1) % dropZones.length;
          const nextZone = dropZones[nextZoneIndex];
          
          // Move to next zone
          setDragItems(prev => 
            prev.map(dragItem => 
              dragItem.id === itemId 
                ? { ...dragItem, currentZone: nextZone.id }
                : dragItem
            )
          );
        }
        break;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{element.title}</span>
          <div className="flex items-center space-x-2">
            {attempts > 0 && (
              <span className="text-sm text-gray-600">
                Score: {score}% | Attempts: {attempts}
              </span>
            )}
            {element.configuration.settings.hintSystem && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHint}
                className="flex items-center space-x-1"
              >
                <Lightbulb className="h-4 w-4" />
                <span>Hint</span>
              </Button>
            )}
          </div>
        </CardTitle>
        <p className="text-gray-600">{element.description}</p>
      </CardHeader>

      <CardContent>
        <div 
          ref={containerRef}
          className="relative min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-4"
          role={element.accessibility.screenReader ? "application" : undefined}
          aria-label={element.accessibility.screenReader ? element.title : undefined}
        >
          {/* Drop Zones */}
          {dropZones.map(zone => (
            <div
              key={zone.id}
              className="absolute border-2 border-blue-300 bg-blue-50 rounded-lg p-2 flex flex-col justify-center items-center"
              style={{
                left: `${zone.position.x}px`,
                top: `${zone.position.y}px`,
                width: `${zone.position.width}px`,
                height: `${zone.position.height}px`,
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, zone.id)}
              role="region"
              aria-label={`Drop zone: ${zone.label}`}
            >
              <div className="text-center text-sm font-medium text-blue-700 mb-2">
                {zone.label}
              </div>
              {zone.items.map(itemId => {
                const item = dragItems.find(dragItem => dragItem.id === itemId);
                return item ? (
                  <div
                    key={itemId}
                    className={`p-2 m-1 rounded shadow-md text-sm ${
                      isCompleted
                        ? item.correctZone === zone.id
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white border-gray-300'
                    }`}
                    draggable={!isCompleted}
                    onDragStart={(e) => handleDragStart(e, itemId)}
                    onKeyDown={(e) => handleKeyDown(e, itemId)}
                    tabIndex={element.accessibility.keyboardNavigation ? 0 : -1}
                    role={element.accessibility.keyboardNavigation ? "button" : undefined}
                    aria-pressed={element.accessibility.keyboardNavigation ? false : undefined}
                  >
                    {item.content}
                    {isCompleted && (
                      <span className="ml-2">
                        {item.correctZone === zone.id ? (
                          <CheckCircle className="h-4 w-4 inline text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 inline text-red-600" />
                        )}
                      </span>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          ))}

          {/* Unplaced Items */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Available Items:</div>
              <div className="flex flex-wrap gap-2">
                {dragItems
                  .filter(item => !item.currentZone)
                  .map(item => (
                    <div
                      key={item.id}
                      className="p-2 bg-white border border-gray-300 rounded shadow cursor-move hover:shadow-md transition-shadow"
                      draggable={!isCompleted}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      tabIndex={element.accessibility.keyboardNavigation ? 0 : -1}
                      role={element.accessibility.keyboardNavigation ? "button" : undefined}
                      aria-grabbed={draggedItem === item.id}
                    >
                      {item.content}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-4 p-3 rounded-lg ${
            score >= 100 ? 'bg-green-100 text-green-800' :
            score >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {feedback}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center space-x-2"
            disabled={!isCompleted && attempts === 0}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>

          {isCompleted && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Final Score: {score}%
              </span>
              {score >= (element.scoring?.passingScore || 70) ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  Passed
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-1" />
                  Try Again
                </span>
              )}
            </div>
          )}
        </div>

        {/* Accessibility Instructions */}
        {element.accessibility.keyboardNavigation && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <strong>Keyboard Instructions:</strong> Use Tab to navigate items, Enter or Space to cycle through drop zones.
          </div>
        )}
      </CardContent>
    </Card>
  );
}