import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is niet ingesteld in Vercel.' });
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  try {
    const { wine } = req.body || {};
    if (!wine || !wine.naam) {
      return res.status(400).json({ error: 'Geen wijngegevens ontvangen.' });
    }

    const prompt = `Je bent een bekroonde chef-sommelier van een driesterrenrestaurant.
Analyseer de volgende wijn grondig en geef een gastronomische analyse en meesterlijke wijn-spijs combinaties:

- Wijn: ${wine.naam}
- Wijnhuis / Producent: ${wine.wijnhuis || 'Onbekend'}
- Jaargang: ${wine.jaar || 'NV'}
- Type: ${wine.type || 'Onbekend'}
- Druif: ${wine.druif || 'Onbekend'}
- Land & Streek: ${wine.land || ''} - ${wine.streek || ''}
- Alcohol: ${wine.alcohol || ''}%
- Vivino score: ${wine.score || 'Onbekend'}
- Huidige notities: ${wine.opmerkingen || ''}
- Huidige spijsvermelding: ${wine.eten || ''}

Geef een diepgaande maar compacte analyse:
1. Smaakprofiel: Beschrijf in 2 zinnen het karakter, zuren, tannines en fruit van deze specifieke wijn.
2. 3 Meesterlijke gerechten:
   - Gang 1 (Voorgerecht / Tussengerecht)
   - Gang 2 (Hoofdgerecht)
   - Gang 3 (Kaasplank / Borrel)
   Leg bij elk gerecht uit WAAROM het gastronomisch klopt (bijv. wisselwerking tussen tannines en eiwit, vet en zuren, aardse tonen).
3. Serveertip: Exacte temperatuur, wel/niet decanteren en geschikt type wijnglas.
4. Absolute afrader: 1 type gerecht of smaakcomponent dat je beslist NIET bij deze wijn moet serveren.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        smaakprofiel: {
          type: Type.STRING,
          description: 'Korte sommelier-karakterisering van de wijn.'
        },
        gerechten: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              gang: { type: Type.STRING, description: 'Bijv. Voorgerecht, Hoofdgerecht, Kaasplank' },
              gerecht: { type: Type.STRING, description: 'Het specifieke gerecht met eventuele garnituur of saus' },
              waarom: { type: Type.STRING, description: 'Gastronomische onderbouwing van de match' }
            },
            required: ['gang', 'gerecht', 'waarom']
          }
        },
        serveeradvies: {
          type: Type.STRING,
          description: 'Temperatuur, karaf/decanteren en glaswerk'
        },
        afrader: {
          type: Type.STRING,
          description: 'Wat beslist niet te combineren met deze fles'
        }
      },
      required: ['smaakprofiel', 'gerechten', 'serveeradvies', 'afrader']
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Je bent een meester-sommelier. Geef hoogwaardig, inspirerend en gastronomisch accuraat Nederlands wijn-spijsadvies.',
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
    } catch (fallbackErr: any) {
      console.warn('Gemini 2.5 flash error, falling back to flash-lite:', fallbackErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'Je bent een meester-sommelier. Geef hoogwaardig, inspirerend en gastronomisch accuraat Nederlands wijn-spijsadvies.',
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
    }

    const result = JSON.parse(response.text || '{}');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Wine sommelier error:', error);
    return res.status(500).json({ error: error.message || 'Fout bij analyseren van wijn door AI sommelier.' });
  }
}
