import { useEffect, useRef } from 'react';

interface PrintLabelProps {
  memberName: string;
  neighborhood: string | null;
  date: string;
  onPrintComplete: () => void;
}

export function printMemberLabel(member: { first_name: string; last_name: string; neighborhood?: { name: string } | null }, date: string) {
  const name = `${member.first_name} ${member.last_name}`.trim();
  const neighborhood = member.neighborhood?.name || '';

  const printWindow = window.open('', '_blank', 'width=400,height=300');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Label - ${name}</title>
      <style>
        @page {
          size: 62mm 29mm;
          margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          width: 62mm;
          height: 29mm;
          padding: 3mm 4mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .name {
          font-size: 14pt;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 2mm;
        }
        .details {
          font-size: 8pt;
          color: #555;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .neighborhood {
          font-weight: 600;
        }
        .date {
          font-size: 7pt;
          color: #888;
        }
        .event {
          font-size: 7pt;
          color: #888;
          margin-top: 1mm;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="name">${name}</div>
      <div class="details">
        <span class="neighborhood">${neighborhood}</span>
        <span class="date">${new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <div class="event">Friday Youth Night</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
