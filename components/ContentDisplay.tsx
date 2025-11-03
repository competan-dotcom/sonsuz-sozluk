/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ContentDisplayProps {
  content: string;
  isLoading: boolean;
  onWordClick: (word: string) => void;
  isMuhayyeli?: boolean;
}

const InteractiveContent: React.FC<{
  content: string;
  onWordClick: (word: string) => void;
  isMuhayyeli?: boolean;
}> = ({ content, onWordClick, isMuhayyeli }) => {
  const words = content.split(/(\s+)/).filter(Boolean); // Keep whitespace for spacing

  return (
    <div>
      <p className="justified-text" style={{ margin: 0 }}>
        {words.map((word, index) => {
          // Only make non-whitespace words clickable
          if (/\S/.test(word)) {
            const cleanWord = word.replace(/[.,!?;:()"']/g, '');
            if (cleanWord) {
              return (
                <span
                  key={index}
                  onClick={() => onWordClick(cleanWord)}
                  className="interactive-word"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onWordClick(cleanWord) }}
                  aria-label={`${cleanWord} hakkında daha fazla bilgi edinin`}
                >
                  {word}
                </span>
              );
            }
          }
          // Render whitespace as-is
          return <span key={index}>{word}</span>;
        })}
      </p>
      {isMuhayyeli && (
        <p className="attribution-text">
          (bir competanai muhayyeli)
        </p>
      )}
    </div>
  );
};

const StreamingContent: React.FC<{ content: string }> = ({ content }) => (
  <p style={{ margin: 0 }}>
    {content}
    <span className="blinking-cursor">|</span>
  </p>
);

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, isLoading, onWordClick, isMuhayyeli }) => {
  if (isLoading) {
    return <StreamingContent content={content} />;
  }
  
  if (content) {
    return <InteractiveContent content={content} onWordClick={onWordClick} isMuhayyeli={isMuhayyeli} />;
  }

  return null;
};

export default ContentDisplay;