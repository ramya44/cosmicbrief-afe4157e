/**
 * PDF generator for Vedic forecasts using pdf-lib
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";

interface ForecastSection {
  heading: string;
  content: ContentItem[];
}

interface ContentItem {
  type: string;
  text?: string;
  label?: string;
  title?: string;
  items?: string[];
  date_range?: string;
  what_happening?: string;
  astrology?: string;
  key_actions?: string;
  transitions?: { date: string; significance: string }[];
  quarter?: string;
  question?: string;
  guidance?: string;
}

interface ForecastJson {
  title: string;
  subtitle: string;
  sections: ForecastSection[];
}

interface UserDetails {
  name?: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
}

// Helper to wrap text
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Strip markdown for plain text
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1');
}

export async function generateForecastPdf(
  forecastJson: string | ForecastJson,
  userDetails: UserDetails
): Promise<Uint8Array> {
  // Parse JSON if string
  let forecast: ForecastJson;
  if (typeof forecastJson === 'string') {
    // Handle potential markdown code blocks
    let jsonString = forecastJson.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    forecast = JSON.parse(jsonString);
  } else {
    forecast = forecastJson;
  }

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 60;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const goldColor = rgb(0.83, 0.69, 0.22);
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  let pageNumber = 1;
  
  // Helper to add new page
  const addNewPage = (): PDFPage => {
    pageNumber++;
    const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
    return newPage;
  };
  
  // Helper to check if we need a new page
  const ensureSpace = (neededHeight: number): void => {
    if (yPosition - neededHeight < margin + 40) {
      currentPage = addNewPage();
    }
  };
  
  // Draw page footer
  const drawFooter = (page: PDFPage, pageNum: number): void => {
    page.drawText(`Page ${pageNum}`, {
      x: pageWidth / 2 - 20,
      y: 30,
      size: 10,
      font: timesRoman,
      color: lightGray,
    });
    page.drawText('cosmicbrief.com', {
      x: margin,
      y: 30,
      size: 10,
      font: timesRomanItalic,
      color: lightGray,
    });
  };
  
  // ===== COVER PAGE =====
  
  // Title
  const titleFontSize = 32;
  currentPage.drawText('Your Complete 2026', {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: timesRomanBold,
    color: goldColor,
  });
  yPosition -= 40;
  
  currentPage.drawText('Vedic Forecast', {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: timesRomanBold,
    color: goldColor,
  });
  yPosition -= 60;
  
  // Decorative line
  currentPage.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 200, y: yPosition },
    thickness: 2,
    color: goldColor,
  });
  yPosition -= 50;
  
  // User details
  if (userDetails.name) {
    currentPage.drawText(`Prepared for ${userDetails.name}`, {
      x: margin,
      y: yPosition,
      size: 18,
      font: timesRomanItalic,
      color: textColor,
    });
    yPosition -= 30;
  }
  
  currentPage.drawText(`Birth Date: ${userDetails.birth_date}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: timesRoman,
    color: textColor,
  });
  yPosition -= 22;
  
  currentPage.drawText(`Birth Time: ${userDetails.birth_time}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: timesRoman,
    color: textColor,
  });
  yPosition -= 22;
  
  currentPage.drawText(`Birth Location: ${userDetails.birth_location}`, {
    x: margin,
    y: yPosition,
    size: 14,
    font: timesRoman,
    color: textColor,
  });
  yPosition -= 60;
  
  // Generated date
  const generatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  currentPage.drawText(`Generated on ${generatedDate}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: timesRomanItalic,
    color: lightGray,
  });
  
  // Cosmic Brief branding at bottom
  currentPage.drawText('Cosmic Brief', {
    x: margin,
    y: margin + 40,
    size: 24,
    font: timesRomanBold,
    color: goldColor,
  });
  currentPage.drawText('Vedic Astrology for Your Life Journey', {
    x: margin,
    y: margin + 20,
    size: 12,
    font: timesRomanItalic,
    color: lightGray,
  });
  
  drawFooter(currentPage, pageNumber);
  
  // ===== CONTENT PAGES =====
  
  for (const section of forecast.sections) {
    // Start new page for each major section
    currentPage = addNewPage();
    
    // Section heading
    const headingLines = wrapText(section.heading, timesRomanBold, 22, contentWidth);
    for (const line of headingLines) {
      ensureSpace(30);
      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: 22,
        font: timesRomanBold,
        color: goldColor,
      });
      yPosition -= 28;
    }
    yPosition -= 15;
    
    // Section content
    for (const item of section.content) {
      switch (item.type) {
        case 'paragraph':
          if (item.text) {
            const text = stripMarkdown(item.text);
            const lines = wrapText(text, timesRoman, 12, contentWidth);
            for (const line of lines) {
              ensureSpace(18);
              currentPage.drawText(line, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesRoman,
                color: textColor,
              });
              yPosition -= 18;
            }
            yPosition -= 10;
          }
          break;
          
        case 'astrology_note':
          ensureSpace(60);
          // Label
          if (item.label) {
            currentPage.drawText(stripMarkdown(item.label), {
              x: margin + 10,
              y: yPosition,
              size: 11,
              font: timesRomanBold,
              color: goldColor,
            });
            yPosition -= 18;
          }
          // Text
          if (item.text) {
            const text = stripMarkdown(item.text);
            const lines = wrapText(text, timesRomanItalic, 11, contentWidth - 20);
            for (const line of lines) {
              ensureSpace(16);
              currentPage.drawText(line, {
                x: margin + 10,
                y: yPosition,
                size: 11,
                font: timesRomanItalic,
                color: lightGray,
              });
              yPosition -= 16;
            }
          }
          yPosition -= 15;
          break;
          
        case 'period':
          ensureSpace(100);
          // Date range and title
          if (item.date_range) {
            currentPage.drawText(item.date_range, {
              x: margin,
              y: yPosition,
              size: 14,
              font: timesRomanBold,
              color: goldColor,
            });
            yPosition -= 20;
          }
          if (item.title) {
            currentPage.drawText(stripMarkdown(item.title), {
              x: margin,
              y: yPosition,
              size: 13,
              font: timesRomanBold,
              color: textColor,
            });
            yPosition -= 22;
          }
          // What's happening
          if (item.what_happening) {
            const text = stripMarkdown(item.what_happening);
            const lines = wrapText(text, timesRoman, 12, contentWidth);
            for (const line of lines) {
              ensureSpace(18);
              currentPage.drawText(line, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesRoman,
                color: textColor,
              });
              yPosition -= 18;
            }
            yPosition -= 8;
          }
          // Astrology note
          if (item.astrology) {
            const text = stripMarkdown(item.astrology);
            const lines = wrapText(text, timesRomanItalic, 11, contentWidth);
            for (const line of lines) {
              ensureSpace(16);
              currentPage.drawText(line, {
                x: margin,
                y: yPosition,
                size: 11,
                font: timesRomanItalic,
                color: lightGray,
              });
              yPosition -= 16;
            }
            yPosition -= 8;
          }
          // Key actions
          if (item.key_actions) {
            ensureSpace(20);
            currentPage.drawText('Key Actions:', {
              x: margin,
              y: yPosition,
              size: 11,
              font: timesRomanBold,
              color: textColor,
            });
            yPosition -= 16;
            const text = stripMarkdown(item.key_actions);
            const lines = wrapText(text, timesRoman, 11, contentWidth - 10);
            for (const line of lines) {
              ensureSpace(15);
              currentPage.drawText(line, {
                x: margin + 10,
                y: yPosition,
                size: 11,
                font: timesRoman,
                color: textColor,
              });
              yPosition -= 15;
            }
          }
          yPosition -= 20;
          break;
          
        case 'transitions_table':
          if (item.transitions) {
            for (const transition of item.transitions) {
              ensureSpace(35);
              currentPage.drawText(transition.date, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesRomanBold,
                color: goldColor,
              });
              const sigLines = wrapText(stripMarkdown(transition.significance), timesRoman, 11, contentWidth - 80);
              for (let i = 0; i < sigLines.length; i++) {
                currentPage.drawText(sigLines[i], {
                  x: margin + 80,
                  y: yPosition - (i * 14),
                  size: 11,
                  font: timesRoman,
                  color: textColor,
                });
              }
              yPosition -= Math.max(20, sigLines.length * 14 + 8);
            }
          }
          yPosition -= 10;
          break;
          
        case 'theme':
          ensureSpace(60);
          if (item.title) {
            currentPage.drawText('• ' + stripMarkdown(item.title), {
              x: margin,
              y: yPosition,
              size: 13,
              font: timesRomanBold,
              color: textColor,
            });
            yPosition -= 18;
          }
          if (item.text) {
            const text = stripMarkdown(item.text);
            const lines = wrapText(text, timesRoman, 12, contentWidth - 15);
            for (const line of lines) {
              ensureSpace(18);
              currentPage.drawText(line, {
                x: margin + 15,
                y: yPosition,
                size: 12,
                font: timesRoman,
                color: textColor,
              });
              yPosition -= 18;
            }
          }
          yPosition -= 10;
          break;
          
        case 'decision':
          ensureSpace(80);
          if (item.quarter) {
            currentPage.drawText(item.quarter, {
              x: margin,
              y: yPosition,
              size: 13,
              font: timesRomanBold,
              color: goldColor,
            });
            yPosition -= 20;
          }
          if (item.question) {
            const qLines = wrapText(stripMarkdown(item.question), timesRomanBold, 12, contentWidth);
            for (const line of qLines) {
              ensureSpace(18);
              currentPage.drawText(line, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesRomanBold,
                color: textColor,
              });
              yPosition -= 18;
            }
            yPosition -= 5;
          }
          if (item.guidance) {
            const text = stripMarkdown(item.guidance);
            const lines = wrapText(text, timesRoman, 12, contentWidth);
            for (const line of lines) {
              ensureSpace(18);
              currentPage.drawText(line, {
                x: margin,
                y: yPosition,
                size: 12,
                font: timesRoman,
                color: textColor,
              });
              yPosition -= 18;
            }
          }
          yPosition -= 15;
          break;
          
        case 'benefits_list':
          // Skip CTA content in PDF
          break;
          
        case 'cta':
          // Skip CTA content in PDF
          break;
      }
    }
    
    drawFooter(currentPage, pageNumber);
  }
  
  // Add footer to all pages
  const pages = pdfDoc.getPages();
  for (let i = 1; i < pages.length; i++) {
    drawFooter(pages[i], i + 1);
  }
  
  // Save and return
  return await pdfDoc.save();
}
