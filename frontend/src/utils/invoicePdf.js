import { jsPDF } from 'jspdf';

// Helper: load logo image info (dataUrl, width, height, aspect ratio)
const getLogoInfo = () => {
  return new Promise((resolve) => {
    const candidatePaths = [
      '/programers-logo-BLACCK.png',
      '/programers-logo-black.png',
      '/programers-logo-BLACCK.PNG',
      '/programers-logo-black.PNG'
    ];

    let current = 0;
    const tryNext = () => {
      if (current >= candidatePaths.length) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: w,
            height: h,
            aspect: w / h
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        current++;
        tryNext();
      };
      img.src = candidatePaths[current];
    };

    tryNext();
  });
};

// Helper: format date like 03-Sep-2026
const fmtInvoiceDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper: format amount with Indian commas e.g. 2,30,000.00
const fmtAmount = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helper: convert number to Indian English words (e.g. Three Thousand Rupees Only)
const numberToWords = (num) => {
  const n = Math.round(Number(num || 0));
  if (n === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 ? ' ' + convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 ? ' ' + convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 ? ' ' + convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 ? ' ' + convert(val % 10000000) : '');
  }

  const words = convert(n);
  return words ? `${words} Rupees Only` : '';
};

// Render one copy of the invoice at horizontal offset x0
const renderInvoiceCopy = (doc, invoice, x0, copyLabel, logoInfo, user) => {
  const copyW = 396;
  const xFrameLeft = x0 + 12;
  const xLeft = xFrameLeft + 12;            // Content left margin = x0 + 24
  const xRight = xFrameLeft + copyW - 12;   // Content right margin = x0 + 384
  const contentW = xRight - xLeft;          // Content width = 360 pt

  const yTopFrame = 12;
  const yBottomFrame = 536;

  // 1. Outer Frame Box (Solid Border)
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1);
  doc.setLineDashPattern([], 0);
  doc.rect(xFrameLeft, yTopFrame, copyW, yBottomFrame - yTopFrame);

  // 2. Header: Logo & Title
  if (logoInfo && logoInfo.dataUrl) {
    try {
      const maxH = 26;
      const logoW = Math.min(125, maxH * (logoInfo.aspect || 3.5));
      doc.addImage(logoInfo.dataUrl, 'PNG', xLeft, 16, logoW, maxH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('PROGRAMERS', xLeft, 32);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('PROGRAMERS', xLeft, 32);
  }

  // Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Programers International', xRight, 24, { align: 'right' });
  doc.setFontSize(9.5);
  doc.text('[ Cash Invoice ]', xRight, 37, { align: 'right' });

  // 3. Metadata Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Order No :', xLeft, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(String(invoice.orderId || '2609-08-200'), xLeft + 48, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Date       :', xLeft, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtInvoiceDate(invoice.invoiceDate), xLeft + 48, 74);

  doc.setFont('helvetica', 'bold');
  doc.text('To          :', xLeft, 86);
  doc.setFont('helvetica', 'normal');
  const custName = String(invoice.customer || '');
  const custLines = doc.splitTextToSize(custName, 160);
  doc.text(custLines, xLeft + 48, 86);

  // Proforma / Invoice Box (Right metadata)
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 30, 30);
  doc.rect(xRight - 98, 44, 98, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('PROFORMA / INVOICE', xRight - 49, 54, { align: 'center' });

  // Original / Duplicate label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(copyLabel, xRight, 72, { align: 'right' });

  // Invoice No
  const invIdStr = String(invoice.invoiceId || '207');
  const invLabelStr = 'Invoice No: ';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const labelW = doc.getTextWidth(invLabelStr);
  doc.setFont('helvetica', 'bold');
  const valW = doc.getTextWidth(invIdStr);
  const totalInvW = labelW + valW;

  doc.setFont('helvetica', 'normal');
  doc.text(invLabelStr, xRight - totalInvW, 86);
  doc.setFont('helvetica', 'bold');
  doc.text(invIdStr, xRight - valW, 86);

  // 4. Main Table Section
  const yTableTop = 98;
  const yTableBottom = 380;

  const xCol1 = xLeft + 18;  // # column ends
  const xCol2 = xLeft + 225; // Description column ends (width 207)
  const xCol3 = xLeft + 252; // Qty column ends (width 27)
  const xCol4 = xLeft + 306; // Rate column ends (width 54)
  // Amount column: xCol4 to xRight (width 54)

  // Table Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('#', xLeft + 9, 110, { align: 'center' });
  doc.text('Description', xLeft + 115, 110, { align: 'center' });
  doc.text('Qty', xCol3 - 4, 110, { align: 'right' });
  doc.text('Rate', xCol4 - 5, 110, { align: 'right' });
  doc.text('Amount', xRight - 5, 110, { align: 'right' });

  // Table Items
  let yItem = 130;
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { name: 'Domain Registration', quantity: 1, price: 3000 },
    { name: 'Web Design', quantity: 1, price: 10000 },
    { name: 'Website Programming Dynamic Section', quantity: 1, price: 2000 }
  ];

  items.forEach((it, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    // #
    doc.text(String(idx + 1), xLeft + 9, yItem, { align: 'center' });

    // Description (uppercase)
    const descName = (it.name || '').toUpperCase();
    const descLines = doc.splitTextToSize(descName, 200);
    doc.text(descLines, xCol1 + 5, yItem);

    // Qty
    doc.text(String(it.quantity ?? 1), xCol3 - 4, yItem, { align: 'right' });

    // Rate
    doc.text(fmtAmount(it.price), xCol4 - 5, yItem, { align: 'right' });

    // Amount
    const lineAmt = (it.price * (it.quantity ?? 1)) - (it.discount || 0);
    doc.text(fmtAmount(lineAmt), xRight - 5, yItem, { align: 'right' });

    yItem += Math.max(1, descLines.length) * 12 + 8;
  });

  // Calculate Subtotal & Total
  const subtotal = invoice.subtotal ?? items.reduce((s, it) => s + (it.price * (it.quantity ?? 1)), 0);
  const total = invoice.total ?? subtotal - (invoice.discount || 0) + (invoice.tax || 0);

  // Sub Total Row
  const ySubTotalLine = 344;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Sub Total', xCol4 - 5, ySubTotalLine + 10, { align: 'right' });
  doc.text(fmtAmount(subtotal), xRight - 5, ySubTotalLine + 10, { align: 'right' });

  // Total & Amount in words Row
  const yTotalLine = 360;
  const wordsStr = numberToWords(total);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(wordsStr, xLeft + 5, yTotalLine + 11);

  doc.setFontSize(8);
  doc.text('Total', xCol4 - 5, yTotalLine + 11, { align: 'right' });
  doc.text(fmtAmount(total), xRight - 5, yTotalLine + 11, { align: 'right' });

  // Table Dashed Borders
  doc.setLineDashPattern([2.5, 2], 0);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.75);

  // Outer Table Box
  doc.rect(xLeft, yTableTop, contentW, yTableBottom - yTableTop);

  // Horizontal Dashed Lines
  doc.line(xLeft, 112, xRight, 112);                     // Header bottom
  doc.line(xLeft, ySubTotalLine, xRight, ySubTotalLine); // Subtotal top
  doc.line(xLeft, yTotalLine, xRight, yTotalLine);       // Total top

  // Vertical Dashed Lines
  doc.line(xCol1, yTableTop, xCol1, ySubTotalLine);
  doc.line(xCol2, yTableTop, xCol2, ySubTotalLine);
  doc.line(xCol3, yTableTop, xCol3, ySubTotalLine);
  doc.line(xCol4, yTableTop, xCol4, yTableBottom);

  // Reset line dash to solid
  doc.setLineDashPattern([], 0);

  // 5. Payment Info Notice Box & Signature Section
  const yFooterBox = 392;
  const hFooterBox = 75;
  const wNoticeBox = 192;

  // Left Notice Box (Dashed border)
  doc.setLineDashPattern([2.5, 2], 0);
  doc.rect(xLeft, yFooterBox, wNoticeBox, hFooterBox);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(50, 50, 50);
  const noticeLines = [
    'All Payments should be made by cash/cheque/UPI payable to',
    'Programers International.Claims are accepted only before',
    'delivery.'
  ];
  noticeLines.forEach((line, i) => {
    doc.text(line, xLeft + (wNoticeBox / 2), yFooterBox + 28 + (i * 10.5), { align: 'center' });
  });

  // Right Side (Digital Signature)
  const xSigCenter = xRight - 70;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('For Programers International', xSigCenter, yFooterBox + 12, { align: 'center' });

  // Authorized Signature Valid
  doc.setFontSize(8);
  doc.text('Authorized Signature Valid', xSigCenter, yFooterBox + 25, { align: 'center' });

  // Digitally signed details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(60, 60, 60);
  const signer = (user && user.name) ? user.name : 'Husna M S';
  doc.text(`Digitally signed by ${signer}`, xSigCenter, yFooterBox + 37, { align: 'center' });

  const dateNow = new Date();
  const dateStamp = `${dateNow.getFullYear()}.${String(dateNow.getMonth() + 1).padStart(2, '0')}.${String(dateNow.getDate()).padStart(2, '0')} 07:45:30 +00:00`;
  doc.text(`Date: ${dateStamp}`, xSigCenter, yFooterBox + 48, { align: 'center' });
  doc.text('Location: Thrissur', xSigCenter, yFooterBox + 58, { align: 'center' });

  // 6. Bottom Address Footer Banner
  const yFooter = 492;
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 30, 30);
  doc.line(xLeft, yFooter, xRight, yFooter);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  const xCenter = xFrameLeft + (copyW / 2);
  doc.text('Programers International', xCenter, yFooter + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(50, 50, 50);
  doc.text('4th Floor, Park House ,Round North, Thrissur, Kerala, India - 680 001 | info@programers.in,', xCenter, yFooter + 23, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 20, 20);
  doc.text('www.programers.in | Ph: 9447151442, 9495951442, 9446451442', xCenter, yFooter + 34, { align: 'center' });
};

export const downloadInvoicePdf = async (invoice, user) => {
  const logoInfo = await getLogoInfo();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Copy 1 (Left): Original
  renderInvoiceCopy(doc, invoice, 0, 'Original', logoInfo, user);

  // Middle Dashed Divider Cut-Line
  doc.setLineDashPattern([4, 4], 0);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.75);
  doc.line(420.94, 10, 420.94, 536);

  // Copy 2 (Right): Duplicate / Copy
  renderInvoiceCopy(doc, invoice, 421, 'Duplicate', logoInfo, user);

  doc.save(`${invoice.invoiceId || 'Invoice'}.pdf`);
};
