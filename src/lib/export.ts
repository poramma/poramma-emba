// ============================================================
// src/lib/export.ts
// ============================================================

/**
 * UTILITAIRES D'EXPORT
 * 
 * - Génération PDF (planning, attestations, rapports)
 * - Export Excel (statistiques, listes)
 * - Impression thermique (tickets, reçus)
 * 
 * Backend: Les générations lourdes peuvent être déléguées au backend
 * Frontend: Génération légère pour les aperçus rapides
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DailyScheduleContent } from '../types';

// ============================================================
// TYPES
// ============================================================

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'thermal';

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  footer?: string;
  orientation?: 'portrait' | 'landscape';
}

// ============================================================
// PDF - PLANNING JOURNALIER (besoin ambassade: "imprimer pour le gardien")
// ============================================================

/**
 * Génère un PDF du planning journalier des rendez-vous
 * Format A4, prêt pour impression
 */
export async function generatePlanningPDF(
  content: DailyScheduleContent,
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // En-tête avec logo et titre
  doc.setFontSize(18);
  doc.setTextColor(0, 100, 0); // Vert Mali
  doc.text('AMBASSADE DU MALI AU MAROC', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Planning des Rendez-vous', 105, 30, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`Date: ${formatDateFR(content.date)}`, 105, 38, { align: 'center' });
  doc.text(`Généré le: ${formatDateFR(content.generatedAt)}`, 105, 44, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(0, 100, 0);
  doc.line(20, 48, 190, 48);
  
  let yPosition = 55;
  
  // Pour chaque service
  content.byService.forEach((service) => {
    // Titre du service
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text(service.subServiceName, 20, yPosition);
    yPosition += 8;
    
    // Tableau des rendez-vous
    const tableData = service.appointments.map((apt) => [
      apt.time,
      apt.ticketId,
      apt.studentName,
      apt.studentInue,
      apt.motif,
      apt.isUrgent ? 'URGENT' : '',
      apt.agentName,
    ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Heure', 'Ticket', 'Étudiant', 'INUE', 'Motif', 'Urg.', 'Agent']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 12 },
        6: { cellWidth: 28 },
      },
      styles: {
        cellPadding: 2,
      },
      didDrawCell: (data: any) => {
        // Mettre en rouge les urgences
        if (data.column.index === 5 && data.cell.raw === 'URGENT') {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  });
  
  // Pied de page
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Total: ${content.totalAppointments} rendez-vous | Document confidentiel - Ambassade du Mali`,
    105,
    280,
    { align: 'center' }
  );
  
  return doc.output('blob');
}

// ============================================================
// PDF - ATTESTATION / CERTIFICAT
// ============================================================

/**
 * Génère un PDF d'attestation officielle
 * Avec QR code et numéro de série
 */
export async function generateAttestationPDF(data: {
  type: string;
  numero: string;
  date: string;
  beneficiaire: {
    nom: string;
    prenom: string;
    inue: string;
    dateNaissance: string;
    lieuNaissance: string;
  };
  contenu: string;
  signataire: {
    nom: string;
    fonction: string;
  };
  qrCodeData: string;
}): Promise<Blob> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Bordure officielle
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);
  
  // Logo et en-tête
  doc.setFontSize(16);
  doc.setTextColor(0, 100, 0);
  doc.text('RÉPUBLIQUE DU MALI', 105, 25, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Ambassade du Mali au Royaume du Maroc', 105, 32, { align: 'center' });
  
  doc.setDrawColor(255, 200, 0); // Jaune Mali
  doc.setLineWidth(2);
  doc.line(30, 38, 180, 38);
  
  // Titre du document
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(data.type.toUpperCase(), 105, 50, { align: 'center' });
  
  // Numéro et date
  doc.setFontSize(10);
  doc.text(`N° ${data.numero}`, 20, 60);
  doc.text(`Fait à Rabat, le ${formatDateFR(data.date)}`, 150, 60);
  
  // Corps
  doc.setFontSize(11);
  const splitContent = doc.splitTextToSize(data.contenu, 170);
  doc.text(splitContent, 20, 75);
  
  // QR Code (simulation - rectangle avec texte)
  doc.setDrawColor(0, 0, 0);
  doc.rect(20, 220, 30, 30);
  doc.setFontSize(8);
  doc.text('QR Code', 35, 238, { align: 'center' });
  doc.text('Vérification', 35, 245, { align: 'center' });
  
  // Signature
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.signataire.fonction, 150, 230, { align: 'center' });
  doc.text(data.signataire.nom, 150, 250, { align: 'center' });
  
  // Tampon (simulation)
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(1);
  doc.ellipse(150, 240, 20, 12);
  doc.setFontSize(8);
  doc.setTextColor(200, 0, 0);
  doc.text('TAMPON OFFICIEL', 150, 242, { align: 'center' });
  
  return doc.output('blob');
}

// ============================================================
// EXCEL - EXPORT STATISTIQUES
// ============================================================

/**
 * Exporte des données en Excel
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string,
  filename: string
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exporte un tableau de données en CSV
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

/**
 * Exporte un tableau de données en PDF
 */
export function exportToPdf<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  if (data.length === 0) {
    doc.setFontSize(12);
    doc.text('Aucune donnée à exporter', 105, 150, { align: 'center' });
    doc.save(`${filename}.pdf`);
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((key) => String(item[key] ?? '')));

  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 100, 0);
  doc.text(filename.replace(/-/g, ' ').toUpperCase(), 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le: ${formatDateFR(new Date().toISOString())}`, 105, 28, { align: 'center' });

  // Add table
  (doc as any).autoTable({
    startY: 35,
    head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 100, 0],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      cellPadding: 3,
      overflow: 'linebreak',
    },
    margin: { top: 35, left: 15, right: 15, bottom: 20 },
  });

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} / ${pageCount} | Total: ${data.length} enregistrements`,
      105,
      285,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================
// IMPRESSION THERMIQUE (Ticket)
// ============================================================

/**
 * Génère un ticket pour imprimante thermique
 * Format compact (80mm de large)
 */
export function generateThermalTicket(data: {
  ticketId: string;
  type: string;
  date: string;
  heure: string;
  service: string;
  agent: string;
  etudiant: string;
  inue: string;
  qrCode: string;
}): string {
  // Format ESC/POS pour imprimantes thermiques
  return `
    \x1B\x40          // Initialize
    \x1B\x61\x01      // Center align
    \x1B\x21\x30      // Double height & width
    AMBASSADE DU MALI
    \x1B\x21\x00      // Normal
    ----------------
    Ticket: ${data.ticketId}
    Type: ${data.type}
    ----------------
    Date: ${data.date}
    Heure: ${data.heure}
    ----------------
    Service:
    ${data.service}
    ----------------
    Agent:
    ${data.agent}
    ----------------
    Étudiant:
    ${data.etudiant}
    INUE: ${data.inue}
    ----------------
    \x1D\x6B\x02      // QR Code
    ${data.qrCode}
    \x1B\x61\x01      // Center
    Merci de patienter
    votre tour sera
    bientôt appelé
    \x1B\x64\x02      // Feed 2 lines
    \x1D\x56\x00      // Cut paper
  `;
}

// ============================================================
// HELPERS
// ============================================================

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Déclenche l'impression du navigateur
 */
export function printDocument(blob: Blob, title: string): void {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    printWindow.document.title = title;
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Télécharge un fichier
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}