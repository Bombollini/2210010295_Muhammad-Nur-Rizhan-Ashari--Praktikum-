
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (
  title: string,
  columns: string[],
  data: any[][],
  fileName: string = 'report'
) => {
  const doc = new jsPDF();

  // 1. Header
  doc.setFontSize(18);
  doc.text('Rumah BUMN Banjarmasin', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  const dateStr = new Date().toLocaleString('id-ID', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  doc.text(`Tanggal Cetak: ${dateStr}`, 14, 30);

  // 2. Title
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title.toUpperCase(), 14, 45);

  // 3. Table
  autoTable(doc, {
    head: [columns],
    body: data,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // 4. Footer
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Dicetak oleh sistem dashboard admin Rumah BUMN Banjarmasin.', 
    14, 
    finalY + 10
  );

  // Save
  doc.save(`${fileName}.pdf`);
};
