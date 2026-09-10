/* Centralized Cash in Hand Clearance & Reconciliation Manager */

const CashClearanceManager = {
  getAllCashEntries() {
    const daybookEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    const scopedEntries = typeof filterRecordsByUserScope === 'function' 
      ? filterRecordsByUserScope(daybookEntries, false) 
      : daybookEntries;
    
    // Filter only cashInHand type entries
    return scopedEntries.filter(e => e.type === 'cashInHand');
  },

  getAllCollections() {
    const daybookEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    const scopedEntries = typeof filterRecordsByUserScope === 'function' 
      ? filterRecordsByUserScope(daybookEntries, false) 
      : daybookEntries;

    return scopedEntries.filter(e => e.type === 'collection');
  },

  // Calculate clearance status for entries (either manually cleared or auto-matched via Bank Collection)
  getProcessedEntries() {
    const cashEntries = this.getAllCashEntries();
    const collections = this.getAllCollections();

    // Map of collection remaining balance
    const collectionAvailMap = new Map();
    collections.forEach(c => {
      collectionAvailMap.set(c.id, parseFloat(c.amount) || 0);
    });

    return cashEntries.map(e => {
      const origAmt = parseFloat(e.amount) || 0;
      let isCleared = !!e.cleared;
      let clearedAmt = isCleared ? origAmt : 0;
      let clearMethod = e.clearedMethod || (isCleared ? 'Manual Clearance' : '');

      const invNo = (e.invoiceNo || '').trim().toLowerCase();
      const party = (e.partyName || '').trim().toLowerCase();

      // If not manually cleared, check if matched with a Bank Collection entry
      if (!isCleared && origAmt > 0) {
        if (invNo) {
          const matchColl = collections.find(c => {
            const cInv = (c.invoiceNo || '').trim().toLowerCase();
            const avail = collectionAvailMap.get(c.id) || 0;
            return cInv === invNo && avail > 0;
          });

          if (matchColl) {
            const avail = collectionAvailMap.get(matchColl.id) || 0;
            const offset = Math.min(origAmt, avail);
            collectionAvailMap.set(matchColl.id, avail - offset);
            isCleared = offset >= origAmt;
            clearedAmt = offset;
            clearMethod = `Deposited via Bank Collection (Inv #${e.invoiceNo})`;
          }
        } else if (party) {
          const matchColl = collections.find(c => {
            const cParty = (c.partyName || '').trim().toLowerCase();
            const cAmt = parseFloat(c.amount) || 0;
            const avail = collectionAvailMap.get(c.id) || 0;
            return cParty === party && Math.abs(cAmt - origAmt) < 0.01 && avail > 0;
          });

          if (matchColl) {
            const avail = collectionAvailMap.get(matchColl.id) || 0;
            const offset = Math.min(origAmt, avail);
            collectionAvailMap.set(matchColl.id, avail - offset);
            isCleared = offset >= origAmt;
            clearedAmt = offset;
            clearMethod = `Deposited via Bank Collection (${e.partyName})`;
          }
        }
      }

      const remainingAmt = Math.max(0, origAmt - clearedAmt);

      return {
        ...e,
        originalAmount: origAmt,
        clearedAmount: clearedAmt,
        remainingAmount: remainingAmt,
        isCleared: isCleared || remainingAmt === 0,
        clearMethod: clearMethod
      };
    });
  },

  renderCashClearanceView() {
    const tbody = document.getElementById('cashClearanceTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('cashClearanceSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('cashClearanceStatusFilter')?.value || 'all';

    let processed = this.getProcessedEntries();

    // Filter by status
    if (statusFilter === 'active') {
      processed = processed.filter(e => !e.isCleared && e.remainingAmount > 0);
    } else if (statusFilter === 'cleared') {
      processed = processed.filter(e => e.isCleared || e.remainingAmount === 0);
    }

    // Filter by search term
    if (searchTerm) {
      processed = processed.filter(e => 
        (e.invoiceNo && e.invoiceNo.toLowerCase().includes(searchTerm)) ||
        (e.partyName && e.partyName.toLowerCase().includes(searchTerm)) ||
        (e.recipientPerson && e.recipientPerson.toLowerCase().includes(searchTerm)) ||
        (e.remark && e.remark.toLowerCase().includes(searchTerm))
      );
    }

    // Calculate Metric Totals from all processed entries
    const allProcessed = this.getProcessedEntries();
    let totalCustody = 0;
    let totalCleared = 0;
    let activeInvoicesCount = 0;
    let clearedInvoicesCount = 0;

    allProcessed.forEach(e => {
      totalCustody += e.remainingAmount;
      totalCleared += e.clearedAmount;
      if (e.remainingAmount > 0) activeInvoicesCount++;
      else clearedInvoicesCount++;
    });

    // Update Dashboard Metric Tickers
    const custodyElem = document.getElementById('cashClearanceTotalCustody');
    const clearedElem = document.getElementById('cashClearanceTotalCleared');
    const activeCountElem = document.getElementById('cashClearanceActiveCount');
    const clearedCountElem = document.getElementById('cashClearanceClearedCount');

    if (custodyElem) custodyElem.innerText = typeof formatBDT === 'function' ? formatBDT(totalCustody) : `৳ ${totalCustody}`;
    if (clearedElem) clearedElem.innerText = typeof formatBDT === 'function' ? formatBDT(totalCleared) : `৳ ${totalCleared}`;
    if (activeCountElem) activeCountElem.innerText = `${activeInvoicesCount} Invoices`;
    if (clearedCountElem) clearedCountElem.innerText = `${clearedInvoicesCount} Cleared`;

    if (processed.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            <i class="ri-checkbox-circle-line" style="font-size: 2rem; color: #10b981; display: block; margin-bottom: 0.5rem;"></i>
            No matching Cash in Hand records found for the selected filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = processed.map(e => {
      const isCleared = e.isCleared || e.remainingAmount === 0;
      const statusBadge = isCleared 
        ? `<span class="badge badge-success" style="background:#dcfce7; color:#15803d; border:1px solid #86efac;"><i class="ri-checkbox-circle-fill"></i> Cleared / Bank Deposited</span>`
        : `<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fcd34d;"><i class="ri-time-line"></i> Cash in Hand (Active)</span>`;

      return `
        <tr style="${isCleared ? 'opacity: 0.75; background: rgba(16, 185, 129, 0.03);' : ''}">
          <td style="text-align: center;">
            <input type="checkbox" class="cash-clearance-checkbox" value="${e.id}" ${isCleared ? 'disabled' : ''} style="width: 18px; height: 18px; cursor: pointer;">
          </td>
          <td>
            <div style="font-weight: 600;">${typeof formatDate === 'function' ? formatDate(e.date) : e.date}</div>
            <small style="color: var(--text-muted);">${e.time || ''}</small>
          </td>
          <td>
            <span class="badge badge-secondary" style="font-size: 0.85rem; font-weight: 700; color: #0284c7; background: #e0f2fe;">
              ${e.invoiceNo ? `Inv #${e.invoiceNo}` : 'No Inv No'}
            </span>
          </td>
          <td style="font-weight: 700;">${e.partyName}</td>
          <td>
            <div>${e.recipientPerson || 'Self / Executive'}</div>
            ${e.remark ? `<small style="color: var(--text-muted);">${e.remark}</small>` : ''}
          </td>
          <td style="font-weight: 700; color: var(--text-main);">${typeof formatBDT === 'function' ? formatBDT(e.originalAmount) : `৳ ${e.originalAmount}`}</td>
          <td style="font-weight: 700; color: #10b981;">
            ${typeof formatBDT === 'function' ? formatBDT(e.clearedAmount) : `৳ ${e.clearedAmount}`}
            ${e.clearMethod ? `<div style="font-size:0.72rem; color:#10b981; font-weight:normal;">${e.clearMethod}</div>` : ''}
          </td>
          <td style="font-weight: 800; color: ${isCleared ? '#10b981' : '#d97706'}; font-size: 1.05rem;">
            ${typeof formatBDT === 'function' ? formatBDT(e.remainingAmount) : `৳ ${e.remainingAmount}`}
            ${isCleared ? '<small style="display:block; font-size:0.72rem; color:#10b981;">(NIL Balance)</small>' : ''}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${isCleared ? `
              <button class="btn btn-secondary btn-sm" onclick="CashClearanceManager.unclearCashEntry('${e.id}')" title="Undo Cash Clearance" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">
                <i class="ri-refresh-line"></i> Undo Clear
              </button>
            ` : `
              <button class="btn btn-success btn-sm" onclick="CashClearanceManager.clearSingleCashEntry('${e.id}')" title="Clear Cash / Mark Deposited to Bank" style="padding: 0.35rem 0.75rem; background: #10b981; border-color: #10b981; color: white; font-weight: 600;">
                <i class="ri-checkbox-circle-line"></i> Clear Cash
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  toggleSelectAllCheckboxes(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.cash-clearance-checkbox:not(:disabled)');
    checkboxes.forEach(cb => {
      cb.checked = masterCheckbox.checked;
    });
  },

  clearSingleCashEntry(id) {
    const allEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    const index = allEntries.findIndex(e => e.id === id);
    if (index === -1) return;

    const entry = allEntries[index];
    const confirmMsg = `Clear Cash in Hand for Invoice #${entry.invoiceNo || 'N/A'} (${entry.partyName}) - Amount: ৳ ${entry.amount}?\n\nThis will mark the cash in hand as deposited/cleared and reduce remaining cash in hand balance to ৳ 0.`;
    
    if (confirm(confirmMsg)) {
      allEntries[index] = {
        ...entry,
        cleared: true,
        clearedAt: new Date().toISOString(),
        clearedAmount: parseFloat(entry.amount) || 0,
        clearedMethod: 'Manual Clearance / Bank Deposit'
      };

      Storage.set(STORAGE_KEYS.DAYBOOK, allEntries);

      if (typeof showToast === 'function') {
        showToast(`Cash in Hand for Inv #${entry.invoiceNo || 'N/A'} marked as Cleared!`, 'success');
      }

      this.renderCashClearanceView();
      if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    }
  },

  unclearCashEntry(id) {
    const allEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    const index = allEntries.findIndex(e => e.id === id);
    if (index === -1) return;

    const entry = allEntries[index];
    if (confirm(`Revert clearance for Invoice #${entry.invoiceNo || 'N/A'} (${entry.partyName})? This will restore the Cash in Hand active balance.`)) {
      allEntries[index] = {
        ...entry,
        cleared: false,
        clearedAt: null,
        clearedAmount: 0,
        clearedMethod: ''
      };

      Storage.set(STORAGE_KEYS.DAYBOOK, allEntries);

      if (typeof showToast === 'function') {
        showToast(`Cash in Hand clearance undone for Inv #${entry.invoiceNo || 'N/A'}`, 'info');
      }

      this.renderCashClearanceView();
      if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    }
  },

  clearSelectedCheckboxes() {
    const selectedCheckboxes = Array.from(document.querySelectorAll('.cash-clearance-checkbox:checked'));
    if (selectedCheckboxes.length === 0) {
      alert("Please select at least one Cash in Hand entry by ticking the checkbox!");
      return;
    }

    const selectedIds = selectedCheckboxes.map(cb => cb.value);

    if (confirm(`Are you sure you want to clear ${selectedIds.length} selected Cash in Hand invoice(s)?`)) {
      const allEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
      let updatedCount = 0;

      allEntries.forEach((entry, i) => {
        if (selectedIds.includes(entry.id)) {
          allEntries[i] = {
            ...entry,
            cleared: true,
            clearedAt: new Date().toISOString(),
            clearedAmount: parseFloat(entry.amount) || 0,
            clearedMethod: 'Batch Clearance / Bank Deposit'
          };
          updatedCount++;
        }
      });

      Storage.set(STORAGE_KEYS.DAYBOOK, allEntries);

      if (typeof showToast === 'function') {
        showToast(`Successfully cleared ${updatedCount} Cash in Hand invoice(s)!`, 'success');
      }

      const masterCb = document.getElementById('cashClearanceMasterCheckbox');
      if (masterCb) masterCb.checked = false;

      this.renderCashClearanceView();
      if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    }
  },

  downloadCashClearancePDF() {
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('cashClearancePanelContent', `Jago_Cash_In_Hand_Clearance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      window.print();
    }
  }
};
