/* Items & Price History Management for Jago Corporation PLC */

const ItemManager = {
  getItems() {
    return Storage.get(STORAGE_KEYS.ITEMS);
  },

  getPriceLogs() {
    return Storage.get(STORAGE_KEYS.PRICE_LOGS);
  },

  addItem(itemData) {
    const items = this.getItems();
    const todayStr = new Date().toISOString().split('T')[0];
    const newItem = {
      id: "item-" + Math.random().toString(36).substr(2, 9),
      name: itemData.name.trim(),
      price: parseFloat(itemData.price) || 0,
      category: itemData.category || "Accessories",
      details: itemData.details ? itemData.details.trim() : "",
      dateAdded: todayStr
    };
    items.unshift(newItem);
    Storage.set(STORAGE_KEYS.ITEMS, items);

    // Create initial price log entry
    this.logPriceChange(newItem.id, newItem.name, 0, newItem.price, todayStr, "Item Created");
    return newItem;
  },

  updateItem(id, itemData) {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    const oldItem = items[index];
    const oldPrice = oldItem.price;
    const newPrice = parseFloat(itemData.price) || 0;
    const todayStr = new Date().toISOString().split('T')[0];

    items[index] = {
      ...oldItem,
      name: itemData.name.trim(),
      price: newPrice,
      category: itemData.category || oldItem.category,
      details: itemData.details ? itemData.details.trim() : ""
    };

    Storage.set(STORAGE_KEYS.ITEMS, items);

    // If price changed during edit, log price revision event
    if (oldPrice !== newPrice) {
      this.logPriceChange(id, itemData.name.trim(), oldPrice, newPrice, todayStr, "Price Edit");
    }

    return items[index];
  },

  deleteItem(id) {
    let items = this.getItems();
    items = items.filter(i => i.id !== id);
    Storage.set(STORAGE_KEYS.ITEMS, items);
  },

  confirmDelete(id) {
    const item = this.getItemById(id);
    if (!item) return;

    // Ask user confirmation before deleting
    const isConfirmed = confirm(`Are you sure you want to delete product "${item.name}"?\n\nThis action cannot be undone.`);
    if (isConfirmed) {
      this.deleteItem(id);
      this.renderItemsTable();
      this.renderPriceHistoryTable();
      this.populateItemDropdowns();
      ReportManager.generateSalesReport();
    }
  },

  updateItemPrice(id, newPrice, effectiveDate, note = "Price Revision") {
    const items = this.getItems();
    const itemIndex = items.findIndex(i => i.id === id);
    if (itemIndex === -1) return null;

    const oldPrice = items[itemIndex].price;
    const priceNum = parseFloat(newPrice);
    
    if (isNaN(priceNum) || priceNum <= 0) return null;

    // Update current product catalog price
    items[itemIndex].price = priceNum;
    Storage.set(STORAGE_KEYS.ITEMS, items);

    // Log the price update event with effective date so past daybook reports retain past price
    this.logPriceChange(id, items[itemIndex].name, oldPrice, priceNum, effectiveDate || new Date().toISOString().split('T')[0], note);
    return items[itemIndex];
  },

  logPriceChange(itemId, itemName, oldPrice, newPrice, effectiveDate, note) {
    const logs = this.getPriceLogs();
    const currentUser = SessionManager.getCurrentUser();
    const updatedBy = currentUser 
      ? `${currentUser.name} (${currentUser.userId})` 
      : 'Md Nazmul Hasan (nazmul)';

    logs.unshift({
      id: "log-" + Math.random().toString(36).substr(2, 9),
      itemId,
      itemName,
      oldPrice,
      newPrice,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      note,
      updatedBy
    });
    Storage.set(STORAGE_KEYS.PRICE_LOGS, logs);
  },

  getItemById(id) {
    return this.getItems().find(i => i.id === id);
  },

  renderItemsTable(searchTerm = '') {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;

    let items = this.getItems();
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.category.toLowerCase().includes(term) ||
        (i.details && i.details.toLowerCase().includes(term))
      );
    }

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No water purifier items found in inventory.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          <div style="font-weight: 700;">${item.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Added: ${formatDate(item.dateAdded)}</div>
        </td>
        <td>
          <span class="badge badge-primary">${item.category}</span>
        </td>
        <td>
          <div style="font-size: 0.84rem; max-width: 250px; color: var(--text-muted); white-space: normal;">
            ${item.details ? item.details : '<span style="font-style: italic; opacity: 0.6;">No details added</span>'}
          </div>
        </td>
        <td style="font-weight: 700; color: var(--success); font-size: 1rem;">
          ${formatBDT(item.price)}
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="ItemManager.openUpdatePriceModal('${item.id}')" title="Revise catalog price with effective date">
            <i class="ri-price-tag-3-line"></i> Revise Price
          </button>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="ItemManager.editItemModal('${item.id}')" title="Edit product details">
            <i class="ri-edit-line"></i> Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ItemManager.showPriceHistoryModal('${item.id}')" title="View Price Log History">
            <i class="ri-history-line"></i> Logs
          </button>
          <button class="btn btn-danger btn-sm" onclick="ItemManager.confirmDelete('${item.id}')" title="Delete product">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderPriceHistoryTable() {
    const tbody = document.getElementById('priceLogsTableBody');
    if (!tbody) return;

    const logs = this.getPriceLogs();
    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            No price change history recorded yet.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => `
      <tr>
        <td style="font-weight: 600;">${formatDate(log.effectiveDate)}</td>
        <td style="font-weight: 700; color: var(--text-color);">${log.itemName}</td>
        <td>${log.oldPrice > 0 ? formatBDT(log.oldPrice) : 'New Item'}</td>
        <td style="font-weight: 700; color: var(--primary);">${formatBDT(log.newPrice)}</td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${log.note || 'Revised'}</td>
        <td>
          <span class="badge" style="background: rgba(2, 132, 199, 0.15); color: var(--primary); border: 1px solid rgba(2, 132, 199, 0.3); font-weight: 600; font-size: 0.78rem;">
            <i class="ri-user-3-fill"></i> ${log.updatedBy || 'Md Nazmul Hasan (nazmul)'}
          </span>
        </td>
      </tr>
    `).join('');
  },

  populateItemDropdowns() {
    const selects = document.querySelectorAll('.item-product-select');
    const items = this.getItems();
    selects.forEach(select => {
      let html = '<option value="">Select Water Purifier Item</option>';
      html += items.map(i => `<option value="${i.id}" data-price="${i.price}" data-name="${i.name}">${i.name} (${formatBDT(i.price)})</option>`).join('');
      select.innerHTML = html;
    });
  },

  openAddItemModal() {
    document.getElementById('modalItemTitle').innerText = "Add New Water Purifier Item";
    document.getElementById('itemEditId').value = "";
    document.getElementById('itemNameInput').value = "";
    document.getElementById('itemPriceInput').value = "";
    document.getElementById('itemCategoryInput').value = "Purifier System";
    const detailsInput = document.getElementById('itemDetailsInput');
    if (detailsInput) detailsInput.value = "";
    openModal('itemModal');
  },

  editItemModal(id) {
    const item = this.getItemById(id);
    if (!item) return;

    document.getElementById('modalItemTitle').innerText = "Edit Water Purifier Item";
    document.getElementById('itemEditId').value = item.id;
    document.getElementById('itemNameInput').value = item.name;
    document.getElementById('itemPriceInput').value = item.price;
    document.getElementById('itemCategoryInput').value = item.category || "Accessories";
    const detailsInput = document.getElementById('itemDetailsInput');
    if (detailsInput) detailsInput.value = item.details || "";

    openModal('itemModal');
  },

  openUpdatePriceModal(id) {
    const item = this.getItemById(id);
    if (!item) return;

    document.getElementById('updatePriceItemId').value = item.id;
    document.getElementById('updatePriceItemName').innerText = item.name;
    document.getElementById('updatePriceCurrent').innerText = formatBDT(item.price);
    document.getElementById('updatePriceNewVal').value = item.price;
    document.getElementById('updatePriceEffectiveDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('updatePriceNote').value = "Price revision effective from " + formatDate(new Date().toISOString().split('T')[0]);

    openModal('updatePriceModal');
  },

  showPriceHistoryModal(id) {
    const logs = this.getPriceLogs().filter(l => l.itemId === id);
    const item = this.getItemById(id);

    let html = `<div style="margin-bottom: 0.5rem;"><strong>Product:</strong> ${item ? item.name : ''}</div>`;
    if (item && item.details) {
      html += `<div style="margin-bottom: 1rem; font-size:0.85rem; color:var(--text-muted);"><strong>Specifications/Details:</strong> ${item.details}</div>`;
    }
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Effective Date</th>
            <th>Previous Price</th>
            <th>Updated Price</th>
            <th>Revision Note</th>
            <th>Updated By (User)</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(l => `
            <tr>
              <td>${formatDate(l.effectiveDate)}</td>
              <td>${l.oldPrice > 0 ? formatBDT(l.oldPrice) : 'Initial'}</td>
              <td style="font-weight:700; color:var(--primary);">${formatBDT(l.newPrice)}</td>
              <td>${l.note}</td>
              <td>
                <span class="badge" style="background: rgba(2, 132, 199, 0.15); color: var(--primary); border: 1px solid rgba(2, 132, 199, 0.3); font-weight: 600; font-size: 0.78rem;">
                  <i class="ri-user-3-fill"></i> ${l.updatedBy || 'Md Nazmul Hasan (nazmul)'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

    document.getElementById('itemHistoryModalBody').innerHTML = html;
    openModal('itemHistoryModal');
  }
};
