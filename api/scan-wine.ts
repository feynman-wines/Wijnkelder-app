import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
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

  const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is niet ingesteld in de Vercel Environment Variables.' });
  }

  if (!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ')) {
    return res.status(400).json({
      error: `De ingevulde GEMINI_API_KEY begint met "${apiKey.substring(0, 8)}...". Een geldige Google AI Studio sleutel begint met "AQ" of "AIza". Controleer je instellingen in Vercel.`
    });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const { imageBase64, mimeType = 'image/jpeg', images } = req.body || {};
    
    const imageList: Array<{ data: string; mimeType: string }> = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.imageBase64 || img.base64) {
          const raw = (img.imageBase64 || img.base64).replace(/^data:image\/\w+;base64,/, '');
          imageList.push({
            data: raw,
            mimeType: img.mimeType || 'image/jpeg'
          });
        }
      }
    } else if (imageBase64) {
      const raw = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageList.push({
        data: raw,
        mimeType: mimeType || 'image/jpeg'
      });
    }

    if (imageList.length === 0) {
      return res.status(400).json({ error: 'Geen afbeelding(en) ontvangen.' });
    }

    const imageParts = imageList.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    }));

    const promptInstructions = `
Lees en bepaal tevens de sommelier-inzichten:
- Type: 'Rood', 'Wit & rosé', of 'Overig' (kies 'Overig' voor mousserend, likeur, amaro, digestief of gedistilleerd)
- Geschatte Vivino-score (tussen 3.0 en 5.0) en prijsindicatie in Nederland (€x–y)
- Optimaal drinkvenster (bijv. "2026–2032", of "NV / Onbeperkt" bij likeur/gedistilleerd) en drinken tot (bijv. "2035" of "Onbeperkt")
- Passend spijsadvies (korte opsomming van gerechten, of 'Digestief / solo / ijs' bij likeuren/amaro)
- Klimaatkastadvies: kies strikt één van de volgende 5 codes:
  '++' = Moet er écht in (lange wijn-bewaring >7-15 jaar, kwetsbare topwijn zoals Barolo, Grand Cru, etc.)
  '+' = Aanbevolen (kwaliteitswijn 3-7 jaar)
  '+/-' = Indien ruimte over (stevige wijn voor 1-3 jaar, koele kelder volstaat ook)
  '-' = Niet nodig (jonge frisse wijn voor binnen 12 maanden)
  '--' = Plekverspilling (BELANGRIJK: likeuren, amaro, digestieven, vermout en sterke drank/gedistilleerd met alcohol >= 20% krijgen ALTIJD '--'!)
- Klimaatkastreden: een overtuigende sommelier-argumentatie. Let op: als het een likeur, amaro (bijv. Jefferson Amaro Importante), bitter of gedistilleerd betreft, leg dan nadrukkelijk uit dat deze drank door het hoge alcoholpercentage niet bederft op kamertemperatuur, niet rijpt op fles, rechtop in de drankenkast hoort en NIET in de wijnklimaatkast hoort te liggen.`;

    const textPrompt = imageList.length > 1
      ? `Analyseer de bijgevoegde foto's (voor- én achteretiket) van deze fles grondig.
Combineer alle informatie van beide etiketten:
- Vooretiket: naam, producent/merk, oogstjaar (of NV), herkomst/streek en type.
- Achteretiket: ingrediënten, botanicals of druiven, alcoholpercentage, smaakomschrijving en serveersuggesties.
${promptInstructions}`
      : `Analyseer dit etiket grondig.
Lees de tekst op het etiket (naam, producent/merk/wijnhuis, druivenrassen of botanicals, oogstjaar/vintage of NV, herkomstbenaming, alcoholpercentage).
${promptInstructions}`;

    const schemaProperties = {
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
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: { parts: [...imageParts, { text: textPrompt }] },
        config: {
          systemInstruction: 'Je bent een meester-vinoloog en scanner van wijnetiketten. Herken accuraat de producent, jaargang, herkomst, druif en geef deskundig bewaar- en klimaatkastadvies in het Nederlands.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: [
              'naam', 'wijnhuis', 'jaar', 'type', 'land', 'streek',
              'druif', 'optimaal', 'drinkenTot', 'eten', 'klimaatAdvies', 'klimaatReden'
            ]
          }
        }
      });
    } catch (primaryErr: any) {
      console.warn('Gemini 3.5 flash-lite primary error, retrying:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: { parts: [...imageParts, { text: textPrompt }] },
        config: {
          systemInstruction: 'Je bent een meester-vinoloog en scanner van wijnetiketten. Herken accuraat de producent, jaargang, herkomst, druif en geef deskundig bewaar- en klimaatkastadvies in het Nederlands.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: [
              'naam', 'wijnhuis', 'jaar', 'type', 'land', 'streek',
              'druif', 'optimaal', 'drinkenTot', 'eten', 'klimaatAdvies', 'klimaatReden'
            ]
          }
        }
      });
    }

    const result = JSON.parse(response.text || '{}');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Scan error:', error);
    let msg = error.message || 'Fout bij analyseren van wijnetiket.';
    if (msg.includes('invalid authentication credentials') || msg.includes('Expected OAuth 2')) {
      msg = 'De ingevulde API-sleutel werd door Google geweigerd ("invalid authentication credentials"). Mogelijke oorzaken: 1) De sleutel is per ongeluk verwijderd of ingetrokken in Google AI Studio, 2) De sleutel is onvolledig gekopieerd, of 3) Na het bijwerken van de GEMINI_API_KEY in Vercel moet je op "Redeploy" klikken om de nieuwe sleutel te activeren.';
    }
    return res.status(500).json({ error: msg });
  }
}
