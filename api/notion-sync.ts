import { VercelRequest, VercelResponse } from '@vercel/node';

interface AnalystData {
  analyst: string;
  totalIncidents: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  incidents: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers para permitir peticiones desde GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysts } = req.body as { analysts: AnalystData[] };

    if (!analysts || !Array.isArray(analysts)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const results = [];

    for (const analyst of analysts) {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: DATABASE_ID },
          properties: {
            'Analista': {
              title: [
                {
                  text: {
                    content: analyst.analyst
                  }
                }
              ]
            },
            'Total Incidentes': {
              number: analyst.totalIncidents
            },
            'Críticos': {
              number: analyst.critical
            },
            'Altos': {
              number: analyst.high
            },
            'Medios': {
              number: analyst.medium
            },
            'Bajos': {
              number: analyst.low
            },
            'Fecha Migración': {
              date: {
                start: new Date().toISOString().split('T')[0]
              }
            },
            'Incidentes': {
              rich_text: [
                {
                  text: {
                    content: analyst.incidents.join(', ')
                  }
                }
              ]
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion API error:', error);
        results.push({ analyst: analyst.analyst, status: 'error', error });
      } else {
        const data = await response.json();
        results.push({ analyst: analyst.analyst, status: 'success', id: data.id });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return res.status(200).json({
      success: true,
      message: `Migración completada: ${successCount} exitosos, ${errorCount} errores`,
      results
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
