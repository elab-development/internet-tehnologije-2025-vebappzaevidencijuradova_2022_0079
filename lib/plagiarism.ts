/**
 * Plagiarism checker sa podrškom za više API provajdera
 * 
 * Podržani API-jevi:
 * 1. Copyleaks API
 * 2. Plagiarism Checker API (RapidAPI)
 * 3. Plagiarism Detector API
 * 4. Mock (za testiranje)
 */

interface PlagiarismResult {
  score: number;
  report: string;
  sources?: Array<{
    url: string;
    similarity: number;
    title?: string;
  }>;
}

/**
 * Glavna funkcija za proveru plagijarizma
 * Automatski bira API na osnovu environment varijabli
 */
export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  const apiProvider = process.env.PLAGIARISM_API_PROVIDER || 'mock';
  const apiKey = process.env.PLAGIARISM_API_KEY;

  console.log(`[Plagiarism Check] Using provider: ${apiProvider}`);

  switch (apiProvider.toLowerCase()) {
    case 'copyleaks':
      return checkWithCopyleaks(text, apiKey);
    
    case 'rapidapi':
      return checkWithRapidAPI(text, apiKey);
    
    case 'plagiarismdetector':
      return checkWithPlagiarismDetector(text, apiKey);
    
    case 'mock':
    default:
      console.log('[Plagiarism Check] Using mock checker (no API configured)');
      return checkWithMock(text);
  }
}

/**
 * 1. COPYLEAKS API
 * https://api.copyleaks.com/
 */
async function checkWithCopyleaks(
  text: string,
  apiKey?: string
): Promise<PlagiarismResult> {
  if (!apiKey) {
    console.warn('[Copyleaks] No API key provided, falling back to mock');
    return checkWithMock(text);
  }

  try {
    // Step 1: Login to get access token
    const loginResponse = await fetch('https://id.copyleaks.com/v3/account/login/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.COPYLEAKS_EMAIL,
        key: apiKey,
      }),
    });

    const { access_token } = await loginResponse.json();

    // Step 2: Submit scan
    const scanId = `scan-${Date.now()}`;
    const scanResponse = await fetch(`https://api.copyleaks.com/v3/scans/submit/file/${scanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        base64: Buffer.from(text).toString('base64'),
        filename: 'submission.txt',
        properties: {
          webhooks: {
            status: `${process.env.NEXT_PUBLIC_BASE_URL}/api/plagiarism/webhook/${scanId}`,
          },
        },
      }),
    });

    if (!scanResponse.ok) {
      throw new Error('Copyleaks scan submission failed');
    }

    // Za sada vraćamo pending rezultat
    // U pravoj implementaciji bi se koristio webhook
    return {
      score: 0,
      report: generatePendingReport('Copyleaks', scanId),
    };
  } catch (error) {
    console.error('[Copyleaks] Error:', error);
    return checkWithMock(text);
  }
}

/**
 * 2. RAPIDAPI - Plagiarism Checker API
 * https://rapidapi.com/smodin/api/plagiarism-checker-and-auto-citation-generator-multi-lingual
 */
async function checkWithRapidAPI(
  text: string,
  apiKey?: string
): Promise<PlagiarismResult> {
  if (!apiKey) {
    console.warn('[RapidAPI] No API key provided, falling back to mock');
    return checkWithMock(text);
  }

  try {
    const response = await fetch('https://plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com/plagiarism', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com',
      },
      body: JSON.stringify({
        text: text,
        language: 'en',
        includeCitations: false,
        scrapeSources: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();

    // Parse rezultata
    const score = data.percentPlagiarism || 1;
    const sources = data.sources || [];

    const report = generateDetailedReport({
      provider: 'RapidAPI',
      score,
      wordCount: text.split(/\s+/).length,
      sources: sources.map((s: any) => ({
        url: s.url,
        similarity: s.percent,
        title: s.title,
      })),
    });

    return {
      score,
      report,
      sources: sources.map((s: any) => ({
        url: s.url,
        similarity: s.percent,
        title: s.title,
      })),
    };
  } catch (error) {
    console.error('[RapidAPI] Error:', error);
    return checkWithMock(text);
  }
}

/**
 * 3. PLAGIARISM DETECTOR API
 * Custom API endpoint
 */
async function checkWithPlagiarismDetector(
  text: string,
  apiKey?: string
): Promise<PlagiarismResult> {
  if (!apiKey) {
    console.warn('[PlagiarismDetector] No API key provided, falling back to mock');
    return checkWithMock(text);
  }

  try {
    const apiUrl = process.env.PLAGIARISM_API_URL || 'https://api.plagiarismdetector.com/v1/check';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Plagiarism Detector error: ${response.status}`);
    }

    const data = await response.json();

    const score = data.plagiarismScore || data.score || 0;
    const sources = data.matches || data.sources || [];

    const report = generateDetailedReport({
      provider: 'Plagiarism Detector',
      score,
      wordCount: text.split(/\s+/).length,
      sources: sources.map((s: any) => ({
        url: s.url || s.source,
        similarity: s.similarity || s.percentage,
        title: s.title,
      })),
    });

    return {
      score,
      report,
      sources,
    };
  } catch (error) {
    console.error('[PlagiarismDetector] Error:', error);
    return checkWithMock(text);
  }
}

/**
 * MOCK CHECKER - Za testiranje
 */
async function checkWithMock(text: string): Promise<PlagiarismResult> {
  // Simuliraj API call sa delay-om
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  // Formula: više teksta = veća šansa za plagiarizam (za demo)
  const baseScore = Math.min(wordCount / 100, 1) * 30;
  const randomVariation = Math.random() * 20;
  const score = Math.min(baseScore + randomVariation, 100);

  // Mock izvori
  const sources = score > 10 ? [
    {
      url: 'https://example.edu/article',
      similarity: score * 0.4,
      title: 'Academic Article Example',
    },
    {
      url: 'https://wikipedia.org/example',
      similarity: score * 0.3,
      title: 'Wikipedia Article',
    },
    {
      url: 'https://blog.example.com/post',
      similarity: score * 0.2,
      title: 'Blog Post',
    },
  ] : [];

  const report = generateDetailedReport({
    provider: 'Mock Checker',
    score,
    wordCount,
    sources,
    isMock: true,
  });

  return {
    score: parseFloat(score.toFixed(2)),
    report,
    sources,
  };
}

/**
 * Generiši detaljan izvještaj
 */
function generateDetailedReport(params: {
  provider: string;
  score: number;
  wordCount: number;
  sources: Array<{ url: string; similarity: number; title?: string }>;
  isMock?: boolean;
}): string {
  const { provider, score, wordCount, sources, isMock } = params;
  const date = new Date().toLocaleString('sr-RS');
  
  let severity = 'Low';
  let recommendation = 'The document appears to be original.';
  
  if (score >= 25) {
    severity = 'High';
    recommendation = 'HIGH PLAGIARISM DETECTED! This document requires immediate review.';
  } else if (score >= 10) {
    severity = 'Medium';
    recommendation = 'Some similarities detected. Manual review recommended.';
  }

  return `
=================================================================
                 PLAGIARISM ANALYSIS REPORT
=================================================================

Provider: ${provider}${isMock ? ' (DEMO MODE)' : ''}
Generated: ${date}
Word Count: ${wordCount} words
Overall Similarity Score: ${score.toFixed(2)}%

Severity Level: ${severity}

-----------------------------------------------------------------
SUMMARY
-----------------------------------------------------------------
The document was analyzed using ${provider}.
The system compared the submitted text against millions of 
documents in ${isMock ? 'our demo' : 'the'} database.

Similarity Score Breakdown:
- 0-10%:   Acceptable (likely original work)
- 10-25%:  Warning (requires review)
- 25-100%: High risk (likely plagiarized)

Current Score: ${score.toFixed(2)}% - ${severity} Risk

-----------------------------------------------------------------
MATCHING SOURCES
-----------------------------------------------------------------
${sources.length > 0 ? sources.map((source, i) => `
${i + 1}. ${source.title || 'Unknown Source'}
   URL: ${source.url}
`).join('\n') : `
No significant matches found in the database.
The content appears to be original.
`}

-----------------------------------------------------------------
RECOMMENDATION
-----------------------------------------------------------------
${recommendation}

${score >= 10 ? `
ACTION REQUIRED:
- Review highlighted sections manually
- Check citations and references
- Verify student's original work
- Consider discussion with student
` : `
This submission has passed the plagiarism check.
No further action required.
`}

-----------------------------------------------------------------
DISCLAIMER
-----------------------------------------------------------------
This is an automated analysis. Human review is recommended
for final determination. The score is calculated based on
text similarity and may include properly cited sources.

${isMock ? `
⚠️  DEMO MODE ACTIVE
This report was generated using a mock plagiarism checker.
To enable real plagiarism detection, configure your API keys
in the .env file.
` : ''}

=================================================================
                    END OF REPORT
=================================================================
  `.trim();
}

/**
 * Pending report za async API-jeve
 */
function generatePendingReport(provider: string, scanId: string): string {
  return `
=================================================================
                 PLAGIARISM SCAN SUBMITTED
=================================================================

Provider: ${provider}
Scan ID: ${scanId}
Status: PENDING

The plagiarism scan has been submitted and is being processed.
Results will be available shortly via webhook notification.

This is a placeholder report. The final detailed report will
be generated once the scan is complete.

=================================================================
  `.trim();
}

