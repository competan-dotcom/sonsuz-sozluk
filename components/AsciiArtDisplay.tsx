/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import type { AsciiArtData } from '../services/geminiService';

interface AsciiArtDisplayProps {
  artData: AsciiArtData | null;
  topic: string;
  isHandleVisible: boolean;
}

const AsciiArtDisplay: React.FC<AsciiArtDisplayProps> = ({ artData, topic, isHandleVisible }) => {
  const [currentFrame, setCurrentFrame] = useState<string>('*');
  const [isAnimationFinished, setIsAnimationFinished] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: number;
    let frameIndex = 0;
    setIsAnimationFinished(false);

    function showNextFrame() {
        if (!artData || !artData.frames || frameIndex >= artData.frames.length) {
            if (artData) {
              setIsAnimationFinished(true);
            }
            return; 
        }
        setCurrentFrame(artData.frames[frameIndex]);
        frameIndex++;
        timeoutId = window.setTimeout(showNextFrame, 120);
    }

    if (artData && artData.frames) {
      setCurrentFrame('*');
      showNextFrame();
    } else {
      if(artData) {
        setIsAnimationFinished(true);
      } else {
        setCurrentFrame('*');
      }
    }
    
    return () => window.clearTimeout(timeoutId);
  }, [artData]);

  const accessibilityLabel = `${topic} için ASCII sanatı`;

  if (!artData) {
    return (
      <div className="ascii-art-container">
        <pre className="ascii-art" aria-label={accessibilityLabel}>*</pre>
      </div>
    );
  }

  if (!isAnimationFinished) {
    return (
      <div className="ascii-art-container">
        <pre className="ascii-art" aria-label={accessibilityLabel}>
          {currentFrame}
        </pre>
      </div>
    );
  }

  return (
    <div className="ascii-art-container">
      <pre className="ascii-art" aria-label={accessibilityLabel}>
        {artData.art.map((line, index) => {
          const isLastLine = index === artData.art.length - 1;
          if (line.endsWith('=|')) {
            return (
              <React.Fragment key={index}>
                {line.substring(0, line.length - 2)}
                <span className={isHandleVisible ? 'pulsing-handle' : ''}>=</span>
                |
                {!isLastLine && '\n'}
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={index}>
              {line}
              {!isLastLine && '\n'}
            </React.Fragment>
          );
        })}
      </pre>
    </div>
  );
};

export default AsciiArtDisplay;