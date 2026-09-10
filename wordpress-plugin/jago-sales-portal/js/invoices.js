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
      } else {
        unallocatedCollections.push({
          partyLower: collPartyLower,
          amount: collAmt,
          date: coll.date
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
  }
};
