const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const src = path.join(__dirname, 'views', 'payreq-billing-pdf.ejs');
const testTpl = path.join(__dirname, 'views', 'payreq-billing-pdf-test.ejs');
const outDir = 'C:\\Users\\MIS-SANQUA\\AppData\\Local\\Temp\\opencode';

// Convert a px value (relative to the 8px base) into a rem value.
function toRem(px) {
  const v = px / 8;
  return (Math.round(v * 1000) / 1000) + 'rem';
}

async function main() {
  // 1) Build the test template: scale every font-size proportionally to an
  //    injected base (via rem) so 8px -> 1rem, 9px -> 1.125rem, etc.
  let html = fs.readFileSync(src, 'utf8');
  html = html.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (m, n) => 'font-size: ' + toRem(parseFloat(n)));
  html = html.replace(
    /html\s*\{\s*zoom:\s*0\.75;\s*\}/,
    'html {\n  font-size: <%= baseFont %>px;\n  zoom: 0.75;\n}'
  );
  fs.writeFileSync(testTpl, html);
  console.log('>>> Test template written:', testTpl);

  // 2) Mock data that covers every EJS reference in the billing template.
  const mock = {
    companyData: { logo: '' },
    imagePath: '',
    departmentData: { name: 'DEPARTEMEN PARENT (Section)' },
    data: { data: { currency: 'Rp' } },
    header: {
      document_no: 'PR-2026/000123',
      createdAt: '13 Nov 2026',
      employee_name: 'Budi Santoso',
      payment_type: 2,
      department_name: 'Departemen Asli',
      account_name: 'Budi Santoso',
      vendor_name: 'PT Vendor Contoh',
      bank_name: 'Bank Contoh',
      account_number: '1234567890',
      purchase_request: { project: { odoo_project_code: 'PRJ-001', name: 'Proyek Contoh' } },
      payment_desc: 'Pembelian Barang & Jasa',
      total_pph_amount: 1500000,
      total_price: 15000000,
      terbilang: 'Lima Belas Juta Rupiah',
      payreq_type: 1,
      source_of_funds: 'kas kecil',
      payment_request_detail: [
        {
          odoo_bill_no: 'BILL-001',
          invoice_no: 'INV-001',
          invoice_date: '01 Nov 2026',
          receive_invoice_date: '02 Nov 2026',
          invoice_due_date: '30 Nov 2026',
          total_after_tax: 8000000,
          deduction: 500000,
          debt_value: 7500000
        },
        {
          odoo_bill_no: 'BILL-002',
          invoice_no: 'INV-002',
          invoice_date: '03 Nov 2026',
          receive_invoice_date: '04 Nov 2026',
          invoice_due_date: '01 Des 2026',
          total_after_tax: 7000000,
          deduction: 0,
          debt_value: 7000000
        }
      ]
    },
    qrCode: { qrPath: '', approval1: [], approval2: [], approval3: [] },
    approver1: [],
    approver2: [],
    approver3: []
  };

  // 3) Render + generate one PDF per base font size.
  for (const baseFont of [11, 12]) {
    const data = Object.assign({}, mock, { baseFont });
    const outHtml = await ejs.renderFile(testTpl, data);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(outHtml, { waitUntil: 'networkidle2', timeout: 60000 });
    const outPdf = path.join(outDir, `payreq-billing-base${baseFont}.pdf`);
    await page.pdf({
      path: outPdf,
      width: '210mm',
      height: '297mm',
      printBackground: true,
      margin: { top: '0.3cm', bottom: '0.3cm', left: '0.3cm', right: '0.3cm' }
    });
    await browser.close();
    console.log(`>>> Generated (base ${baseFont}px, body ~${((1.125 * baseFont * 0.75).toFixed(2))}px effective): ${outPdf}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
