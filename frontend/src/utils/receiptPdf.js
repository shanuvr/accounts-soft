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
export const fmtReceiptDate = (dateStr) => {
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
export const fmtAmount = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helper: convert number to Indian English words (e.g. Three Thousand Rupees Only)
export const numberToWords = (num) => {
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

// Render one copy of the receipt at horizontal offset x0
const renderReceiptCopy = (doc, payment, summary, x0, copyLabel, logoInfo, user) => {
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
  doc.text('[ PAYMENT RECEIPT ]', xRight, 37, { align: 'right' });

  // 3. Metadata Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Order No :', xLeft, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(String(payment.orderId || '—'), xLeft + 48, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Date       :', xLeft, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtReceiptDate(payment.date), xLeft + 48, 74);

  doc.setFont('helvetica', 'bold');
  doc.text('From      :', xLeft, 86);
  doc.setFont('helvetica', 'normal');
  const custName = String(payment.customer || '');
  const custLines = doc.splitTextToSize(custName, 160);
  doc.text(custLines, xLeft + 48, 86);

  // Receipt / Voucher Box (Right metadata)
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 30, 30);
  doc.rect(xRight - 98, 44, 98, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RECEIPT / VOUCHER', xRight - 49, 54, { align: 'center' });

  // Original / Duplicate label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(copyLabel, xRight, 72, { align: 'right' });

  // Receipt No
  const rcpIdStr = String(payment.paymentId ? `RCP-${payment.paymentId}` : 'RECEIPT');
  const rcpLabelStr = 'Receipt No: ';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const labelW = doc.getTextWidth(rcpLabelStr);
  doc.setFont('helvetica', 'bold');
  const valW = doc.getTextWidth(rcpIdStr);
  const totalRcpW = labelW + valW;

  doc.setFont('helvetica', 'normal');
  doc.text(rcpLabelStr, xRight - totalRcpW, 86);
  doc.setFont('helvetica', 'bold');
  doc.text(rcpIdStr, xRight - valW, 86);

  // 4. Main Body Table
  const yTableTop = 98;
  const yTableBottom = 380;
  const xColLabel = xLeft + 120; // dividing point between label & details

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('PARTICULARS', xLeft + 8, 110);
  doc.text('DETAILS', xColLabel + 8, 110);

  // Dashed lines setup
  doc.setLineDashPattern([2.5, 2], 0);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.75);

  // Outer Table Box
  doc.rect(xLeft, yTableTop, contentW, yTableBottom - yTableTop);
  // Header bottom line
  doc.line(xLeft, 114, xRight, 114);
  // Vertical column divider
  doc.line(xColLabel, yTableTop, xColLabel, 240);

  // Rows of Payment Information
  const infoRows = [
    ['Received Towards', payment.planStage ? `${payment.planStage} (Order #${payment.orderId})` : `Payment for Order #${payment.orderId}`],
    ['Invoice Reference', payment.invoiceId || '—'],
    ['Payment Mode', payment.method || 'Cash'],
    ['Transaction / Ref No.', payment.reference || '—'],
    ['Payment Status', payment.status || 'Received'],
    ['Received By', payment.receivedBy || (user && user.name) || 'Authorized Staff'],
  ];

  let yRow = 127;
  infoRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(lbl, xLeft + 8, yRow);

    doc.setFont('helvetica', 'normal');
    doc.text(String(val), xColLabel + 8, yRow);

    yRow += 18;
  });

  // Account Status / Summary Box inside table (y = 240 to 344)
  doc.line(xLeft, 240, xRight, 240);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('ORDER PAYMENT SUMMARY', xLeft + 8, 252);

  const orderVal = summary?.orderValue ?? 0;
  const thisAmt = payment.amount || 0;
  const totReceived = summary?.received ?? thisAmt;
  const prevReceived = Math.max(0, totReceived - thisAmt);
  const balPending = summary?.pending ?? Math.max(0, orderVal - totReceived);

  const summaryGrid = [
    ['Total Order Value:', `Rs. ${fmtAmount(orderVal)}`],
    ['Previously Received:', `Rs. ${fmtAmount(prevReceived)}`],
    ['Amount Received This Receipt:', `Rs. ${fmtAmount(thisAmt)}`],
    ['Total Received to Date:', `Rs. ${fmtAmount(totReceived)}`],
    ['Balance Pending:', `Rs. ${fmtAmount(balPending)}`],
  ];

  let ySum = 266;
  summaryGrid.forEach(([label, value], idx) => {
    doc.setFont('helvetica', idx === 2 ? 'bold' : 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 30, 30);
    doc.text(label, xLeft + 12, ySum);
    doc.text(value, xRight - 12, ySum, { align: 'right' });
    ySum += 14;
  });

  // Amount Received Highlights (Total bar)
  const ySubTotalLine = 344;
  const yTotalLine = 360;

  doc.line(xLeft, ySubTotalLine, xRight, ySubTotalLine);
  doc.line(xLeft, yTotalLine, xRight, yTotalLine);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Amount Received', xRight - 90, ySubTotalLine + 10, { align: 'right' });
  doc.text(`Rs. ${fmtAmount(thisAmt)}`, xRight - 8, ySubTotalLine + 10, { align: 'right' });

  // Amount in words
  const wordsStr = numberToWords(thisAmt);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(wordsStr, xLeft + 8, yTotalLine + 11);

  doc.setFontSize(8.5);
  doc.text('NET RECEIVED', xRight - 90, yTotalLine + 11, { align: 'right' });
  doc.text(`Rs. ${fmtAmount(thisAmt)}`, xRight - 8, yTotalLine + 11, { align: 'right' });

  // Reset line dash to solid
  doc.setLineDashPattern([], 0);

  // 5. Receipt Notice Box & Signature Section
  const yFooterBox = 392;
  const hFooterBox = 75;
  const wNoticeBox = 192;

  // Left Notice Box (Dashed border)
  doc.setLineDashPattern([2.5, 2], 0);
  doc.rect(xLeft, yFooterBox, wNoticeBox, hFooterBox);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);
  const noticeLines = [
    'Thank you for your business!',
    'Receipt is issued subject to realization of funds.',
    'For any queries, please quote the Receipt & Order No.'
  ];
  noticeLines.forEach((line, i) => {
    doc.text(line, xLeft + (wNoticeBox / 2), yFooterBox + 28 + (i * 11), { align: 'center' });
  });

  // Right Side (Digital Signature)
  const xSigCenter = xRight - 70;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('For Programers International', xSigCenter, yFooterBox + 12, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Authorized Signatory Valid', xSigCenter, yFooterBox + 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(60, 60, 60);
  const signer = (user && user.name) || payment.receivedBy || 'Husna M S';
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

export const downloadReceiptPdf = async (payment, summary, user) => {
  const logoInfo = await getLogoInfo();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Copy 1 (Left): Original for Customer
  renderReceiptCopy(doc, payment, summary, 0, 'Original', logoInfo, user);

  // Middle Dashed Divider Cut-Line
  doc.setLineDashPattern([4, 4], 0);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.75);
  doc.line(420.94, 10, 420.94, 536);

  // Copy 2 (Right): Duplicate for Office
  renderReceiptCopy(doc, payment, summary, 421, 'Duplicate', logoInfo, user);

  doc.save(`Receipt-${payment.paymentId || 'Payment'}.pdf`);
};
