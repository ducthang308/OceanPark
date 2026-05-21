export type InvoicePrintRow = [string, string];

type InvoicePrintOptions = {
  title: string;
  documentTitle: string;
  generatedAt: string;
  rows: InvoicePrintRow[];
  footer: string;
  signerLabel: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const openInvoicePrintWindow = ({
  title,
  documentTitle,
  generatedAt,
  rows,
  footer,
  signerLabel,
}: InvoicePrintOptions) => {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const printWindow = window.open("", "_blank", "width=980,height=780");

  if (!printWindow) {
    return false;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(documentTitle)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 0;
            background: #f3f7f6;
          }
          .invoice-toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 18px;
            background: #10201e;
            color: #ffffff;
            box-shadow: 0 10px 26px rgba(15, 23, 42, 0.18);
          }
          .invoice-toolbar span {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.76);
          }
          .invoice-toolbar button,
          .signature-actions button {
            border: 0;
            border-radius: 8px;
            padding: 10px 16px;
            font-weight: 700;
            cursor: pointer;
          }
          .invoice-toolbar__print {
            background: #0b8b7f;
            color: #ffffff;
          }
          .invoice-toolbar__clear,
          .signature-actions button {
            background: #ffffff;
            color: #0f172a;
          }
          .invoice {
            max-width: 780px;
            margin: 34px auto;
            padding: 34px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
            color: #0f172a;
          }
          .subtitle {
            color: #64748b;
            margin-bottom: 28px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 12px 14px;
            text-align: left;
          }
          th {
            width: 36%;
            background: #f8fafc;
            color: #334155;
          }
          .signature-section {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-top: 32px;
          }
          .signature-card {
            min-height: 210px;
            display: flex;
            flex-direction: column;
            padding: 18px;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            background: #fbfdff;
          }
          .signature-title {
            text-align: center;
            font-size: 14px;
            font-weight: 700;
            color: #334155;
          }
          .signature-date {
            margin-top: 4px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          .signature-space {
            flex: 1;
          }
          .signature-line {
            margin: 10px auto 0;
            width: 72%;
            border-top: 1px solid #94a3b8;
          }
          .signature-name {
            margin-top: 8px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          .signature-pad {
            position: relative;
            flex: 1;
            min-height: 138px;
            margin-top: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            overflow: hidden;
          }
          #signatureCanvas,
          #signatureImage {
            width: 100%;
            height: 138px;
          }
          #signatureCanvas {
            display: block;
            touch-action: none;
            cursor: crosshair;
          }
          #signatureImage {
            display: none;
            object-fit: contain;
          }
          .signature-hint {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #94a3b8;
            font-size: 13px;
            pointer-events: none;
          }
          .signature-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 10px;
          }
          .signature-meta {
            color: #64748b;
            font-size: 12px;
          }
          .footer {
            margin-top: 28px;
            color: #64748b;
            font-size: 13px;
          }
          @media (max-width: 720px) {
            .invoice {
              margin: 18px;
              padding: 22px;
            }
            .signature-section {
              grid-template-columns: 1fr;
            }
            .invoice-toolbar {
              flex-wrap: wrap;
            }
          }
          @media print {
            body {
              margin: 40px;
              background: #ffffff;
            }
            .no-print,
            .invoice-toolbar,
            .signature-hint,
            #signatureCanvas {
              display: none !important;
            }
            .invoice {
              max-width: 760px;
              margin: 0 auto;
              padding: 0;
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }
            #signatureImage {
              display: block !important;
            }
            .signature-card {
              break-inside: avoid;
              background: #ffffff;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-toolbar no-print">
          <button type="button" class="invoice-toolbar__print" id="printInvoice">In hóa đơn</button>
          <button type="button" class="invoice-toolbar__clear" id="clearToolbar">Ký lại</button>
          <span>Ký trực tiếp vào ô chữ ký trước khi in.</span>
        </div>

        <div class="invoice">
          <h1>${escapeHtml(title)}</h1>
          <div class="subtitle">DThang Home - ${escapeHtml(generatedAt)}</div>
          <table>${rowsHtml}</table>

          <div class="signature-section">
            <div class="signature-card">
              <div class="signature-title">Đại diện DThang Home</div>
              <div class="signature-date">Ngày ký: ...... / ...... / ........</div>
              <div class="signature-space"></div>
              <div class="signature-line"></div>
              <div class="signature-name">Ký và ghi rõ họ tên</div>
            </div>

            <div class="signature-card">
              <div class="signature-title">${escapeHtml(signerLabel)}</div>
              <div class="signature-date" id="signatureDate">Chưa ký online</div>
              <div class="signature-pad">
                <canvas id="signatureCanvas"></canvas>
                <img id="signatureImage" alt="Chữ ký online" />
                <span class="signature-hint" id="signatureHint">Ký tại đây</span>
              </div>
              <div class="signature-actions no-print">
                <span class="signature-meta" id="signatureMeta">Có thể ký bằng chuột hoặc cảm ứng.</span>
                <button type="button" id="clearSignature">Ký lại</button>
              </div>
            </div>
          </div>

          <div class="footer">${escapeHtml(footer)}</div>
        </div>

        <script>
          (function () {
            const canvas = document.getElementById('signatureCanvas');
            const image = document.getElementById('signatureImage');
            const hint = document.getElementById('signatureHint');
            const meta = document.getElementById('signatureMeta');
            const signatureDate = document.getElementById('signatureDate');
            const ctx = canvas.getContext('2d');
            let drawing = false;
            let hasSignature = false;

            function setCanvasSize() {
              const rect = canvas.getBoundingClientRect();
              const ratio = window.devicePixelRatio || 1;
              const existing = hasSignature ? canvas.toDataURL('image/png') : '';

              canvas.width = Math.max(rect.width * ratio, 1);
              canvas.height = Math.max(rect.height * ratio, 1);
              ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.lineWidth = 2.4;
              ctx.strokeStyle = '#111827';

              if (existing) {
                const restoreImage = new Image();
                restoreImage.onload = function () {
                  ctx.drawImage(restoreImage, 0, 0, rect.width, rect.height);
                };
                restoreImage.src = existing;
              }
            }

            function getPoint(event) {
              const source = event.touches ? event.touches[0] : event;
              const rect = canvas.getBoundingClientRect();

              return {
                x: source.clientX - rect.left,
                y: source.clientY - rect.top,
              };
            }

            function beginDraw(event) {
              event.preventDefault();
              drawing = true;
              const point = getPoint(event);
              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
            }

            function draw(event) {
              if (!drawing) return;
              event.preventDefault();
              const point = getPoint(event);
              ctx.lineTo(point.x, point.y);
              ctx.stroke();
              hasSignature = true;
              hint.style.display = 'none';
              meta.textContent = 'Đã ký, bấm In hóa đơn để lưu chữ ký vào bản in.';
            }

            function endDraw() {
              drawing = false;
              syncImage();
            }

            function syncImage() {
              if (!hasSignature) {
                image.removeAttribute('src');
                signatureDate.textContent = 'Chưa ký online';
                return;
              }

              image.src = canvas.toDataURL('image/png');
              signatureDate.textContent = 'Đã ký online lúc ' + new Date().toLocaleString('vi-VN');
            }

            function clearSignature() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              hasSignature = false;
              hint.style.display = 'block';
              meta.textContent = 'Có thể ký bằng chuột hoặc cảm ứng.';
              syncImage();
            }

            setCanvasSize();
            window.addEventListener('resize', setCanvasSize);

            canvas.addEventListener('mousedown', beginDraw);
            canvas.addEventListener('mousemove', draw);
            window.addEventListener('mouseup', endDraw);

            canvas.addEventListener('touchstart', beginDraw, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', endDraw);

            document.getElementById('clearSignature').addEventListener('click', clearSignature);
            document.getElementById('clearToolbar').addEventListener('click', clearSignature);
            document.getElementById('printInvoice').addEventListener('click', function () {
              syncImage();
              window.print();
            });
          })();
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();

  return true;
};
