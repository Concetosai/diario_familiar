/**
 * ==============================================================================
 * SCRIPT DE Google Apps Script - LEGADO FAMILIAR DATABASE INITIALIZER
 * ==============================================================================
 * Este script se ejecuta UNA SOLA VEZ desde el editor de Apps Script de tu
 * Google Spreadsheet ID: 1iIt99lWjKHwspBA33r10UixIXbbDJjCpcL9XYx8zTpc
 *
 * Crea automáticamente las hojas necesarias para almacenar:
 * 1. 01_RESPUESTAS_PREGUNTAS (Textos de respuestas vinculados al Email Master)
 * 2. 02_MURO_COMENTARIOS (Comentarios y mensajes del muro familiar)
 *
 * Instrucciones:
 * 1. Abre tu hoja de cálculo en Google Sheets.
 * 2. Ve a: Extensiones -> Apps Script.
 * 3. Borra el código existente y pega este archivo completo.
 * 4. Selecciona la función "inicializarBaseDeDatosLegadoFamiliar" y haz clic en "Ejecutar".
 * ==============================================================================
 */

function inicializarBaseDeDatosLegadoFamiliar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. CONFIGURACIÓN DE HOJA 01_RESPUESTAS_PREGUNTAS
  const sheetName1 = '01_RESPUESTAS_PREGUNTAS';
  let sheet1 = ss.getSheetByName(sheetName1);
  if (!sheet1) {
    sheet1 = ss.insertSheet(sheetName1);
    Logger.log('Hoja creada: ' + sheetName1);
  }
  
  const headers1 = [
    'ID_Respuesta',
    'Email_Master',
    'Codigo_Familia',
    'ID_Pregunta',
    'Etapa_Vida',
    'Titulo_Pregunta',
    'Respuesta_Texto',
    'Audio_URL',
    'Transcripcion_Fiel',
    'Resumen_IA',
    'Autor_Email',
    'Autor_Nombre',
    'Rol_Autor',
    'Fecha_Guardado',
    'Estado'
  ];
  
  // Establecer encabezados y estilo
  sheet1.getRange(1, 1, 1, headers1.length).setValues([headers1]);
  sheet1.getRange(1, 1, 1, headers1.length)
    .setBackground('#78350F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontFamily('Serif')
    .setHorizontalAlignment('center');
  sheet1.setFrozenRows(1);

  // 2. CONFIGURACIÓN DE HOJA 02_MURO_COMENTARIOS
  const sheetName2 = '02_MURO_COMENTARIOS';
  let sheet2 = ss.getSheetByName(sheetName2);
  if (!sheet2) {
    sheet2 = ss.insertSheet(sheetName2);
    Logger.log('Hoja creada: ' + sheetName2);
  }
  
  const headers2 = [
    'ID_Comentario',
    'Email_Master',
    'Codigo_Familia',
    'ID_Pregunta',
    'Autor_Email',
    'Autor_Nombre',
    'Rol_Autor',
    'Mensaje_Comentario',
    'Etiqueta_Emocional',
    'Foto_Adjunta_URL',
    'Fecha_Publicacion',
    'Estado'
  ];
  
  sheet2.getRange(1, 1, 1, headers2.length).setValues([headers2]);
  sheet2.getRange(1, 1, 1, headers2.length)
    .setBackground('#065F46')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontFamily('Serif')
    .setHorizontalAlignment('center');
  sheet2.setFrozenRows(1);

  // Auto-ajustar ancho de columnas
  sheet1.autoResizeColumns(1, headers1.length);
  sheet2.autoResizeColumns(1, headers2.length);

  SpreadsheetApp.getUi().alert(
    '🎉 ¡Base de Datos Inicializada con Éxito!\n\n' +
    'Se han creado las hojas y columnas:\n' +
    '1. 01_RESPUESTAS_PREGUNTAS (15 Columnas)\n' +
    '2. 02_MURO_COMENTARIOS (12 Columnas)\n\n' +
    'Todas vinculadas mediante Email_Master y Codigo_Familia.'
  );
}
