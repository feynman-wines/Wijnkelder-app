import * as XLSX from 'xlsx';
import { Wine } from '../types/wine';

/**
 * Exports current wine list to a native Excel (.xlsx) spreadsheet.
 * Every column is neatly separated, auto-sized, and opens directly in Excel,
 * Google Sheets, or Apple Numbers without requiring delimiter configuration.
 */
export function exportToExcel(wines: Wine[]) {
  const data = wines.map(w => ({
    'Wijnnaam': w.naam || '',
    'Wijnhuis': w.wijnhuis || '',
    'Jaargang': w.jaar || '',
    'Type': w.type || '',
    'Druif': w.druif || '',
    'Land': w.land || '',
    'Streek': w.streek || '',
    'Aantal flessen': Number(w.aantal) || 0,
    'Plank': w.plank ? `Plank ${w.plank}` : '',
    'Opslaglocatie': w.opslag || '',
    'Vivino Score': w.score || '',
    'Optimaal drinkvenster': w.optimaal || '',
    'Uiterlijk drinken tot': w.drinkenTot || '',
    'Klimaatkast Advies': w.klimaatAdvies || '',
    'Klimaat Argumentatie': w.klimaatReden || '',
    'Serveertemperatuur': w.temperatuur || '',
    'Spijscombinatie': w.eten || '',
    'Geschatte prijs': w.prijs || '',
    'Favoriet': w.favorite ? 'Ja' : 'Nee',
    'Opmerkingen': w.opmerkingen || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set friendly auto column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Wijnnaam
    { wch: 24 }, // Wijnhuis
    { wch: 10 }, // Jaargang
    { wch: 12 }, // Type
    { wch: 22 }, // Druif
    { wch: 14 }, // Land
    { wch: 18 }, // Streek
    { wch: 14 }, // Aantal flessen
    { wch: 12 }, // Plank
    { wch: 25 }, // Opslaglocatie
    { wch: 12 }, // Vivino Score
    { wch: 18 }, // Optimaal drinkvenster
    { wch: 18 }, // Uiterlijk drinken tot
    { wch: 18 }, // Klimaatkast Advies
    { wch: 40 }, // Klimaat Argumentatie
    { wch: 16 }, // Serveertemperatuur
    { wch: 30 }, // Spijscombinatie
    { wch: 14 }, // Geschatte prijs
    { wch: 10 }, // Favoriet
    { wch: 40 }  // Opmerkingen
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wijnvoorraad');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `wijnkelder-voorraad-${dateStr}.xlsx`);
}
