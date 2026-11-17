import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadReceiptPDF = (txn) => {
  const doc = new jsPDF();

  // Primary Colors
  const navy = [11, 25, 44];
  const blue = [0, 102, 255];
  const darkGray = [51, 65, 85];
  const lightBg = [248, 250, 252];

  // Header Background
  doc.setFillColor(...navy);
  doc.rect(0, 0, 210, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ONLINE BANKING MANAGEMENT SYSTEM', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('OFFICIAL ELECTRONIC TRANSACTION RECEIPT', 105, 26, { align: 'center' });
  doc.text('Educational Banking Simulation • Secured Transaction', 105, 32, { align: 'center' });

  // Blue Accent Line
  doc.setFillColor(...blue);
  doc.rect(0, 38, 210, 3, 'F');

  // Meta info section
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TRANSACTION RECEIPT', 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 58);
  doc.text(`Transaction Reference: ${txn.transaction_id}`, 14, 64);

  // Amount Highlight Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 72, 182, 24, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 72, 182, 24, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.text('Total Amount Processed:', 22, 83);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald green
  doc.text(`$${parseFloat(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 22, 91);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`[ STATUS: ${txn.status || 'SUCCESS'} ]`, 190, 86, { align: 'right' });

  // Table Data
  const tableData = [
    ['Transaction ID', txn.transaction_id],
    ['Date & Time', new Date(txn.created_at).toLocaleString()],
    ['Transaction Type', txn.transaction_type],
    ['Amount', `$${parseFloat(txn.amount).toFixed(2)} USD`],
    ['Sender Name', txn.sender_name || 'N/A (Cash / External Deposit)'],
    ['Sender Account Number', txn.sender_account_number || 'N/A'],
    ['Beneficiary Name', txn.receiver_name || 'N/A (Cash Withdrawal)'],
    ['Beneficiary Account Number', txn.receiver_account_number || 'N/A'],
    ['Transaction Remarks', txn.remarks || 'None'],
  ];

  autoTable(doc, {
    startY: 104,
    head: [['Field Description', 'Transaction Details']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkGray,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 117 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 14;

  // Security Verification Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY, 182, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, 182, 24, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('SYSTEM VERIFICATION NOTICE:', 20, finalY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('This is an electronically generated receipt produced by the Online Banking Management System.', 20, finalY + 14);
  doc.text('SIMULATION MODE: All balances and transactions are simulated for academic and training purposes.', 20, finalY + 19);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Online Banking Management System • Safe & Secure Educational Platform', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`Receipt_${txn.transaction_id}.pdf`);
};
