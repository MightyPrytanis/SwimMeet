import React from 'react';
import logoImage from '@assets/Sleek Lettermark SwimMeet Logo for Sports_1755887370233.png';

export function PublicDemo() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 25%, #0074d9 50%, #39cccc 75%, #2ecc40 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(0, 31, 63, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '20px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <img 
            src={logoImage} 
            alt="SwimMeet Logo" 
            style={{ height: '120px', transform: 'scaleX(1.20)' }}
          />
          <h1 style={{ 
            margin: '16px 0 8px 0', 
            fontSize: '48px', 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ffd700, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            SwimMeet
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '18px', 
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Advanced AI Orchestration Platform
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Platform Overview */}
        <section style={{ marginBottom: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '20px', color: '#ffd700' }}>
            🏊‍♂️ Multi-AI Orchestration Platform
          </h2>
          <p style={{ fontSize: '20px', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto', opacity: 0.9 }}>
            SwimMeet enables simultaneous querying of multiple AI services with advanced response management, 
            fact-checking capabilities, and collaborative workflows. Think of it as conducting an orchestra 
            of AI assistants working together on your challenges.
          </p>
        </section>

        {/* Three Modes */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center', color: '#ffd700' }}>
            Three Powerful Modes
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            
            {/* DIVE Mode */}
            <div style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '2px solid #2563EB',
              padding: '30px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: '#2563EB', fontSize: '24px', marginBottom: '16px' }}>
                🏊‍♂️ DIVE Mode
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                Simultaneous multi-AI querying. Submit your question to multiple AI providers 
                at once and compare their responses side-by-side.
              </p>
              <div style={{ background: 'rgba(37, 99, 235, 0.2)', padding: '16px', fontSize: '14px' }}>
                <strong>Example:</strong> "Analyze the impact of remote work on productivity"
                <br /><br />
                <strong>Result:</strong> Get perspectives from ChatGPT-4, Claude 4, Gemini Pro, 
                and Perplexity simultaneously, with quality ratings and response time tracking.
              </div>
            </div>

            {/* TURN Mode */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '2px solid #7C3AED',
              padding: '30px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: '#7C3AED', fontSize: '24px', marginBottom: '16px' }}>
                🔄 TURN Mode
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                AI-to-AI fact-checking and verification. Select a verifier AI to critique 
                and score the accuracy of other AI responses.
              </p>
              <div style={{ background: 'rgba(124, 58, 237, 0.2)', padding: '16px', fontSize: '14px' }}>
                <strong>Example:</strong> Get ChatGPT's analysis of climate data, then have Claude 
                fact-check it for accuracy, providing scores and identifying any errors.
                <br /><br />
                <strong>Result:</strong> Accuracy scores, factual error identification, and improvement recommendations.
              </div>
            </div>

            {/* WORK Mode */}
            <div style={{
              background: 'rgba(218, 165, 32, 0.1)',
              border: '2px solid #DAA520',
              padding: '30px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: '#DAA520', fontSize: '24px', marginBottom: '16px' }}>
                ⚙️ WORK Mode
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                Sequential AI collaboration. Multiple AIs work together in stages, 
                building on each other's work to create comprehensive solutions.
              </p>
              <div style={{ background: 'rgba(218, 165, 32, 0.2)', padding: '16px', fontSize: '14px' }}>
                <strong>Example:</strong> "Develop a marketing strategy for a new product"
                <br /><br />
                <strong>Workflow:</strong> Step 1 (OpenAI): Market analysis → Step 2 (Anthropic): Strategy development → Step 3 (Google): Implementation plan
              </div>
            </div>
          </div>
        </section>

        {/* Live Statistics */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center', color: '#ffd700' }}>
            Platform Statistics
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#39cccc' }}>8</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>AI Providers</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2ecc40' }}>4</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Active Connections</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff6b6b' }}>∞</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Conversations</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd700' }}>24/7</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Availability</div>
            </div>
          </div>
        </section>

        {/* Sample Response Display */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center', color: '#ffd700' }}>
            Sample AI Response Analysis
          </h2>
          
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '30px', backdropFilter: 'blur(10px)' }}>
            <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              Query: "What are the key trends in sustainable technology for 2025?"
            </div>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              
              {/* ChatGPT Response */}
              <div style={{ 
                background: 'rgba(37, 99, 235, 0.2)', 
                border: '1px solid #2563EB', 
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ color: '#2563EB' }}>ChatGPT-4</strong>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: '#16a34a', padding: '2px 8px', fontSize: '12px' }}>95% Positive</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>2.3s</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Key sustainable technology trends for 2025 include advanced battery storage systems, 
                  green hydrogen production scaling, circular economy automation, and AI-optimized energy grids. 
                  Carbon capture technologies are becoming economically viable...
                </p>
              </div>

              {/* Claude Response */}
              <div style={{ 
                background: 'rgba(124, 58, 237, 0.2)', 
                border: '1px solid #7C3AED', 
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ color: '#7C3AED' }}>Claude 4</strong>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: '#16a34a', padding: '2px 8px', fontSize: '12px' }}>92% Positive</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>1.8s</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  The sustainable tech landscape in 2025 will be dominated by breakthrough materials science, 
                  particularly in biodegradable plastics and next-generation solar cells. Fusion energy 
                  pilot programs are entering commercial testing phases...
                </p>
              </div>

              {/* Verification Results */}
              <div style={{ 
                background: 'rgba(255, 215, 0, 0.2)', 
                border: '1px solid #ffd700', 
                padding: '20px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#ffd700' }}>TURN Verification Results</strong>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Accuracy Score:</strong> 94% (Both responses factually sound)
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Strengths:</strong> Current technology trends correctly identified, realistic timelines
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Areas for Improvement:</strong> Could include more specific cost projections
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Features */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center', color: '#ffd700' }}>
            Technical Capabilities
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🔐 Enterprise Security</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                JWT authentication, bcrypt password hashing, disposable access tokens, 
                and comprehensive session management with admin controls.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>📊 Advanced Analytics</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Real-time performance tracking, response quality scoring, provider reliability metrics, 
                and comprehensive conversation history.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🔄 Workflow Engine</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Intelligent step planning, sequential AI collaboration, progress monitoring, 
                and automatic handoffs between providers.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🌐 Platform Independence</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Standard technologies (PostgreSQL, JWT, bcrypt) with zero proprietary dependencies. 
                Complete portability across platforms.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#ffd700' }}>
            Experience SwimMeet
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 30px auto' }}>
            This is a completely public demo page designed for AI assistants to understand SwimMeet's capabilities. 
            The full platform includes user authentication, persistent conversations, and advanced workflow management.
          </p>
          <div style={{
            background: 'rgba(255, 215, 0, 0.2)',
            border: '2px solid #ffd700',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ffd700' }}>AI Analysis Note</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              This public demo page is specifically designed to be accessible to AI assistants via web_fetch. 
              The full SwimMeet platform requires authentication and provides persistent data storage, 
              user management, and advanced AI orchestration capabilities.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0, 31, 63, 0.9)',
        padding: '20px 0',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          SwimMeet - Advanced AI Orchestration Platform | Built with React, TypeScript, and PostgreSQL
        </p>
      </footer>
    </div>
  );
}