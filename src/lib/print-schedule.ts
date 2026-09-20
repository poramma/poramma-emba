// src/lib/print-schedule.ts
//
// Impression du planning des rendez-vous d'UNE date : PDF A4 ou ticket
// thermique 80 mm. Le contenu vient du serveur (POST /rendez-vous/print-daily) :
// il est déjà filtré sur la date, sans les rendez-vous annulés, regroupé par
// service et ordonné par créneau — on ne fait ici que le mettre en page.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyScheduleContent } from '../types/rendez-vous';

const STATUS_FR: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CHECKED_IN: 'Arrivé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  MISSED: 'Manqué',
};

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const generatedAt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

/** jsPDF (police standard) ne sait pas afficher certains caractères : on garde le texte simple. */
const clean = (v: string | null | undefined) => (v ?? '').replace(/[^\S\n]+/g, ' ').trim();

export function generateSchedulePdf(content: DailyScheduleContent, meta: { agentLabel?: string; serviceLabel?: string; printedBy?: string } = {}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 87, 44);
  doc.text('Ambassade du Mali au Maroc', 14, 16);
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(`Planning des rendez-vous — ${longDate(content.date)}`, 14, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const filters = [meta.serviceLabel ? `Service : ${meta.serviceLabel}` : 'Tous les services', meta.agentLabel ? `Agent : ${meta.agentLabel}` : 'Tous les agents'];
  doc.text(`${content.totalAppointments} rendez-vous — ${filters.join(' · ')}`, 14, 30);

  let y = 36;

  if (content.byService.length === 0) {
    doc.setFontSize(11);
    doc.text('Aucun rendez-vous actif pour cette date.', 14, y + 6);
  }

  for (const group of content.byService) {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 87, 44);
    doc.text(`${clean(group.subServiceName)}  (${group.appointments.length})`, 14, y);

    autoTable(doc, {
      startY: y + 2,
      head: [['Heure', 'Ticket', 'Usager', 'INUE', 'Téléphone', 'Motif', 'Statut']],
      body: group.appointments.map((a) => [
        a.endTime ? `${a.time}–${a.endTime}` : a.time,
        a.ticketId,
        clean(a.studentName) + (a.isUrgent ? '  [URGENT]' : ''),
        a.studentInue && a.studentInue !== 'N/A' ? a.studentInue : '—',
        a.studentPhone ?? '—',
        clean(a.motif) || '—',
        STATUS_FR[a.status] ?? a.status,
      ]),
      styles: { fontSize: 8, cellPadding: 1.8, valign: 'middle' },
      headStyles: { fillColor: [0, 87, 44], textColor: 255 },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 30 }, 3: { cellWidth: 26 }, 4: { cellWidth: 26 }, 6: { cellWidth: 20 } },
      margin: { left: 14, right: 14 },
    });

    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10) + 9;
  }

  // Pied de page : édition et numérotation
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footer = `Édité le ${generatedAt(content.generatedAt)}${meta.printedBy ? ` par ${clean(meta.printedBy)}` : ''}`;
    doc.text(footer, 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i} / ${pages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  doc.save(`planning-rdv-${content.date}.pdf`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Ticket pour imprimante thermique 80 mm : ouvre une fenêtre d'impression au
 * format ticket (largeur 80 mm, hauteur libre, police monospace). Renvoie
 * `false` si le navigateur a bloqué la fenêtre (l'appelant l'explique).
 */
export function printThermalSchedule(content: DailyScheduleContent, meta: { agentLabel?: string; serviceLabel?: string } = {}): boolean {
  const lines = content.byService
    .map(
      (g) => `
      <div class="svc">${esc(g.subServiceName)} (${g.appointments.length})</div>
      ${g.appointments
        .map(
          (a) => `
        <div class="row"><b>${esc(a.time)}</b> ${esc(a.ticketId)}${a.isUrgent ? ' <b>URGENT</b>' : ''}</div>
        <div class="sub">${esc(a.studentName)}${a.studentInue && a.studentInue !== 'N/A' ? ` — ${esc(a.studentInue)}` : ''}</div>
        ${a.studentPhone ? `<div class="sub">${esc(a.studentPhone)}</div>` : ''}
        ${a.motif ? `<div class="sub">${esc(a.motif)}</div>` : ''}
        <div class="sep"></div>`
        )
        .join('')}`
    )
    .join('');

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Planning ${esc(content.date)}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 74mm; margin: 0; color: #000; }
  h1 { font-size: 13px; text-align: center; margin: 0 0 2px; }
  .date { text-align: center; font-size: 11px; margin-bottom: 4px; }
  .meta { text-align: center; font-size: 10px; margin-bottom: 6px; }
  .svc { font-weight: bold; margin-top: 8px; border-bottom: 1px solid #000; }
  .row { margin-top: 4px; }
  .sub { padding-left: 6px; }
  .sep { border-bottom: 1px dashed #000; margin: 3px 0; }
  .foot { text-align: center; font-size: 9px; margin-top: 8px; }
</style></head><body>
  <h1>AMBASSADE DU MALI</h1>
  <div class="date">${esc(longDate(content.date))}</div>
  <div class="meta">${content.totalAppointments} rendez-vous${meta.serviceLabel ? ` — ${esc(meta.serviceLabel)}` : ''}${meta.agentLabel ? ` — ${esc(meta.agentLabel)}` : ''}</div>
  ${lines || '<div class="sub">Aucun rendez-vous actif.</div>'}
  <div class="foot">Édité le ${esc(generatedAt(content.generatedAt))}</div>
  <script>window.onload = function () { window.print(); setTimeout(function () { window.close(); }, 300); };</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=380,height=640');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
