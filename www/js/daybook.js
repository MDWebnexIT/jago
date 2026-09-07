/* Centralized Day Book Management for Jago Corporation PLC */

const DayBookManager = {
  getAllRawEntries() {
    return Storage.get(STORAGE_KEYS.DAYBOOK, []);
  },

  getDaybookEntries() {
    const entries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    return filterRecordsByUserScope(entries, false);
  },

  getEntriesByDate(dateStr) {
    const entries = this.getDaybookEntries();
    return entries.filter(e => e.date === dateStr);
  },

  addEntry(entryData) {
    const entries = this.getAllRawEntries();
    const currentUser = SessionManager.getCurrentUser();
    const activeUserId = (currentUser && currentUser.role === 'admin') 
      ? (SessionManager.getAdminScope() === 'ALL' ? 'nazmul' : SessionManager.getAdminScope())
      : (currentUser ? currentUser.userId : 'nazmul');

    let itemsList = [];
    let calculatedAmount = parseFloat(entryData.amount) || 0;

    if (entryData.items && Array.isArray(entryData.items) && entryData.items.length > 0) {
      itemsList = entryData.items.map(it => ({
        itemId: it.itemId || "",
        itemName: it.itemName || "Item",
        qty: parseFloat(it.qty) || 1,
        unitPrice: parseFloat(it.unitPrice) || 0,
        subtotal: (parseFloat(it.qty) || 1) * (parseFloat(it.unitPrice) || 0)
      }));

      // Calculate total amount from items sum
      calculatedAmount = itemsList.reduce((sum, item) => sum + item.subtotal, 0);
    } else if (entryData.itemName) {
      // Single item fallback
      const q = parseFloat(entryData.qty) || 1;
      const u = parseFloat(entryData.unitPrice) || 0;
      itemsList = [{
        itemId: entryData.itemId || "",
        itemName: entryData.itemName,
        qty: q,
        unitPrice: u,
        subtotal: q * u
      }];
      if (calculatedAmount <= 0) calculatedAmount = q * u;
    }

    const newEntry = {
      id: "db-" + Math.random().toString(36).substr(2, 9),
      userId: activeUserId,
      date: entryData.date || new Date().toISOString().split('T')[0],
      type: entryData.type, // 'collection', 'delivery', 'cashInHand', 'orderInHand'
      time: entryData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyName: entryData.partyName ? entryData.partyName.trim() : "General Customer",
      invoiceNo: entryData.invoiceNo ? entryData.invoiceNo.trim() : "",
      vatInvoiceNo: entryData.vatInvoiceNo ? entryData.vatInvoiceNo.trim() : "",
      recipientPerson: entryData.recipientPerson ? entryData.recipientPerson.trim() : "",
      items: itemsList,
      // Backward compatibility fields
      itemId: itemsList.length > 0 ? itemsList[0].itemId : (entryData.itemId || ""),
      itemName: itemsList.length > 0 ? itemsList[0].itemName : (entryData.itemName || ""),
      qty: itemsList.length > 0 ? itemsList[0].qty : (parseFloat(entryData.qty) || 1),
      unitPrice: itemsList.length > 0 ? itemsList[0].unitPrice : (parseFloat(entryData.unitPrice) || 0),
      amount: calculatedAmount,
      paymentMethod: entryData.paymentMethod || "Cash",
      remark: entryData.remark ? entryData.remark.trim() : ""
    };

    entries.push(newEntry);
    Storage.set(STORAGE_KEYS.DAYBOOK, entries);
    return newEntry;
  },

  deleteEntry(id) {
    let entries = this.getAllRawEntries();
    entries = entries.filter(e => e.id !== id);
    Storage.set(STORAGE_KEYS.DAYBOOK, entries);
  },

  // Calculate daybook metrics for a given date
  getDailyTotals(dateStr) {
    const dayEntries = this.getEntriesByDate(dateStr);

    let totalCollection = 0;
    let totalDelivery = 0;
    let totalCashInHand = 0;
    let totalOrderInHand = 0;

    dayEntries.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      if (e.type === 'collection') totalCollection += amt;
      else if (e.type === 'delivery') totalDelivery += amt;
      else if (e.type === 'cashInHand') totalCashInHand += amt;
      else if (e.type === 'orderInHand') totalOrderInHand += amt;
    });

    return {
      totalCollection,
      totalDelivery,
      totalCashInHand,
      totalOrderInHand
    };
  },

  formatItemDetailsHTML(item) {
    if (item.items && item.items.length > 0) {
      if (item.items.length === 1) {
        const it = item.items[0];
        return `<strong>${it.itemName}</strong> (${it.qty} pcs @ ${formatBDT(it.unitPrice)})`;
      }
      return `
        <div style="margin-top: 0.2rem; font-size: 0.85rem;">
          ${item.items.map(it => `
            <div style="padding: 0.1rem 0; border-bottom: 1px dashed #e2e8f0;">
              • <strong>${it.itemName}</strong>: ${it.qty} pcs @ ${formatBDT(it.unitPrice)} = <span style="font-weight:700;">${formatBDT(it.subtotal)}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if (item.itemName) {
      return `<strong>${item.itemName}</strong> (${item.qty} pcs @ ${formatBDT(item.unitPrice)})`;
    }
    return '';
  },

  renderDaybookReport(dateStr) {
    const reportContainer = document.getElementById('daybookReportOutput');
    if (!reportContainer) return;

    const entries = this.getEntriesByDate(dateStr);

    const collections = entries.filter(e => e.type === 'collection');
    const deliveries = entries.filter(e => e.type === 'delivery');
    const cashList = entries.filter(e => e.type === 'cashInHand');
    const orders = entries.filter(e => e.type === 'orderInHand');

    const totals = this.getDailyTotals(dateStr);

    let html = `
      <div class="daybook-report-container">
        <div class="daybook-header-box">
          <h2>JAGO CORPORATION PLC</h2>
          <p><strong>SALES & MARKETING EXECUTIVE DAY BOOK</strong></p>
          <p>Location: Dhaka City | Date: <strong>${formatDate(dateStr)}</strong></p>
        </div>

        <table class="excel-table">
          <thead>
            <tr>
              <th style="width: 10%;">Date</th>
              <th style="width: 10%;">Time</th>
              <th style="width: 50%;">Details / Particulars & Delivered Product Items</th>
              <th style="width: 15%;">Amount (৳)</th>
              <th style="width: 15%;">Remark</th>
            </tr>
          </thead>
          <tbody>
    `;

    // 1. COLLECTION SECTION
    html += `
      <tr class="excel-section-header">
        <td style="font-weight: 700;">${dateStr}</td>
        <td></td>
        <td colspan="3" style="font-weight: 700; color: #0284c7;">COLLECTION (Customer Money Received / Sent to Bank)</td>
      </tr>
    `;

    if (collections.length === 0) {
      html += `<tr><td></td><td>-</td><td style="color:#64748b;">No collection recorded for this date</td><td>৳ 0</td><td>-</td></tr>`;
    } else {
      collections.forEach(item => {
        html += `
          <tr>
            <td></td>
            <td>${item.time}</td>
            <td><strong>${item.partyName}</strong> ${item.paymentMethod ? `(${item.paymentMethod})` : ''}</td>
            <td style="font-weight:600;">${formatBDT(item.amount)}</td>
            <td>${item.remark || '-'}</td>
          </tr>
        `;
      });
    }

    html += `
      <tr class="excel-total-row">
        <td></td>
        <td></td>
        <td style="text-align: right; font-weight: 700;">Total Collection:</td>
        <td style="font-weight: 800; color: #059669;">${formatBDT(totals.totalCollection)}</td>
        <td></td>
      </tr>
    `;

    // 2. DELIVERY SECTION (Multi-Product Formatting)
    html += `
      <tr class="excel-section-header">
        <td style="font-weight: 700;">${dateStr}</td>
        <td></td>
        <td colspan="3" style="font-weight: 700; color: #0284c7;">DELIVERY (Products Delivered to Party / Customer)</td>
      </tr>
    `;

    if (deliveries.length === 0) {
      html += `<tr><td></td><td>-</td><td style="color:#64748b;">No delivery recorded for this date</td><td>৳ 0</td><td>-</td></tr>`;
    } else {
      deliveries.forEach(item => {
        const itemFormatted = this.formatItemDetailsHTML(item);
        html += `
          <tr>
            <td></td>
            <td>${item.time}</td>
            <td>
              <div style="font-weight:700; color:#0f172a; font-size:0.95rem;">${item.partyName}</div>
              ${itemFormatted}
            </td>
            <td style="font-weight:700; color:#0284c7;">${formatBDT(item.amount)}</td>
            <td>${item.remark || '-'}</td>
          </tr>
        `;
      });
    }

    html += `
      <tr class="excel-total-row">
        <td></td>
        <td></td>
        <td style="text-align: right; font-weight: 700;">Total Delivery:</td>
        <td style="font-weight: 800; color: #0284c7;">${formatBDT(totals.totalDelivery)}</td>
        <td></td>
      </tr>
    `;

    // 3. CASH IN HAND / CHEQUE SECTION
    html += `
      <tr class="excel-section-header">
        <td style="font-weight: 700;">${dateStr}</td>
        <td></td>
        <td colspan="3" style="font-weight: 700; color: #d97706;">CASH IN HAND / CHEQUE (Self / Office Accounts Dept / Person)</td>
      </tr>
    `;

    if (cashList.length === 0) {
      html += `<tr><td></td><td>-</td><td style="color:#64748b;">No cash in hand recorded</td><td>৳ 0</td><td>-</td></tr>`;
    } else {
      cashList.forEach(item => {
        html += `
          <tr>
            <td></td>
            <td>${item.time}</td>
            <td><strong>${item.partyName}</strong></td>
            <td style="font-weight:600;">${formatBDT(item.amount)}</td>
            <td>${item.remark || '-'}</td>
          </tr>
        `;
      });
    }

    html += `
      <tr class="excel-total-row">
        <td></td>
        <td></td>
        <td style="text-align: right; font-weight: 700;">Total Cash in Hand:</td>
        <td style="font-weight: 800; color: #d97706;">${formatBDT(totals.totalCashInHand)}</td>
        <td></td>
      </tr>
    `;

    // 4. ORDER IN HAND SECTION
    html += `
      <tr class="excel-section-header">
        <td style="font-weight: 700;">${dateStr}</td>
        <td></td>
        <td colspan="3" style="font-weight: 700; color: #2563eb;">ORDER IN HAND (Pending Customer Orders)</td>
      </tr>
    `;

    if (orders.length === 0) {
      html += `<tr><td></td><td>-</td><td style="color:#64748b;">No order in hand recorded</td><td>৳ 0</td><td>-</td></tr>`;
    } else {
      orders.forEach(item => {
        const itemFormatted = this.formatItemDetailsHTML(item);
        html += `
          <tr>
            <td></td>
            <td>${item.time}</td>
            <td>
              <div style="font-weight:700; color:#0f172a; font-size:0.95rem;">${item.partyName}</div>
              ${itemFormatted}
            </td>
            <td style="font-weight:700; color:#2563eb;">${formatBDT(item.amount)}</td>
            <td>${item.remark || '-'}</td>
          </tr>
        `;
      });
    }

    html += `
      <tr class="excel-total-row">
        <td></td>
        <td></td>
        <td style="text-align: right; font-weight: 700;">Total Order in Hand:</td>
        <td style="font-weight: 800; color: #2563eb;">${formatBDT(totals.totalOrderInHand)}</td>
        <td></td>
      </tr>
    `;

    html += `
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Prepared By (Executive)</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Accounts Department</p>
          </div>
          <div style="text-align: center; min-width: 180px;">
            <div style="border-bottom: 1px solid #0f172a; margin-bottom: 0.4rem; height: 30px;"></div>
            <p style="font-size: 0.82rem; font-weight: 600;">Approved By (Manager)</p>
          </div>
        </div>
      </div>
    `;

    reportContainer.innerHTML = html;
  },

  renderDaybookTable(dateStr) {
    const tbody = document.getElementById('daybookEntriesTableBody');
    if (!tbody) return;

    const entries = this.getEntriesByDate(dateStr);

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No Daybook entries logged for ${formatDate(dateStr)}. Click "Add Daybook Entry" to log data.
          </td>
        </tr>`;
      return;
    }

    const typeLabels = {
      collection: '<span class="badge badge-success">Collection</span>',
      delivery: '<span class="badge badge-primary">Delivery</span>',
      cashInHand: '<span class="badge badge-warning">Cash in Hand</span>',
      orderInHand: '<span class="badge badge-secondary">Order in Hand</span>'
    };

    tbody.innerHTML = entries.map(e => `
      <tr>
        <td>${e.time}</td>
        <td>${typeLabels[e.type] || e.type}</td>
        <td style="font-weight:700;">${e.partyName}</td>
        <td>${this.formatItemDetailsHTML(e) || '-'}</td>
        <td style="font-weight:700; color:var(--text-main);">${formatBDT(e.amount)}</td>
        <td style="font-size:0.82rem; color:var(--text-muted);">${e.remark || '-'}</td>
        <td style="text-align:right;">
          <button class="btn btn-danger btn-sm" onclick="DayBookManager.confirmDelete('${e.id}')" title="Delete Entry">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  confirmDelete(id) {
    if (confirm("Delete this daybook entry?")) {
      this.deleteEntry(id);
      const currentDate = document.getElementById('selectedDateInput').value;
      this.renderDaybookTable(currentDate);
      this.renderDaybookReport(currentDate);
      updateDashboardMetrics();
    }
  },

  downloadDaybookPDF() {
    const dateVal = document.getElementById('selectedDateInput')?.value || new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('daybookReportOutput', `Jago_DayBook_${dateVal}.pdf`);
    } else {
      window.print();
    }
  }
};
