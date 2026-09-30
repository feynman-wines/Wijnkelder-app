import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is niet ingesteld in de Vercel Environment Variables.' });
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  try {
    const { dish, wines } = req.body || {};
    if (!dish) {
      return res.status(400).json({ error: 'Geen gerecht opgegeven.' });
    }

    if (!Array.isArray(wines) || wines.length === 0) {
      return res.status(400).json({ error: 'Geen wijnvoorraad beschikbaar.' });
    }

    const wineCatalog = wines
      .filter((w: any) => Number(w.aantal) > 0)
      .map((w: any) => ({
        id: w.id,
        naam: w.naam,
        wijnhuis: w.wijnhuis,
        jaar: w.jaar,
        type: w.type,
        druif: w.druif,
        land: w.land,
        streek: w.streek,
        score: w.score,
        optimaal: w.optimaal,
        drinkenTot: w.drinkenTot,
        eten: w.eten,
        aantal: w.aantal,
        plank: w.plank,
        klimaatAdvies: w.klimaatAdvies
      }));

    const prompt = `Je bent een bekroonde chef-sommelier.
De gebruiker wil advies voor het gerecht: "${dish}".

Hier is de actuele kelder- en klimaatkastvoorraad van de gebruiker (alleen flessen met voorraad > 0):
${JSON.stringify(wineCatalog, null, 2)}

SELECTEER DE ABSOLUTE TOP 3 WIJNEN UIT DEZE LIJST die het allerbeste combineren met "${dish}".
Houd rekening met:
1. Smaakbalans: vetgehalte, zuren, tannines, bereidingswijze (bijvoorbeeld witvis vraagt fris/mineraal wit, GEEN zware tanninerijke rode wijn; stoofpot vraagt juist ronde body en kruidigheid).
2. Drinkrijpheid: geef de voorkeur aan wijnen die nu op dronk zijn of hun einde naderen boven wijnen die nog 10 jaar moeten rijpen.
3. Serveersuggestie: geef een specifieke temperatuur en serveertip (zoals decanteren of passend glaswerk).

Als er geen perfecte match in de kelder ligt, kies dan de best passende opties uit de lijst en leg eerlijk uit wat de nuance of het compromis is.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Je bent een deskundige Nederlandse sommelier. Analyseer de smaakcomponenten van het gerecht en geef een eerlijk, hoogstaand en gastronomisch onderbouwd advies gebaseerd op de opgegeven kelderlijst.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              algemeneGastronomie: {
                type: Type.STRING,
                description: 'Korte sommelier-analyse van het gerecht (smaakintensiteit, vet, zuren, bereiding).'
              },
              picks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    wineId: { type: Type.STRING, description: 'Het exacte ID van de gekozen wijn' },
                    naam: { type: Type.STRING },
                    jaar: { type: Type.STRING },
                    matchScore: { type: Type.NUMBER, description: 'Score van 1 tot 100 voor de pairing' },
                    waarom: { type: Type.STRING, description: 'Waarom deze wijn precies past (smaakprofiel, zuren/tannines relatie met gerecht)' },
                    serveertip: { type: Type.STRING, description: 'Optimale serveertemperatuur en advies m.b.t. karafferen/glazen' }
                  },
                  required: ['wineId', 'naam', 'matchScore', 'waarom', 'serveertip']
                }
              }
            },
            required: ['algemeneGastronomie', 'picks']
          }
        }
      });
    } catch (primaryErr: any) {
      console.warn('Gemini 3.8 flash sommelier error, falling back to gemini-3.5-flash-lite:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'Je bent een deskundige Nederlandse sommelier. Analyseer de smaakcomponenten van het gerecht en geef een eerlijk, hoogstaand en gastronomisch onderbouwd advies gebaseerd op de opgegeven kelderlijst.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              algemeneGastronomie: {
                type: Type.STRING,
                description: 'Korte sommelier-analyse van het gerecht (smaakintensiteit, vet, zuren, bereiding).'
              },
              picks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    wineId: { type: Type.STRING, description: 'Het exacte ID van de gekozen wijn' },
                    naam: { type: Type.STRING },
                    jaar: { type: Type.STRING },
                    matchScore: { type: Type.NUMBER, description: 'Score van 1 tot 100 voor de pairing' },
                    waarom: { type: Type.STRING, description: 'Waarom deze wijn precies past (smaakprofiel, zuren/tannines relatie met gerecht)' },
                    serveertip: { type: Type.STRING, description: 'Optimale serveertemperatuur en advies m.b.t. karafferen/glazen' }
                  },
                  required: ['wineId', 'naam', 'matchScore', 'waarom', 'serveertip']
                }
              }
            },
            required: ['algemeneGastronomie', 'picks']
          }
        }
      });
    }

    const result = JSON.parse(response.text || '{}');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Sommelier error:', error);
    return res.status(500).json({ error: error.message || 'Fout bij raadplegen sommelier.' });
  }
}
