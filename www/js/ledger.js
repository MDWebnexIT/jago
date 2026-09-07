/* Party / Customer Accounting Ledger Module for Jago Corporation PLC */

const LedgerManager = {
  getLedgerForCustomer(customerName, fromDate = '', toDate = '') {
    const daybookEntries = DayBookManager.getDaybookEntries();
    const customers = CustomerManager.getCustomers();
    const customer = customers.find(c => c.shopName.trim().toLowerCase() === customerName.trim().toLowerCase());
    
    // Base Opening balance from customer profile
    let initialBalance = 0;
    if (customer && customer.openingBalance) {
      const bal = parseFloat(customer.openingBalance) || 0;
      initialBalance = customer.balanceType === 'credit' ? -bal : bal;
    }

    // Filter entries for this party
    let partyEntries = daybookEntries.filter(e => {
      if (!e.partyName) return false;
      return e.partyName.trim().toLowerCase() === customerName.trim().toLowerCase();
    });

    // Sort chronologically
    partyEntries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    let openingBalance = initialBalance;
    let periodEntries = [];

    partyEntries.forEach(entry => {
      const amt = parseFloat(entry.amount) || 0;
      if (fromDate && entry.date < fromDate) {
        // Entries before fromDate contribute to Opening Balance
        if (entry.type === 'delivery') openingBalance += amt;
        else if (entry.type === 'collection') openingBalance -= amt;
      } else if (!toDate || entry.date <= toDate) {
        periodEntries.push(entry);
      }
    });

    return {
      openingBalance,
      entries: periodEntries
    };
  },

  renderLedgerView() {
    const custSelect = document.getElementById('ledgerCustomerSelect');
    const fromInput = document.getElementById('ledgerFromDate');
    const toInput = document.getElementById('ledgerToDate');
    const statementOutput = document.getElementById('ledgerStatementOutput');

    if (!custSelect || !statementOutput) return;

    const selectedShop = custSelect.value;
    const customers = CustomerManager.getCustomers();
    const customer = customers.find(c => c.shopName === selectedShop);

    if (!selectedShop || !customer) {
      statementOutput.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <i class="ri-booklet-line" style="font-size: 3rem; color: var(--primary);"></i>
          <h3 style="margin-top: 1rem;">Select a Customer / Party to View Ledger Statement</h3>
          <p style="font-size: 0.88rem; color: var(--text-muted);">Choose a customer from the dropdown above to view complete debit, credit, and running balance ledger.</p>
        </div>`;
      return;
    }

    const fromDate = fromInput ? fromInput.value : '';
    const toDate = toInput ? toInput.value : '';

    const { openingBalance, entries } = this.getLedgerForCustomer(selectedShop, fromDate, toDate);

    let runningBalance = openingBalance;
    let totalDebit = 0;  // Delivery / Sales
    let totalCredit = 0; // Collection / Money Paid

    let rowsHtml = '';

    // Opening Balance Row
    rowsHtml += `
      <tr style="background: rgba(255,255,255,0.03); font-weight: 700;">
        <td>${fromDate ? formatDate(fromDate) : (customer.openingBalanceDate ? formatDate(customer.openingBalanceDate) : 'Initial')}</td>
        <td>-</td>
        <td><span class="badge badge-warning">Opening Balance</span></td>
        <td>
          <strong>Opening Balance B/F ${customer.openingBalanceNote ? `(${customer.openingBalanceNote})` : ''}</strong>
          <button class="btn btn-secondary btn-sm no-print" onclick="CustomerManager.openOpeningBalanceModal('${customer.id}')" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; margin-left: 0.5rem;">
            <i class="ri-edit-line"></i> Edit Balance
          </button>
        </td>
        <td>-</td>
        <td>-</td>
        <td style="font-weight: 800; color: ${runningBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
          ${formatBDT(runningBalance)}
        </td>
      </tr>
    `;

    entries.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      let debit = 0;
      let credit = 0;

      if (item.type === 'delivery') {
        debit = amt;
        totalDebit += amt;
        runningBalance += amt;
      } else if (item.type === 'collection') {
        credit = amt;
        totalCredit += amt;
        runningBalance -= amt;
      } else if (item.type === 'orderInHand') {
        // Pending order note (non-financial posting until delivered)
      }

      let invBadge = item.invoiceNo ? `<span style="display:inline-block; font-size:0.75rem; background:#e0f2fe; color:#0369a1; padding:0.1rem 0.4rem; border-radius:4px; margin-right:0.3rem;">Inv #${item.invoiceNo}</span>` : '';
      let vatBadge = item.vatInvoiceNo ? `<span style="display:inline-block; font-size:0.75rem; background:#fef3c7; color:#92400e; padding:0.1rem 0.4rem; border-radius:4px; margin-right:0.3rem;">VAT #${item.vatInvoiceNo}</span>` : '';
      let recipBadge = item.recipientPerson ? `<span style="display:inline-block; font-size:0.75rem; background:#f3e8ff; color:#6b21a8; padding:0.1rem 0.4rem; border-radius:4px;">Custody: ${item.recipientPerson}</span>` : '';

      const desc = item.type === 'delivery' 
        ? `Product Delivery: ${DayBookManager.formatItemDetailsHTML(item)}`
        : item.type === 'collection'
        ? `Payment Collection (${item.paymentMethod || 'Cash'})`
        : `Order in Hand Note`;

      const typeBadge = item.type === 'delivery' 
        ? '<span class="badge badge-primary">Sales (Debit)</span>'
        : item.type === 'collection'
        ? '<span class="badge badge-success">Payment (Credit)</span>'
        : '<span class="badge badge-secondary">Pending Order</span>';

      rowsHtml += `
        <tr>
          <td style="font-weight: 600;">${formatDate(item.date)}</td>
          <td>${item.time}</td>
          <td>${typeBadge}</td>
          <td>
            <div style="margin-bottom:0.2rem;">${invBadge} ${vatBadge} ${recipBadge}</div>
            <div>${desc}</div>
            ${item.remark ? `<div style="font-size:0.78rem; color:var(--text-muted);">${item.remark}</div>` : ''}
          </td>
          <td style="font-weight: 600; color: var(--primary);">${debit > 0 ? formatBDT(debit) : '-'}</td>
          <td style="font-weight: 600; color: var(--success);">${credit > 0 ? formatBDT(credit) : '-'}</td>
          <td style="font-weight: 800; color: ${runningBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
            ${formatBDT(runningBalance)}
          </td>
        </tr>
      `;
    });

    const netClosingBalance = runningBalance;

    let html = `
      <div class="card daybook-report-container" style="background: white; color: #0f172a; padding: 2rem; border-radius: var(--radius-lg);">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; text-transform: uppercase;">JAGO CORPORATION PLC</h2>
            <p style="font-size: 0.88rem; color: #475569;">Water Purifier & Accessories Division | Dhaka City</p>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0284c7; margin-top: 0.5rem;">PARTY / CUSTOMER ACCOUNT LEDGER</h3>
          </div>
          <div style="text-align: right;">
            <button class="btn btn-secondary no-print" onclick="window.print()" style="margin-bottom: 0.5rem; margin-right: 0.4rem;">
              <i class="ri-printer-line"></i> Print Statement
            </button>
            <button class="btn btn-danger no-print" onclick="LedgerManager.downloadLedgerPDF()" style="margin-bottom: 0.5rem; margin-right: 0.4rem; background: #e11d48; border-color: #e11d48; color: white;" title="Download Party Ledger Statement as PDF">
              <i class="ri-file-pdf-2-line"></i> Download PDF
            </button>
            <button class="btn btn-danger no-print" onclick="CustomerManager.confirmDeleteActiveLedgerCustomer('${customer.id}')" style="margin-bottom: 0.5rem;" title="Delete Party and clean up ledger">
              <i class="ri-delete-bin-line"></i> Delete Party & Ledger
            </button>
            <p style="font-size: 0.82rem; color: #475569;">Statement Date: <strong>${formatDate(new Date().toISOString().split('T')[0])}</strong></p>
          </div>
        </div>

        <!-- Customer Profile Info Box -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.88rem;">
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">Shop / Party Name</p>
            <p style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${customer.shopName}</p>
          </div>
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">Owner & Contact</p>
            <p style="font-weight: 700; color: #0f172a;">${customer.ownerName || '-'} (${customer.phone || 'No phone'})</p>
          </div>
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">Area / Zone & Address</p>
            <p style="font-weight: 700; color: #0284c7;">${customer.zone} - ${customer.address || '-'}</p>
          </div>
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">Tax Credentials</p>
            <p style="font-weight: 600; color: #475569;">${customer.bin ? `BIN: ${customer.bin}` : ''} ${customer.nid ? `NID: ${customer.nid}` : ''} ${!customer.bin && !customer.nid ? '-' : ''}</p>
          </div>
        </div>

        <!-- Financial Summary Bar -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 0.85rem; border-radius: 6px;">
            <p style="font-size: 0.78rem; color: #0369a1; font-weight: 600; text-transform: uppercase;">Total Delivery Sales (Debit)</p>
            <p style="font-size: 1.3rem; font-weight: 800; color: #0284c7;">${formatBDT(totalDebit)}</p>
          </div>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 0.85rem; border-radius: 6px;">
            <p style="font-size: 0.78rem; color: #047857; font-weight: 600; text-transform: uppercase;">Total Payments (Credit)</p>
            <p style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${formatBDT(totalCredit)}</p>
          </div>
          <div style="background: ${netClosingBalance > 0 ? '#fef2f2' : '#f0fdf4'}; border-left: 4px solid ${netClosingBalance > 0 ? '#ef4444' : '#10b981'}; padding: 0.85rem; border-radius: 6px;">
            <p style="font-size: 0.78rem; color: ${netClosingBalance > 0 ? '#b91c1c' : '#047857'}; font-weight: 600; text-transform: uppercase;">Net Outstanding Balance</p>
            <p style="font-size: 1.3rem; font-weight: 800; color: ${netClosingBalance > 0 ? '#ef4444' : '#10b981'};">${formatBDT(netClosingBalance)}</p>
          </div>
        </div>

        <!-- Ledger Statement Table -->
        <table class="excel-table" style="font-size: 0.88rem;">
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 10%;">Time</th>
              <th style="width: 15%;">Type</th>
              <th style="width: 35%;">Particulars / Transaction Details</th>
              <th style="width: 14%;">Debit (Sales ৳)</th>
              <th style="width: 14%;">Credit (Paid ৳)</th>
              <th style="width: 15%;">Running Balance (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="excel-total-row">
              <td colspan="4" style="text-align: right; font-weight: 800;">TOTALS & CLOSING BALANCE:</td>
              <td style="font-weight: 800; color: #0284c7;">${formatBDT(totalDebit)}</td>
              <td style="font-weight: 800; color: #10b981;">${formatBDT(totalCredit)}</td>
              <td style="font-weight: 800; color: ${netClosingBalance > 0 ? '#b91c1c' : '#047857'};">${formatBDT(netClosingBalance)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Customer Signature</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Prepared By (Executive)</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Authorized Officer</p>
          </div>
        </div>
      </div>
    `;

    statementOutput.innerHTML = html;
  },

  downloadLedgerPDF() {
    const custSelect = document.getElementById('ledgerCustomerSelect');
    const custName = custSelect && custSelect.value ? custSelect.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Party';
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('ledgerStatementOutput', `Jago_Ledger_${custName}_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  }
};
