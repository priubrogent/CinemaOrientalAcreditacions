import { google } from 'googleapis';
import type { Accreditation } from '../types/index.js';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = 'Acreditacions';

// Parse credentials from environment variable or file
function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  return null;
}

async function getAuthClient() {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error('Google credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth.getClient();
}

export async function syncToGoogleSheets(accreditations: Accreditation[]): Promise<{ success: boolean; error?: string }> {
  if (!SPREADSHEET_ID) {
    return { success: false, error: 'Google Sheets ID not configured' };
  }

  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    // Prepare headers and data
    const headers = ['ID', 'Comanda', 'Nom', 'Email', 'Tipus', 'Codi', 'Estat', 'Data creació', 'Email enviat'];
    const rows = accreditations.map(a => [
      a.id,
      a.order_id,
      a.customer_name,
      a.customer_email,
      a.type,
      a.code || '',
      a.status,
      a.created_at,
      a.email_sent_at || ''
    ]);

    const values = [headers, ...rows];

    // Clear existing data and write new data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log(`Synced ${accreditations.length} accreditations to Google Sheets`);
    return { success: true };
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error syncing to Google Sheets'
    };
  }
}

export async function appendToGoogleSheets(accreditation: Accreditation): Promise<{ success: boolean; error?: string }> {
  if (!SPREADSHEET_ID) {
    return { success: false, error: 'Google Sheets ID not configured' };
  }

  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const row = [
      accreditation.id,
      accreditation.order_id,
      accreditation.customer_name,
      accreditation.customer_email,
      accreditation.type,
      accreditation.code || '',
      accreditation.status,
      accreditation.created_at,
      accreditation.email_sent_at || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    console.log(`Appended accreditation ${accreditation.id} to Google Sheets`);
    return { success: true };
  } catch (error) {
    console.error('Google Sheets append error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error appending to Google Sheets'
    };
  }
}

export async function updateRowInGoogleSheets(accreditation: Accreditation): Promise<{ success: boolean; error?: string }> {
  if (!SPREADSHEET_ID) {
    return { success: false, error: 'Google Sheets ID not configured' };
  }

  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    // Find the row with this accreditation ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] == accreditation.id) {
        rowIndex = i + 1; // Sheets is 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      // Row not found, append instead
      return appendToGoogleSheets(accreditation);
    }

    const row = [
      accreditation.id,
      accreditation.order_id,
      accreditation.customer_name,
      accreditation.customer_email,
      accreditation.type,
      accreditation.code || '',
      accreditation.status,
      accreditation.created_at,
      accreditation.email_sent_at || ''
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:I${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    console.log(`Updated accreditation ${accreditation.id} in Google Sheets (row ${rowIndex})`);
    return { success: true };
  } catch (error) {
    console.error('Google Sheets update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating Google Sheets'
    };
  }
}

export async function isConfigured(): Promise<boolean> {
  return !!SPREADSHEET_ID && !!getCredentials();
}

const CASALS_SHEET_NAME = 'Casals';

export interface CasalSheetRow {
  id: number;
  nom_casal: string;
  dates: string[];
  nombre_nens: number;
  nombre_monitors: number;
  email: string;
  telefon: string;
  comentaris: string | null;
  validated: number;
  validated_date: string | null;
  created_at: string;
}

export async function appendCasalToSheets(casal: CasalSheetRow): Promise<{ success: boolean; error?: string }> {
  if (!SPREADSHEET_ID) {
    return { success: false, error: 'Google Sheets ID not configured' };
  }

  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const row = [
      casal.id,
      casal.nom_casal,
      casal.dates.join(', '),
      casal.nombre_nens,
      casal.nombre_monitors,
      casal.nombre_nens + casal.nombre_monitors,
      casal.email,
      casal.telefon,
      casal.comentaris || '',
      casal.validated ? 'Sí' : 'No',
      casal.validated_date || '',
      casal.created_at,
    ];

    // Ensure the Casals sheet tab exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = spreadsheet.data.sheets?.some(
      s => s.properties?.title === CASALS_SHEET_NAME
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: CASALS_SHEET_NAME } } }],
        },
      });
      // Write header row into the newly created sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CASALS_SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Nom del Casal', 'Dates', 'Nens', 'Monitors', 'Total', 'Email', 'Telèfon', 'Comentaris', 'Validat', 'Data Validada', 'Data Inscripció']],
        },
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CASALS_SHEET_NAME}!A:L`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    console.log(`Appended casal ${casal.id} to Google Sheets (Casals tab)`);
    return { success: true };
  } catch (error) {
    console.error('Google Sheets casal append error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error appending casal to Google Sheets',
    };
  }
}
