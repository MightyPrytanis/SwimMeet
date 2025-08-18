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
    <div style={{border: '2px solid red', padding: '10px', margin: '10px', backgroundColor: 'white'}}>
      <h3 style={{margin: '0 0 10px 0'}}>EVENT HANDLER TEST - Total Clicks: {testCount}</h3>
      <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
        <button 
          onClick={() => testClick('gold')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#ffd700',
            border: '2px solid #ffed4e',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Gold Test ({buttonStates.gold || 0})
        </button>
        <button 
          onClick={() => testClick('dropdown')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#c0c0c0',
            border: '2px solid #d3d3d3',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Dropdown Test ({buttonStates.dropdown || 0})
        </button>
        <button 
          onClick={() => testClick('tab')}
          style={{
            margin: '0',
            padding: '10px 15px',
            backgroundColor: '#cd7f32',
            border: '2px solid #daa520',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          type="button"
        >
          Tab Test ({buttonStates.tab || 0})
        </button>
      </div>
    </div>
  );
}