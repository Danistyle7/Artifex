import { formatBs, formatPickupDate, isCounterSale } from './reservation-data.mjs';

const width = 226.77; // An 80 mm roll.
const margin = 16;
const green = '0.09 0.22 0.18';
const clay = '0.64 0.27 0.19';
const ink = '0.14 0.20 0.17';
const muted = '0.31 0.35 0.31';
const cream = '0.98 0.96 0.92';

function pdfString(value) {
  // Use ASCII octal escapes for WinAnsi glyphs so byte offsets stay exact.
  return Array.from(value.normalize('NFC'), character => {
    const code = character.codePointAt(0);
    if (code >= 32 && code <= 126) return character.replace(/[\\()]/u, '\\$&');
    if (code >= 160 && code <= 255) return '\\' + code.toString(8).padStart(3, '0');
    return '?';
  }).join('');
}

function glyphWidth(character) {
  // Conservative em widths for the standard Latin fonts used by the ticket.
  const base = character.normalize('NFD')[0];
  if (/[WMw%&@æÆŒœ]/u.test(base)) return 1;
  if (/[A-Zm]/u.test(base)) return .85;
  if (/[0-9]/u.test(base)) return .57;
  if (/[ijl.,:;!()| ]/u.test(base)) return .37;
  if (/[a-z×\-/'?]/u.test(base)) return .68;
  return 1;
}

function linesFor(value, size) {
  const limit = (width - 2 * margin) / size;
  const lines = [];
  let line = '';
  let used = 0;
  for (const word of String(value).trim().split(/\s+/u)) {
    const characters = Array.from(word);
    const wordWidth = characters.reduce((total, character) => total + glyphWidth(character), 0);
    if (line && used + glyphWidth(' ') + wordWidth > limit) {
      lines.push(line);
      line = '';
      used = 0;
    }
    if (line) {
      line += ' ';
      used += glyphWidth(' ');
    }
    for (const character of characters) {
      const advance = glyphWidth(character);
      if (used + advance > limit) {
        lines.push(line);
        line = '';
        used = 0;
      }
      line += character;
      used += advance;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ticketPdf(order) {
  const counter = isCounterSale(order);
  const commands = [];
  let top = 29;

  function text(value, size = 10, font = 'F2', color = ink) {
    for (const line of linesFor(value, size)) {
      const topAtLine = top;
      commands.push(height => `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${margin} ${height - topAtLine} Tm (${pdfString(line)}) Tj ET`);
      top += size + 3;
    }
  }

  function rule(color = '0.83 0.79 0.70') {
    const position = top - 2;
    commands.push(height => `${color} RG 0.65 w ${margin} ${height - position} m ${width - margin} ${height - position} l S`);
    top += 12;
  }

  text('Artifex', 27, 'F1', green);
  top -= 11;
  text('Pan con alma', 9, 'F2', muted);
  top += 4;
  rule(clay);
  text(counter ? 'Venta de mostrador' : 'Ticket de reserva', 12, 'F3', green);
  text(order.code, 10, 'F3');
  top += 3;
  if (!counter) text(order.customer.name);
  text(formatPickupDate(order.pickup.date), 9);
  text(`${counter ? 'Hora' : 'Recojo'} ${order.pickup.slot}`, 9);
  top += 4;
  rule();
  for (const item of order.items) {
    text(`${item.quantity} × ${item.name}`, 10, 'F3');
    text(`${formatBs(item.unitPrice)} c/u   |   ${formatBs(item.subtotal)}`, 9, 'F2', muted);
    top += 3;
  }
  rule();
  text(`Total ${formatBs(order.total)}`, 14, 'F3', green);
  if (order.status === 'cancelado') text('Cancelado', 10, 'F3', clay);
  else if (order.status === 'no_recogido') text('No recogido', 10, 'F3', clay);
  else if (!counter && order.status !== 'entregado') text('Pago al recoger.', 9);
  top += 4;
  text(counter ? 'Venta de demostración.' : 'Reserva simulada. No enviada a Artifex.', 8, 'F2', clay);
  text('Sin validez fiscal ni de pago.', 8, 'F2', muted);

  const height = top + 8;
  const stream = [
    `${cream} rg 0 0 ${width} ${height} re f`,
    `${green} rg 0 ${height - 4} ${width} 4 re f`,
    ...commands.map(command => command(height)),
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
    ...['Times-Bold', 'Helvetica', 'Helvetica-Bold'].map(font =>
      `<< /Type /Font /Subtype /Type1 /BaseFont /${font} /Encoding /WinAnsiEncoding >>`),
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let document = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = document.length;
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(document);
}

export function downloadTicket(order) {
  const url = URL.createObjectURL(new Blob([ticketPdf(order)], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `Artifex-${order.code.replace(/[^a-z0-9-]/giu, '')}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
