/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { streamDefinition, generateAsciiArt, AsciiArtData, refineDefinition, generateStaticAsciiBox } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';
import ThemeToggle from './components/ThemeToggle';

// Kullanıcı tarafından sağlanan özel tanımlar
const CUSTOM_DEFINITIONS = [
  { word: 'zaman', definition: 'sonluk.' },
  { word: 'bulut', definition: 'sınırlı beyazlık.' },
  { word: 'wifi', definition: 'bağımlık.' },
  { word: 'selfie', definition: 'münhasır bölgen.' },
  { word: 'coinci', definition: 'umarbaz.' },
  { word: 'cc:', definition: 'yancı.' },
  { word: 'ulaç', definition: 'tabirci.' }
];

// Rastgele butonu için özel kelimeler ve seçilmiş genel kelimelerden oluşan havuz.
const RANDOM_SUGGESTIONS = [
  ...CUSTOM_DEFINITIONS.map(d => d.word),
  'denge', 'ışık', 'gölge', 'boşluk', 'yankı', 'paradoks', 'arayış', 'rüya', 'zaman', 'sonsuzluk', 'hafıza', 'sessizlik', 'yolculuk'
];

const App: React.FC = () => {
  const [currentTopic, setCurrentTopic] = useState<string>('hipermetin');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [staticAscii, setStaticAscii] = useState<string[]>([]);
  const [isHandleVisible, setIsHandleVisible] = useState<boolean>(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  const [animationClass, setAnimationClass] = useState('fade-in');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMuhayyeli, setIsMuhayyeli] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Statik ASCII kutusunu oluşturan ve yeniden boyutlandırmayı yöneten useEffect
  useEffect(() => {
    const updateStaticAscii = () => {
      const art = generateStaticAsciiBox(
        [
          '..',
          'iki',
          'kapılı',
          'bir',
          'handa',
          'gidiyorum',
          'gündüz',
          'gece',
          '..'
        ],
        window.innerWidth
      );
      setStaticAscii(art);
    };

    updateStaticAscii(); // İlk oluşturma
    window.addEventListener('resize', updateStaticAscii);
    return () => window.removeEventListener('resize', updateStaticAscii);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const navigateToTopic = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setAnimationClass('fade-out');
      setTimeout(() => {
        setCurrentTopic(newTopic);
        setAnimationClass('fade-in');
      }, 300); // Must match CSS fade-out duration
    }
  }, [currentTopic]);

  useEffect(() => {
    if (!currentTopic) return;

    let isCancelled = false;
    const lowerCaseTopic = currentTopic.toLowerCase();
    setIsHandleVisible(false);

    const customDefinitionEntry = CUSTOM_DEFINITIONS.find(
      (entry) => entry.word.toLowerCase() === lowerCaseTopic
    );
    setIsMuhayyeli(!!customDefinitionEntry);

    // Özel, sabit kodlanmış konular için işlem.
    if (customDefinitionEntry || lowerCaseTopic === '2025' || lowerCaseTopic === 'competanai' || lowerCaseTopic === 'dev valladares') {
      setIsLoading(true);
      setError(null);
      setContent('');
      setAsciiArt(null);
      setIsEditing(false);

      generateAsciiArt(currentTopic, window.innerWidth)
        .then(art => {
          if (!isCancelled) setAsciiArt(art);
        });
      
      // Konuya göre tanımı belirle.
      let definition = '';
      if (customDefinitionEntry) {
        definition = customDefinitionEntry.definition;
      } else {
        switch (lowerCaseTopic) {
          case '2025':
            definition = "2026'dan önceki, 2024'ten sonraki sene.";
            break;
          case 'competanai':
            definition = "yapay zeka tasarımlarıyla uğraşan bir fani. tevellütten mütevellit bu namütenahi sözlük işine kafayı takmıştır.";
            break;
          case 'dev valladares':
            definition = "bu algoritmanın ilk sahibi. competanai'ye ilham veren fani.";
            break;
        }
      }

      // API çağrısını atla ve tanımı sabit kodla.
      setTimeout(() => {
        if (!isCancelled) {
          setContent(definition);
          setIsLoading(false);
          setIsHandleVisible(true);
        }
      }, 150); // Hızlı bir UI geçişi için küçük gecikme.

      return () => { isCancelled = true; };
    }

    const fetchContentAndArt = async () => {
      setIsMuhayyeli(false);
      setIsLoading(true);
      setError(null);
      setContent('');
      setAsciiArt(null);
      setGenerationTime(null);
      setIsEditing(false);
      const startTime = performance.now();

      generateAsciiArt(currentTopic, window.innerWidth)
        .then(art => {
          if (!isCancelled) {
            setAsciiArt(art);
          }
        });

      let accumulatedContent = '';
      try {
        for await (const chunk of streamDefinition(currentTopic)) {
          if (isCancelled) break;
          
          if (chunk.startsWith('hata:')) {
            throw new Error(chunk);
          }
          accumulatedContent += chunk;
          if (!isCancelled) {
            setContent(accumulatedContent);
          }
        }
      } catch (e: unknown) {
        if (!isCancelled) {
          const errorMessage = e instanceof Error ? e.message : 'bilinmeyen bir hata oluştu';
          setError(errorMessage);
          setContent('');
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          const endTime = performance.now();
          setGenerationTime(endTime - startTime);
          setIsLoading(false);
          setIsHandleVisible(true);
        }
      }
    };

    fetchContentAndArt();
    
    return () => {
      isCancelled = true;
    };
  }, [currentTopic]);

  const handleWordClick = useCallback((word: string) => {
    navigateToTopic(word);
  }, [navigateToTopic]);

  const handleSearch = useCallback((topic: string) => {
    navigateToTopic(topic);
  }, [navigateToTopic]);

  const handleRandom = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_SUGGESTIONS.length);
    let randomWord = RANDOM_SUGGESTIONS[randomIndex];

    if (randomWord.toLowerCase() === currentTopic.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % RANDOM_SUGGESTIONS.length;
      randomWord = RANDOM_SUGGESTIONS[nextIndex];
    }
    navigateToTopic(randomWord);
  }, [currentTopic, navigateToTopic]);

  const handleHome = useCallback(() => {
    navigateToTopic('hipermetin');
  }, [navigateToTopic]);

  const handleSuggestChangeClick = useCallback(() => {
    setEditText(content);
    setIsEditing(true);
  }, [content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  const handleSubmitSuggestion = useCallback(async () => {
    if (!editText.trim()) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setContent('');
    setIsEditing(false);

    let accumulatedContent = '';
    try {
      const stream = refineDefinition(currentTopic, content, editText);
      for await (const chunk of stream) {
        if (isCancelled) break;
        if (chunk.startsWith('hata:')) {
          throw new Error(chunk);
        }
        accumulatedContent += chunk;
        if (!isCancelled) {
          setContent(accumulatedContent);
        }
      }
    } catch (e: unknown) {
      if (!isCancelled) {
        const errorMessage = e instanceof Error ? e.message : 'bilinmeyen bir hata oluştu';
        setError(errorMessage);
        setContent('');
        console.error(e);
      }
    } finally {
      if (!isCancelled) {
        setIsLoading(false);
        setEditText('');
      }
    }
    
    return () => {
      isCancelled = true;
    };
  }, [currentTopic, content, editText]);

  const titleText = "sonsuz sözlük";

  return (
    <div>
      <SearchBar
        onSearch={handleSearch}
        onRandom={handleRandom}
        onHome={handleHome}
        isLoading={isLoading}
      />
      
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className={isLoading ? 'loading-indicator' : ''}>∞</span>
          <span className="main-title-text">
            {titleText.split('').map((char, index) => (
              <span
                key={index}
                className="pulsing-char"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </h1>
        <p className="app-description" style={{ color: 'var(--text-color-subtle)', margin: 0 }}>
            <span>[ekranda gördüğün her kelime sonsuz bir kapıdır]</span><br/>
            <span>[kelimelere tıklayın ve kapılar kapıları açsın]</span>
        </p>
        <div style={{ margin: '2rem 0' }} className={`ascii-art-wrapper ${animationClass}`}>
          <AsciiArtDisplay artData={asciiArt} topic={currentTopic} isHandleVisible={isHandleVisible} />
          <div className="static-ascii-container">
            <pre className="ascii-art" aria-label="iki kapılı bir handa gidiyorum gündüz gece">
              {staticAscii.map((line, index) => {
                const isLastLine = index === staticAscii.length - 1;
                if (line.startsWith('|=') && line.endsWith('|')) {
                  return (
                    <React.Fragment key={index}>
                      |
                      <span className={isHandleVisible ? 'pulsing-handle' : ''}>=</span>
                      {line.substring(2, line.length - 1)}|
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
        </div>
      </header>
      
      <main className={animationClass}>
        <div>
          <h2 style={{ marginBottom: '2rem', textTransform: 'lowercase' }}>
            {currentTopic}
          </h2>

          {error && (
            <div className="error-message">
              <p style={{ margin: 0 }}>bir hata oluştu</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {isLoading && content.length === 0 && !error && (
            <LoadingSkeleton />
          )}

          {!isEditing && content.length > 0 && !error && (
             <ContentDisplay 
               content={content} 
               isLoading={isLoading} 
               onWordClick={handleWordClick}
               isMuhayyeli={isMuhayyeli}
             />
          )}

          {isEditing && (
            <div className="edit-suggestion-container">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="suggestion-textarea"
                rows={5}
                aria-label="tanım önerisi"
              />
              <div className="suggestion-controls">
                <button onClick={handleSubmitSuggestion} disabled={isLoading}>gönder</button>
                <button onClick={handleCancelEdit} disabled={isLoading}>iptal</button>
              </div>
            </div>
          )}

          {isAdmin && !isEditing && !isLoading && content.length > 0 && !error && (
            <div style={{ marginTop: '1.5rem' }}>
              <button onClick={handleSuggestChangeClick} className="edit-suggestion-button">
                tanımı düzenle
              </button>
            </div>
          )}

          {!isLoading && !error && content.length === 0 && (
            <div style={{ color: 'var(--text-color-subtle)', padding: '2rem 0' }}>
              <p>içerik oluşturulamadı.</p>
            </div>
          )}

        </div>
      </main>
      
      <footer className="sticky-footer">
        <div className="footer-content">
          <p className="footer-text" style={{ margin: 0 }}>
            <button onClick={() => handleWordClick('competanai')}>
              competanai
            </button>
          </p>
          <p className="footer-text" style={{ margin: 0 }}>
            <button onClick={() => handleWordClick('Dev Valladares')}>
              ©
            </button>
            {' '}
            <button onClick={() => handleWordClick('2025')} title="2026'dan önceki, 2024'ten sonraki sene.">
              2025
            </button>
          </p>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </footer>
    </div>
  );
};

export default App;
