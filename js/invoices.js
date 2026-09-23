/* All Invoices & Billing Report Module for Jago Corporation PLC */

const InvoiceManager = {
  getAllInvoices() {
    const daybookEntries = DayBookManager.getDaybookEntries();
    const customers = CustomerManager.getCustomers();

    // Filter delivery entries (each delivery represents an invoice)
    const deliveries = daybookEntries.filter(e => e.type === 'delivery');
    const collections = daybookEntries.filter(e => e.type === 'collection');

    const cleanIdStr = (str) => {
      if (!str) return '';
      return String(str)
        .toUpperCase()
        .replace(/^(INVOICE|INV|VAT)[-_#\s]*/i, '')
        .replace(/[^A-Z0-9]/g, '')
        .trim();
    };

    // Prepare structure for deliveries
    const invoiceList = deliveries.map((deliv, index) => {
      const invNo = deliv.invoiceNo && deliv.invoiceNo.trim() ? deliv.invoiceNo.trim() : `INV-${1000 + index + 1}`;
      const vatNo = deliv.vatInvoiceNo ? deliv.vatInvoiceNo.trim() : '';

      const cust = customers.find(c => c.shopName.trim().toLowerCase() === (deliv.partyName || "").trim().toLowerCase()) || {
        shopName: deliv.partyName || 'General Customer',
        ownerName: '-',
        phone: '-',
        address: 'Dhaka City',
        zone: 'Dhaka',
        bin: '',
        nid: ''
      };

      const totalAmount = parseFloat(deliv.amount) || 0;

      return {
        id: deliv.id,
        invoiceNo: invNo,
        vatInvoiceNo: vatNo,
        cleanInvNo: cleanIdStr(invNo),
        cleanVatNo: cleanIdStr(vatNo),
        date: deliv.date,
        time: deliv.time || '12:00 PM',
        customer: cust,
        partyName: (deliv.partyName || '').trim(),
        partyLower: (deliv.partyName || '').trim().toLowerCase(),
        items: deliv.items && deliv.items.length > 0 ? deliv.items : [{
          itemId: deliv.itemId || '',
          itemName: deliv.itemName || 'Water Purifier Item',
          qty: deliv.qty || 1,
          unitPrice: deliv.unitPrice || totalAmount,
          subtotal: totalAmount
        }],
        totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: 'unpaid',
        paymentHistory: [],
        remark: deliv.remark || ''
      };
    });

    // Step 1: Explicitly match collections by Invoice No, VAT No, or Remark mention
    const unallocatedCollections = [];

    collections.forEach(coll => {
      const collAmt = parseFloat(coll.amount) || 0;
      if (collAmt <= 0) return;

      const collInvClean = cleanIdStr(coll.invoiceNo);
      const collVatClean = cleanIdStr(coll.vatInvoiceNo);
      const collRemark = (coll.remark || '').toUpperCase();
      const collPartyLower = (coll.partyName || '').trim().toLowerCase();

      let matchedInv = null;

      // Check explicit match against invoices
      for (const inv of invoiceList) {
        const isInvMatch = collInvClean && (collInvClean === inv.cleanInvNo || (inv.cleanVatNo && collInvClean === inv.cleanVatNo));
        const isVatMatch = collVatClean && (collVatClean === inv.cleanVatNo || (inv.cleanInvNo && collVatClean === inv.cleanInvNo));
        const isRemarkInvMatch = inv.cleanInvNo && inv.cleanInvNo.length >= 2 && collRemark.includes(inv.cleanInvNo);
        const isRemarkVatMatch = inv.cleanVatNo && inv.cleanVatNo.length >= 2 && collRemark.includes(inv.cleanVatNo);

        if (isInvMatch || isVatMatch || isRemarkInvMatch || isRemarkVatMatch) {
          matchedInv = inv;
          break;
        }
      }

      if (matchedInv) {
        matchedInv.paidAmount += collAmt;
        matchedInv.paymentHistory.push({
          id: coll.id,
          date: coll.date,
          time: coll.time || '12:00 PM',
          amount: collAmt,
          paymentMethod: coll.paymentMethod || 'Cash',
          recipientPerson: coll.recipientPerson || '',
          remark: coll.remark || '',
          matchType: 'Direct Invoice Match'
        });
      } else {
        unallocatedCollections.push({
          id: coll.id,
          partyLower: collPartyLower,
          amount: collAmt,
          date: coll.date,
          time: coll.time || '12:00 PM',
          paymentMethod: coll.paymentMethod || 'Cash',
          recipientPerson: coll.recipientPerson || '',
          remark: coll.remark || ''
        });
      }
    });

    // Step 2: Allocate general/unallocated customer collections chronologically to remaining invoice dues for that customer
    unallocatedCollections.forEach(coll => {
      if (!coll.partyLower) return;
      let remainingColl = coll.amount;

      for (const inv of invoiceList) {
        if (remainingColl <= 0) break;
        if (inv.partyLower === coll.partyLower && inv.paidAmount < inv.totalAmount) {
          const needed = inv.totalAmount - inv.paidAmount;
          const applyAmt = Math.min(needed, remainingColl);
          inv.paidAmount += applyAmt;
          remainingColl -= applyAmt;

          inv.paymentHistory.push({
            id: coll.id,
            date: coll.date,
            time: coll.time,
            amount: applyAmt,
            paymentMethod: coll.paymentMethod || 'Cash',
            recipientPerson: coll.recipientPerson || '',
            remark: coll.remark || '',
            matchType: 'Customer General Collection'
          });
        }
      }
    });

    // Step 3: Compute final status & due amounts
    invoiceList.forEach(inv => {
      if (inv.paidAmount > inv.totalAmount) {
        inv.paidAmount = inv.totalAmount;
      }
      inv.dueAmount = Math.max(0, inv.totalAmount - inv.paidAmount);

      if (inv.dueAmount <= 0.01) {
        inv.dueAmount = 0;
        inv.status = 'paid';
      } else if (inv.paidAmount > 0) {
        inv.status = 'partial';
      } else {
        inv.status = 'unpaid';
      }

      // Sort payment history for invoice chronologically
      inv.paymentHistory.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    });

    return invoiceList;
  },

  renderInvoicesTable() {
    const tbody = document.getElementById('invoicesMasterTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('invoicesSearchInput');
    const custFilterSelect = document.getElementById('invoicesCustomerFilter');
    const statusFilterSelect = document.getElementById('invoicesStatusFilter');
    const fromInput = document.getElementById('invoicesFromDate');
    const toInput = document.getElementById('invoicesToDate');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCust = custFilterSelect ? custFilterSelect.value : '';
    const selectedStatus = statusFilterSelect ? statusFilterSelect.value : '';
    const fromDate = fromInput ? fromInput.value : '';
    const toDate = toInput ? toInput.value : '';

    let invoices = this.getAllInvoices();

    // Sort chronologically descending (newest invoices first)
    invoices.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    // Summary Metrics Counters
    let totalCount = invoices.length;
    let grandSales = 0;
    let grandCollected = 0;
    let grandDue = 0;
    let vatCount = 0;

    invoices.forEach(inv => {
      grandSales += inv.totalAmount;
      grandCollected += inv.paidAmount;
      grandDue += inv.dueAmount;
      if (inv.vatInvoiceNo) vatCount++;
    });

    // Update Summary Tickers
    const countElem = document.getElementById('invoicesTotalCount');
    const salesElem = document.getElementById('invoicesTotalSales');
    const collElem = document.getElementById('invoicesTotalCollected');
    const dueElem = document.getElementById('invoicesTotalDue');
    const vatElem = document.getElementById('invoicesVatCount');

    if (countElem) countElem.innerText = totalCount;
    if (salesElem) salesElem.innerText = formatBDT(grandSales);
    if (collElem) collElem.innerText = formatBDT(grandCollected);
    if (dueElem) dueElem.innerText = formatBDT(grandDue);
    if (vatElem) vatElem.innerText = vatCount;

    // Apply Filters
    if (searchTerm) {
      invoices = invoices.filter(inv => 
        inv.invoiceNo.toLowerCase().includes(searchTerm) ||
        (inv.vatInvoiceNo && inv.vatInvoiceNo.toLowerCase().includes(searchTerm)) ||
        inv.partyName.toLowerCase().includes(searchTerm) ||
        inv.customer.zone.toLowerCase().includes(searchTerm) ||
        inv.items.some(it => it.itemName.toLowerCase().includes(searchTerm))
      );
    }

    if (selectedCust) {
      invoices = invoices.filter(inv => inv.partyName === selectedCust);
    }

    if (selectedStatus) {
      invoices = invoices.filter(inv => inv.status === selectedStatus);
    }

    if (fromDate) {
      invoices = invoices.filter(inv => inv.date >= fromDate);
    }

    if (toDate) {
      invoices = invoices.filter(inv => inv.date <= toDate);
    }

    if (invoices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            <i class="ri-file-search-line" style="font-size: 2rem; color: var(--primary);"></i>
            <div style="margin-top: 0.5rem;">No invoices found matching your criteria.</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const itemsHtml = DayBookManager.formatItemDetailsHTML(inv);
      
      let statusBadge = '<span class="badge badge-danger">Unpaid / Due</span>';
      if (inv.status === 'paid') {
        statusBadge = '<span class="badge badge-success">Paid / Settled</span>';
      } else if (inv.status === 'partial') {
        statusBadge = '<span class="badge badge-primary">Partial Paid</span>';
      }

      const vatBadge = inv.vatInvoiceNo 
        ? `<div style="font-size: 0.75rem; color: var(--accent); font-weight:600;"><i class="ri-article-line"></i> VAT: ${inv.vatInvoiceNo}</div>` 
        : '';

      return `
        <tr>
          <td>
            <strong style="color: var(--primary); font-size: 0.95rem;">${inv.invoiceNo}</strong>
            ${vatBadge}
          </td>
          <td>
            <div style="font-weight: 600;">${formatDate(inv.date)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${inv.time}</div>
          </td>
          <td>
            <strong style="color: var(--text-main);">${inv.partyName}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${inv.customer.zone || 'Dhaka'}</div>
          </td>
          <td>${itemsHtml}</td>
          <td style="font-weight: 700; color: var(--primary);">${formatBDT(inv.totalAmount)}</td>
          <td style="font-weight: 700; color: var(--success);">${formatBDT(inv.paidAmount)}</td>
          <td style="font-weight: 800; color: ${inv.dueAmount > 0 ? 'var(--danger)' : 'var(--success)'};">
            ${formatBDT(inv.dueAmount)}
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm" onclick="InvoiceManager.openInvoiceVoucherModal('${inv.invoiceNo}')" title="View & Print Formal Tax Invoice">
              <i class="ri-printer-line"></i> Tax Invoice
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openInvoiceVoucherModal(invoiceNo) {
    const invoices = this.getAllInvoices();
    const inv = invoices.find(i => i.invoiceNo === invoiceNo);
    if (!inv) return;

    const modalBody = document.getElementById('invoiceVoucherModalBody');
    if (!modalBody) return;

    const cust = inv.customer;

    let itemsTableRows = inv.items.map((it, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>
          <strong>${it.itemName}</strong>
        </td>
        <td style="text-align: center;">${it.qty} pcs</td>
        <td style="text-align: right;">${formatBDT(it.unitPrice)}</td>
        <td style="text-align: right; font-weight: 700;">${formatBDT(it.subtotal || (it.qty * it.unitPrice))}</td>
      </tr>
    `).join('');

    const voucherHtml = `
      <div class="daybook-report-container" style="background: white; color: #0f172a; padding: 2.5rem; border-radius: 8px;">
        
        <!-- Company Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.8rem; font-weight: 900; color: #0f172a; margin: 0;">JAGO CORPORATION PLC</h1>
            <p style="font-size: 0.9rem; color: #0284c7; font-weight: 700; margin: 0.2rem 0 0 0;">Water Purifier & Accessories Division</p>
            <p style="font-size: 0.82rem; color: #475569; margin: 0.1rem 0 0 0;">Head Office: Dhaka City, Bangladesh | Contact: Sales & Marketing Dept</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 1.4rem; font-weight: 800; color: #0284c7; margin: 0; text-transform: uppercase;">TAX INVOICE</h2>
            <p style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-top: 0.3rem;">Invoice #: <span style="color: #0284c7;">${inv.invoiceNo}</span></p>
            ${inv.vatInvoiceNo ? `<p style="font-size: 0.82rem; font-weight: 600; color: #d97706; margin: 0;">VAT Invoice #: ${inv.vatInvoiceNo}</p>` : ''}
            <p style="font-size: 0.82rem; color: #475569; margin: 0.2rem 0 0 0;">Date: <strong>${formatDate(inv.date)}</strong> (${inv.time})</p>
          </div>
        </div>

        <!-- Bill To / Customer Details Box -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 0.88rem;">
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.3rem;">Billed To (Customer Details)</p>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">${cust.shopName || inv.partyName}</h3>
            <p style="margin: 0.2rem 0 0 0; color: #334155;"><strong>Owner:</strong> ${cust.ownerName || '-'}</p>
            <p style="margin: 0.1rem 0 0 0; color: #334155;"><strong>Phone:</strong> ${cust.phone || '-'}</p>
            <p style="margin: 0.1rem 0 0 0; color: #0284c7; font-weight: 600;"><strong>Area / Zone:</strong> ${cust.zone || 'Dhaka'} - ${cust.address || ''}</p>
          </div>
          <div style="border-left: 1px solid #e2e8f0; padding-left: 1.5rem;">
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.3rem;">Tax & Identification Credentials</p>
            <p style="margin: 0.2rem 0 0 0; color: #334155;"><strong>BIN Number:</strong> ${cust.bin || 'N/A'}</p>
            <p style="margin: 0.1rem 0 0 0; color: #334155;"><strong>NID Number:</strong> ${cust.nid || 'N/A'}</p>
            <p style="margin: 0.3rem 0 0 0; color: #334155;"><strong>Payment Status:</strong> 
              <strong style="color: ${inv.dueAmount <= 0 ? '#059669' : '#dc2626'}; uppercase;">
                ${inv.status === 'paid' ? 'PAID IN FULL' : (inv.status === 'partial' ? 'PARTIAL PAYMENT' : 'UNPAID / OUTSTANDING DUE')}
              </strong>
            </p>
          </div>
        </div>

        <!-- Product Table -->
        <table class="excel-table" style="width: 100%; margin-bottom: 1.5rem; font-size: 0.88rem;">
          <thead>
            <tr style="background: #0284c7; color: white;">
              <th style="width: 8%; text-align: center;">#</th>
              <th style="width: 47%;">Description of Water Purifier Goods / Accessories</th>
              <th style="width: 15%; text-align: center;">Quantity</th>
              <th style="width: 15%; text-align: right;">Unit Price (৳)</th>
              <th style="width: 15%; text-align: right;">Subtotal (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <!-- Totals & Payment Summary -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem;">
          <div style="max-width: 60%; font-size: 0.82rem; color: #475569;">
            <p style="font-weight: 700; color: #0f172a; margin-bottom: 0.2rem;">Terms & Conditions:</p>
            <ul style="margin: 0; padding-left: 1.2rem;">
              <li>Goods once sold are covered under standard Jago Corporation PLC warranty terms.</li>
              <li>Please check purifier accessories & parts at the time of delivery.</li>
            </ul>
            ${inv.remark ? `<p style="margin-top: 0.5rem; font-weight: 600; color: #0284c7;"><strong>Remark:</strong> ${inv.remark}</p>` : ''}
          </div>

          <div style="min-width: 250px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1rem; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
              <span>Subtotal Amount:</span>
              <strong style="color: #0f172a;">${formatBDT(inv.totalAmount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; color: #059669;">
              <span>Amount Paid / Collected:</span>
              <strong>${formatBDT(inv.paidAmount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 0.4rem; font-size: 1.05rem; font-weight: 800; color: ${inv.dueAmount > 0 ? '#dc2626' : '#059669'};">
              <span>Balance Due (৳):</span>
              <span>${formatBDT(inv.dueAmount)}</span>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 4rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Customer Received Signature</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Prepared By (Sales Exec)</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Authorized Officer</p>
          </div>
        </div>

      </div>
    `;

    modalBody.innerHTML = voucherHtml;
    openModal('invoiceVoucherModal');
  },

  printInvoiceVoucher() {
    window.print();
  },

  downloadInvoicesPDF() {
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('invoicesTab', `Jago_All_Invoices_Master_Report_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  },

  downloadInvoiceVoucherPDF() {
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('invoiceVoucherModalBody', `Jago_Tax_Invoice_Voucher_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  },

  renderPaymentHistoryTable() {
    const tbody = document.getElementById('payHistTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('payHistSearchInput');
    const custFilterSelect = document.getElementById('payHistCustomerFilter');
    const statusFilterSelect = document.getElementById('payHistStatusFilter');
    const methodFilterSelect = document.getElementById('payHistMethodFilter');
    const fromInput = document.getElementById('payHistFromDate');
    const toInput = document.getElementById('payHistToDate');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCust = custFilterSelect ? custFilterSelect.value : '';
    const selectedStatus = statusFilterSelect ? statusFilterSelect.value : '';
    const selectedMethod = methodFilterSelect ? methodFilterSelect.value : '';
    const fromDate = fromInput ? fromInput.value : '';
    const toDate = toInput ? toInput.value : '';

    let invoices = this.getAllInvoices();

    // Sort chronologically descending (newest invoices first)
    invoices.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    // Summary Metrics Counters
    let totalSales = 0;
    let totalCollected = 0;
    let totalDue = 0;

    let bankTotal = 0;
    let bkashTotal = 0;
    let cashTotal = 0;
    let chequeTotal = 0;

    let fullyPaidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    invoices.forEach(inv => {
      totalSales += inv.totalAmount;
      totalCollected += inv.paidAmount;
      totalDue += inv.dueAmount;

      if (inv.status === 'paid') fullyPaidCount++;
      else if (inv.status === 'partial') partialCount++;
      else unpaidCount++;

      inv.paymentHistory.forEach(pm => {
        const amt = pm.amount || 0;
        const m = (pm.paymentMethod || 'Cash').toLowerCase();
        if (m.includes('bank')) bankTotal += amt;
        else if (m.includes('bkash') || m.includes('nagad')) bkashTotal += amt;
        else if (m.includes('cheque')) chequeTotal += amt;
        else cashTotal += amt;
      });
    });

    // Update Summary Ticker Cards
    const salesElem = document.getElementById('payHistTotalSales');
    const collElem = document.getElementById('payHistTotalCollected');
    const dueElem = document.getElementById('payHistTotalDue');

    const bankElem = document.getElementById('payHistBankTotal');
    const bkashElem = document.getElementById('payHistBkashTotal');
    const cashElem = document.getElementById('payHistCashTotal');
    const chequeElem = document.getElementById('payHistChequeTotal');

    const paidCntElem = document.getElementById('payHistFullyPaidCount');
    const partCntElem = document.getElementById('payHistPartialCount');
    const unpCntElem = document.getElementById('payHistUnpaidCount');

    if (salesElem) salesElem.innerText = formatBDT(totalSales);
    if (collElem) collElem.innerText = formatBDT(totalCollected);
    if (dueElem) dueElem.innerText = formatBDT(totalDue);

    if (bankElem) bankElem.innerText = formatBDT(bankTotal);
    if (bkashElem) bkashElem.innerText = formatBDT(bkashTotal);
    if (cashElem) cashElem.innerText = formatBDT(cashTotal);
    if (chequeElem) chequeElem.innerText = formatBDT(chequeTotal);

    if (paidCntElem) paidCntElem.innerText = fullyPaidCount;
    if (partCntElem) partCntElem.innerText = partialCount;
    if (unpCntElem) unpCntElem.innerText = unpaidCount;

    // Apply Search & Filtering
    if (searchTerm) {
      invoices = invoices.filter(inv =>
        inv.invoiceNo.toLowerCase().includes(searchTerm) ||
        (inv.vatInvoiceNo && inv.vatInvoiceNo.toLowerCase().includes(searchTerm)) ||
        inv.partyName.toLowerCase().includes(searchTerm) ||
        inv.customer.zone.toLowerCase().includes(searchTerm) ||
        inv.paymentHistory.some(pm =>
          (pm.paymentMethod && pm.paymentMethod.toLowerCase().includes(searchTerm)) ||
          (pm.recipientPerson && pm.recipientPerson.toLowerCase().includes(searchTerm)) ||
          (pm.remark && pm.remark.toLowerCase().includes(searchTerm))
        )
      );
    }

    if (selectedCust) {
      invoices = invoices.filter(inv => inv.partyName === selectedCust);
    }

    if (selectedStatus) {
      invoices = invoices.filter(inv => inv.status === selectedStatus);
    }

    if (selectedMethod) {
      invoices = invoices.filter(inv =>
        inv.paymentHistory.some(pm => (pm.paymentMethod || 'Cash').toLowerCase().includes(selectedMethod.toLowerCase()))
      );
    }

    if (fromDate) {
      invoices = invoices.filter(inv => inv.date >= fromDate);
    }

    if (toDate) {
      invoices = invoices.filter(inv => inv.date <= toDate);
    }

    if (invoices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            <i class="ri-search-eye-line" style="font-size: 2.2rem; color: var(--primary);"></i>
            <div style="margin-top: 0.5rem; font-weight: 600;">No payment history records found matching your search.</div>
            <div style="font-size: 0.82rem; opacity: 0.7;">Try searching with Invoice #, customer name, or payment method (Bank, bKash, Cash).</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      let statusBadge = '<span class="badge badge-danger">Unpaid / Due</span>';
      if (inv.status === 'paid') {
        statusBadge = '<span class="badge badge-success">Fully Paid</span>';
      } else if (inv.status === 'partial') {
        statusBadge = '<span class="badge badge-primary">Partial Paid</span>';
      }

      // Format payment breakdown list for this invoice
      let paymentBreakdownHTML = '';
      if (inv.paymentHistory && inv.paymentHistory.length > 0) {
        paymentBreakdownHTML = `
          <div style="margin-top: 0.4rem; background: rgba(0,0,0,0.15); border-radius: 6px; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.3rem;">
              <i class="ri-history-line"></i> Payment Breakdown (${inv.paymentHistory.length} transaction${inv.paymentHistory.length > 1 ? 's' : ''}):
            </div>
            ${inv.paymentHistory.map(pm => {
              const method = pm.paymentMethod || 'Cash';
              let methodBadge = '<span class="badge badge-success" style="font-size: 0.72rem;">Cash</span>';
              if (method.toLowerCase().includes('bank')) {
                methodBadge = '<span class="badge" style="background:#0284c7; color:white; font-size: 0.72rem;">Bank Transfer</span>';
              } else if (method.toLowerCase().includes('bkash') || method.toLowerCase().includes('nagad')) {
                methodBadge = '<span class="badge" style="background:#d946ef; color:white; font-size: 0.72rem;">bKash / Nagad</span>';
              } else if (method.toLowerCase().includes('cheque')) {
                methodBadge = '<span class="badge" style="background:#f59e0b; color:white; font-size: 0.72rem;">Cheque</span>';
              }

              const recipientText = pm.recipientPerson ? `<span style="color: var(--text-muted); margin-left: 0.3rem;">Bank/Custody: <strong>${pm.recipientPerson}</strong></span>` : '';
              const remarkText = pm.remark ? `<span style="font-style: italic; color: #94a3b8; margin-left: 0.3rem;">(${pm.remark})</span>` : '';

              return `
                <div style="font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; padding: 0.2rem 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                  <div>
                    <span style="font-weight: 600; color: var(--text-muted); margin-right: 0.4rem;">${formatDate(pm.date)}</span>
                    ${methodBadge}
                    ${recipientText}
                    ${remarkText}
                  </div>
                  <div style="font-weight: 700; color: var(--success); font-size: 0.88rem;">
                    +${formatBDT(pm.amount)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        paymentBreakdownHTML = `
          <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-top: 0.2rem;">
            No payments received yet for this invoice.
          </div>
        `;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 800; color: var(--primary); font-size: 1rem;">${inv.invoiceNo}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(inv.date)} (${inv.time})</div>
          </td>
          <td>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${inv.partyName}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${inv.customer.zone || 'Dhaka'} | ${inv.customer.phone || '-'}</div>
          </td>
          <td style="font-weight: 700; color: var(--primary); font-size: 1rem;">${formatBDT(inv.totalAmount)}</td>
          <td style="font-weight: 700; color: var(--success); font-size: 1rem;">${formatBDT(inv.paidAmount)}</td>
          <td style="font-weight: 800; color: ${inv.dueAmount > 0 ? 'var(--danger)' : 'var(--success)'}; font-size: 1rem;">
            ${formatBDT(inv.dueAmount)}
          </td>
          <td>${statusBadge}</td>
          <td>
            ${paymentBreakdownHTML}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-success btn-sm" onclick="InvoiceManager.openAddPaymentModalForInvoice('${inv.invoiceNo}', '${inv.partyName}', ${inv.dueAmount})" title="Record Payment for Invoice ${inv.invoiceNo}" style="padding: 0.25rem 0.5rem; margin-right: 0.25rem;">
              <i class="ri-add-line"></i> + Log Payment
            </button>
            <button class="btn btn-secondary btn-sm" onclick="InvoiceManager.openInvoicePaymentHistoryModal('${inv.invoiceNo}')" title="Print Detailed Payment History Statement" style="padding: 0.25rem 0.5rem;">
              <i class="ri-printer-line"></i> Statement
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddPaymentModalForInvoice(invoiceNo, partyName, dueAmount) {
    if (typeof openDaybookModalWithType === 'function') {
      openDaybookModalWithType('collection');
    } else if (typeof openModal === 'function') {
      openModal('daybookModal');
    }

    const partySelect = document.getElementById('dbPartyName');
    if (partySelect && partyName) {
      let found = false;
      for (let i = 0; i < partySelect.options.length; i++) {
        if (partySelect.options[i].value.toLowerCase() === partyName.toLowerCase()) {
          partySelect.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = document.createElement('option');
        opt.value = partyName;
        opt.text = partyName;
        opt.selected = true;
        partySelect.appendChild(opt);
      }
    }

    const amtInput = document.getElementById('dbAmount');
    if (amtInput && dueAmount > 0) {
      amtInput.value = dueAmount;
    }

    const remarkInput = document.getElementById('dbRemark');
    if (remarkInput) {
      remarkInput.value = `Payment for Invoice #${invoiceNo}`;
    }
  },

  openInvoicePaymentHistoryModal(invoiceNo) {
    const invoices = this.getAllInvoices();
    const inv = invoices.find(i => i.invoiceNo === invoiceNo);
    if (!inv) return;

    const modalBody = document.getElementById('invoiceVoucherModalBody');
    if (!modalBody) return;

    const cust = inv.customer;

    let paymentsRows = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 1rem;">No payments received yet</td></tr>`;
    if (inv.paymentHistory && inv.paymentHistory.length > 0) {
      paymentsRows = inv.paymentHistory.map((pm, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${formatDate(pm.date)} (${pm.time})</td>
          <td><strong>${pm.paymentMethod}</strong></td>
          <td>${pm.recipientPerson || '-'}</td>
          <td style="text-align: right; font-weight: 700; color: #059669;">${formatBDT(pm.amount)}</td>
        </tr>
      `).join('');
    }

    const statementHtml = `
      <div class="daybook-report-container" style="background: white; color: #0f172a; padding: 2.5rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.8rem; font-weight: 900; color: #0f172a; margin: 0;">JAGO CORPORATION PLC</h1>
            <p style="font-size: 0.9rem; color: #0284c7; font-weight: 700; margin: 0.2rem 0 0 0;">INVOICE PAYMENT HISTORY STATEMENT</p>
            <p style="font-size: 0.82rem; color: #475569; margin: 0.1rem 0 0 0;">Dhaka City, Bangladesh | Executive Sales Portal</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #0284c7; margin: 0;">INVOICE #${inv.invoiceNo}</h2>
            <p style="font-size: 0.85rem; color: #475569; margin: 0.2rem 0 0 0;">Invoice Date: <strong>${formatDate(inv.date)}</strong></p>
            <p style="font-size: 0.85rem; color: #475569; margin: 0;">Status: <strong style="color: ${inv.dueAmount <= 0 ? '#059669' : '#dc2626'};">${inv.status.toUpperCase()}</strong></p>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.88rem;">
          <div>
            <p style="color: #64748b; font-size: 0.78rem; text-transform: uppercase; font-weight: 700; margin: 0;">Customer Name</p>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0;">${cust.shopName || inv.partyName}</h3>
            <p style="margin: 0; color: #334155;">Zone/Area: <strong>${cust.zone || 'Dhaka'}</strong></p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">Total Invoice Sales: <strong>${formatBDT(inv.totalAmount)}</strong></p>
            <p style="margin: 0.2rem 0; color: #059669;">Total Paid / Received: <strong>${formatBDT(inv.paidAmount)}</strong></p>
            <p style="margin: 0; font-size: 1.05rem; font-weight: 800; color: ${inv.dueAmount > 0 ? '#dc2626' : '#059669'};">Remaining Balance Due: <strong>${formatBDT(inv.dueAmount)}</strong></p>
          </div>
        </div>

        <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Received Payment Breakdown History</h3>
        <table class="excel-table" style="width: 100%; margin-bottom: 1.5rem; font-size: 0.88rem;">
          <thead>
            <tr style="background: #0284c7; color: white;">
              <th style="width: 8%; text-align: center;">#</th>
              <th style="width: 25%;">Payment Date & Time</th>
              <th style="width: 22%;">Payment Channel / Method</th>
              <th style="width: 25%;">Bank / Custody Details</th>
              <th style="width: 20%; text-align: right;">Amount Received (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsRows}
          </tbody>
        </table>
      </div>
    `;

    modalBody.innerHTML = statementHtml;
    openModal('invoiceVoucherModal');
  },

  downloadPaymentHistoryPDF() {
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('paymentHistoryTab', `Jago_Invoice_Payment_History_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  }
};
