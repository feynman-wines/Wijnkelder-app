import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Increase payload limit for base64 photo scanning
app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function callGeminiWithRetry(fn: () => Promise<any>, maxRetries = 2, delayMs = 1200): Promise<any> {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// AI Sommelier food pairing endpoint
app.post('/api/sommelier', async (req, res) => {
  try {
    const { dish, wines } = req.body;
    if (!dish) {
      return res.status(400).json({ error: 'Geen gerecht opgegeven.' });
    }

    if (!Array.isArray(wines) || wines.length === 0) {
      return res.status(400).json({ error: 'Geen wijnvoorraad beschikbaar.' });
    }

    // Prepare compact wine catalogue for the model
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
      response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
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
        })
      );
    } catch (primaryErr: any) {
      console.warn('Gemini 3.8 flash error, trying gemini-3.1-flash-lite:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
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
    return res.json(result);
  } catch (error: any) {
    console.error('Sommelier error:', error);
    return res.status(500).json({ error: error.message || 'Fout bij raadplegen sommelier.' });
  }
});

// Wine label scanning and auto-filling endpoint
app.post('/api/scan-wine', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen.' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyseer dit wijnetiket grondig.
Lees de tekst op het etiket (naam, wijnhuis/domein, druivenras(sen), oogstjaar/vintage, herkomstbenaming, alcoholpercentage).
Bepaal tevens sommelier-inzichten:
- Type: 'Rood', 'Wit & rosé', of 'Overig'
- Geschatte Vivino-score (tussen 3.0 en 5.0) en prijsindicatie in Nederland (€x–y)
- Optimaal drinkvenster (bijv. "2026–2032") en drinken tot (bijv. "2035")
- Passend spijsadvies (korte opsomming van gerechten)
- Klimaatkastadvies: kies strikt één van de volgende 5 codes:
  '++' = Moet er écht in (lange bewaring >7-15 jaar, kwetsbare topwijn)
  '+' = Aanbevolen (kwaliteitswijn 3-7 jaar)
  '+/-' = Indien ruimte over (stevige wijn voor 1-3 jaar, koele kelder volstaat ook)
  '-' = Niet nodig (jonge doordrinker, binnen 12 maanden op)
  '--' = Plekverspilling (slobberwijn of direct drinken)
- Klimaatkastreden: een overtuigende sommelier-argumentatie waarom deze specifieke wijn wel/niet in de klimaatkast moet.`,
    };

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: 'Je bent een meester-vinoloog en scanner van wijnetiketten. Herken accuraat de producent, jaargang, herkomst, druif en geef deskundig bewaar- en klimaatkastadvies in het Nederlands.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              naam: { type: Type.STRING, description: 'Naam van de wijn' },
              wijnhuis: { type: Type.STRING, description: 'Producent of wijnhuis' },
              jaar: { type: Type.STRING, description: 'Oogstjaar of NV' },
              type: { type: Type.STRING, description: 'Rood, Wit & rosé, of Overig' },
              land: { type: Type.STRING, description: 'Land van herkomst' },
              streek: { type: Type.STRING, description: 'Streek of appellation' },
              druif: { type: Type.STRING, description: 'Druivenras(sen)' },
              alcohol: { type: Type.STRING, description: 'Alcoholpercentage bijv. 13.5%' },
              prijs: { type: Type.STRING, description: 'Prijsindicatie bijv. €25–35' },
              score: { type: Type.NUMBER, description: 'Geschatte Vivino score (bijv. 4.2)' },
              optimaal: { type: Type.STRING, description: 'Optimaal drinkvenster (bijv. 2026–2034)' },
              drinkenTot: { type: Type.STRING, description: 'Uiterste drinkjaar (bijv. 2038)' },
              temperatuur: { type: Type.STRING, description: 'Aanbevolen serveertemperatuur (bijv. 16–18 °C)' },
              eten: { type: Type.STRING, description: 'Spijssuggesties gescheiden door komma' },
              opmerkingen: { type: Type.STRING, description: 'Toelichting op houtrijping, vinificatie en karakter' },
              klimaatAdvies: { type: Type.STRING, description: 'Strikt een van: ++, +, +/-, -, --' },
              klimaatReden: { type: Type.STRING, description: 'Onderbouwing voor klimaatkastplaatsing' }
            },
            required: [
              'naam', 'wijnhuis', 'jaar', 'type', 'land', 'streek',
              'druif', 'optimaal', 'drinkenTot', 'eten', 'klimaatAdvies', 'klimaatReden'
            ]
          }
        }
      })
    );

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.error('Scan error:', error);
    return res.status(500).json({ error: error.message || 'Fout bij analyseren wijnetiket.' });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🍷 Mijn Wijnkelder server draait op poort ${port}`);
  });
}

startServer();
