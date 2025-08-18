import React, { useState } from "react";

export function EventDiagnostic() {
  const [testCount, setTestCount] = useState(0);
  const [buttonStates, setButtonStates] = useState<Record<string, number>>({});
  
  const testClick = (buttonName: string) => {
    console.log(`${buttonName} clicked!`);
    setTestCount(prev => prev + 1);
    setButtonStates(prev => ({
      ...prev,
      [buttonName]: (prev[buttonName] || 0) + 1
    }));
  };
  
  return React.createElement('div', {
    style: { border: '2px solid red', padding: '10px', margin: '10px' }
  }, [
    React.createElement('h3', { key: 'header' }, `EVENT HANDLER TEST - Total Clicks: ${testCount}`),
    React.createElement('button', {
      key: 'gold',
      onClick: () => testClick('gold'),
      style: { margin: '5px', padding: '10px', backgroundColor: '#ffd700' }
    }, `Gold Test (${buttonStates.gold || 0})`),
    React.createElement('button', {
      key: 'dropdown', 
      onClick: () => testClick('dropdown'),
      style: { margin: '5px', padding: '10px', backgroundColor: '#c0c0c0' }
    }, `Dropdown Test (${buttonStates.dropdown || 0})`),
    React.createElement('button', {
      key: 'tab',
      onClick: () => testClick('tab'),
      style: { margin: '5px', padding: '10px', backgroundColor: '#cd7f32' }
    }, `Tab Test (${buttonStates.tab || 0})`)
  ]);
}