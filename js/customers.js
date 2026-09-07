/* Customers Management Component for Jago Corporation PLC */

const CustomerManager = {
  getCustomers() {
    const customers = Storage.get(STORAGE_KEYS.CUSTOMERS, []);
    return filterRecordsByUserScope(customers, false);
  },

  getAllRawCustomers() {
    return Storage.get(STORAGE_KEYS.CUSTOMERS, []);
  },

  addCustomer(customerData) {
    const rawCustomers = this.getAllRawCustomers();
    const currentUser = SessionManager.getCurrentUser();
    const activeUserId = (currentUser && currentUser.role === 'admin') 
      ? (SessionManager.getAdminScope() === 'ALL' ? 'nazmul' : SessionManager.getAdminScope())
      : (currentUser ? currentUser.userId : 'nazmul');

    const newCustomer = {
      id: "cust-" + Math.random().toString(36).substr(2, 9),
      userId: activeUserId,
      shopName: customerData.shopName.trim(),
      ownerName: customerData.ownerName ? customerData.ownerName.trim() : "",
      address: customerData.address ? customerData.address.trim() : "",
      phone: customerData.phone ? customerData.phone.trim() : "",
      bin: customerData.bin ? customerData.bin.trim() : "",
      nid: customerData.nid ? customerData.nid.trim() : "",
      zone: customerData.zone
    };
    rawCustomers.unshift(newCustomer);
    Storage.set(STORAGE_KEYS.CUSTOMERS, rawCustomers);
    return newCustomer;
  },

  updateCustomer(id, updatedData) {
    const customers = this.getAllRawCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updatedData };
      Storage.set(STORAGE_KEYS.CUSTOMERS, customers);
      return customers[index];
    }
    return null;
  },

  deleteCustomer(id) {
    const cust = this.getCustomerById(id);
    if (!cust) return false;

    const shopName = cust.shopName;

    // 1. Remove customer from storage
    let customers = this.getAllRawCustomers();
    customers = customers.filter(c => c.id !== id);
    Storage.set(STORAGE_KEYS.CUSTOMERS, customers);

    // 2. Cascade delete all daybook entries for this customer
    let daybookEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    daybookEntries = daybookEntries.filter(e => {
      if (!e.partyName) return true;
      return e.partyName.trim().toLowerCase() !== shopName.trim().toLowerCase();
    });
    Storage.set(STORAGE_KEYS.DAYBOOK, daybookEntries);

    // 3. Cascade delete all opening balance logs for this customer
    let obLogs = Storage.get(STORAGE_KEYS.OPENING_BALANCE_LOGS, []);
    obLogs = obLogs.filter(l => l.customerId !== id && l.shopName !== shopName);
    Storage.set(STORAGE_KEYS.OPENING_BALANCE_LOGS, obLogs);

    return true;
  },

  getCustomerById(id) {
    return this.getAllRawCustomers().find(c => c.id === id);
  },

  getOpeningBalanceLogs(customerId = '') {
    const logs = Storage.get(STORAGE_KEYS.OPENING_BALANCE_LOGS, []);
    if (customerId) {
      return logs.filter(l => l.customerId === customerId);
    }
    return logs;
  },

  updateOpeningBalance(customerId, openingBalance, balanceType = 'debit', effectiveDate = '', note = '') {
    const customers = this.getAllRawCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return null;

    const oldBalance = cust.openingBalance || 0;
    const oldType = cust.balanceType || 'debit';
    const newBal = parseFloat(openingBalance) || 0;
    const effDate = effectiveDate || new Date().toISOString().split('T')[0];

    cust.openingBalance = newBal;
    cust.balanceType = balanceType; // 'debit' (Party owes us) or 'credit' (We owe party / advance)
    cust.openingBalanceDate = effDate;
    cust.openingBalanceNote = note;

    Storage.set(STORAGE_KEYS.CUSTOMERS, customers);

    // Save audit log entry
    const logs = this.getOpeningBalanceLogs();
    logs.push({
      id: 'bal-log-' + Math.random().toString(36).substr(2, 9),
      customerId,
      shopName: cust.shopName,
      oldBalance,
      oldType,
      newBalance: newBal,
      newType: balanceType,
      effectiveDate: effDate,
      note: note || 'Opening balance updated',
      updatedAt: new Date().toISOString()
    });
    Storage.set(STORAGE_KEYS.OPENING_BALANCE_LOGS, logs);

    return cust;
  },

  renderCustomerTable(searchTerm = '', zoneFilter = '') {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    let customers = this.getCustomers();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      customers = customers.filter(c => 
        c.shopName.toLowerCase().includes(term) ||
        c.ownerName.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term)
      );
    }

    if (zoneFilter) {
      customers = customers.filter(c => c.zone === zoneFilter);
    }

    if (customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No customers found matching your criteria.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = customers.map(c => {
      const ob = c.openingBalance || 0;
      const obType = c.balanceType === 'credit' ? 'Cr' : 'Dr';
      return `
      <tr>
        <td>
          <div style="font-weight: 700;">${c.shopName}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${c.address || 'No address provided'}</div>
        </td>
        <td>${c.ownerName || '-'}</td>
        <td>
          <div>${c.phone || '-'}</div>
        </td>
        <td>
          <span class="badge badge-primary">${c.zone}</span>
        </td>
        <td>
          <div style="font-weight:600; font-size:0.88rem;">${formatBDT(ob)} (${obType})</div>
          <button class="btn btn-secondary btn-sm" onclick="CustomerManager.openOpeningBalanceModal('${c.id}')" style="padding: 0.2rem 0.4rem; font-size: 0.72rem; margin-top:0.2rem;" title="Edit Opening Balance">
            <i class="ri-edit-line"></i> Edit Balance
          </button>
        </td>
        <td>${c.bin ? `<span class="badge badge-success">BIN: ${c.bin}</span>` : '<span style="color: var(--text-muted);">-</span>'}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="CustomerManager.editCustomerModal('${c.id}')" title="Edit Customer">
            <i class="ri-edit-line"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="CustomerManager.confirmDelete('${c.id}')" title="Delete Customer">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `}).join('');
  },

  openOpeningBalanceModal(id) {
    const cust = this.getCustomerById(id);
    if (!cust) return;

    document.getElementById('obCustId').value = cust.id;
    document.getElementById('obCustName').innerText = cust.shopName;
    document.getElementById('obAmountInput').value = cust.openingBalance || 0;
    document.getElementById('obTypeInput').value = cust.balanceType || 'debit';
    document.getElementById('obDateInput').value = cust.openingBalanceDate || new Date().toISOString().split('T')[0];
    document.getElementById('obNoteInput').value = cust.openingBalanceNote || '';

    this.renderOpeningBalanceHistoryTable(cust.id);
    openModal('openingBalanceModal');
  },

  renderOpeningBalanceHistoryTable(customerId) {
    const tbody = document.getElementById('obHistoryTableBody');
    if (!tbody) return;

    const logs = this.getOpeningBalanceLogs(customerId);
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem;">No opening balance revision history yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${formatDate(l.effectiveDate)}</td>
        <td>${formatBDT(l.oldBalance)} (${l.oldType || 'debit'})</td>
        <td style="font-weight:700; color:var(--primary);">${formatBDT(l.newBalance)} (${l.newType || 'debit'})</td>
        <td style="font-size:0.8rem;">${l.note || '-'}</td>
      </tr>
    `).join('');
  },

  populateZoneDropdowns() {
    const selects = document.querySelectorAll('.dhaka-zone-select');
    selects.forEach(select => {
      const currentValue = select.value;
      const isFilter = select.classList.contains('filter-select');
      
      let optionsHtml = isFilter ? '<option value="">All Zones (Dhaka)</option>' : '<option value="">Select Dhaka Zone</option>';
      optionsHtml += DHAKA_ZONES.map(zone => `<option value="${zone}">${zone}</option>`).join('');
      select.innerHTML = optionsHtml;
      if (currentValue) select.value = currentValue;
    });
  },

  populateCustomerDropdowns() {
    const selects = document.querySelectorAll('.customer-party-select');
    
    // 1. Get explicit customer profiles
    const customerProfiles = this.getCustomers();
    
    // 2. Also get unique party names from DayBook entries to ensure no past customer is missing
    const daybookEntries = Storage.get(STORAGE_KEYS.DAYBOOK, []);
    const userFilteredDaybook = typeof filterRecordsByUserScope === 'function' ? filterRecordsByUserScope(daybookEntries, false) : daybookEntries;
    
    const customerMap = new Map();
    
    customerProfiles.forEach(c => {
      if (c && c.shopName && c.shopName.trim()) {
        const key = c.shopName.trim();
        customerMap.set(key.toLowerCase(), {
          shopName: key,
          zone: c.zone || 'Dhaka'
        });
      }
    });

    userFilteredDaybook.forEach(e => {
      if (e && e.partyName && e.partyName.trim()) {
        const key = e.partyName.trim();
        if (!customerMap.has(key.toLowerCase())) {
          customerMap.set(key.toLowerCase(), {
            shopName: key,
            zone: 'Dhaka'
          });
        }
      }
    });

    const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => 
      a.shopName.localeCompare(b.shopName)
    );

    selects.forEach(select => {
      const currentVal = select.value;
      const isReportSelect = (select.id === 'custReportSelect');
      let html = isReportSelect 
        ? '<option value="ALL">🌐 All Customers (Merged Report)</option>' 
        : '<option value="">Select Customer / Shop Name *</option>';
      
      html += sortedCustomers.map(c => `<option value="${c.shopName}">${c.shopName}${c.zone ? ` (${c.zone})` : ''}</option>`).join('');
      select.innerHTML = html;

      if (currentVal) {
        select.value = currentVal;
      }
    });
  },

  editCustomerModal(id) {
    const customer = this.getCustomerById(id);
    if (!customer) return;

    document.getElementById('modalCustomerTitle').innerText = 'Edit Customer Details';
    document.getElementById('custEditId').value = customer.id;
    document.getElementById('custShopName').value = customer.shopName;
    document.getElementById('custOwnerName').value = customer.ownerName;
    document.getElementById('custAddress').value = customer.address;
    document.getElementById('custPhone').value = customer.phone;
    document.getElementById('custBin').value = customer.bin;
    document.getElementById('custNid').value = customer.nid;
    document.getElementById('custZone').value = customer.zone;

    openModal('customerModal');
  },

  confirmDelete(id) {
    const customer = this.getCustomerById(id);
    if (!customer) return;
    if (confirm(`Are you sure you want to permanently delete party "${customer.shopName}" and ALL their daybook & ledger records?`)) {
      this.deleteCustomer(id);
      this.renderCustomerTable();
      this.populateCustomerDropdowns();

      // Reset ledger select if deleted party was active
      const ledgerSelect = document.getElementById('ledgerCustomerSelect');
      if (ledgerSelect && ledgerSelect.value === customer.shopName) {
        ledgerSelect.value = '';
      }

      refreshCurrentTabContent();
      updateDashboardMetrics();
    }
  },

  confirmDeleteActiveLedgerCustomer(id) {
    this.confirmDelete(id);
  }
};
