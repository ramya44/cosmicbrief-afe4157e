/**
 * Email templates for Vedic forecasts
 */

export function buildVedicFreeEmailHtml(name: string | undefined, resultsUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Vedic Forecast is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="color: #d4af37; font-size: 28px; margin: 0; font-weight: 600;">✨ Cosmic Brief</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${greeting}
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Your free Vedic astrology forecast is ready! We've analyzed your birth chart to reveal insights about your personality, life journey, and what 2026 holds for you.
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Click the button below to view your personalized forecast:
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                View Your Forecast →
              </a>
            </td>
          </tr>
          
          <!-- Upgrade Teaser -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px;">
                <p style="color: #d4af37; font-size: 14px; font-weight: 600; margin: 0 0 10px;">
                  Want the full picture?
                </p>
                <p style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin: 0;">
                  Upgrade to your complete 2026 forecast with month-by-month guidance, key dates, and personalized action steps.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Cosmic Brief. All rights reserved.
              </p>
              <p style="color: #666; font-size: 12px; margin: 10px 0 0;">
                Questions? Reply to this email or contact us at support@cosmicbrief.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPaidCosmicBriefEmailHtml(name: string | undefined, resultsUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Expanded Cosmic Brief is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="color: #d4af37; font-size: 28px; margin: 0; font-weight: 600;">Cosmic Brief</h1>
              <p style="color: #f4d03f; font-size: 14px; margin: 10px 0 0; letter-spacing: 2px; text-transform: uppercase;">Expanded Analysis</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${greeting}
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: #f4d03f;">Your expanded Cosmic Brief is ready!</strong> This comprehensive analysis dives deep into your birth chart to reveal insights about your personality, relationships, career purpose, and life chapters.
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Click below to view your complete analysis:
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                View My Cosmic Brief
              </a>
            </td>
          </tr>

          <!-- What's Included -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px;">
                <p style="color: #d4af37; font-size: 14px; font-weight: 600; margin: 0 0 15px;">
                  Your Expanded Analysis Includes:
                </p>
                <p style="color: #e0e0e0; font-size: 13px; line-height: 1.5; margin: 0;">
                  <span style="color: #d4af37;">&#10003;</span> Complete Personality Profile (Rising, Sun, Moon)<br>
                  <span style="color: #d4af37;">&#10003;</span> Relationship Patterns & Compatibility<br>
                  <span style="color: #d4af37;">&#10003;</span> Career & Life Purpose Guidance<br>
                  <span style="color: #d4af37;">&#10003;</span> Full Life Chapter Timeline<br>
                  <span style="color: #d4af37;">&#10003;</span> Growth Edge Analysis with Action Steps
                </p>
              </div>
            </td>
          </tr>

          <!-- Bookmark Reminder -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin: 0; text-align: center;">
                <strong style="color: #e0e0e0;">Pro tip:</strong> Bookmark your Cosmic Brief for easy reference whenever you need guidance!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Cosmic Brief. All rights reserved.
              </p>
              <p style="color: #666; font-size: 12px; margin: 10px 0 0;">
                Questions? Reply to this email or contact us at support@cosmicbrief.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVedicPaidEmailHtml(name: string | undefined, resultsUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Complete Vedic Cosmic Brief is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="color: #d4af37; font-size: 28px; margin: 0; font-weight: 600;">✨ Cosmic Brief</h1>
              <p style="color: #f4d03f; font-size: 14px; margin: 10px 0 0; letter-spacing: 2px; text-transform: uppercase;">Premium Forecast</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${greeting}
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: #f4d03f;">Congratulations!</strong> Your complete 2026 Vedic astrology forecast is now ready. This comprehensive report includes month-by-month guidance, key transition dates, and personalized action steps tailored specifically for you.
              </p>
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Click below to view your forecast online, or download the attached PDF for offline access:
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                View Online →
              </a>
            </td>
          </tr>
          
          <!-- What's Included -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px;">
                <p style="color: #d4af37; font-size: 14px; font-weight: 600; margin: 0 0 15px;">
                  📎 PDF Attached for Your Records
                </p>
                <p style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin: 0 0 10px;">
                  Your complete forecast is attached as a PDF. Save it, print it, or reference it anytime throughout your transformative year ahead.
                </p>
                <p style="color: #e0e0e0; font-size: 13px; line-height: 1.5; margin: 0;">
                  <span style="color: #d4af37;">✓</span> 2026 Year Overview<br>
                  <span style="color: #d4af37;">✓</span> Month-by-Month Breakdown<br>
                  <span style="color: #d4af37;">✓</span> Key Transition Dates<br>
                  <span style="color: #d4af37;">✓</span> Pivotal Themes & Decisions<br>
                  <span style="color: #d4af37;">✓</span> Personalized Action Steps
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Bookmark Reminder -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin: 0; text-align: center;">
                💡 <strong style="color: #e0e0e0;">Pro tip:</strong> Bookmark your online forecast for easy access throughout the year!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Cosmic Brief. All rights reserved.
              </p>
              <p style="color: #666; font-size: 12px; margin: 10px 0 0;">
                Questions? Reply to this email or contact us at support@cosmicbrief.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// WEEKLY HOROSCOPE EMAIL TEMPLATES
// ============================================

export interface WeeklyHoroscopeContent {
  weekStart: string;
  weekEnd: string;
  masterOverview: string;
  moonSignContent: string;
  nakshatraContent: string;
}

export function buildWeeklyHoroscopeEmailHtml(
  name: string | undefined,
  content: WeeklyHoroscopeContent,
  unsubscribeUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Cosmic Forecast</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0a0a0f; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 24px 15px; text-align: center;">
              <p style="color: #d4af37; font-size: 12px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">Weekly Forecast</p>
              <h1 style="color: #f5f5dc; font-size: 22px; margin: 0; font-weight: 600;">${content.weekStart} – ${content.weekEnd}</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 10px 24px 0;">
              <p style="color: #e0e0e0; font-size: 15px; line-height: 1.5; margin: 0;">
                ${greeting}
              </p>
            </td>
          </tr>

          <!-- Master Overview -->
          <tr>
            <td style="padding: 20px 24px;">
              <div style="background: rgba(212, 175, 55, 0.08); border-left: 3px solid #d4af37; border-radius: 0 8px 8px 0; padding: 16px;">
                <p style="color: #d4af37; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">This Week's Energy</p>
                <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0;">
                  ${content.masterOverview}
                </p>
              </div>
            </td>
          </tr>

          <!-- Moon Sign Section -->
          <tr>
            <td style="padding: 0 24px 20px;">
              <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="color: #d4af37; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">☽ Your Moon Sign Forecast</p>
                <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0;">
                  ${content.moonSignContent}
                </p>
              </div>
            </td>
          </tr>

          <!-- Nakshatra Section -->
          <tr>
            <td style="padding: 0 24px 20px;">
              <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="color: #d4af37; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">✦ Your Nakshatra Insight</p>
                <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0;">
                  ${content.nakshatraContent}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 24px 24px;" align="center">
              <a href="https://cosmicbrief.com" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Get Your Full 2026 Forecast
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
              <p style="color: #666; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Cosmic Brief
              </p>
              <p style="color: #555; font-size: 11px; margin: 10px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #555; text-decoration: underline;">Unsubscribe</a> from weekly forecasts
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWeeklyHoroscopeEmailText(
  name: string | undefined,
  content: WeeklyHoroscopeContent,
  unsubscribeUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `WEEKLY COSMIC FORECAST
${content.weekStart} – ${content.weekEnd}

${greeting}

Here's your personalized weekly forecast.

---

THIS WEEK'S ENERGY

${content.masterOverview}

---

YOUR MOON SIGN FORECAST

${content.moonSignContent}

---

YOUR NAKSHATRA INSIGHT

${content.nakshatraContent}

---

Want deeper insights? Get your full 2026 forecast at https://cosmicbrief.com

---

© ${new Date().getFullYear()} Cosmic Brief
Unsubscribe: ${unsubscribeUrl}
`;
}

// ============================================
// PERSONALIZED WEEKLY FORECAST EMAIL TEMPLATES
// ============================================

export interface WeeklyForecastEmailContent {
  weekStart: string;
  weekEnd: string;
  weekSummary: string;
  moneyDays: Array<{ day: string; date: string; quality: string; reason: string }>;
  conversationDays: Array<{ day: string; date: string; quality: string; reason: string }>;
  luckyDays: Array<{ day: string; date: string; area: string; reason: string }>;
  lookForwardTo: string[];
  avoid: string[];
  isTrial: boolean;
  resultsUrl: string;
}

function getQualityEmoji(quality: string): string {
  const emojiMap: Record<string, string> = {
    excellent: '✨',
    good: '👍',
    favorable: '💬',
    neutral: '⚖️',
    challenging: '⚠️',
  };
  return emojiMap[quality] || '•';
}

function getQualityColor(quality: string): string {
  const colorMap: Record<string, string> = {
    excellent: '#22c55e',
    good: '#10b981',
    favorable: '#3b82f6',
    neutral: '#6b7280',
    challenging: '#f97316',
  };
  return colorMap[quality] || '#6b7280';
}

export function buildWeeklyForecastEmailHtml(
  name: string | undefined,
  content: WeeklyForecastEmailContent,
  unsubscribeUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const moneyDaysHtml = content.moneyDays.map(day => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="min-width: 60px; text-align: center;">
            <div style="color: #d4af37; font-weight: 600; font-size: 14px;">${day.day}</div>
            <div style="color: #666; font-size: 11px;">${day.date}</div>
          </div>
          <div>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; background: ${getQualityColor(day.quality)}20; color: ${getQualityColor(day.quality)}; border: 1px solid ${getQualityColor(day.quality)}40; margin-bottom: 4px;">${day.quality}</span>
            <p style="color: #a0a0a0; font-size: 13px; margin: 0; line-height: 1.4;">${day.reason}</p>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const luckyDaysHtml = content.luckyDays.map(day => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="min-width: 60px; text-align: center;">
            <div style="color: #d4af37; font-weight: 600; font-size: 14px;">${day.day}</div>
            <div style="color: #666; font-size: 11px;">${day.date}</div>
          </div>
          <div>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; background: #8b5cf620; color: #a78bfa; border: 1px solid #8b5cf640; margin-bottom: 4px;">${day.area}</span>
            <p style="color: #a0a0a0; font-size: 13px; margin: 0; line-height: 1.4;">${day.reason}</p>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const lookForwardHtml = content.lookForwardTo.map(item => `
    <li style="color: #a0a0a0; font-size: 13px; margin: 6px 0; padding-left: 4px;">
      <span style="color: #22c55e;">→</span> ${item}
    </li>
  `).join('');

  const avoidHtml = content.avoid.map(item => `
    <li style="color: #a0a0a0; font-size: 13px; margin: 6px 0; padding-left: 4px;">
      <span style="color: #f97316;">→</span> ${item}
    </li>
  `).join('');

  const trialCta = content.isTrial ? `
    <tr>
      <td style="padding: 20px 24px;">
        <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #d4af37; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Keep the insights coming</p>
          <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 16px;">Subscribe for $5/month to receive your personalized weekly forecast every Sunday.</p>
          <a href="${content.resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Subscribe Now
          </a>
        </div>
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Cosmic Forecast</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 24px 15px; text-align: center;">
              <p style="color: #d4af37; font-size: 12px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">Your Week Ahead</p>
              <h1 style="color: #f5f5dc; font-size: 24px; margin: 0; font-weight: 600;">${content.weekStart} – ${content.weekEnd}</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 10px 24px 0;">
              <p style="color: #e0e0e0; font-size: 15px; line-height: 1.5; margin: 0;">
                ${greeting}
              </p>
            </td>
          </tr>

          <!-- Week Summary -->
          <tr>
            <td style="padding: 20px 24px;">
              <div style="background: rgba(212, 175, 55, 0.08); border-left: 3px solid #d4af37; border-radius: 0 8px 8px 0; padding: 16px;">
                <p style="color: #d4af37; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">Week Overview</p>
                <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0;">
                  ${content.weekSummary}
                </p>
              </div>
            </td>
          </tr>

          <!-- Money Days -->
          ${content.moneyDays.length > 0 ? `
          <tr>
            <td style="padding: 0 24px 20px;">
              <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="color: #22c55e; font-size: 12px; font-weight: 600; margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase;">💰 Best Days for Money</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${moneyDaysHtml}
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Lucky Days -->
          ${content.luckyDays.length > 0 ? `
          <tr>
            <td style="padding: 0 24px 20px;">
              <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="color: #eab308; font-size: 12px; font-weight: 600; margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase;">⭐ Lucky Days</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${luckyDaysHtml}
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Two Column: Look Forward To / Avoid -->
          <tr>
            <td style="padding: 0 24px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" valign="top" style="padding-right: 8px;">
                    <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 8px; padding: 12px;">
                      <p style="color: #22c55e; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">👍 Look Forward To</p>
                      <ul style="margin: 0; padding: 0; list-style: none;">
                        ${lookForwardHtml}
                      </ul>
                    </div>
                  </td>
                  <td width="48%" valign="top" style="padding-left: 8px;">
                    <div style="background: rgba(249, 115, 22, 0.05); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 8px; padding: 12px;">
                      <p style="color: #f97316; font-size: 11px; font-weight: 600; margin: 0 0 8px; letter-spacing: 1px; text-transform: uppercase;">⚠️ Avoid</p>
                      <ul style="margin: 0; padding: 0; list-style: none;">
                        ${avoidHtml}
                      </ul>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trial CTA -->
          ${trialCta}

          <!-- View Full Forecast -->
          <tr>
            <td style="padding: 0 24px 24px;" align="center">
              <a href="${content.resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a1a2e; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Full Forecast
              </a>
            </td>
          </tr>

          <!-- 2026 Upsell -->
          <tr>
            <td style="padding: 0 24px 20px; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                Want the bigger picture? <a href="https://cosmicbrief.com/2026" style="color: #d4af37; text-decoration: underline;">Get your 2026 Yearly Forecast</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
              <p style="color: #666; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Cosmic Brief
              </p>
              <p style="color: #555; font-size: 11px; margin: 10px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #555; text-decoration: underline;">Unsubscribe</a> from weekly forecasts
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWeeklyForecastEmailText(
  name: string | undefined,
  content: WeeklyForecastEmailContent,
  unsubscribeUrl: string
): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const moneyDaysText = content.moneyDays.map(day =>
    `• ${day.day} (${day.date}) - ${day.quality}: ${day.reason}`
  ).join('\n');

  const luckyDaysText = content.luckyDays.map(day =>
    `• ${day.day} (${day.date}) - ${day.area}: ${day.reason}`
  ).join('\n');

  const lookForwardText = content.lookForwardTo.map(item => `• ${item}`).join('\n');
  const avoidText = content.avoid.map(item => `• ${item}`).join('\n');

  return `YOUR WEEK AHEAD
${content.weekStart} – ${content.weekEnd}

${greeting}

Here's your personalized weekly forecast.

---

WEEK OVERVIEW

${content.weekSummary}

---

BEST DAYS FOR MONEY

${moneyDaysText}

---

LUCKY DAYS

${luckyDaysText}

---

LOOK FORWARD TO

${lookForwardText}

---

WHAT TO AVOID

${avoidText}

---

View your full forecast: ${content.resultsUrl}

${content.isTrial ? `
---

KEEP THE INSIGHTS COMING

Subscribe for $5/month to receive your personalized weekly forecast every Sunday.
Subscribe: ${content.resultsUrl}
` : ''}

---

Want the bigger picture? Get your 2026 Yearly Forecast at https://cosmicbrief.com/2026

---

© ${new Date().getFullYear()} Cosmic Brief
Unsubscribe: ${unsubscribeUrl}
`;
}
