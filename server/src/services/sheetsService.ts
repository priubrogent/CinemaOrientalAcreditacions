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
