/* Master Data Input Hub Component for Jago Corporation PLC */

const MasterInputManager = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Invoice Lookup event for Collection
    const collInvInput = document.getElementById('masterCollInvoiceNo');
    if (collInvInput) {
      collInvInput.addEventListener('change', () => this.autoFillFromInvoice('masterCollPartyName', 'masterCollInvoiceNo', 'masterCollAmount', 'masterCollItemDetailsPreview'));
    }

    // Invoice Lookup event for Cash in Hand
    const cashInvInput = document.getElementById('masterCashInvoiceNo');
    if (cashInvInput) {
      cashInvInput.addEventListener('change', () => this.autoFillFromInvoice('masterCashPartyName', 'masterCashInvoiceNo', 'masterCashAmount', 'masterCashItemDetailsPreview'));
    }

    // Master Collection Form Submit
    const collForm = document.getElementById('masterCollectionForm');
    if (collForm) {
      collForm.addEventListener('submit', (e) => this.onCollectionSubmit(e));
    }

    // Master Delivery Form Submit
    const delivForm = document.getElementById('masterDeliveryForm');
    if (delivForm) {
      delivForm.addEventListener('submit', (e) => this.onDeliverySubmit(e));
    }

    // Master Cash In Hand Form Submit
    const cashForm = document.getElementById('masterCashForm');
    if (cashForm) {
      cashForm.addEventListener('submit', (e) => this.onCashSubmit(e));
    }

    // Master Order In Hand Form Submit
    const orderForm = document.getElementById('masterOrderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => this.onOrderSubmit(e));
    }
  },

  // Auto Lookup Invoice and fill product items & amount
  autoFillFromInvoice(partySelectId, invInputId, amountInputId, previewElemId) {
    const partyName = document.getElementById(partySelectId)?.value || '';
    const invoiceNo = document.getElementById(invInputId)?.value ? document.getElementById(invInputId).value.trim() : '';
    const amountInput = document.getElementById(amountInputId);
    const previewElem = document.getElementById(previewElemId);

    if (!invoiceNo) return;

    const entries = DayBookManager.getDaybookEntries();
    const match = entries.find(e => 
      e.invoiceNo && e.invoiceNo.toLowerCase() === invoiceNo.toLowerCase() &&
      (!partyName || e.partyName.toLowerCase() === partyName.toLowerCase())
    );

    if (match) {
      if (amountInput && (!amountInput.value || parseFloat(amountInput.value) === 0)) {
        amountInput.value = match.amount;
      }
      if (previewElem) {
        previewElem.style.display = 'block';
        previewElem.innerHTML = `
          <i class="ri-information-line"></i> <strong>Matched Invoice (${match.invoiceNo}):</strong> 
          Party: <em>${match.partyName}</em> | Items: ${DayBookManager.formatItemDetailsHTML(match)} | Total: <strong>${formatBDT(match.amount)}</strong>
        `;
      }
      // Auto select customer if not already selected
      const partySelect = document.getElementById(partySelectId);
      if (partySelect && !partySelect.value) {
        partySelect.value = match.partyName;
      }
    } else if (previewElem) {
      previewElem.style.display = 'block';
      previewElem.innerHTML = `<i class="ri-alert-line"></i> Invoice #${invoiceNo} not found in past records. Manual entry applied.`;
    }
  },

  // Submit 1: Collection
  onCollectionSubmit(e) {
    e.preventDefault();
    const dateVal = document.getElementById('masterHubDate').value || document.getElementById('selectedDateInput').value;
    const partyName = document.getElementById('masterCollPartyName').value;
    const invoiceNo = document.getElementById('masterCollInvoiceNo').value;
    const amount = parseFloat(document.getElementById('masterCollAmount').value) || 0;
    const paymentMethod = document.getElementById('masterCollMethod').value;
    const bankDetails = document.getElementById('masterCollBankNotes').value;
    const time = document.getElementById('masterCollTime').value || '12:00 PM';

    if (!partyName || amount <= 0) {
      alert('Please select Party / Customer Name and enter valid Collection Amount.');
      return;
    }

    const remark = bankDetails ? `Bank/Deposit: ${bankDetails}` : '';

    DayBookManager.addEntry({
      date: dateVal,
      type: 'collection',
      time,
      partyName,
      invoiceNo,
      amount,
      paymentMethod,
      remark
    });

    this.showHubAlert('masterHubAlert', `✓ Collection of ${formatBDT(amount)} from "${partyName}" logged successfully into Daybook & Party Ledger!`);
    document.getElementById('masterCollectionForm').reset();
    document.getElementById('masterCollTime').value = '12:00 PM';
    if (document.getElementById('masterCollItemDetailsPreview')) {
      document.getElementById('masterCollItemDetailsPreview').style.display = 'none';
    }

    refreshCurrentTabContent();
    updateDashboardMetrics();
  },

  // Submit 2: Delivery
  onDeliverySubmit(e) {
    e.preventDefault();
    const dateVal = document.getElementById('masterHubDate').value || document.getElementById('selectedDateInput').value;
    const partyName = document.getElementById('masterDelivPartyName').value;
    const invoiceNo = document.getElementById('masterDelivInvoiceNo').value;
    const vatInvoiceNo = document.getElementById('masterDelivVatInvoiceNo').value;
    const time = document.getElementById('masterDelivTime').value || '12:00 PM';
    const remark = document.getElementById('masterDelivRemark').value;

    const rows = document.querySelectorAll('.master-deliv-prod-row');
    const itemsList = [];
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

    const customAmount = parseFloat(document.getElementById('masterDelivAmount').value) || 0;

    if (!partyName) {
      alert('Please select Customer / Shop Name for Delivery.');
      return;
    }

    DayBookManager.addEntry({
      date: dateVal,
      type: 'delivery',
      time,
      partyName,
      invoiceNo,
      vatInvoiceNo,
      items: itemsList,
      amount: customAmount,
      remark
    });

    this.showHubAlert('masterHubAlert', `✓ Product Delivery for "${partyName}" logged into Daybook & Party Ledger!`);
    document.getElementById('masterDeliveryForm').reset();
    document.getElementById('masterDelivTime').value = '12:00 PM';
    const container = document.getElementById('masterDelivProdRowsContainer');
    if (container) {
      container.innerHTML = '';
      this.addMasterDeliveryRow();
    }

    refreshCurrentTabContent();
    updateDashboardMetrics();
  },

  // Submit 3: Cash in Hand
  onCashSubmit(e) {
    e.preventDefault();
    const dateVal = document.getElementById('masterHubDate').value || document.getElementById('selectedDateInput').value;
    const partyName = document.getElementById('masterCashPartyName').value;
    const invoiceNo = document.getElementById('masterCashInvoiceNo').value;
    const recipientPerson = document.getElementById('masterCashRecipient').value;
    const recipientOther = document.getElementById('masterCashRecipientOther') ? document.getElementById('masterCashRecipientOther').value : '';
    const amount = parseFloat(document.getElementById('masterCashAmount').value) || 0;
    const time = document.getElementById('masterCashTime').value || '12:00 PM';
    const remark = document.getElementById('masterCashRemark').value;

    if (!partyName || amount <= 0) {
      alert('Please select Party / Shop Name and enter Amount for Cash in Hand.');
      return;
    }

    const finalRecipient = recipientPerson === 'Other Office Person' ? `Office Person: ${recipientOther}` : recipientPerson;

    DayBookManager.addEntry({
      date: dateVal,
      type: 'cashInHand',
      time,
      partyName,
      invoiceNo,
      recipientPerson: finalRecipient,
      amount,
      remark
    });

    this.showHubAlert('masterHubAlert', `✓ Cash in Hand of ${formatBDT(amount)} (${finalRecipient}) logged into Daybook!`);
    document.getElementById('masterCashForm').reset();
    document.getElementById('masterCashTime').value = '12:00 PM';

    refreshCurrentTabContent();
    updateDashboardMetrics();
  },

  // Submit 4: Order in Hand
  onOrderSubmit(e) {
    e.preventDefault();
    const dateVal = document.getElementById('masterHubDate').value || document.getElementById('selectedDateInput').value;
    const partyName = document.getElementById('masterOrderPartyName').value;
    const time = document.getElementById('masterOrderTime').value || '12:00 PM';
    const remark = document.getElementById('masterOrderRemark').value;

    const rows = document.querySelectorAll('.master-order-prod-row');
    const itemsList = [];
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

    const customAmount = parseFloat(document.getElementById('masterOrderAmount').value) || 0;

    if (!partyName) {
      alert('Please select Customer / Shop Name for Order in Hand.');
      return;
    }

    DayBookManager.addEntry({
      date: dateVal,
      type: 'orderInHand',
      time,
      partyName,
      items: itemsList,
      amount: customAmount,
      remark
    });

    this.showHubAlert('masterHubAlert', `✓ Order in Hand for "${partyName}" recorded!`);
    document.getElementById('masterOrderForm').reset();
    document.getElementById('masterOrderTime').value = '12:00 PM';
    const container = document.getElementById('masterOrderProdRowsContainer');
    if (container) {
      container.innerHTML = '';
      this.addMasterOrderRow();
    }

    refreshCurrentTabContent();
    updateDashboardMetrics();
  },

  showHubAlert(elemId, message) {
    const alertBox = document.getElementById(elemId);
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.innerHTML = message;
      setTimeout(() => {
        alertBox.style.display = 'none';
      }, 5000);
    }
  },

  addMasterDeliveryRow() {
    this.createProductRow('masterDelivProdRowsContainer', 'master-deliv-prod-row', 'recalcMasterDelivTotal');
  },

  addMasterOrderRow() {
    this.createProductRow('masterOrderProdRowsContainer', 'master-order-prod-row', 'recalcMasterOrderTotal');
  },

  createProductRow(containerId, rowClass, recalcFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = ItemManager.getItems();
    const rowId = 'master-row-' + Math.random().toString(36).substr(2, 9);

    let optionsHtml = '<option value="">Select Water Purifier Product</option>';
    optionsHtml += items.map(i => `<option value="${i.id}" data-price="${i.price}" data-name="${i.name}">${i.name} (${formatBDT(i.price)})</option>`).join('');

    const rowDiv = document.createElement('div');
    rowDiv.className = `${rowClass} form-row`;
    rowDiv.id = rowId;
    rowDiv.style.alignItems = 'center';
    rowDiv.style.gap = '0.5rem';

    rowDiv.innerHTML = `
      <div style="flex: 2.5;">
        <select class="form-select db-prod-select" required onchange="MasterInputManager.onProductRowChange('${rowId}', '${recalcFnName}')">
          ${optionsHtml}
        </select>
      </div>
      <div style="flex: 1;">
        <input type="number" min="1" value="1" class="form-control db-prod-qty" placeholder="Qty" required oninput="${recalcFnName}()">
      </div>
      <div style="flex: 1.2;">
        <input type="number" step="0.01" class="form-control db-prod-price" placeholder="Unit ৳" required oninput="${recalcFnName}()">
      </div>
      <div style="width: 38px;">
        <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('${rowId}').remove(); ${recalcFnName}();" title="Remove Item" style="padding: 0.45rem;">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;

    container.appendChild(rowDiv);
  },

  onProductRowChange(rowId, recalcFnName) {
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
    if (window[recalcFnName]) window[recalcFnName]();
  }
};

// Global Recalc Helpers
function recalcMasterDelivTotal() {
  const rows = document.querySelectorAll('.master-deliv-prod-row');
  let total = 0;
  rows.forEach(r => {
    const q = parseFloat(r.querySelector('.db-prod-qty')?.value) || 0;
    const p = parseFloat(r.querySelector('.db-prod-price')?.value) || 0;
    total += (q * p);
  });
  const input = document.getElementById('masterDelivAmount');
  if (input) input.value = total;
}

function recalcMasterOrderTotal() {
  const rows = document.querySelectorAll('.master-order-prod-row');
  let total = 0;
  rows.forEach(r => {
    const q = parseFloat(r.querySelector('.db-prod-qty')?.value) || 0;
    const p = parseFloat(r.querySelector('.db-prod-price')?.value) || 0;
    total += (q * p);
  });
  const input = document.getElementById('masterOrderAmount');
  if (input) input.value = total;
}
