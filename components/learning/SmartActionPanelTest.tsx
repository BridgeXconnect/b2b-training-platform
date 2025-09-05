'use client';

import { useState } from 'react';
import SmartActionPanel from './SmartActionPanel';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export default function SmartActionPanelTest() {
  const [userId, setUserId] = useState('test-user-123');
  const [panelKey, setPanelKey] = useState(0);

  const resetPanel = () => {
    console.log('[SmartActionPanelTest] Resetting panel');
    setPanelKey(prev => prev + 1);
  };

  const changeUser = () => {
    const newUserId = `test-user-${Date.now()}`;
    console.log('[SmartActionPanelTest] Changing user to:', newUserId);
    setUserId(newUserId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Action Panel Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Button onClick={resetPanel}>Reset Panel</Button>
            <Button onClick={changeUser}>Change User</Button>
          </div>
          <div className="text-sm text-gray-600">
            Current User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
          </div>
        </CardContent>
      </Card>

      <SmartActionPanel 
        key={panelKey}
        userId={userId} 
        onActionExecuted={(actionId, result) => {
          console.log('[SmartActionPanelTest] Action executed:', actionId, result);
        }}
      />
    </div>
  );
}