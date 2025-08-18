import { useState } from "react";

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
  
  return (
    <div style={{border: '2px solid red', padding: '10px', margin: '10px'}}>
      <h3>EVENT HANDLER TEST - Total Clicks: {testCount}</h3>
      <button onClick={() => testClick('gold')}>
        Gold Test ({buttonStates.gold || 0})
      </button>
      <button onClick={() => testClick('dropdown')}>
        Dropdown Test ({buttonStates.dropdown || 0})
      </button>
      <button onClick={() => testClick('tab')}>
        Tab Test ({buttonStates.tab || 0})
      </button>
    </div>
  );
}