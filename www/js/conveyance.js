/* Daily Conveyance Bill Management for Jago Corporation PLC */

function numberToWordsBDT(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return "Taka Zero Only";

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return (b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')).trim();
    if (n < 1000) return (a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '')).trim();
    if (n < 100000) return (inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '')).trim();
    if (n < 10000000) return (inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '')).trim();
    return (inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '')).trim();
  }

  const taka = Math.floor(num);
  const paisa = Math.round((num - taka) * 100);

  let words = taka > 0 ? inWords(taka) : 'Zero';
  let result = 'Taka ' + words;
  if (paisa > 0) {
    result += ' and ' + inWords(paisa) + ' Paisa';
  }
  result += ' Only';
  return result;
}
if (typeof window !== 'undefined') {
  window.numberToWordsBDT = numberToWordsBDT;
}

const ConveyanceManager = {
  getAllRawLogs() {
    return Storage.get(STORAGE_KEYS.CONVEYANCE, []);
  },

  getConveyanceLogs(overrideUserId = null) {
    const logs = Storage.get(STORAGE_KEYS.CONVEYANCE, []);
    return filterRecordsByUserScope(logs, true, overrideUserId);
  },

  getLogsByDate(dateStr, overrideUserId = null) {
    if (!dateStr) return this.getConveyanceLogs(overrideUserId);
    return this.getConveyanceLogs(overrideUserId).filter(c => c.date === dateStr);
  },

  getConveyanceById(id) {
    return this.getAllRawLogs().find(c => c.id === id);
  },

  addConveyance(data) {
    const logs = this.getAllRawLogs();
    const currentUser = SessionManager.getCurrentUser();
    const activeUserId = (currentUser && currentUser.role === 'admin') 
      ? (SessionManager.getAdminScope() === 'ALL' ? 'nazmul' : SessionManager.getAdminScope())
      : (currentUser ? currentUser.userId : 'nazmul');

    const newLog = {
      id: "conv-" + Math.random().toString(36).substr(2, 9),
      userId: activeUserId,
      date: data.date || new Date().toISOString().split('T')[0],
      fromLocation: data.fromLocation.trim(),
      toLocation: data.toLocation.trim(),
      transport: data.transport || "Rickshaw",
      purpose: data.purpose ? data.purpose.trim() : "Sales & Collection Visit",
      amount: parseFloat(data.amount) || 0
    };
    logs.unshift(newLog);
    Storage.set(STORAGE_KEYS.CONVEYANCE, logs);

    // Save locations to memory dropdown
    Storage.saveConveyanceLocation(newLog.fromLocation);
    Storage.saveConveyanceLocation(newLog.toLocation);
    this.populateLocationDatalists();

    return newLog;
  },

  updateConveyance(id, data) {
    const logs = this.getConveyanceLogs();
    const index = logs.findIndex(c => c.id === id);
    if (index !== -1) {
      logs[index] = {
        ...logs[index],
        date: data.date || logs[index].date,
        fromLocation: data.fromLocation.trim(),
        toLocation: data.toLocation.trim(),
        transport: data.transport || logs[index].transport,
        purpose: data.purpose ? data.purpose.trim() : logs[index].purpose,
        amount: parseFloat(data.amount) || 0
      };
      Storage.set(STORAGE_KEYS.CONVEYANCE, logs);

      Storage.saveConveyanceLocation(data.fromLocation);
      Storage.saveConveyanceLocation(data.toLocation);
      this.populateLocationDatalists();

      return logs[index];
    }
    return null;
  },

  deleteConveyance(id) {
    let logs = this.getConveyanceLogs();
    logs = logs.filter(c => c.id !== id);
    Storage.set(STORAGE_KEYS.CONVEYANCE, logs);
  },

  populateLocationDatalists() {
    const savedLocations = Storage.getSavedLocations();
    const datalistFrom = document.getElementById('savedFromLocationsDatalist');
    const datalistTo = document.getElementById('savedToLocationsDatalist');

    const optionsHtml = savedLocations.map(loc => `<option value="${loc}">`).join('');

    if (datalistFrom) datalistFrom.innerHTML = optionsHtml;
    if (datalistTo) datalistTo.innerHTML = optionsHtml;
  },

  // Tab 4 Simple Renderer
  renderConveyanceTable(dateStr) {
    const tbody = document.getElementById('conveyanceTableBody');
    if (!tbody) return;

    this.populateLocationDatalists();

    const viewModeFilter = document.getElementById('conveyanceDateFilterMode')?.value || 'all';
    const activeDate = viewModeFilter === 'all' ? '' : dateStr;

    let logs = this.getLogsByDate(activeDate);
    if (viewModeFilter === 'selectedDate' && logs.length === 0) {
      // Fallback to all logs if no logs match current single date
      logs = this.getConveyanceLogs();
    }

    const totalElem = document.getElementById('conveyanceDailyTotal');
    const totalWordsElem = document.getElementById('conveyanceDailyTotalWords');

    let total = 0;
    logs.forEach(l => total += (parseFloat(l.amount) || 0));

    if (totalElem) {
      totalElem.innerText = formatBDT(total);
    }
    if (totalWordsElem) {
      totalWordsElem.innerText = numberToWordsBDT(total);
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No conveyance bill entries logged yet. Click "Log Conveyance Entry" to add one.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-weight: 700;">${formatDate(l.date)}</td>
        <td style="font-weight: 600; color: var(--text-main);">${l.fromLocation} → ${l.toLocation}</td>
        <td>
          <span class="badge badge-primary">${l.transport}</span>
        </td>
        <td>${l.purpose}</td>
        <td style="font-weight: 700; color: var(--danger);">${formatBDT(l.amount)}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="ConveyanceManager.editConveyanceModal('${l.id}')" title="Edit Entry for Date ${l.date}">
            <i class="ri-edit-line"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="ConveyanceManager.confirmDelete('${l.id}')" title="Delete Entry">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  // Tab 9 Dedicated Report View Filter Handler
  onReportFilterModeChange() {
    const modeSelect = document.getElementById('convReportFilterMode');
    const fromGroup = document.getElementById('convFromDateGroup');
    const toGroup = document.getElementById('convToDateGroup');
    const fromInput = document.getElementById('convFromDate');
    const toInput = document.getElementById('convToDate');

    if (modeSelect && fromGroup && toGroup) {
      const mode = modeSelect.value;
      if (mode === 'dateRange') {
        fromGroup.style.display = 'block';
        toGroup.style.display = 'block';

        if (fromInput && !fromInput.value) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          fromInput.value = firstDay;
        }
        if (toInput && !toInput.value) {
          const todayStr = new Date().toISOString().split('T')[0];
          toInput.value = todayStr;
        }
      } else {
        fromGroup.style.display = 'none';
        toGroup.style.display = 'none';
      }
    }
    this.renderConveyanceReport();
  },

  // Tab 9 Report Data Fetcher
  getFilteredReportLogs() {
    let logs = this.getConveyanceLogs();

    // Sort chronologically descending (newest dates first)
    logs.sort((a, b) => b.date.localeCompare(a.date));

    const modeSelect = document.getElementById('convReportFilterMode');
    const mode = modeSelect ? modeSelect.value : 'all';

    const headerDate = document.getElementById('selectedDateInput')?.value || new Date().toISOString().split('T')[0];
    const fromDate = document.getElementById('convFromDate')?.value || '';
    const toDate = document.getElementById('convToDate')?.value || '';
    const transportFilter = document.getElementById('convTransportFilter')?.value || '';
    const searchKeyword = document.getElementById('convSearchInput')?.value.toLowerCase().trim() || '';

    // 1. Date Filtering
    if (mode === 'selectedDate' && headerDate) {
      logs = logs.filter(l => l.date === headerDate);
    } else if (mode === 'dateRange') {
      if (fromDate) logs = logs.filter(l => l.date >= fromDate);
      if (toDate) logs = logs.filter(l => l.date <= toDate);
    }
    // Mode 'all' returns all recorded entries

    // 2. Transport Mode Filtering
    if (transportFilter) {
      logs = logs.filter(l => l.transport === transportFilter);
    }

    // 3. Search Keyword Filtering
    if (searchKeyword) {
      logs = logs.filter(l => 
        (l.fromLocation || '').toLowerCase().includes(searchKeyword) ||
        (l.toLocation || '').toLowerCase().includes(searchKeyword) ||
        (l.purpose || '').toLowerCase().includes(searchKeyword) ||
        (l.transport || '').toLowerCase().includes(searchKeyword)
      );
    }

    return logs;
  },  // Tab 9 Main Renderer
  renderConveyanceReport() {
    const tbody = document.getElementById('conveyanceReportTableBody');
    if (!tbody) return;

    const logs = this.getFilteredReportLogs();

    // Calculate Ticker Metrics & Summary Totals
    let totalBill = 0;
    let totalTrips = logs.length;
    let rickshawSum = 0;
    let cngUberSum = 0;
    let busOtherSum = 0;

    logs.forEach(l => {
      const amt = parseFloat(l.amount) || 0;
      totalBill += amt;
      if (l.transport === 'Rickshaw') rickshawSum += amt;
      else if (l.transport === 'CNG' || l.transport === 'Uber / Pathao') cngUberSum += amt;
      else busOtherSum += amt;
    });

    // Update Metric Cards
    const totalElem = document.getElementById('convMetricTotal');
    const totalWordsElem = document.getElementById('convMetricTotalWords');
    const tripsElem = document.getElementById('convMetricTrips');
    const rickshawElem = document.getElementById('convMetricRickshaw');
    const cngUberElem = document.getElementById('convMetricCngUber');
    const busOtherElem = document.getElementById('convMetricBusOther');
    const footerTotalElem = document.getElementById('conveyanceTableFooterTotal');
    const footerTotalWordsElem = document.getElementById('conveyanceTableFooterTotalWords');

    if (totalElem) totalElem.innerText = formatBDT(totalBill);
    if (totalWordsElem) totalWordsElem.innerText = numberToWordsBDT(totalBill);
    if (tripsElem) tripsElem.innerText = `${totalTrips} Trips`;
    if (rickshawElem) rickshawElem.innerText = formatBDT(rickshawSum);
    if (cngUberElem) cngUberElem.innerText = formatBDT(cngUberSum);
    if (busOtherElem) busOtherElem.innerText = formatBDT(busOtherSum);
    if (footerTotalElem) footerTotalElem.innerText = formatBDT(totalBill);
    if (footerTotalWordsElem) footerTotalWordsElem.innerHTML = `<strong>Amount in Words:</strong> ${numberToWordsBDT(totalBill)}`;

    // Render Master Detailed Trip Log Table Body
    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            <i class="ri-car-line" style="font-size: 2rem; color: var(--primary);"></i>
            <p style="margin-top: 0.5rem;">No conveyance entries found matching your selected date or filter criteria.</p>
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-weight: 700;">${formatDate(l.date)}</td>
          <td style="font-weight: 600; color: var(--text-main);">${l.fromLocation} → ${l.toLocation}</td>
          <td>
            <span class="badge ${l.transport === 'Rickshaw' ? 'badge-primary' : (l.transport === 'CNG' || l.transport === 'Uber / Pathao' ? 'badge-success' : 'badge-warning')}">${l.transport}</span>
          </td>
          <td>${l.purpose}</td>
          <td style="font-weight: 700; color: var(--danger);">${formatBDT(l.amount)}</td>
          <td style="text-align: right;" class="no-print">
            <button class="btn btn-secondary btn-sm" onclick="ConveyanceManager.editConveyanceModal('${l.id}')" title="Edit Entry">
              <i class="ri-edit-line"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="ConveyanceManager.confirmDelete('${l.id}')" title="Delete Entry">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 1. Render Day-Wise Grouped Separate Reports (1 Sep, 2 Sep, 3 Sep...)
    this.renderDayWiseGroupedReport(logs);

    // 2. Render Date-Wise Summary Breakdown Table
    this.renderDailySummaryTable(logs);
  },

  // Render Day-Wise Grouped Separate Cards & Tables in Tab 9
  renderDayWiseGroupedReport(logs) {
    const container = document.getElementById('conveyanceDayWiseReportContainer');
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            <i class="ri-car-line" style="font-size: 2.5rem; color: var(--primary);"></i>
            <h4 style="margin-top: 0.75rem;">No Conveyance Entries Found</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted);">Adjust date range or filter settings above to view conveyance bill reports.</p>
          </div>
        </div>`;
      return;
    }

    // Group logs by date
    const dateMap = {};
    logs.forEach(l => {
      if (!dateMap[l.date]) dateMap[l.date] = [];
      dateMap[l.date].push(l);
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a)); // Newest dates first

    let html = '';
    sortedDates.forEach(dateStr => {
      const dayLogs = dateMap[dateStr];
      let dayTotal = 0;
      dayLogs.forEach(l => dayTotal += (parseFloat(l.amount) || 0));

      const rowsHtml = dayLogs.map((l, index) => `
        <tr>
          <td style="text-align: center; width: 40px;">${index + 1}</td>
          <td style="font-weight: 600; color: var(--text-main);">${l.fromLocation} → ${l.toLocation}</td>
          <td><span class="badge ${l.transport === 'Rickshaw' ? 'badge-primary' : (l.transport === 'CNG' || l.transport === 'Uber / Pathao' ? 'badge-success' : 'badge-warning')}">${l.transport}</span></td>
          <td>${l.purpose}</td>
          <td style="font-weight: 700; color: var(--danger); text-align: right;">${formatBDT(l.amount)}</td>
        </tr>
      `).join('');

      html += `
        <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--primary);">
          <div class="card-header" style="padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div class="card-title" style="font-size: 1rem; color: var(--primary);">
              <i class="ri-calendar-event-fill"></i> ${formatDate(dateStr)} (${dayLogs.length} Journeys)
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: var(--danger); font-size: 1.05rem;">
                Daily Total: ${formatBDT(dayTotal)}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic; font-weight: 500;">
                In Words: ${numberToWordsBDT(dayTotal)}
              </div>
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table" style="font-size: 0.88rem;">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>Journey Route (From → To)</th>
                  <th>Transport Mode</th>
                  <th>Purpose / Customer Visited</th>
                  <th style="text-align: right;">Fare Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr style="background: rgba(255,255,255,0.04); font-weight: 700;">
                  <td colspan="4" style="text-align: right; color: var(--text-muted);">Daily Subtotal for ${formatDate(dateStr)}:</td>
                  <td style="text-align: right; color: var(--danger); font-size: 1rem;">${formatBDT(dayTotal)}</td>
                </tr>
                <tr style="background: rgba(56, 189, 248, 0.05); font-weight: 600;">
                  <td colspan="5" style="text-align: right; color: var(--primary); font-size: 0.85rem;">
                    <strong>In Words:</strong> ${numberToWordsBDT(dayTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderDailySummaryTable(logs) {
    const summaryTbody = document.getElementById('conveyanceDailySummaryTableBody');
    if (!summaryTbody) return;

    if (!logs || logs.length === 0) {
      summaryTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            No daily summary data available for current date selection.
          </td>
        </tr>`;
      return;
    }

    // Group logs by date
    const dayGroupMap = {};
    logs.forEach(l => {
      if (!dayGroupMap[l.date]) {
        dayGroupMap[l.date] = {
          date: l.date,
          count: 0,
          rickshaw: 0,
          cngUber: 0,
          busOther: 0,
          total: 0,
          routes: []
        };
      }
      dayGroupMap[l.date].count += 1;
      const amt = parseFloat(l.amount) || 0;
      dayGroupMap[l.date].total += amt;

      if (l.transport === 'Rickshaw') dayGroupMap[l.date].rickshaw += amt;
      else if (l.transport === 'CNG' || l.transport === 'Uber / Pathao') dayGroupMap[l.date].cngUber += amt;
      else dayGroupMap[l.date].busOther += amt;

      const routeStr = `${l.fromLocation} → ${l.toLocation}`;
      if (!dayGroupMap[l.date].routes.includes(routeStr)) {
        dayGroupMap[l.date].routes.push(routeStr);
      }
    });

    const dayGroupList = Object.values(dayGroupMap);
    dayGroupList.sort((a, b) => b.date.localeCompare(a.date));

    summaryTbody.innerHTML = dayGroupList.map(d => `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${formatDate(d.date)}</td>
        <td><span class="badge badge-secondary">${d.count} journeys</span></td>
        <td style="font-size: 0.85rem; max-width: 300px; color: var(--text-muted);">
          ${d.routes.join(', ')}
        </td>
        <td style="font-weight: 600;">${formatBDT(d.rickshaw)}</td>
        <td style="font-weight: 600;">${formatBDT(d.cngUber)}</td>
        <td style="font-weight: 600;">${formatBDT(d.busOther)}</td>
        <td style="font-weight: 800; color: var(--danger); font-size: 0.95rem;">
          ${formatBDT(d.total)}
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; font-style: italic;">${numberToWordsBDT(d.total)}</div>
        </td>
      </tr>
    `).join('');
  },

  openAddModal() {
    document.getElementById('modalConveyanceTitle').innerText = "Log Daily Conveyance Entry";
    document.getElementById('convEditId').value = "";

    const selectedHeaderDate = document.getElementById('selectedDateInput').value || new Date().toISOString().split('T')[0];
    document.getElementById('convDate').value = selectedHeaderDate;

    document.getElementById('convFrom').value = "";
    document.getElementById('convTo').value = "";
    document.getElementById('convTransport').value = "Rickshaw";
    document.getElementById('convPurpose').value = "";
    document.getElementById('convAmount').value = "";

    this.populateLocationDatalists();
    openModal('conveyanceModal');
  },

  editConveyanceModal(id) {
    const log = this.getConveyanceById(id);
    if (!log) return;

    document.getElementById('modalConveyanceTitle').innerText = `Edit Conveyance Entry (${formatDate(log.date)})`;
    document.getElementById('convEditId').value = log.id;
    document.getElementById('convDate').value = log.date;
    document.getElementById('convFrom').value = log.fromLocation;
    document.getElementById('convTo').value = log.toLocation;
    document.getElementById('convTransport').value = log.transport;
    document.getElementById('convPurpose').value = log.purpose;
    document.getElementById('convAmount').value = log.amount;

    this.populateLocationDatalists();
    openModal('conveyanceModal');
  },

  confirmDelete(id) {
    if (confirm("Delete this conveyance entry?")) {
      this.deleteConveyance(id);
      const dateVal = document.getElementById('selectedDateInput').value;
      this.renderConveyanceTable(dateVal);
      this.renderConveyanceReport();
      updateDashboardMetrics();
    }
  },

  // Open Formal Printable Day-Wise Conveyance Claim Voucher Sheet
  openConveyanceVoucherModal() {
    const logs = this.getFilteredReportLogs();
    const modalBody = document.getElementById('conveyanceVoucherModalBody');
    if (!modalBody) return;

    const modeSelect = document.getElementById('convReportFilterMode');
    const mode = modeSelect ? modeSelect.value : 'all';
    const headerDate = document.getElementById('selectedDateInput')?.value || new Date().toISOString().split('T')[0];
    const fromDate = document.getElementById('convFromDate')?.value || '';
    const toDate = document.getElementById('convToDate')?.value || '';

    let periodLabel = `All Recorded Dates Cumulative Report`;
    if (mode === 'dateRange') {
      periodLabel = `Period: ${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : 'Present'}`;
    } else if (mode === 'selectedDate') {
      periodLabel = `Single Day (${formatDate(headerDate)})`;
    }

    let grandTotal = 0;
    logs.forEach(l => grandTotal += (parseFloat(l.amount) || 0));

    // Group logs by date (chronological order ascending for formal report: 01 Sep -> 02 Sep -> 03 Sep...)
    const dateMap = {};
    logs.forEach(l => {
      if (!dateMap[l.date]) dateMap[l.date] = [];
      dateMap[l.date].push(l);
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

    let dayBlocksHtml = '';

    if (sortedDates.length === 0) {
      dayBlocksHtml = `
        <div style="text-align: center; color: #64748b; padding: 2rem; border: 1px dashed #cbd5e1; border-radius: 6px;">
          No conveyance entries recorded for ${periodLabel}.
        </div>`;
    } else {
      sortedDates.forEach((dateStr, dIdx) => {
        const dayLogs = dateMap[dateStr];
        let dayTotal = 0;
        dayLogs.forEach(l => dayTotal += (parseFloat(l.amount) || 0));

        const rows = dayLogs.map((l, rIdx) => `
          <tr>
            <td style="text-align: center; padding: 6px;">${rIdx + 1}</td>
            <td style="padding: 6px;"><strong>${l.fromLocation}</strong> → <strong>${l.toLocation}</strong></td>
            <td style="padding: 6px;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${l.transport}</span></td>
            <td style="padding: 6px;">${l.purpose}</td>
            <td style="padding: 6px; text-align: right; font-weight: 700; color: #0f172a;">${formatBDT(l.amount)}</td>
          </tr>
        `).join('');

        dayBlocksHtml += `
          <div style="margin-bottom: 1.5rem; page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
            <div style="background: #f1f5f9; padding: 0.65rem 0.85rem; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #0284c7; font-size: 0.95rem;">
                📅 Day ${dIdx + 1}: ${formatDate(dateStr)} (${dayLogs.length} Journeys)
              </span>
              <span style="font-weight: 800; color: #dc2626; font-size: 1rem;">
                Daily Subtotal: ${formatBDT(dayTotal)}
              </span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="background: #0f172a; color: white; text-align: left;">
                  <th style="padding: 6px; text-align: center; width: 35px;">#</th>
                  <th style="padding: 6px;">Journey Route (From → To)</th>
                  <th style="padding: 6px; width: 120px;">Transport</th>
                  <th style="padding: 6px;">Purpose / Customer Visited</th>
                  <th style="padding: 6px; text-align: right; width: 100px;">Fare (৳)</th>
                </tr>
              </thead>
              <tbody style="border-bottom: 1px solid #cbd5e1;">
                ${rows}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="4" style="padding: 6px 10px; text-align: right; color: #475569;">Daily Subtotal (${formatDate(dateStr)}):</td>
                  <td style="padding: 6px 10px; text-align: right; color: #dc2626; font-size: 0.95rem;">${formatBDT(dayTotal)}</td>
                </tr>
                <tr style="background: #f1f5f9; font-weight: 600;">
                  <td colspan="5" style="padding: 4px 10px; text-align: right; color: #0284c7; font-size: 0.82rem;">
                    <strong>In Words:</strong> ${numberToWordsBDT(dayTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      });
    }

    modalBody.innerHTML = `
      <div id="conveyancePrintableVoucherArea" style="padding: 1.5rem; background: #ffffff; color: #1e293b; font-family: system-ui, -apple-system, sans-serif; border: 1px solid #e2e8f0; border-radius: 8px;">
        <!-- Header Branding -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h2 style="margin: 0; color: #0284c7; font-size: 1.4rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">JAGO CORPORATION PLC</h2>
            <div style="font-size: 0.82rem; color: #475569; margin-top: 0.25rem;">
              Water Purifier Assembly & Wholesale Distribution Specialist<br>
              Head Office: Motijheel C/A, Dhaka-1000 | Phone: +880 1700-000000 | Email: billing@jagocorp.com
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0284c7; color: white; padding: 0.4rem 0.8rem; font-weight: 700; font-size: 0.85rem; border-radius: 4px; letter-spacing: 0.5px;">
              DAY-WISE CONVEYANCE EXPENSE REPORT
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
              <strong>Report Generated:</strong> ${formatDate(new Date().toISOString().split('T')[0])}
            </div>
          </div>
        </div>

        <!-- Claim Metadata Banner -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: #f8fafc; padding: 0.85rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 1.25rem; font-size: 0.85rem;">
          <div>
            <span style="color: #64748b; font-size: 0.78rem; text-transform: uppercase;">Claimant Executive:</span><br>
            <strong style="color: #0f172a; font-size: 0.95rem;">Sales & Marketing Dept</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.78rem; text-transform: uppercase;">Statement Scope / Period:</span><br>
            <strong style="color: #0284c7;">${periodLabel}</strong>
          </div>
          <div style="text-align: right;">
            <span style="color: #64748b; font-size: 0.78rem; text-transform: uppercase;">Cumulative Expense:</span><br>
            <strong style="color: #dc2626; font-size: 1.05rem;">${formatBDT(grandTotal)}</strong>
            <div style="font-size: 0.75rem; color: #0284c7; font-weight: 600; margin-top: 2px;">${numberToWordsBDT(grandTotal)}</div>
          </div>
        </div>

        <!-- Day-Wise Grouped Sections -->
        <div style="margin-bottom: 1.5rem;">
          ${dayBlocksHtml}
        </div>

        <!-- Cumulative Summary Banner -->
        <div style="background: #0f172a; color: white; padding: 1rem 1.25rem; border-radius: 6px; margin-bottom: 2.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1rem;">
            <span style="font-weight: 700;">Grand Total Cumulative Conveyance Claim:</span>
            <span style="font-weight: 800; color: #38bdf8; font-size: 1.25rem;">${formatBDT(grandTotal)}</span>
          </div>
          <div style="margin-top: 0.5rem; text-align: right; color: #e2e8f0; font-size: 0.92rem; border-top: 1px dashed rgba(255,255,255,0.25); padding-top: 0.5rem;">
            <strong style="color: #38bdf8;">Amount in Words:</strong> ${numberToWordsBDT(grandTotal)}
          </div>
        </div>

        <!-- Approvals & Signatures Block -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; text-align: center; font-size: 0.8rem; page-break-inside: avoid;">
          <div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 0.4rem; font-weight: 700; color: #334155;">
              Field Executive Signature
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">Prepared & Submitted</div>
          </div>
          <div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 0.4rem; font-weight: 700; color: #334155;">
              Sales Manager Approval
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">Checked & Verified</div>
          </div>
          <div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 0.4rem; font-weight: 700; color: #334155;">
              Accounts Audit & Disbursed By
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">Passed for Cash Disbursement</div>
          </div>
        </div>
      </div>
    `;

    openModal('conveyanceVoucherModal');
  },

  // Print Conveyance Voucher
  printConveyanceVoucher() {
    const area = document.getElementById('conveyancePrintableVoucherArea');
    if (!area) {
      window.print();
      return;
    }

    const printWin = window.open('', '', 'width=900,height=750');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day-Wise Conveyance Claim Report - Jago Corporation PLC</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
          th { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${area.outerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  downloadConveyanceReportPDF() {
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('conveyanceDayWiseReportContainer', `Jago_Conveyance_Executive_Report_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  },

  downloadConveyanceVoucherPDF() {
    const filenameDate = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('conveyanceVoucherModalBody', `Jago_Conveyance_Claim_Sheet_${filenameDate}.pdf`);
    } else {
      window.print();
    }
  }
};


