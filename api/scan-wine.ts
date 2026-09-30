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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is niet ingesteld in de Vercel Environment Variables.' });
  }

  const ai = new GoogleGenAI({
    apiKey,
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

    const textPrompt = imageList.length > 1
      ? `Analyseer de bijgevoegde foto's (voor- én achteretiket) van deze wijn grondig.
Combineer alle informatie van beide etiketten:
- Vooretiket: meestal naam, producent/château, oogstjaar, streek en classificatie.
- Achteretiket: vaak specifieke druivenrassen, alcoholpercentage, smaakomschrijving, vinificatie en serveersuggesties.

Lees en bepaal tevens de sommelier-inzichten:
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
- Klimaatkastreden: een overtuigende sommelier-argumentatie waarom deze specifieke wijn wel/niet in de klimaatkast moet.`
      : `Analyseer dit wijnetiket grondig.
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
- Klimaatkastreden: een overtuigende sommelier-argumentatie waarom deze specifieke wijn wel/niet in de klimaatkast moet.`;

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
        model: 'gemini-2.5-flash',
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
      console.warn('Gemini 2.5 flash error, falling back to gemini-2.5-flash-lite:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
    return res.status(500).json({ error: error.message || 'Fout bij analyseren van wijnetiket.' });
  }
}
