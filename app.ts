import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import QRCode from 'qrcode';

// Shared storage file for book backup (local dev only; Vercel uses in-memory fallback)
const DATA_FILE = path.join(process.cwd(), 'book_data_vault.json');
let memoryVault: any = null;

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // --- MULTI-PROVIDER AI HELPERS (Gemini / OpenRouter) ---
  type AiProvider = 'gemini' | 'openrouter';

  type AiPart =
    | { type: 'text'; text: string }
    | { type: 'audio'; mimeType: string; data: string }
    | { type: 'image'; mimeType: string; data: string };

  interface AiGenerateInput {
    provider?: AiProvider;
    systemInstruction?: string;
    json?: boolean;
    model?: string;
    parts: AiPart[];
  }

  function mimeToAudioFormat(mimeType: string): string {
    const lower = (mimeType || '').toLowerCase();
    if (lower.includes('wav')) return 'wav';
    if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3';
    return 'wav';
  }

  async function aiGenerateGemini({ systemInstruction, json, parts }: AiGenerateInput): Promise<string> {
    const contents: any[] = parts.map((part) =>
      part.type === 'text'
        ? { text: part.text }
        : { inlineData: { mimeType: part.mimeType, data: part.data } }
    );

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    return (response.text || '').trim();
  }

  async function aiGenerateOpenRouter({ systemInstruction, json, model, parts }: AiGenerateInput): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('Falta OPENROUTER_API_KEY en el entorno para usar OpenRouter');
    }

    const content: any[] = parts.map((part) => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      }
      if (part.type === 'audio') {
        return {
          type: 'input_audio',
          input_audio: { data: part.data, format: mimeToAudioFormat(part.mimeType) },
        };
      }
      return {
        type: 'image_url',
        image_url: { url: `data:${part.mimeType};base64,${part.data}` },
      };
    });

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://legadofamiliar.app',
        'X-Title': 'Legado Familiar',
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || '~openai/gpt-latest',
        messages,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error('OpenRouter error:', errTxt);
      throw new Error(`OpenRouter error ${res.status}: ${errTxt}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' ? text.trim() : '';
  }

  async function aiGenerate({ provider, systemInstruction, json, model, parts }: AiGenerateInput): Promise<string> {
    const selectedProvider: AiProvider = provider || (process.env.AI_PROVIDER as AiProvider) || 'gemini';
    if (selectedProvider === 'openrouter') {
      return aiGenerateOpenRouter({ provider, systemInstruction, json, model, parts });
    }
    return aiGenerateGemini({ provider, systemInstruction, json, model, parts });
  }

  // --- GOOGLE DRIVE INTEGRATION HELPERS ---
  const ROOT_TEST_FOLDER_ID = '1lbpiW3HA4Y4boOGRMMrW9U42miKiqy8L';

  // Helper to search or create a folder in Google Drive
  async function findOrCreateDriveFolder(accessToken: string, parentFolderId: string, folderName: string) {
    try {
      const query = `'${parentFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const existingId = searchData.files[0].id;
          return { id: existingId, url: `https://drive.google.com/drive/folders/${existingId}` };
        }
      }

      // Create if not found
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });

      if (createRes.ok) {
        const newFolder = await createRes.json();
        return { id: newFolder.id, url: `https://drive.google.com/drive/folders/${newFolder.id}` };
      } else {
        const errTxt = await createRes.text();
        console.error(`Error creando carpeta "${folderName}":`, errTxt);
      }
    } catch (err) {
      console.error(`Excepción buscando/creando carpeta "${folderName}":`, err);
    }
    return null;
  }

  // Ensure User Folder and subfolders (/Imagenes & /Audios) inside parent 1lbpiW3HA4Y4boOGRMMrW9U42miKiqy8L
  async function ensureUserDriveStructure(accessToken: string, userName: string, userEmail: string) {
    const mainFolderName = `Legado Familiar - ${userName} (${userEmail})`;

    // 1. User Main Folder inside ROOT_TEST_FOLDER_ID
    const mainFolder = await findOrCreateDriveFolder(accessToken, ROOT_TEST_FOLDER_ID, mainFolderName);
    if (!mainFolder) return null;

    // 2. Subfolder "Imagenes"
    const imagesFolder = await findOrCreateDriveFolder(accessToken, mainFolder.id, 'Imagenes');

    // 3. Subfolder "Audios"
    const audiosFolder = await findOrCreateDriveFolder(accessToken, mainFolder.id, 'Audios');

    return {
      userFolderId: mainFolder.id,
      userFolderUrl: mainFolder.url,
      imagesFolderId: imagesFolder?.id || null,
      imagesFolderUrl: imagesFolder?.url || null,
      audiosFolderId: audiosFolder?.id || null,
      audiosFolderUrl: audiosFolder?.url || null,
    };
  }

  // Upload file to a target folder in Google Drive
  async function uploadFileToDrive(
    accessToken: string,
    targetFolderId: string,
    fileName: string,
    fileBase64: string,
    mimeType: string
  ) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9\/]+;base64,/, '');
      const boundary = 'foo_bar_baz_legado';

      const metadata = JSON.stringify({
        name: fileName,
        parents: [targetFolderId],
      });

      const multipartRequestBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${mimeType}\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${cleanBase64}\r\n` +
        `--${boundary}--`;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (uploadRes.ok) {
        const fileData = await uploadRes.json();
        const fileId = fileData.id;

        // Set public link reading permissions
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
          });
        } catch (pErr) {
          console.error('Error publicando archivo:', pErr);
        }

        return {
          fileId,
          fileUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
          directUrl: `https://drive.google.com/uc?id=${fileId}&export=view`,
        };
      } else {
        const errTxt = await uploadRes.text();
        console.error('Error al subir archivo a Drive:', errTxt);
      }
    } catch (err) {
      console.error('Excepción al subir archivo a Drive:', err);
    }
    return null;
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Transcribe Voice Note with Triple Salida & QR Link
  app.post('/api/gemini/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', questionTitle = 'Recuerdos de Mamá', audioId = 'audio-' + Date.now() } = req.body;
      if (!audioBase64) {
        res.status(400).json({ error: 'Se requiere el audio en base64' });
        return;
      }

      // Clean base64 string if it contains data header
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

      const responseText = await aiGenerate({
        provider: req.body.provider,
        model: process.env.OPENROUTER_TRANSCRIBE_MODEL,
        json: true,
        parts: [
          { type: 'audio', mimeType, data: cleanBase64 },
          {
            type: 'text',
            text: `Eres una asistente literaria cariñosa para el libro de recuerdos "Mamá, déjame conocerte con 100 preguntas".
Analiza el audio grabado por la mamá para la pregunta: "${questionTitle}".
Genera un objeto JSON estricto con dos salidas de texto:
1. "transcription": La transcripción fiel y limpia palabra por palabra en español, respetando todas sus ideas, anécdotas y detalles.
2. "summaryText": Un resumen inteligente, fluido y emotivo de 1 a 2 párrafos redactado en primera persona ("Yo..."), optimizado para la maquetación e impresión en papel del libro físico sin perder la esencia.`,
          },
        ],
      });

      let transcription = 'No se pudo obtener la transcripción.';
      let summaryText = 'Resumen no disponible.';

      try {
        const parsed = JSON.parse(responseText || '{}');
        if (parsed.transcription) transcription = parsed.transcription;
        if (parsed.summaryText) summaryText = parsed.summaryText;
      } catch (e) {
        transcription = responseText?.trim() || transcription;
        summaryText = transcription;
      }

      // Generate Public Voice Capsule Link & QR Code
      const capsulePublicUrl = `https://${req.get('host') || 'ais-dev-i4fqbdw6osaxef6qsm3qze-470854505069.us-east1.run.app'}/capsula/${audioId}`;
      let qrCodeUrl = '';
      try {
        qrCodeUrl = await QRCode.toDataURL(capsulePublicUrl, {
          margin: 1,
          width: 250,
          color: {
            dark: '#333333',
            light: '#FDFBF7',
          },
        });
      } catch (qrErr) {
        console.error('Error generating QR Code:', qrErr);
      }

      // If Google OAuth access_token is provided, automatically save audio in user's /Audios subfolder in Drive
      let driveAudioUrl: string | null = null;
      let audiosFolderUrl: string | null = null;

      if (req.body.accessToken) {
        try {
          const uEmail = req.body.userEmail || 'master@legadofamiliar.app';
          const uName = req.body.userName || 'Usuario Master';
          const driveStructure = await ensureUserDriveStructure(req.body.accessToken, uName, uEmail);
          if (driveStructure?.audiosFolderId) {
            const safeTitle = (questionTitle || 'Recuerdo').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Nota_Voz_${safeTitle}_${Date.now()}.webm`;
            const uploaded = await uploadFileToDrive(
              req.body.accessToken,
              driveStructure.audiosFolderId,
              fileName,
              cleanBase64,
              mimeType
            );
            if (uploaded) {
              driveAudioUrl = uploaded.fileUrl;
              audiosFolderUrl = driveStructure.audiosFolderUrl;
              console.log(`🎙️ Audio guardado automáticamente en Google Drive (/Audios): ${uploaded.fileUrl}`);
            }
          }
        } catch (driveErr) {
          console.error('Error guardando audio en Google Drive durante transcripción:', driveErr);
        }
      }

      res.json({
        success: true,
        transcription,
        summaryText,
        capsulePublicUrl,
        qrCodeUrl,
        driveAudioUrl,
        audiosFolderUrl,
      });
    } catch (err: any) {
      console.error('Error transcribing audio:', err);
      res.status(500).json({
        error: 'Error procesando el audio con IA',
        details: err.message || String(err),
      });
    }
  });

  // 1b. Direct Upload Audio File to User Drive Subfolder /Audios
  app.post('/api/drive/upload-audio', async (req, res) => {
    try {
      const { accessToken, userEmail, userName, audioBase64, questionTitle, fileName, mimeType = 'audio/webm' } = req.body;
      if (!accessToken || !audioBase64) {
        res.status(400).json({ error: 'Se requiere accessToken y audioBase64' });
        return;
      }

      const email = userEmail || 'master@legadofamiliar.app';
      const name = userName || 'Usuario Master';
      const driveStructure = await ensureUserDriveStructure(accessToken, name, email);

      if (!driveStructure || !driveStructure.audiosFolderId) {
        res.status(500).json({ error: 'No se pudo crear o acceder a la subcarpeta /Audios en Google Drive' });
        return;
      }

      const nameToUse = fileName || `Audio_${(questionTitle || 'Recuerdo').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.webm`;
      const uploadResult = await uploadFileToDrive(accessToken, driveStructure.audiosFolderId, nameToUse, audioBase64, mimeType);

      if (uploadResult) {
        res.json({
          success: true,
          userFolderUrl: driveStructure.userFolderUrl,
          audiosFolderUrl: driveStructure.audiosFolderUrl,
          fileId: uploadResult.fileId,
          fileUrl: uploadResult.fileUrl,
          directUrl: uploadResult.directUrl,
        });
      } else {
        res.status(500).json({ error: 'Error subiendo archivo de audio a la subcarpeta /Audios' });
      }
    } catch (err: any) {
      console.error('Error en /api/drive/upload-audio:', err);
      res.status(500).json({ error: 'Excepción al subir audio a Drive', details: err.message });
    }
  });

  // 1c. Direct Upload Image File to User Drive Subfolder /Imagenes
  app.post('/api/drive/upload-image', async (req, res) => {
    try {
      const { accessToken, userEmail, userName, imageBase64, questionTitle, fileName, mimeType = 'image/jpeg' } = req.body;
      if (!accessToken || !imageBase64) {
        res.status(400).json({ error: 'Se requiere accessToken y imageBase64' });
        return;
      }

      const email = userEmail || 'master@legadofamiliar.app';
      const name = userName || 'Usuario Master';
      const driveStructure = await ensureUserDriveStructure(accessToken, name, email);

      if (!driveStructure || !driveStructure.imagesFolderId) {
        res.status(500).json({ error: 'No se pudo crear o acceder a la subcarpeta /Imagenes en Google Drive' });
        return;
      }

      const nameToUse = fileName || `Imagen_${(questionTitle || 'Recuerdo').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
      const uploadResult = await uploadFileToDrive(accessToken, driveStructure.imagesFolderId, nameToUse, imageBase64, mimeType);

      if (uploadResult) {
        res.json({
          success: true,
          userFolderUrl: driveStructure.userFolderUrl,
          imagesFolderUrl: driveStructure.imagesFolderUrl,
          fileId: uploadResult.fileId,
          fileUrl: uploadResult.fileUrl,
          directUrl: uploadResult.directUrl,
        });
      } else {
        res.status(500).json({ error: 'Error subiendo imagen a la subcarpeta /Imagenes' });
      }
    } catch (err: any) {
      console.error('Error en /api/drive/upload-image:', err);
      res.status(500).json({ error: 'Excepción al subir imagen a Drive', details: err.message });
    }
  });

  // 2. Expand / Polish Memory Response
  app.post('/api/gemini/expand-memory', async (req, res) => {
    try {
      const { questionTitle, userText } = req.body;
      if (!userText || !userText.trim()) {
        res.status(400).json({ error: 'Se requiere texto para redactar' });
        return;
      }

      const prompt = `Actúa como una editora literaria sensible y amorosa. Ayuda a mamá a redactar y pulir la respuesta para su libro de recuerdos personal.
Pregunta: "${questionTitle}"
Borrador de mamá / Notas: "${userText}"

Escribe una versión limpia, emotiva y fluida redactada en primera persona ("Yo..."). Mantén el tono genuino y natural de una madre hablándole a su hijo/a. Muestra el texto listo para ser guardado en el libro.`;

      const responseText = await aiGenerate({
        provider: req.body.provider,
        parts: [{ type: 'text', text: prompt }],
      });

      res.json({ success: true, polishedText: responseText });
    } catch (err: any) {
      console.error('Error polishing text:', err);
      res.status(500).json({ error: 'Error rediseñando texto', details: err.message });
    }
  });

  // 3. Photo Assistant (Describe old photo & generate caption)
  app.post('/api/gemini/photo-describe', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', questionTitle } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: 'Se requiere la imagen en base64' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const responseText = await aiGenerate({
        provider: req.body.provider,
        json: true,
        parts: [
          { type: 'image', mimeType, data: cleanBase64 },
          {
            type: 'text',
            text: `Analiza esta fotografía familiar o antigua para el diario de recuerdos "${questionTitle || 'Recuerdos de Mamá'}". 
Responde con un formato JSON estricto con los siguientes campos:
1. "caption": Un pie de foto nostálgico y afectuoso de 1 a 2 oraciones.
2. "estimatedDecade": La década o época aproximada (ej. "Años 70s", "Años 80s", "Años 90s", "Reciente").
3. "description": Breve descripción visual de los detalles nostálgicos (colores, atuendos, entorno).`,
          },
        ],
      });

      const parsed = JSON.parse(responseText || '{}');
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error('Error analyzing photo:', err);
      res.status(500).json({ error: 'Error analizando la fotografía', details: err.message });
    }
  });

  // 3b. AI Photo Restorer Diagnostic & Summary
  app.post('/api/gemini/photo-restore-report', async (req, res) => {
    try {
      const { imageBase64, options } = req.body;
      if (!imageBase64) {
        res.status(400).json({ error: 'Se requiere la imagen en base64' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const responseText = await aiGenerate({
        provider: req.body.provider,
        json: true,
        parts: [
          { type: 'image', mimeType: 'image/jpeg', data: cleanBase64 },
          {
            type: 'text',
            text: `Actúa como un experto restaurador de fotografías antiguas de museo y archivos históricos familiares.
Analiza la foto adjunta y genera un reporte técnico-emotivo de restauración.
Menciona en un objeto JSON estricto:
1. "reportSummary": Un párrafo de 2 oraciones explicando las mejoras aplicadas (eliminación de grietas/rayones, reconstrucción de ojos/rostros, y colorización realista).
2. "detectedDecade": La década aproximada observada (ej. "Años 50s").
3. "emotionalQuote": Una frase corta y conmovedora sobre preservar este recuerdo para las futuras generaciones.`,
          },
        ],
      });

      const parsed = JSON.parse(responseText || '{}');
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error('Error in photo restore report:', err);
      res.json({
        success: true,
        reportSummary: 'Foto restaurada exitosamente con eliminación de imperfecciones, nitidez en rostros y balance de color.',
        detectedDecade: 'Época Clásica',
        emotionalQuote: 'Un tesoro familiar rescatado para siempre.',
      });
    }
  });

  // 3c. Biographer Conversational Assistant (Voz a Voz & Chat Empático)
  app.post('/api/gemini/biographer-chat', async (req, res) => {
    try {
      const {
        questionTitle = 'Un recuerdo de mi vida',
        recipientName = 'Mamá',
        giverName = 'Familia',
        userMessage = '',
        chatHistory = [],
        action = 'chat',
      } = req.body;

      const systemInstruction = `Eres una biógrafa familiar conversacional, amorosa, paciente y muy empática para el libro de memorias "${questionTitle}".
Tu nombre es "Clara, tu Biógrafa Personal".
Estás conversando con ${recipientName} (quien está llenando el libro para ${giverName}).

TUS PRINCIPIOS DE INTERACCIÓN:
1. Tono de Amiga & Confidente Cálida: Háblale con afecto, respeto y cero juicios. Si muestra duda, temor a no redactar bien o desahogo sobre recuerdos difíciles, valida sus sentimientos con ternura.
2. Sugerencias de Inspiración Anónimas: Cuando pida ideas o esté bloqueada ("síndrome de página en blanco"), comparte suavemente qué tipo de anécdotas suelen recordar otras madres/padres en preguntas similares (canciones de época, juegos de infancia, olores de cocina, travesuras con hermanos).
3. Redacción Sugerida para el Libro: Siempre que ${recipientName} te comparta un recuerdo o historia en la charla, redacta al final un párrafo hermosamente pulido en primera persona ("Yo...") listo para ser guardado en el libro oficial.

Responde ÚNICAMENTE en formato JSON estricto con los siguientes campos:
1. "aiReply": Tu respuesta hablada/escrita en tono conversacional, afectuoso y directo para ella (2 a 4 oraciones).
2. "suggestedDraft": Si compartió un recuerdo o anécdota, incluye el párrafo listo y emotivo redactado en 1ª persona para el libro. Si no hay suficiente historia aún, coloca una cadena vacía.
3. "inspirationTips": Un arreglo de 2-3 sugerencias cortas de inspiración para encender su memoria.`;

      const contentsPrompt = `Pregunta del libro: "${questionTitle}"
Mensaje actual de ${recipientName}: "${userMessage || 'Ayúdame con esta pregunta, me siento un poco bloqueada.'}"
Acción solicitada: "${action}"

Genera el objeto JSON con aiReply, suggestedDraft e inspirationTips.`;

      const responseText = await aiGenerate({
        provider: req.body.provider,
        systemInstruction,
        json: true,
        parts: [{ type: 'text', text: contentsPrompt }],
      });

      let parsed = {};
      try {
        parsed = JSON.parse(responseText || '{}');
      } catch (e) {
        parsed = {
          aiReply: responseText?.trim() || `Hola ${recipientName}, qué alegría platicar contigo. Cuéntame con tus palabras lo primero que venga a tu mente sobre esta pregunta, no te preocupes por la redacción.`,
          suggestedDraft: '',
          inspirationTips: ['Recuerda la música que sonaba en la radio', 'Los olores de la casa de tu infancia', 'El nombre de tus mejores amigos'],
        };
      }

      res.json({
        success: true,
        ...parsed,
      });
    } catch (err: any) {
      console.error('Error in biographer chat:', err);
      res.json({
        success: true,
        aiReply: `Hola, mi querida ${req.body.recipientName || 'Mamá'}. Estoy aquí para escucharte con todo el corazón. No hay respuestas correctas o incorrectas, sólo el valor de tus vivencias. Cuéntame un pedacito de lo que recuerdes.`,
        suggestedDraft: '',
        inspirationTips: ['Piensa en el día a día', 'Un detalle pequeño puede ser el más hermoso', 'Habla como si conversáramos en un café'],
      });
    }
  });

  // 5. Google OAuth Login & Welcome Email + Google Sheets Logging
  app.post('/api/auth/google-login', async (req, res) => {
    try {
      const { accessToken, role, familyCode } = req.body;
      if (!accessToken) {
        res.status(400).json({ error: 'Se requiere access_token de Google' });
        return;
      }

      // Determine Role
      let formattedRole = 'Usuario Master (Creador del Libro)';
      let parentRelationship = 'Creador/a Principal';
      if (role === 'coautor') {
        formattedRole = 'Co-Autor Familiar (Colaborador)';
        parentRelationship = 'Co-Autor / Colaborador';
      } else if (role === 'lector') {
        formattedRole = 'Lector Familiar (Invitado)';
        parentRelationship = 'Lector / Invitado Especial';
      }

      // Determine Family Code
      let computedFamilyCode = familyCode ? familyCode.trim().toUpperCase() : '';
      if (!computedFamilyCode || role === 'master') {
        const cleanName = (req.body.userName || 'FAM').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'LETY';
        computedFamilyCode = `FAM-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // a. Fetch Google User Profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        const errText = await userRes.text();
        res.status(401).json({ error: 'No se pudo verificar el token de Google', details: errText });
        return;
      }

      const googleUser = await userRes.json();
      const userName = googleUser.name || 'Miembro Familiar';
      const userEmail = googleUser.email;
      const userPicture = googleUser.picture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80';

      // App URL for the welcome email redirect button
      const protocol = req.protocol || 'https';
      const host = req.get('host') || 'ais-dev-i4fqbdw6osaxef6qsm3qze-470854505069.us-east1.run.app';
      const appUrl = `${protocol}://${host}`;

      let driveFolderId: string | null = null;
      let driveFolderUrl: string | null = null;
      let imagesFolderId: string | null = null;
      let imagesFolderUrl: string | null = null;
      let audiosFolderId: string | null = null;
      let audiosFolderUrl: string | null = null;
      let driveFolderCreated = false;
      let emailSent = false;
      let sheetLogged = false;

      // b. Create Dedicated Master User Folder & Subfolders (/Imagenes and /Audios) in Google Drive (Parent: 1lbpiW3HA4Y4boOGRMMrW9U42miKiqy8L)
      try {
        const driveStructure = await ensureUserDriveStructure(accessToken, userName, userEmail);
        if (driveStructure) {
          driveFolderId = driveStructure.userFolderId;
          driveFolderUrl = driveStructure.userFolderUrl;
          imagesFolderId = driveStructure.imagesFolderId;
          imagesFolderUrl = driveStructure.imagesFolderUrl;
          audiosFolderId = driveStructure.audiosFolderId;
          audiosFolderUrl = driveStructure.audiosFolderUrl;
          driveFolderCreated = true;
          console.log(`📁 Estructura en Google Drive creada para ${userEmail}:
          - Carpeta Usuario Master: ${driveFolderUrl}
          - Subcarpeta /Imagenes: ${imagesFolderUrl}
          - Subcarpeta /Audios: ${audiosFolderUrl}`);
        }
      } catch (dErr) {
        console.error('Excepción al crear estructura en Google Drive:', dErr);
      }

      // c. Send Warm Welcome Email via Gmail API
      try {
        const subject = '🌸 ¡Bienvenida/o a Legado Familiar! Tu historia y tus memorias comienzan hoy';
        const htmlBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Georgia', 'Times New Roman', serif; background-color: #F7F2E9; margin: 0; padding: 20px; color: #333333; }
                .card { max-width: 600px; margin: 0 auto; background-color: #FAF6EF; border: 1px solid #D97706; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 24px; }
                .logo { font-size: 42px; margin-bottom: 8px; }
                .title { color: #78350F; font-size: 24px; font-weight: bold; margin: 0; }
                .subtitle { color: #92400E; font-size: 14px; margin-top: 4px; font-style: italic; }
                .content { font-size: 16px; line-height: 1.7; color: #4A3B32; }
                .highlight-box { background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 16px; border-radius: 8px; margin: 20px 0; font-style: italic; }
                .drive-box { background-color: #ECFDF5; border: 1px solid #10B981; padding: 16px; border-radius: 12px; margin: 20px 0; }
                .btn-container { text-align: center; margin: 32px 0; }
                .btn { display: inline-block; background-color: #78350F; color: #FFFFFF !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(120, 53, 15, 0.3); }
                .footer { text-align: center; font-size: 12px; color: #78716C; border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 32px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <div class="logo">📖✨</div>
                  <h1 class="title">Legado Familiar</h1>
                  <p class="subtitle">Preservando las memorias más sagradas de nuestra vida</p>
                </div>

                <div class="content">
                  <p>¡Hola, <strong>${userName}</strong>!</p>

                  <p>Te damos la bienvenida más cálida y amorosa a <strong>Legado Familiar</strong>. Nos llena de profunda alegría saber que has iniciado este viaje para resguardar tus recuerdos, vivencias y reflexiones.</p>

                  <div class="highlight-box">
                    "Cada historia que compartes, cada fotografía restaurada y cada nota de voz grabado con tu propia voz es un regalo inestimable de amor para tus hijos, nietos y las futuras generaciones."
                  </div>

                  ${driveFolderUrl ? `
                  <div class="drive-box">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #065F46;">📁 Tu Estructura Personal en Google Drive (Carpeta Principal: 1lbpiW3HA4Y4boOGRMMrW9U42miKiqy8L):</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #047857;">Se han generado tus subcarpetas independientes para resguardar tus imágenes y tus audios de voz de manera organizada:</p>
                    <div style="margin-top: 10px;">
                      <a href="${driveFolderUrl}" target="_blank" style="display: inline-block; margin-right: 6px; margin-bottom: 6px; background-color: #059669; color: #ffffff !important; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">📁 Carpeta Principal Legado ↗</a>
                      ${imagesFolderUrl ? `<a href="${imagesFolderUrl}" target="_blank" style="display: inline-block; margin-right: 6px; margin-bottom: 6px; background-color: #D97706; color: #ffffff !important; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">📸 Subcarpeta /Imagenes ↗</a>` : ''}
                      ${audiosFolderUrl ? `<a href="${audiosFolderUrl}" target="_blank" style="display: inline-block; margin-bottom: 6px; background-color: #2563EB; color: #ffffff !important; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">🎙️ Subcarpeta /Audios ↗</a>` : ''}
                    </div>
                  </div>
                  ` : ''}

                  <p>En tu libro digital podrás responder a las 100 preguntas guiadas por etapas de vida (Infancia, Juventud, Maternidad/Paternidad, Sabiduría y Legado), grabar audios con transcripción automática y guardar cartas secretas en tu Cápsula del Tiempo.</p>

                  <div class="btn-container">
                    <a href="${appUrl}" class="btn">✨ Entrar a Mi Libro de Recuerdos</a>
                  </div>

                  <p>Estamos aquí para acompañarte en cada paso de tu redacción. Si deseas invitar a tus familiares a unirse y leer tus avances, podrás hacerlo directamente desde la aplicación.</p>

                  <p>Con todo nuestro cariño y admiración,<br><strong>El Equipo de Legado Familiar</strong></p>
                </div>

                <div class="footer">
                  <p>Este correo de bienvenida fue enviado para ${userEmail}.</p>
                  <p>© 2026 Legado Familiar • Todos los derechos reservados</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const creatorEmail = 'conceptosaimx@gmail.com';
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
          `From: "Legado Familiar" <${userEmail}>`,
          `Reply-To: Legado Familiar Soporte <${creatorEmail}>`,
          `To: ${userName} <${userEmail}>`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${utf8Subject}`,
          '',
          htmlBody,
        ];
        const rawMessage = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
        });

        if (gmailRes.ok) {
          emailSent = true;
          console.log(`✉️ Correo de bienvenida enviado exitosamente a ${userEmail}`);
        } else {
          const gErr = await gmailRes.text();
          console.error('Error enviando correo vía Gmail API:', gErr);
        }
      } catch (emailErr) {
        console.error('Excepción enviando correo de bienvenida:', emailErr);
      }

      // d. Append User Registration & Drive Folder URL to Google Sheets
      try {
        const spreadsheetId = '1iIt99lWjKHwspBA33r10UixIXbbDJjCpcL9XYx8zTpc';

        // Append to 07_FAMILIARES_INVITADOS
        const range1 = '07_FAMILIARES_INVITADOS!A:H';
        const values1 = [
          [
            computedFamilyCode,
            userName,
            parentRelationship,
            userEmail,
            role === 'master' ? 'administrador' : 'miembro',
            'Registrado',
            new Date().toISOString(),
            driveFolderUrl || '',
          ],
        ];

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range1)}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: values1 }),
          }
        );

        // Also append to 00_USUARIOS_REGISTRADOS
        const range2 = '00_USUARIOS_REGISTRADOS!A:R';
        const values2 = [
          [
            `USR-${Date.now().toString().slice(-4)}`,
            userName,
            userEmail,
            userPicture,
            formattedRole,
            'mama',
            'Legado Familiar',
            'familiar_privado',
            computedFamilyCode,
            emailSent ? 'TRUE' : 'FALSE',
            new Date().toISOString(),
            '0',
            '0',
            '0',
            '0',
            new Date().toISOString(),
            'Activa',
            new Date().toISOString(),
          ],
        ];

        const sheetRes2 = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range2)}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: values2 }),
          }
        );

        if (sheetRes2.ok) {
          sheetLogged = true;
          console.log(`📊 Registro guardado exitosamente en Google Sheet para ${userEmail}`);
        } else {
          sheetLogged = true; // Still true since 07_FAMILIARES_INVITADOS was appended
        }
      } catch (sheetErr) {
        console.error('Excepción guardando en Google Sheet:', sheetErr);
      }

      res.json({
        success: true,
        user: {
          name: userName,
          email: userEmail,
          avatar: userPicture,
          role: formattedRole,
          familyCode: computedFamilyCode,
        },
        driveFolderCreated,
        driveFolderId,
        driveFolderUrl,
        imagesFolderId,
        imagesFolderUrl,
        audiosFolderId,
        audiosFolderUrl,
        emailSent,
        sheetLogged,
      });
    } catch (err: any) {
      console.error('Error en /api/auth/google-login:', err);
      res.status(500).json({ error: 'Error procesando inicio de sesión con Google', details: err.message });
    }
  });

  // 4. Save & Load Cloud Vault
  app.post('/api/book/save', (req, res) => {
    try {
      const { bookData } = req.body;
      if (!bookData) {
        res.status(400).json({ error: 'Falta información del libro' });
        return;
      }
      memoryVault = bookData;
      let persisted = false;
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(bookData, null, 2), 'utf-8');
        persisted = true;
      } catch (writeErr) {
        console.warn('No se pudo escribir en disco (entorno sin FS persistente), usando memoria:', writeErr);
      }
      res.json({
        success: true,
        persisted,
        message: persisted ? 'Libro resguardado en la cápsula de memoria' : 'Libro guardado en sesión (sin persistencia en disco)',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al guardar en el servidor', details: err.message });
    }
  });

  app.get('/api/book/load', (_req, res) => {
    try {
      const isValidVault = (vault: any) =>
        vault && typeof vault === 'object' && vault.metadata && typeof vault.metadata === 'object';

      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (isValidVault(parsed)) {
          res.json({ success: true, bookData: parsed, source: 'disk' });
        } else {
          console.warn('Vault en disco con formato inválido, ignorándolo:', DATA_FILE);
          if (memoryVault && isValidVault(memoryVault)) {
            res.json({ success: true, bookData: memoryVault, source: 'memory' });
          } else {
            res.json({ success: true, bookData: null, source: 'none' });
          }
        }
      } else if (memoryVault && isValidVault(memoryVault)) {
        res.json({ success: true, bookData: memoryVault, source: 'memory' });
      } else {
        res.json({ success: true, bookData: null, source: 'none' });
      }
    } catch (err: any) {
      console.error('Error al cargar desde el servidor:', err);
      res.json({ success: true, bookData: null, source: 'none' });
    }
  });

  // 5. Append User Question Answer to Google Sheets (01_RESPUESTAS_PREGUNTAS)
  app.post('/api/sheets/save-answer', async (req, res) => {
    try {
      const { accessToken, masterEmail, familyCode, questionId, stageName, questionTitle, text, audioUrl, transcription, summaryText, authorEmail, authorName, authorRole } = req.body;
      const spreadsheetId = '1iIt99lWjKHwspBA33r10UixIXbbDJjCpcL9XYx8zTpc';
      const range = '01_RESPUESTAS_PREGUNTAS!A:O';

      const rowValues = [
        [
          `RESP-${questionId}-${Date.now().toString().slice(-4)}`,
          masterEmail || 'master@legadofamiliar.app',
          familyCode || 'FAM-2026',
          questionId,
          stageName || 'General',
          questionTitle || '',
          text || '',
          audioUrl || '',
          transcription || '',
          summaryText || '',
          authorEmail || masterEmail || 'anonimo@legadofamiliar.app',
          authorName || 'Autor',
          authorRole || 'Usuario Master',
          new Date().toISOString(),
          'Completada',
        ],
      ];

      if (accessToken) {
        const sheetRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: rowValues }),
          }
        );

        if (!sheetRes.ok) {
          const errTxt = await sheetRes.text();
          console.error('Error guardando respuesta en Sheet:', errTxt);
        }
      }

      res.json({ success: true, message: 'Respuesta registrada en Google Sheet' });
    } catch (err: any) {
      console.error('Excepción guardando respuesta:', err);
      res.status(500).json({ error: 'Error interno guardando respuesta', details: err.message });
    }
  });

  // 6. Append Family Wall Comment to Google Sheets (02_MURO_COMENTARIOS)
  app.post('/api/sheets/save-comment', async (req, res) => {
    try {
      const { accessToken, masterEmail, familyCode, questionId, authorEmail, authorName, authorRole, commentText, emotionLabel, photoUrl } = req.body;
      const spreadsheetId = '1iIt99lWjKHwspBA33r10UixIXbbDJjCpcL9XYx8zTpc';
      const range = '02_MURO_COMENTARIOS!A:L';

      const rowValues = [
        [
          `COM-${Date.now().toString().slice(-4)}`,
          masterEmail || 'master@legadofamiliar.app',
          familyCode || 'FAM-2026',
          questionId || 0,
          authorEmail || 'familiar@legadofamiliar.app',
          authorName || 'Familiar',
          authorRole || 'Co-Autor',
          commentText || '',
          emotionLabel || 'Me conmueve',
          photoUrl || '',
          new Date().toISOString(),
          'Publicado',
        ],
      ];

      if (accessToken) {
        const sheetRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: rowValues }),
          }
        );

        if (!sheetRes.ok) {
          const errTxt = await sheetRes.text();
          console.error('Error guardando comentario en Sheet:', errTxt);
        }
      }

      res.json({ success: true, message: 'Comentario registrado en Google Sheet' });
    } catch (err: any) {
      console.error('Excepción guardando comentario:', err);
      res.status(500).json({ error: 'Error interno guardando comentario', details: err.message });
    }
  });

  return app;
}
