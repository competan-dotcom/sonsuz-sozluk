/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI} from '@google/genai';

// Vite'ın anahtarı tarayıcıya bu şekilde vermesi gerekir
const VITE_API_KEY = import.meta.env.VITE_API_KEY;

// The "!" asserts API_KEY is non-null after the check.
const ai = new GoogleGenAI({apiKey: VITE_API_KEY!});
const textModelName = 'gemini-2.5-flash-lite';

export interface AsciiArtData {
  art: string[];
  frames: string[];
}

/**
 * Streams a definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @returns An async generator that yields text chunks of the definition.
 */
export async function* streamDefinition(
  topic: string,
): AsyncGenerator<string, void, undefined> {
  if (!VITE_API_KEY) {
    yield 'hata: api_key yapılandırılmamış. devam etmek için lütfen ortam değişkenlerinizi kontrol edin.';
    return;
  }

  const prompt = `"${topic}" terimi için ansiklopedi tarzında, kısa ve tek paragraflık bir tanım sağla. bilgilendirici ve tarafsız ol. markdown, başlık veya herhangi bir özel biçimlendirme kullanma. yalnızca tanımın metniyle yanıt ver. tüm yanıt küçük harflerle olmalıdır.`;

  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for the lowest possible latency, as requested.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        // Force to lowercase on the client side for guaranteed consistency.
        yield chunk.text.toLowerCase();
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'bilinmeyen bir hata oluştu.';
    yield `hata: "${topic}" için içerik oluşturulamadı. ${errorMessage}`;
    // Re-throwing allows the caller to handle the error state definitively.
    throw new Error(errorMessage);
  }
}

/**
 * Refines an existing definition based on user-provided suggestions.
 * @param topic The word or term being defined.
 * @param originalDefinition The original definition text.
 * @param suggestion The user's suggested changes or new definition.
 * @returns An async generator that yields text chunks of the new definition.
 */
export async function* refineDefinition(
  topic: string,
  originalDefinition: string,
  suggestion: string,
): AsyncGenerator<string, void, undefined> {
  if (!VITE_API_KEY) {
    yield 'hata: api anahtarı yapılandırılmamış.';
    return;
  }

  const prompt = `
    "${topic}" kelimesi için mevcut tanımı, sağlanan öneriye göre geliştir.

    mevcut tanım:
    "${originalDefinition}"

    önerilen değişiklik/yeni tanım:
    "${suggestion}"

    görev: öneriyi dikkate alarak yeni, geliştirilmiş, tek paragraflık bir tanım oluştur. yeni tanım, ansiklopedi tarzında, bilgilendirici ve tarafsız olmalıdır. markdown, başlık veya herhangi bir özel biçimlendirme kullanma. yalnızca tanımın metniyle yanıt ver. tüm yanıt küçük harflerle olmalıdır.
  `;
  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text.toLowerCase();
      }
    }
  } catch (error) {
    console.error('gemini\'den akış sırasında hata:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'bilinmeyen bir hata oluştu.';
    yield `hata: "${topic}" için içerik oluşturulamadı. ${errorMessage}`;
    throw new Error(errorMessage);
  }
}


/**
 * Generates a single random word or concept using the Gemini API.
 * @returns A promise that resolves to a single random word.
 */
export async function getRandomWord(): Promise<string> {
  if (!VITE_API_KEY) {
    throw new Error('API_KEY is not configured.');
  }

  const prompt = `İlgi çekici, tek kelimelik veya iki kelimelik bir Türkçe kavram oluştur. Bu bir isim, fiil, sıfat veya özel isim olabilir. Sadece kelime veya kavramın kendisiyle, fazladan metin, noktalama işareti veya biçimlendirme olmadan yanıt ver.`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for low latency.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error getting random word from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not get random word: ${errorMessage}`);
  }
}

/**
 * Konu için ASCII sanatı oluşturur.
 * @param topic Sanatın oluşturulacağı konu.
 * @param screenWidth Tarayıcı penceresinin geçerli genişliği.
 * @returns Sanatı içeren bir nesneye çözümlenen bir söz.
 */
export async function generateAsciiArt(topic: string, screenWidth?: number): Promise<AsciiArtData> {
  const paddedTopic = ` ${topic} `;
  const topicWidth = paddedTopic.length;

  // Cihaz genişliğine göre kapı genişliğini ayarla.
  const isMobile = screenWidth && screenWidth < 768;
  const gateWidth = isMobile ? 20 : 48; 
  const doorHeight = 9; // Toplam 11 satır için 9 orta satır.

  // --- Yapı Taşları ---
  const topGate = `+${'='.repeat(gateWidth)}+`;
  const bottomGate = `+${'='.repeat(gateWidth)}+`;
  
  // Kapı kolu ve boş satırlar için bileşenler.
  const emptyBodyLine = `|${' '.repeat(gateWidth)}|`;
  const emptyLineWithHandle = `|${' '.repeat(gateWidth - 1)}=|`;
  
  const middleIndex = Math.floor(doorHeight / 2);

  const emptyGateMiddleLines = Array.from({ length: doorHeight }, (_, i) => 
    i === middleIndex ? emptyLineWithHandle : emptyBodyLine
  );
  const emptyGate = [topGate, ...emptyGateMiddleLines, bottomGate].join('\n');

  // --- Konu ile Son Sanat ---
  let topicContent: string;
  // Kapı kolu için bir karakter boşluk bırak.
  const contentWidth = gateWidth - 1;

  // Konu mevcut alandan uzunsa, onu kırp.
  if (topicWidth > contentWidth) {
    // Kırpılmış metin ve "..." için yer olduğundan emin ol.
    topicContent = paddedTopic.substring(0, contentWidth - 3) + '...';
  } else {
    topicContent = paddedTopic;
  }

  // Konuyu kapı içinde sola yasla ve kapı kolu için yer bırak.
  const paddingNeeded = contentWidth - topicContent.length;
  const rightPad = ' '.repeat(paddingNeeded);
  const leftAlignedTopicString = `${topicContent}${rightPad}`;
  
  const topicLineWithHandle = `|${leftAlignedTopicString}=|`; // Kapı kolunu ve metni içeren satır.
  
  const finalArtMiddleLines = Array.from({ length: doorHeight }, (_, i) => 
    i === middleIndex ? topicLineWithHandle : emptyBodyLine
  );
  const finalArt = [topGate, ...finalArtMiddleLines, bottomGate];
  
  const frames: string[] = [];

  // --- Animasyon Sırası ---

  // 1. "kapılar açılıyor..." metin animasyonu
  const openingText = 'kapılar açılıyor...';
  // Dikey yüksekliği yeni kapı yüksekliğiyle eşleştir (7 satır).
  const animationHeight = doorHeight + 2; 
  const topPaddingLines = Math.floor((animationHeight - 1) / 2); // 3 satır
  const bottomPaddingLines = Math.ceil((animationHeight - 1) / 2); // 3 satır
  const topPadding = '\n'.repeat(topPaddingLines);
  const bottomPadding = '\n'.repeat(bottomPaddingLines);
  
  for (let i = 1; i <= openingText.length; i++) {
    const textFrame = `${topPadding}${openingText.substring(0, i)}${bottomPadding}`;
    frames.push(textFrame);
  }
  const fullTextFrame = `${topPadding}${openingText}${bottomPadding}`;
  frames.push(fullTextFrame);
  frames.push(fullTextFrame);

  const emptySpace = '\n'.repeat(animationHeight);
  frames.push(emptySpace);

  // 2. Kapı satır satır belirir.
  const doorLines = emptyGate.split('\n');
  for (let i = 1; i <= doorLines.length; i++) {
    const partialDoor = doorLines.slice(0, i).join('\n');
    frames.push(partialDoor);
  }
  frames.push(emptyGate);

  // 3. Enerji kapı gövdesinde çatırdar.
  const crackleChars = '.*+*°*+*.';
  for (let i = 0; i < 5; i++) {
      const crackleLines = [];
      for (let j = 0; j < doorHeight; j++) {
          let crackleLineContent = '';
          for (let k = 0; k < gateWidth; k++) {
              crackleLineContent += crackleChars[Math.floor(Math.random() * crackleChars.length)];
          }
          crackleLines.push(`|${crackleLineContent}|`);
      }
      frames.push([topGate, ...crackleLines, bottomGate].join('\n'));
  }

  // 4. Bir ışık parlaması.
  const flashLine = `|${'#'.repeat(gateWidth)}|`;
  const flashLines = Array(doorHeight).fill(flashLine);
  frames.push([topGate, ...flashLines, bottomGate].join('\n'));

  // 5. Konu belirir.
  frames.push(finalArt.join('\n'));

  return { art: finalArt, frames };
}

/**
 * İçinde metin bulunan statik, sabit bir ASCII kutusu oluşturur.
 * @param lines Kutunun içine yerleştirilecek metin satırları dizisi.
 * @param screenWidth Tarayıcı penceresinin geçerli genişliği.
 * @returns Oluşturulan ASCII sanatını içeren bir dize dizisi.
 */
export function generateStaticAsciiBox(lines: string[], screenWidth?: number): string[] {
  const isMobile = screenWidth && screenWidth < 768;
  const gateWidth = isMobile ? 20 : 48;
  const doorHeight = 9;

  const topGate = `+${'='.repeat(gateWidth)}+`;
  const bottomGate = `+${'='.repeat(gateWidth)}+`;
  const emptyBodyLine = `|${' '.repeat(gateWidth)}|`;

  // Metni dikey olarak ortala
  const totalEmptyRows = doorHeight - lines.length;
  const topPaddingRows = Math.floor(totalEmptyRows / 2);
  const bottomPaddingRows = Math.ceil(totalEmptyRows / 2);

  // Metin satırlarını sağa hizala
  const rightAlignedTextLines = lines.map(line => {
    const text = line.length > gateWidth ? line.substring(0, gateWidth) : line;
    const padding = gateWidth - text.length;
    const leftPadding = Math.max(0, padding);
    return `|${' '.repeat(leftPadding)}${text}|`;
  });

  // Kutunun orta bölümünü oluştur
  const middleLines = [
    ...Array(topPaddingRows).fill(emptyBodyLine),
    ...rightAlignedTextLines,
    ...Array(bottomPaddingRows).fill(emptyBodyLine),
  ];

  // Orta satıra sol kapı kolunu ekle
  const middleIndex = Math.floor(doorHeight / 2);
  if (middleLines[middleIndex]) {
    // Kapı kolunun olduğu satır için metin satırını bul
    const originalLineIndex = middleIndex - topPaddingRows;
    
    // Orta satırın bir metin satırına karşılık gelip gelmediğini kontrol et
    if (originalLineIndex >= 0 && originalLineIndex < lines.length) {
      // Bu, metin içeren bir satır. Metni kapı koluyla yeniden hizala.
      const lineText = lines[originalLineIndex];
      const contentWidth = gateWidth - 1; // Kapı kolunun yanındaki metin için alan
      const text = lineText.length > contentWidth ? lineText.substring(0, contentWidth) : lineText;
      const padding = contentWidth - text.length;
      const leftPadding = Math.max(0, padding);
      middleLines[middleIndex] = `|=${' '.repeat(leftPadding)}${text}|`;
    } else {
      // Bu boş bir dolgu satırı. Sadece kapı kolunu ekle.
      middleLines[middleIndex] = `|=${' '.repeat(gateWidth - 1)}|`;
    }
  }

  return [topGate, ...middleLines, bottomGate];
}
