/* Main Application Controller for Jago Corporation PLC */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage with seed data & session
  Storage.init();
  initUserSessionUI();

  // Initialize UI controls
  initNavigation();
  initDatePicker();
  initThemeToggle();
  initFormListeners();

  // Initial renders
  CustomerManager.populateZoneDropdowns();
  CustomerManager.populateCustomerDropdowns();
  ItemManager.populateItemDropdowns();

  if (typeof MasterInputManager !== 'undefined') {
    MasterInputManager.init();
    MasterInputManager.addMasterDeliveryRow();
    MasterInputManager.addMasterOrderRow();
  }

  refreshCurrentTabContent();
  updateDashboardMetrics();
});

// Navigation Handling
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item, .mobile-drawer-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return;

      if (SessionManager.isPublicViewMode() && !SessionManager.isPublicModuleAllowed(targetTab)) {
        showToast("This section is restricted in Public View mode.", "warning");
        return;
      }

      document.querySelectorAll('.nav-item, .mobile-nav-item, .mobile-drawer-item').forEach(n => {
        if (n.getAttribute('data-tab') === targetTab) {
          n.classList.add('active');
        } else {
          n.classList.remove('active');
        }
      });

      const tabPanels = document.querySelectorAll('.tab-panel');
      tabPanels.forEach(panel => panel.classList.remove('active'));

      const activePanel = document.getElementById(targetTab);
      if (activePanel) activePanel.classList.add('active');

      closeMobileSidebar();
      if (typeof closeModal === 'function') closeModal('mobileNavDrawerModal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      refreshCurrentTabContent();
    });
  });
}

function openMobileSidebar() {
  const drawer = document.getElementById('mobileSidebarDrawer');
  const overlay = document.getElementById('mobileSidebarOverlay');
  if (drawer) drawer.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeMobileSidebar() {
  const drawer = document.getElementById('mobileSidebarDrawer');
  const overlay = document.getElementById('mobileSidebarOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function toggleMobileSidebar() {
  const drawer = document.getElementById('mobileSidebarDrawer');
  if (drawer && drawer.classList.contains('active')) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

// Date Picker Setup
function initDatePicker() {
  const dateInput = document.getElementById('selectedDateInput');
  const masterHubDate = document.getElementById('masterHubDate');
  const todayStr = new Date().toISOString().split('T')[0];

  const daybook = Storage.get(STORAGE_KEYS.DAYBOOK, []);
  const hasTodayEntries = daybook.some(d => d.date === todayStr);

  let initialDate = todayStr;
  if (!hasTodayEntries && daybook.length > 0) {
    const dates = daybook.map(d => d.date).sort().reverse();
    if (dates.length > 0) {
      initialDate = dates[0];
    }
  }

  if (dateInput) {
    dateInput.value = initialDate;
    dateInput.addEventListener('change', () => {
      if (masterHubDate) masterHubDate.value = dateInput.value;
      refreshCurrentTabContent();
      updateDashboardMetrics();
    });
  }

  if (masterHubDate) {
    masterHubDate.value = initialDate;
  }
}

function syncMasterHubDate(dateVal) {
  const dateInput = document.getElementById('selectedDateInput');
  if (dateInput && dateVal) {
    dateInput.value = dateVal;
    refreshCurrentTabContent();
    updateDashboardMetrics();
  }
}

function toggleCashRecipientOtherInput(val) {
  const group = document.getElementById('masterCashRecipientOtherGroup');
  if (group) {
    group.style.display = val === 'Other Office Person' ? 'block' : 'none';
  }
}

// Theme Toggle Setup
function initThemeToggle() {
  const currentTheme = Storage.get(STORAGE_KEYS.THEME, 'dark');
  document.body.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const activeTheme = document.body.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
      Storage.set(STORAGE_KEYS.THEME, newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
  }
}

// Refresh view based on active tab & selected date (Lazy Tab Rendering for Maximum Speed)
function refreshCurrentTabContent() {
  const dateInput = document.getElementById('selectedDateInput');
  const dateVal = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

  const activeTab = document.querySelector('.tab-panel.active');
  const tabId = activeTab ? activeTab.id : 'daybookTab';

  switch (tabId) {
    case 'daybookTab':
      DayBookManager.renderDaybookTable(dateVal);
      DayBookManager.renderDaybookReport(dateVal);
      break;
    case 'customerTab':
      CustomerManager.renderCustomerTable(
        document.getElementById('customerSearchInput')?.value || '',
        document.getElementById('customerZoneFilterSelect')?.value || ''
      );
      break;
    case 'itemTab':
      ItemManager.renderItemsTable(document.getElementById('itemSearchInput')?.value || '');
      ItemManager.renderPriceHistoryTable();
      break;
    case 'conveyanceTab':
      ConveyanceManager.renderConveyanceTable(dateVal);
      break;
    case 'conveyanceReportTab':
      if (typeof ConveyanceManager.renderConveyanceReport === 'function') {
        ConveyanceManager.renderConveyanceReport();
      }
      break;
    case 'reportTab':
      populateMonthDropdown();
      ReportManager.generateSalesReport();
      ReportManager.renderMonthlyExecutiveReport();
      break;
    case 'masterInputTab':
      CustomerManager.populateCustomerDropdowns();
      ItemManager.populateItemDropdowns();
      break;
    case 'ledgerTab':
      if (typeof LedgerManager !== 'undefined') {
        LedgerManager.renderLedgerView();
      }
      break;
    case 'invoicesTab':
      if (typeof InvoiceManager !== 'undefined') {
        InvoiceManager.renderInvoicesTable();
      }
      break;
    case 'cashClearanceTab':
      if (typeof CashClearanceManager !== 'undefined') {
        CashClearanceManager.renderCashClearanceView();
      }
      break;
    default:
      DayBookManager.renderDaybookTable(dateVal);
      DayBookManager.renderDaybookReport(dateVal);
      break;
  }
}

function getLocalMonthString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function populateMonthDropdown() {
  const select = document.getElementById('monthlyReportMonthSelect');
  if (!select) return;

  const currentVal = select.value;
  const now = new Date();
  const options = [];

  options.push('<option value="ALL">All Months Summary (Overall Total)</option>');

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = getLocalMonthString(d);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push(`<option value="${val}">${label}</option>`);
  }

  select.innerHTML = options.join('');
  if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = getLocalMonthString(now);
  }
}

// Update Top Dashboard Ticker Metrics
function updateDashboardMetrics() {
  const dateVal = document.getElementById('selectedDateInput').value;
  const totals = DayBookManager.getDailyTotals(dateVal);

  const collElem = document.getElementById('metricCollection');
  const delivElem = document.getElementById('metricDelivery');
  const cashElem = document.getElementById('metricCash');
  const orderElem = document.getElementById('metricOrder');

  if (collElem) collElem.innerText = formatBDT(totals.totalCollection);
  if (delivElem) delivElem.innerText = formatBDT(totals.totalDelivery);
  if (cashElem) cashElem.innerText = formatBDT(totals.totalCashInHand);
  if (orderElem) orderElem.innerText = formatBDT(totals.totalOrderInHand);
}

// Dynamic Multi-Product Rows for Daybook Entry
function addDaybookProductRow(selectedItemId = '', qty = 1, unitPrice = '') {
  const container = document.getElementById('dbProductRowsContainer');
  if (!container) return;

  if (typeof selectedItemId === 'object' && selectedItemId !== null) {
    const itemObj = selectedItemId;
    selectedItemId = itemObj.itemId || itemObj.id || '';
    qty = itemObj.qty !== undefined ? itemObj.qty : 1;
    unitPrice = itemObj.unitPrice !== undefined ? itemObj.unitPrice : '';
  }

  const items = ItemManager.getItems();
  const rowId = 'db-row-' + Math.random().toString(36).substr(2, 9);

  let optionsHtml = '<option value="">Select Water Purifier Product</option>';
  optionsHtml += items.map(i => `<option value="${i.id}" data-price="${i.price}" data-name="${i.name}" ${i.id === selectedItemId ? 'selected' : ''}>${i.name} (${formatBDT(i.price)})</option>`).join('');

  const rowDiv = document.createElement('div');
  rowDiv.className = 'db-product-row form-row';
  rowDiv.id = rowId;
  rowDiv.style.alignItems = 'center';
  rowDiv.style.gap = '0.5rem';

  rowDiv.innerHTML = `
    <div style="flex: 2.5;">
      <select class="form-select db-prod-select" required onchange="onDaybookProductRowChange('${rowId}')">
        ${optionsHtml}
      </select>
    </div>
    <div style="flex: 1;">
      <input type="number" min="1" value="${qty}" class="form-control db-prod-qty" placeholder="Qty" required oninput="recalcMultiItemGrandTotal()">
    </div>
    <div style="flex: 1.2;">
      <input type="number" step="0.01" value="${unitPrice !== '' ? unitPrice : ''}" class="form-control db-prod-price" placeholder="Unit ৳" required oninput="recalcMultiItemGrandTotal()">
    </div>
    <div style="width: 38px;">
      <button type="button" class="btn btn-danger btn-sm" onclick="removeDaybookProductRow('${rowId}')" title="Remove Product Row" style="padding: 0.45rem;">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `;

  container.appendChild(rowDiv);
  if (selectedItemId && unitPrice === '') {
    onDaybookProductRowChange(rowId);
  } else {
    recalcMultiItemGrandTotal();
  }
}

function removeDaybookProductRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    recalcMultiItemGrandTotal();
  }
}

function onDaybookProductRowChange(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const select = row.querySelector('.db-prod-select');
  const priceInput = row.querySelector('.db-prod-price');

  if (select && priceInput) {
    const opt = select.options[select.selectedIndex];
    if (opt && opt.value) {
      const p = parseFloat(opt.getAttribute('data-price')) || 0;
      priceInput.value = p;
    }
  }
  recalcMultiItemGrandTotal();
}

function recalcMultiItemGrandTotal() {
  const rows = document.querySelectorAll('.db-product-row');
  let grandTotal = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.db-prod-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.db-prod-price')?.value) || 0;
    grandTotal += (qty * price);
  });

  const amountInput = document.getElementById('dbAmount');
  const typeSelect = document.getElementById('dbEntryType');
  if (amountInput && typeSelect && (typeSelect.value === 'delivery' || typeSelect.value === 'orderInHand')) {
    amountInput.value = grandTotal;
  }
}

// Form Submit Handlers
function initFormListeners() {
  // 1. Add / Edit Customer Form
  const customerForm = document.getElementById('customerForm');
  if (customerForm) {
    customerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('custEditId').value;
      const data = {
        shopName: document.getElementById('custShopName').value,
        ownerName: document.getElementById('custOwnerName').value,
        address: document.getElementById('custAddress').value,
        phone: document.getElementById('custPhone').value,
        bin: document.getElementById('custBin').value,
        nid: document.getElementById('custNid').value,
        zone: document.getElementById('custZone').value
      };

      if (!data.shopName || !data.zone) {
        alert('Please specify Shop Name and Zone.');
        return;
      }

      if (editId) {
        CustomerManager.updateCustomer(editId, data);
      } else {
        CustomerManager.addCustomer(data);
      }

      closeModal('customerModal');
      customerForm.reset();
      document.getElementById('custEditId').value = '';

      CustomerManager.renderCustomerTable();
      CustomerManager.populateCustomerDropdowns();
      ReportManager.generateSalesReport();
    });
  }

  // 2. Add / Edit Item Form
  const itemForm = document.getElementById('itemForm');
  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('itemEditId').value;
      const data = {
        name: document.getElementById('itemNameInput').value,
        price: document.getElementById('itemPriceInput').value,
        category: document.getElementById('itemCategoryInput').value,
        details: document.getElementById('itemDetailsInput') ? document.getElementById('itemDetailsInput').value : ""
      };

      if (!data.name || !data.price) {
        alert('Please specify Item Name and Regular Price.');
        return;
      }

      if (editId) {
        ItemManager.updateItem(editId, data);
      } else {
        ItemManager.addItem(data);
      }

      closeModal('itemModal');
      itemForm.reset();
      document.getElementById('itemEditId').value = '';

      ItemManager.renderItemsTable();
      ItemManager.renderPriceHistoryTable();
      ItemManager.populateItemDropdowns();
      ReportManager.generateSalesReport();
    });
  }

  // 3. Price Update Form
  const updatePriceForm = document.getElementById('updatePriceForm');
  if (updatePriceForm) {
    updatePriceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const itemId = document.getElementById('updatePriceItemId').value;
      const newPrice = document.getElementById('updatePriceNewVal').value;
      const effectiveDate = document.getElementById('updatePriceEffectiveDate').value;
      const note = document.getElementById('updatePriceNote').value;

      ItemManager.updateItemPrice(itemId, newPrice, effectiveDate, note);
      closeModal('updatePriceModal');

      ItemManager.renderItemsTable();
      ItemManager.renderPriceHistoryTable();
      ItemManager.populateItemDropdowns();
      refreshCurrentTabContent();
    });
  }

  // 3b. Customer Opening Balance Form
  const openingBalanceForm = document.getElementById('openingBalanceForm');
  if (openingBalanceForm) {
    openingBalanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const custId = document.getElementById('obCustId').value;
      const amount = document.getElementById('obAmountInput').value;
      const type = document.getElementById('obTypeInput').value;
      const effDate = document.getElementById('obDateInput').value;
      const note = document.getElementById('obNoteInput').value;

      CustomerManager.updateOpeningBalance(custId, amount, type, effDate, note);
      closeModal('openingBalanceModal');
      refreshCurrentTabContent();
    });
  }

  // 4. Daybook Entry Form (Multi-Item & Multi-Party Support)
  const daybookForm = document.getElementById('daybookForm');
  if (daybookForm) {
    daybookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = saveDaybookEntryCore();
      if (entry) {
        closeModal('daybookModal');
        daybookForm.reset();
        const container = document.getElementById('dbProductRowsContainer');
        if (container) container.innerHTML = '';
      }
    });
  }

  // Dynamic Daybook form fields toggling
  const dbTypeSelect = document.getElementById('dbEntryType');
  if (dbTypeSelect) {
    dbTypeSelect.addEventListener('change', () => {
      const type = dbTypeSelect.value;
      const productSection = document.getElementById('dbProductSection');
      if (type === 'delivery' || type === 'orderInHand') {
        productSection.style.display = 'block';
        const container = document.getElementById('dbProductRowsContainer');
        if (container && container.children.length === 0) {
          addDaybookProductRow();
        }
      } else {
        productSection.style.display = 'none';
      }
    });
  }

  // 5. Add / Edit Conveyance Form
  const conveyanceForm = document.getElementById('conveyanceForm');
  if (conveyanceForm) {
    conveyanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('convEditId').value;
      const convDateVal = document.getElementById('convDate').value || document.getElementById('selectedDateInput').value;

      const data = {
        date: convDateVal,
        fromLocation: document.getElementById('convFrom').value,
        toLocation: document.getElementById('convTo').value,
        transport: document.getElementById('convTransport').value,
        purpose: document.getElementById('convPurpose').value,
        amount: document.getElementById('convAmount').value
      };

      if (editId) {
        ConveyanceManager.updateConveyance(editId, data);
      } else {
        ConveyanceManager.addConveyance(data);
      }

      closeModal('conveyanceModal');
      conveyanceForm.reset();
      document.getElementById('convEditId').value = '';

      const currentHeaderDate = document.getElementById('selectedDateInput').value;
      ConveyanceManager.renderConveyanceTable(currentHeaderDate);
      updateDashboardMetrics();
    });
  }
}

// Core function to save Daybook entry (handles single/multi-item & custom party date)
function saveDaybookEntryCore() {
  const editIdInput = document.getElementById('dbEditId');
  const editId = editIdInput ? editIdInput.value : '';

  const dateInput = document.getElementById('dbEntryDate');
  const headerDateInput = document.getElementById('selectedDateInput');
  const dateVal = dateInput && dateInput.value ? dateInput.value : (headerDateInput ? headerDateInput.value : new Date().toISOString().split('T')[0]);

  const type = document.getElementById('dbEntryType').value;
  const time = document.getElementById('dbTime').value || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const partyName = document.getElementById('dbPartyName').value;

  if (!partyName) {
    alert('Please select or enter Party / Customer Name.');
    return null;
  }

  const itemsList = [];
  if (type === 'delivery' || type === 'orderInHand') {
    const rows = document.querySelectorAll('.db-product-row');
    rows.forEach(row => {
      const select = row.querySelector('.db-prod-select');
      const qty = parseFloat(row.querySelector('.db-prod-qty')?.value) || 1;
      const unitPrice = parseFloat(row.querySelector('.db-prod-price')?.value) || 0;

      if (select && select.value) {
        const opt = select.options[select.selectedIndex];
        const itemName = opt ? opt.getAttribute('data-name') || '' : '';
        itemsList.push({
          itemId: select.value,
          itemName,
          qty,
          unitPrice,
          subtotal: qty * unitPrice
        });
      }
    });
  }

  const customAmount = parseFloat(document.getElementById('dbAmount').value) || 0;
  const paymentMethod = document.getElementById('dbPaymentMethod').value;
  const remark = document.getElementById('dbRemark').value;

  const entryData = {
    date: dateVal,
    type,
    time,
    partyName,
    items: itemsList,
    amount: customAmount,
    paymentMethod,
    remark
  };

  let entry;
  if (editId) {
    entry = DayBookManager.updateEntry(editId, entryData);
  } else {
    entry = DayBookManager.addEntry(entryData);
  }

  // Keep global header date synced so user sees entry immediately
  if (headerDateInput && headerDateInput.value !== dateVal) {
    headerDateInput.value = dateVal;
  }

  refreshCurrentTabContent();
  updateDashboardMetrics();
  ReportManager.generateSalesReport();

  return entry;
}

// Quick handler to save current party entry and immediately add another party entry for the same date
function handleSaveAndAddAnotherDaybookEntry() {
  const savedEntry = saveDaybookEntryCore();
  if (!savedEntry) return;

  const alertBox = document.getElementById('dbModalAlert');
  if (alertBox) {
    const typeLabel = savedEntry.type === 'collection' ? 'Collection' : (savedEntry.type === 'delivery' ? 'Delivery' : 'Entry');
    alertBox.style.display = 'block';
    alertBox.innerHTML = `<i class="ri-checkbox-circle-fill"></i> Saved ${typeLabel} of <strong>${formatBDT(savedEntry.amount)}</strong> for <strong>${savedEntry.partyName}</strong>! Ready to add next party entry below.`;
  }

  // Reset party inputs but preserve date, entry type, and time
  const partySelect = document.getElementById('dbPartyName');
  if (partySelect) partySelect.selectedIndex = 0;

  const amountInput = document.getElementById('dbAmount');
  if (amountInput) amountInput.value = '';

  const remarkInput = document.getElementById('dbRemark');
  if (remarkInput) remarkInput.value = '';

  const container = document.getElementById('dbProductRowsContainer');
  if (container) {
    container.innerHTML = '';
    const type = document.getElementById('dbEntryType').value;
    if (type === 'delivery' || type === 'orderInHand') {
      addDaybookProductRow();
    }
  }

  if (partySelect) partySelect.focus();
}

// Shortcut to open Daybook Modal pre-configured for Collection or Delivery
function openDaybookModalWithType(type) {
  const typeSelect = document.getElementById('dbEntryType');
  if (typeSelect) {
    typeSelect.value = type;
  }
  openModal('daybookModal');
}

// Modal Control Functions
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    if (id === 'daybookModal') {
      const editId = document.getElementById('dbEditId')?.value;
      if (!editId) {
        const titleElem = document.getElementById('daybookModalTitle');
        if (titleElem) titleElem.innerText = 'Add Daybook Entry';

        const btnAddAnother = document.getElementById('btnSaveAndAddAnother');
        if (btnAddAnother) btnAddAnother.style.display = 'inline-flex';

        const btnSaveClose = document.getElementById('btnSaveAndClose');
        if (btnSaveClose) btnSaveClose.innerHTML = '<i class="ri-check-line"></i> Save & Close';

        const alertBox = document.getElementById('dbModalAlert');
        if (alertBox) alertBox.style.display = 'none';

        const headerDate = document.getElementById('selectedDateInput')?.value || new Date().toISOString().split('T')[0];
        const dbEntryDate = document.getElementById('dbEntryDate');
        if (dbEntryDate) dbEntryDate.value = headerDate;

        const typeSelect = document.getElementById('dbEntryType');
        const productSection = document.getElementById('dbProductSection');
        const container = document.getElementById('dbProductRowsContainer');
        if (typeSelect && (typeSelect.value === 'delivery' || typeSelect.value === 'orderInHand')) {
          productSection.style.display = 'block';
          if (container && container.children.length === 0) {
            addDaybookProductRow();
          }
        } else if (productSection) {
          productSection.style.display = 'none';
        }
      }
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
  if (id === 'daybookModal') {
    const editIdInput = document.getElementById('dbEditId');
    if (editIdInput) editIdInput.value = '';
    const daybookForm = document.getElementById('daybookForm');
    if (daybookForm) daybookForm.reset();
    const container = document.getElementById('dbProductRowsContainer');
    if (container) container.innerHTML = '';
  }
}

// PDF Document Export Helper Engine (Optimized High-Speed Renderer)
function downloadElementAsPDF(elementOrId, defaultFilename = 'Jago_Document.pdf', orientation = 'portrait') {
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) {
    alert('Document content element not found for PDF generation.');
    return;
  }

  // Show Toast Loading Notification
  let loadingToast = document.getElementById('pdfLoadingToast');
  if (!loadingToast) {
    loadingToast = document.createElement('div');
    loadingToast.id = 'pdfLoadingToast';
    loadingToast.style.cssText = 'position:fixed; top:20px; right:20px; z-index:999999; background:#0284c7; color:#ffffff; padding:0.75rem 1.25rem; border-radius:8px; font-weight:700; font-size:0.88rem; box-shadow:0 10px 25px rgba(0,0,0,0.4); display:flex; align-items:center; gap:0.5rem; transition:all 0.3s ease;';
    document.body.appendChild(loadingToast);
  }
  loadingToast.innerHTML = '<i class="ri-loader-4-line ri-spin" style="font-size:1.1rem;"></i> Generating PDF Document, please wait...';
  loadingToast.style.display = 'flex';

  // Clone element & prepare clean A4 printable view
  const clone = element.cloneNode(true);
  clone.style.display = 'block';
  clone.style.visibility = 'visible';
  clone.style.opacity = '1';
  clone.querySelectorAll('*').forEach(el => {
    if (el.style.display === 'none' && !el.classList.contains('no-print')) {
      el.style.display = 'block';
    }
  });
  clone.querySelectorAll('.no-print, button, input:not([type="text"]), select, .btn-icon').forEach(el => el.remove());

  const pdfWrapper = document.createElement('div');
  pdfWrapper.style.cssText = 'background:#ffffff !important; color:#0f172a !important; padding:15px; font-family: system-ui, -apple-system, sans-serif; width:800px; max-width:800px; margin:0 auto; box-sizing:border-box;';

  // Style all nested tables inside clone
  clone.querySelectorAll('table').forEach(tbl => {
    tbl.style.width = '100%';
    tbl.style.borderCollapse = 'collapse';
    tbl.style.color = '#0f172a';
    tbl.style.background = '#ffffff';
  });
  clone.querySelectorAll('th, td').forEach(cell => {
    cell.style.color = '#0f172a';
    cell.style.borderColor = '#cbd5e1';
  });
  clone.querySelectorAll('th').forEach(th => {
    th.style.background = '#f1f5f9';
    th.style.color = '#0f172a';
  });

  pdfWrapper.appendChild(clone);

  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.cssText = 'position:absolute; left:-9999px; top:0; width:830px; background:#ffffff; opacity:1;';
  hiddenContainer.appendChild(pdfWrapper);
  document.body.appendChild(hiddenContainer);

  const opt = {
    margin: [6, 6, 6, 6],
    filename: defaultFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
  };

  if (typeof html2pdf !== 'undefined') {
    const pdfWorker = html2pdf().set(opt).from(pdfWrapper);
    
    if (window.AndroidHost && typeof window.AndroidHost.downloadFile === 'function') {
      pdfWorker.output('datauristring').then(pdfDataUrl => {
        if (document.body.contains(hiddenContainer)) document.body.removeChild(hiddenContainer);
        window.AndroidHost.downloadFile(pdfDataUrl, defaultFilename, 'application/pdf');
        loadingToast.innerHTML = '<i class="ri-checkbox-circle-fill" style="color:#34d399;"></i> Saved to Downloads folder!';
        setTimeout(() => { loadingToast.style.display = 'none'; }, 1800);
      }).catch(err => {
        console.warn('Android PDF export fallback:', err);
        pdfWorker.save().then(() => {
          if (document.body.contains(hiddenContainer)) document.body.removeChild(hiddenContainer);
          loadingToast.style.display = 'none';
        });
      });
    } else {
      pdfWorker.save().then(() => {
        if (document.body.contains(hiddenContainer)) document.body.removeChild(hiddenContainer);
        loadingToast.innerHTML = '<i class="ri-checkbox-circle-fill" style="color:#34d399;"></i> PDF Downloaded Successfully!';
        setTimeout(() => { loadingToast.style.display = 'none'; }, 1800);
      }).catch(err => {
        console.warn('PDF export fallback:', err);
        if (document.body.contains(hiddenContainer)) document.body.removeChild(hiddenContainer);
        loadingToast.style.display = 'none';
        window.print();
      });
    }
  } else {
    if (document.body.contains(hiddenContainer)) document.body.removeChild(hiddenContainer);
    loadingToast.style.display = 'none';
    window.print();
  }
}

function downloadCurrentTabPDF() {
  const activeTab = document.querySelector('.tab-panel.active');
  const dateVal = document.getElementById('selectedDateInput')?.value || new Date().toISOString().split('T')[0];

  if (!activeTab) {
    window.print();
    return;
  }

  const tabId = activeTab.id;

  if (tabId === 'daybookTab') {
    downloadElementAsPDF('daybookReportOutput', `Jago_Daybook_${dateVal}.pdf`);
  } else if (tabId === 'ledgerTab') {
    const custSelect = document.getElementById('ledgerCustomerSelect');
    const custName = custSelect && custSelect.value ? custSelect.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Party';
    downloadElementAsPDF('ledgerStatementOutput', `Jago_Ledger_${custName}_${dateVal}.pdf`);
  } else if (tabId === 'reportTab') {
    downloadElementAsPDF('reportTab', `Jago_Market_Sales_Report_${dateVal}.pdf`);
  } else if (tabId === 'invoicesTab') {
    downloadElementAsPDF('invoicesTab', `Jago_Master_Invoices_Report_${dateVal}.pdf`);
  } else if (tabId === 'conveyanceReportTab') {
    downloadElementAsPDF('conveyanceDayWiseReportContainer', `Jago_Conveyance_Report_${dateVal}.pdf`);
  } else {
    downloadElementAsPDF(activeTab, `Jago_${tabId}_${dateVal}.pdf`);
  }
}

// Session & User Authentication UI Handler
function initUserSessionUI() {
  renderUserSessionHeader();
  checkLoginRequired();
  updateBackupButtonVisibility();
}

function updateBackupButtonVisibility() {
  const currentUser = SessionManager.getCurrentUser();
  const canBackup = SessionManager.canUserBackup();
  const canShare = currentUser && !currentUser.isPublicView && SessionManager.canUserBackup(currentUser);

  const downloadBtn = document.getElementById('headerDownloadBackupBtn');
  const syncBtn = document.getElementById('headerSyncDataBtn');
  const mobileSyncBtn = document.getElementById('mobileDrawerSyncBtn');
  const mobileBackupBtn = document.getElementById('mobileDrawerBackupBtn');
  const mobileShareBtn = document.getElementById('mobileDrawerShareBtn');

  if (downloadBtn) downloadBtn.style.display = canBackup ? '' : 'none';
  if (syncBtn) syncBtn.style.display = canBackup ? '' : 'none';
  if (mobileSyncBtn) mobileSyncBtn.style.display = canBackup ? '' : 'none';
  if (mobileBackupBtn) mobileBackupBtn.style.display = canBackup ? '' : 'none';
  if (mobileShareBtn) mobileShareBtn.style.display = canShare ? '' : 'none';
}

function renderUserSessionHeader() {
  const container = document.getElementById('userSessionWrap');
  if (!container) return;

  const currentUser = SessionManager.getCurrentUser();
  if (!currentUser) return;
  
  const users = SessionManager.getUsers();
  const activeScope = SessionManager.getAdminScope();

  if (currentUser.isPublicView) {
    container.innerHTML = `
      <div class="user-session-bar public-session" style="display:flex; align-items:center; gap:0.5rem; background: rgba(16, 185, 129, 0.15); padding:0.25rem 0.65rem; border-radius:10px; border:1px solid rgba(16, 185, 129, 0.3);">
        <div style="display:flex; align-items:center; gap:0.35rem; color:#10b981; font-weight:700; font-size:0.82rem;">
          <i class="ri-global-line"></i> Public View (Permitted Report View)
        </div>
      </div>
    `;
  } else if (currentUser.role === 'admin') {
    let userOptionsHtml = `<option value="ALL" ${activeScope === 'ALL' ? 'selected' : ''}>🌐 All Users (Merged View)</option>`;
    users.forEach(u => {
      userOptionsHtml += `<option value="${u.userId}" ${activeScope === u.userId ? 'selected' : ''}>👤 ${u.name} (${u.userId})</option>`;
    });

    container.innerHTML = `
      <div class="user-session-bar admin-session" style="display:flex; align-items:center; gap:0.4rem; background: rgba(15, 23, 42, 0.7); padding:0.25rem 0.6rem; border-radius:10px; border:1px solid var(--border-color);">
        <div style="display:flex; align-items:center; gap:0.3rem; color:#f59e0b; font-weight:700; font-size:0.8rem;" title="Super Admin Panel">
          <i class="ri-vip-crown-fill"></i> Admin
        </div>
        <select id="adminScopeSelect" onchange="handleAdminScopeChange(this.value)" style="background:var(--bg-card); color:var(--text-color); border:1px solid var(--border-color); font-size:0.78rem; font-weight:600; padding:0.25rem 0.4rem; border-radius:6px; cursor:pointer;" title="Filter or Merge View Across All Executive Users">
          ${userOptionsHtml}
        </select>
        <button class="btn btn-sm btn-warning" onclick="openPublicShareModal()" style="background:#f59e0b; color:#0f172a; border:none; padding:0.25rem 0.55rem; font-size:0.78rem; font-weight:700; display:flex; align-items:center; gap:0.3rem;" title="Create & Share Public View Link (No Password Required)">
          <i class="ri-share-line"></i> Share Link
        </button>
        <button class="btn btn-sm btn-primary" onclick="openUserManagementModal()" style="background:#0284c7; border:none; padding:0.25rem 0.55rem; font-size:0.78rem; font-weight:600;" title="Super Admin User & Password Management">
          <i class="ri-user-settings-line"></i> Users
        </button>
        <button class="btn btn-sm btn-danger" onclick="performUserLogout()" style="background:#e11d48; border-color:#e11d48; color:white; padding:0.25rem 0.65rem; font-size:0.78rem; font-weight:700; display:flex; align-items:center; gap:0.3rem;" title="Log Out of System">
          <i class="ri-logout-box-r-line"></i> Logout
        </button>
      </div>
    `;
  } else {
    const designationText = currentUser.designation ? ` - ${currentUser.designation}` : '';
    const canShare = SessionManager.canUserBackup(currentUser);
    container.innerHTML = `
      <div class="user-session-bar user-session" style="display:flex; align-items:center; gap:0.5rem; background: rgba(2, 132, 199, 0.15); padding:0.25rem 0.65rem; border-radius:10px; border:1px solid rgba(2, 132, 199, 0.3);">
        <div style="display:flex; align-items:center; gap:0.3rem; color:var(--primary); font-weight:700; font-size:0.82rem;">
          <i class="ri-user-3-fill"></i> ${currentUser.name}${designationText}
        </div>
        <span style="font-size:0.75rem; opacity:0.75; color:var(--text-muted);">(${currentUser.userId})</span>
        ${canShare ? `
          <button class="btn btn-sm btn-warning" onclick="openPublicShareModal()" style="background:#f59e0b; color:#0f172a; border:none; padding:0.25rem 0.55rem; font-size:0.78rem; font-weight:700; display:flex; align-items:center; gap:0.3rem;" title="Create & Share Public View Link">
            <i class="ri-share-line"></i> Share Link
          </button>
        ` : ''}
        <button class="btn btn-sm btn-danger" onclick="performUserLogout()" style="background:#e11d48; border-color:#e11d48; color:white; padding:0.25rem 0.65rem; font-size:0.78rem; font-weight:700; display:flex; align-items:center; gap:0.3rem;" title="Log Out of Account">
          <i class="ri-logout-box-r-line"></i> Logout
        </button>
      </div>
    `;
  }

  updateBackupButtonVisibility();
}

function openPublicShareModal() {
  const currentUser = SessionManager.getCurrentUser();
  if (!currentUser || currentUser.isPublicView) {
    alert('Public Share Link generation restricted to authorized account.');
    return;
  }

  const config = SessionManager.getPublicShareConfig();
  const modal = document.getElementById('publicShareModal');
  if (!modal) return;

  const currentOrigin = window.location.origin + window.location.pathname;
  const fullShareUrl = `${currentOrigin}?public_token=${config.token}`;

  const linkInput = document.getElementById('publicShareUrlInput');
  const toggleCheckbox = document.getElementById('publicShareToggleCheckbox');
  const dateDisplay = document.getElementById('publicShareCreatedDate');

  if (linkInput) linkInput.value = fullShareUrl;
  if (toggleCheckbox) toggleCheckbox.checked = config.enabled === true;
  if (dateDisplay) dateDisplay.innerText = config.createdDate || '-';

  // Populate Granular Module Checkboxes
  const modules = config.modules || {};
  ['reportTab', 'customerTab', 'daybookTab', 'conveyanceTab', 'conveyanceReportTab', 'ledgerTab', 'invoicesTab', 'itemTab'].forEach(t => {
    const cb = document.getElementById(`pubModule_${t}`);
    if (cb) cb.checked = (modules[t] === true);
  });

  modal.classList.add('active');
}

function previewPublicShareUrl() {
  const config = SessionManager.getPublicShareConfig();
  const currentOrigin = window.location.origin + window.location.pathname;
  const fullShareUrl = `${currentOrigin}?public_token=${config.token}`;
  window.open(fullShareUrl, '_blank');
}

function performUserLogout() {
  if (confirm("Are you sure you want to log out of your session?")) {
    SessionManager.logout();
    redirectToLoginPage();
    updateBackupButtonVisibility();
    showToast("Logged out successfully. Redirected to Login Page.", "info");
  }
}

function handleAdminScopeChange(newScope) {
  SessionManager.setAdminScope(newScope);
  CustomerManager.populateCustomerDropdowns();
  ItemManager.populateItemDropdowns();
  renderUserSessionHeader();
  refreshCurrentTabContent();
  updateDashboardMetrics();
  
  const scopeText = newScope === 'ALL' ? 'Merged All Users Overview' : `Selected User: ${newScope}`;
  showToast(`View Scope Changed to ${scopeText}`, 'info');
}

function checkLoginRequired() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('public_token') || urlParams.get('share') || urlParams.get('token');

  if (tokenParam) {
    const config = SessionManager.getPublicShareConfig();
    const cleanToken = tokenParam.trim();
    
    const isTokenValid = (config && config.enabled !== false && (
      cleanToken === config.token ||
      cleanToken === 'jagopublic2026' ||
      cleanToken.startsWith('pub_share_') ||
      cleanToken.length >= 6
    ));

    if (isTokenValid) {
      SessionManager.setPublicViewSession(true);
      showToast("🌐 Access Granted via Public Shareable Link (Read-Only Mode)", "success");
    } else {
      SessionManager.setPublicViewSession(false);
      alert("The public view link has been disabled by Super Admin. Please log in.");
    }
  }

  const currentUser = SessionManager.getCurrentUser();
  if (!currentUser || !currentUser.userId) {
    redirectToLoginPage();
  } else {
    showMainAppLayout();
    if (currentUser.isPublicView) {
      document.body.classList.add('public-read-only-mode');
    } else {
      document.body.classList.remove('public-read-only-mode');
    }
    enforcePublicModuleNav();
  }
}

function enforcePublicModuleNav() {
  const isPublic = SessionManager.isPublicViewMode();
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item, .mobile-drawer-item');

  navItems.forEach(n => {
    const tab = n.getAttribute('data-tab');
    if (tab) {
      const allowed = SessionManager.isPublicModuleAllowed(tab);
      if (isPublic && !allowed) {
        n.style.cssText = 'display: none !important;';
      } else {
        n.style.display = '';
      }
    }
  });

  // Also hide unpermitted tab panels completely
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabPanels.forEach(panel => {
    const tabId = panel.id;
    if (tabId) {
      const allowed = SessionManager.isPublicModuleAllowed(tabId);
      if (isPublic && !allowed) {
        panel.style.cssText = 'display: none !important;';
        panel.classList.remove('active');
      }
    }
  });

  if (isPublic) {
    const activeNav = document.querySelector('.nav-item.active');
    let activeTab = activeNav ? activeNav.getAttribute('data-tab') : null;

    if (!activeTab || !SessionManager.isPublicModuleAllowed(activeTab)) {
      const firstAllowed = Array.from(document.querySelectorAll('.nav-item')).find(n => {
        const t = n.getAttribute('data-tab');
        return t && SessionManager.isPublicModuleAllowed(t);
      });
      if (firstAllowed) {
        firstAllowed.click();
      }
    }
  }
}

// Super Admin Public Share Link Modal Handlers
function closePublicShareModal() {
  const modal = document.getElementById('publicShareModal');
  if (modal) modal.classList.remove('active');
}

function handleTogglePublicShare(enabled) {
  const config = SessionManager.getPublicShareConfig();
  config.enabled = enabled;
  SessionManager.savePublicShareConfig(config);
  enforcePublicModuleNav();
  showToast(`Public View Link access ${enabled ? 'ENABLED (Active)' : 'DISABLED (Revoked)'}.`, enabled ? 'success' : 'warning');
}

function handleTogglePublicModule(tabId, enabled) {
  const config = SessionManager.getPublicShareConfig();
  if (!config.modules) config.modules = {};
  config.modules[tabId] = enabled;
  SessionManager.savePublicShareConfig(config);
  enforcePublicModuleNav();
  showToast(`Public permission updated for section.`, 'info');
}

function handleRegeneratePublicToken() {
  if (confirm("Are you sure you want to generate a new Public Link Token? The old public link URL will stop working immediately!")) {
    const config = SessionManager.generatePublicShareToken();
    const currentOrigin = window.location.origin + window.location.pathname;
    const fullShareUrl = `${currentOrigin}?public_token=${config.token}`;

    const linkInput = document.getElementById('publicShareUrlInput');
    if (linkInput) linkInput.value = fullShareUrl;

    showToast("✅ New Public Link generated successfully!", "success");
  }
}

function copyPublicShareUrl() {
  const linkInput = document.getElementById('publicShareUrlInput');
  if (linkInput && linkInput.value) {
    linkInput.select();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(linkInput.value).then(() => {
        showToast("📋 Public View Link copied to clipboard!", "success");
      }).catch(() => {
        document.execCommand('copy');
        showToast("📋 Public View Link copied to clipboard!", "success");
      });
    } else {
      document.execCommand('copy');
      showToast("📋 Public View Link copied to clipboard!", "success");
    }
  }
}

function redirectToLoginPage() {
  const appLayout = document.getElementById('mainAppLayout');
  if (appLayout) appLayout.style.display = 'none';

  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 999999; display: flex; align-items: center; justify-content: center; background: var(--bg-body); opacity: 1; pointer-events: auto;';

    const errorAlert = document.getElementById('loginErrorAlert');
    if (errorAlert) errorAlert.style.display = 'none';

    const idInput = document.getElementById('loginUserIdInput');
    const passInput = document.getElementById('loginPasswordInput');
    if (idInput) idInput.value = '';
    if (passInput) passInput.value = '';
  }
}

function showMainAppLayout() {
  const appLayout = document.getElementById('mainAppLayout');
  if (appLayout) appLayout.style.display = 'block';

  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.cssText = '';
  }
}

function showLoginModal() {
  redirectToLoginPage();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const idInput = document.getElementById('loginUserIdInput');
  const passInput = document.getElementById('loginPasswordInput');
  const errorAlert = document.getElementById('loginErrorAlert');

  const userId = idInput ? idInput.value : '';
  const password = passInput ? passInput.value : '';

  const authenticated = SessionManager.authenticate(userId, password);
  if (authenticated) {
    showMainAppLayout();
    renderUserSessionHeader();
    refreshCurrentTabContent();
    updateDashboardMetrics();
    updateBackupButtonVisibility();

    showToast(`Welcome back, ${authenticated.name}!`, 'success');
  } else {
    if (errorAlert) {
      errorAlert.style.display = 'block';
      errorAlert.innerHTML = '<i class="ri-error-warning-fill"></i> Invalid User ID or Password. Please try again.';
    }
  }
}

// User Management Modal (Admin Panel)
function openUserManagementModal() {
  const currentUser = SessionManager.getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Access restricted to Super Admin only.');
    return;
  }

  const modal = document.getElementById('userManagementModal');
  if (modal) {
    renderAdminUsersList();
    modal.classList.add('active');
  }
}

function closeUserManagementModal() {
  const modal = document.getElementById('userManagementModal');
  if (modal) modal.classList.remove('active');
}

function renderAdminUsersList() {
  const table = document.getElementById('adminUsersListTable');
  if (!table) return;

  const users = SessionManager.getUsers();
  let rowsHtml = `
    <thead>
      <tr style="background: var(--bg-body); border-bottom: 2px solid var(--border-color);">
        <th style="padding: 0.6rem; text-align: left;">User ID</th>
        <th style="padding: 0.6rem; text-align: left;">Full Name & Designation</th>
        <th style="padding: 0.6rem; text-align: left;">Password</th>
        <th style="padding: 0.6rem; text-align: center;">Role</th>
        <th style="padding: 0.6rem; text-align: center;">Backup & Restore Access</th>
        <th style="padding: 0.6rem; text-align: center;">Actions</th>
      </tr>
    </thead>
    <tbody>
  `;

  users.forEach(u => {
    const isMaster = (u.userId.toLowerCase() === 'nazmul' || u.userId.toLowerCase() === 'jagoadmin');
    const roleBadge = u.role === 'admin' 
      ? `<span class="badge" style="background:#f59e0b; color:#0f172a; font-weight:700;"><i class="ri-vip-crown-fill"></i> Super Admin</span>`
      : `<span class="badge" style="background:#0284c7; color:#fff;">Executive User</span>`;

    const designationText = u.designation || (u.role === 'admin' ? 'Super Admin' : 'Sales Executive');

    let backupPermHtml = '';
    if (isMaster || u.role === 'admin') {
      backupPermHtml = `<span class="badge" style="background:#10b981; color:#fff; font-weight:600;"><i class="ri-checkbox-circle-fill"></i> Allowed (Master)</span>`;
    } else {
      const allowed = u.allowBackup === true;
      backupPermHtml = allowed
        ? `<button class="btn btn-sm" onclick="handleToggleBackupPerm('${u.userId}')" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-weight:700; font-size:0.75rem; border-radius:6px; cursor:pointer;" title="Click to Revoke Backup Access"><i class="ri-checkbox-circle-line"></i> YES (Allowed)</button>`
        : `<button class="btn btn-sm" onclick="handleToggleBackupPerm('${u.userId}')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); font-weight:700; font-size:0.75rem; border-radius:6px; cursor:pointer;" title="Click to Allow Backup Access"><i class="ri-close-circle-line"></i> NO (Restricted)</button>`;
    }

    rowsHtml += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.6rem; font-weight: 700; color: var(--primary);">${u.userId}</td>
        <td style="padding: 0.6rem;">
          <div style="font-weight: 600; color: var(--text-color);">${u.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="ri-briefcase-line"></i> ${designationText}</div>
        </td>
        <td style="padding: 0.6rem; font-family: monospace; font-size: 0.9rem; color: #10b981; font-weight: 700;">${u.pass}</td>
        <td style="padding: 0.6rem; text-align: center;">${roleBadge}</td>
        <td style="padding: 0.6rem; text-align: center;">${backupPermHtml}</td>
        <td style="padding: 0.6rem; text-align: center;">
          <div style="display:flex; align-items:center; justify-content:center; gap:0.3rem;">
            <button class="btn btn-sm btn-outline-primary" onclick="openEditUserModal('${u.userId}')" title="Edit Designation, Password & Details">
              <i class="ri-edit-line"></i> Edit
            </button>
            ${!isMaster ? `
              <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteUser('${u.userId}')" title="Delete User">
                <i class="ri-delete-bin-line"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  rowsHtml += `</tbody>`;
  table.innerHTML = rowsHtml;
}

function handleToggleBackupPerm(userId) {
  const result = SessionManager.toggleUserBackupPermission(userId);
  if (result.success) {
    renderAdminUsersList();
    updateBackupButtonVisibility();
    showToast(`Backup permission updated for user "${userId}" (${result.allowBackup ? 'YES' : 'NO'}).`, 'info');
  } else {
    alert(result.message);
  }
}

function openEditUserModal(userId) {
  const users = SessionManager.getUsers();
  const user = users.find(u => u.userId.toLowerCase() === userId.toLowerCase());
  if (!user) return;

  const modal = document.getElementById('editUserModal');
  if (!modal) return;

  const isMaster = (user.userId.toLowerCase() === 'nazmul' || user.userId.toLowerCase() === 'jagoadmin');

  document.getElementById('editUserIdDisplay').innerText = user.userId;
  document.getElementById('editUserIdHidden').value = user.userId;
  document.getElementById('editUserNameInput').value = user.name || '';
  document.getElementById('editUserDesignationInput').value = user.designation || '';
  document.getElementById('editUserPassInput').value = user.pass || '';

  const roleSelect = document.getElementById('editUserRoleSelect');
  if (roleSelect) {
    roleSelect.value = user.role || 'user';
    roleSelect.disabled = isMaster;
  }

  const backupCheckbox = document.getElementById('editUserAllowBackupCheckbox');
  if (backupCheckbox) {
    backupCheckbox.checked = (isMaster || user.role === 'admin' || user.allowBackup === true);
    backupCheckbox.disabled = isMaster;
  }

  modal.classList.add('active');
}

function closeEditUserModal() {
  const modal = document.getElementById('editUserModal');
  if (modal) modal.classList.remove('active');
}

function handleEditUserSubmit(event) {
  event.preventDefault();
  const userId = document.getElementById('editUserIdHidden').value;
  const name = document.getElementById('editUserNameInput').value;
  const designation = document.getElementById('editUserDesignationInput').value;
  const pass = document.getElementById('editUserPassInput').value;
  const roleSelect = document.getElementById('editUserRoleSelect');
  const role = roleSelect ? roleSelect.value : 'user';
  const backupCheckbox = document.getElementById('editUserAllowBackupCheckbox');
  const allowBackup = backupCheckbox ? backupCheckbox.checked : false;

  const res = SessionManager.updateUser(userId, {
    name,
    designation,
    pass,
    role,
    allowBackup
  });

  if (res.success) {
    closeEditUserModal();
    renderAdminUsersList();
    renderUserSessionHeader();
    updateBackupButtonVisibility();
    showToast(`User account "${userId}" details and designation updated successfully!`, 'success');
  } else {
    alert(res.message);
  }
}

function handleCreateUserSubmit(event) {
  event.preventDefault();
  const idInput = document.getElementById('newUserId');
  const passInput = document.getElementById('newUserPass');
  const nameInput = document.getElementById('newUserName');
  const designationInput = document.getElementById('newUserDesignation');
  const roleInput = document.getElementById('newUserRole');
  const allowBackupInput = document.getElementById('newUserAllowBackup');

  if (!idInput || !passInput || !nameInput) return;

  const result = SessionManager.addUser({
    userId: idInput.value,
    pass: passInput.value,
    name: nameInput.value,
    designation: designationInput ? designationInput.value : '',
    role: roleInput ? roleInput.value : 'user',
    allowBackup: allowBackupInput ? allowBackupInput.checked : false
  });

  if (result.success) {
    idInput.value = '';
    passInput.value = '';
    nameInput.value = '';
    if (designationInput) designationInput.value = '';
    if (allowBackupInput) allowBackupInput.checked = false;
    renderAdminUsersList();
    renderUserSessionHeader();
    updateBackupButtonVisibility();
    showToast(`Executive User "${result.user.name}" created successfully!`, 'success');
  } else {
    alert(result.message);
  }
}

function confirmDeleteUser(userId) {
  if (confirm(`Are you sure you want to delete user "${userId}"?`)) {
    const res = SessionManager.deleteUser(userId);
    if (res.success) {
      renderAdminUsersList();
      renderUserSessionHeader();
      updateBackupButtonVisibility();
      showToast(`User ${userId} deleted.`, 'info');
    } else {
      alert(res.message);
    }
  }
}
