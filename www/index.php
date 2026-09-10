<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jago Corporation PLC - Sales & Marketing Executive Management System</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <!-- Remix Icons -->
  <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
  <!-- Chart.js Visualization Library -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- PWA & Mobile App Setup -->
  <meta name="theme-color" content="#0284c7">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="manifest.json">
  <!-- Application Stylesheets -->
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/mobile.css">
</head>
<body data-theme="dark">

  <!-- Main Application Wrapper -->
  <div id="mainAppLayout">
    <!-- Header -->
    <header class="app-header">
    <div class="brand-container">
      <button class="btn-icon mobile-menu-toggle no-print" onclick="toggleMobileSidebar()" title="Open Navigation Menu">
        <i class="ri-menu-line"></i>
      </button>
      <div class="brand-logo">
        <i class="ri-drop-fill"></i>
      </div>
      <div class="brand-title">
        <h1>JAGO CORPORATION PLC</h1>
        <p>Water Purifier & Accessories Division | Dhaka City Executive Portal</p>
      </div>
    </div>

    <div class="header-controls">
      <div class="user-session-wrap no-print" id="userSessionWrap"></div>

      <button class="btn btn-primary no-print pwa-install-btn btn-desktop-only" style="display: none; background: #0284c7; border-color: #0284c7;" onclick="promptAndroidInstall()" title="Install Jago App on Android Mobile">
        <i class="ri-android-fill"></i> Install App
      </button>

      <div class="date-picker-wrap">
        <i class="ri-calendar-event-line" style="color: var(--primary);"></i>
        <input type="date" id="selectedDateInput" title="Select Day Book Date">
      </div>

      <button class="btn btn-secondary no-print btn-desktop-only" id="headerDownloadBackupBtn" onclick="exportAppData()" title="Download JSON Backup File to PC or Mobile Phone">
        <i class="ri-download-cloud-line"></i> Download Backup
      </button>

      <button class="btn btn-primary no-print" id="headerSyncDataBtn" onclick="openBackupRestoreModal()" style="background: #0d9488; border-color: #0d9488;" title="Upload & Sync Backup File from PC or Mobile Phone">
        <i class="ri-upload-cloud-line"></i> <span class="btn-text">Sync Data</span>
      </button>

      <button class="btn btn-secondary no-print btn-desktop-only" onclick="window.print()" title="Print Current Day Book Report">
        <i class="ri-printer-line"></i> Print Daybook
      </button>

      <button class="btn btn-danger no-print btn-desktop-only" onclick="downloadCurrentTabPDF()" style="background: #e11d48; border-color: #e11d48; color: white;" title="Download Current Active Report as PDF Document">
        <i class="ri-file-pdf-2-line"></i> Download PDF
      </button>

      <button class="btn-icon no-print" id="themeToggleBtn" title="Toggle Light/Dark Theme">
        <i class="ri-sun-line"></i>
      </button>
    </div>
  </header>

  <!-- Mobile Slide-Out Side Navigation Drawer (Replaces Bottom Navigation) -->
  <div class="mobile-sidebar-overlay no-print" id="mobileSidebarOverlay" onclick="closeMobileSidebar()"></div>
  <aside class="mobile-sidebar-drawer no-print" id="mobileSidebarDrawer">
    <div class="mobile-sidebar-header">
      <div class="brand-container">
        <div class="brand-logo">
          <i class="ri-drop-fill"></i>
        </div>
        <div class="brand-title">
          <h1 style="font-size: 1rem;">JAGO CORPORATION</h1>
          <p style="font-size: 0.72rem; color: var(--text-muted);">Executive Sales Portal</p>
        </div>
      </div>
      <button class="btn-icon" onclick="closeMobileSidebar()"><i class="ri-close-line"></i></button>
    </div>

    <div class="mobile-sidebar-body">
      <div class="nav-item active" data-tab="daybookTab">
        <i class="ri-book-line"></i>
        <span>Central Day Book</span>
      </div>
      <div class="nav-item" data-tab="masterInputTab">
        <i class="ri-file-input-line"></i>
        <span>Master Input Hub</span>
      </div>
      <div class="nav-item" data-tab="invoicesTab">
        <i class="ri-bill-line"></i>
        <span>All Invoices Report</span>
      </div>
      <div class="nav-item" data-tab="conveyanceReportTab">
        <i class="ri-car-line"></i>
        <span>Conveyance Report</span>
      </div>
      <div class="nav-item" data-tab="ledgerTab">
        <i class="ri-file-list-3-line"></i>
        <span>Party Ledger</span>
      </div>
      <div class="nav-item" data-tab="customerTab">
        <i class="ri-store-2-line"></i>
        <span>Customer Directory</span>
      </div>
      <div class="nav-item" data-tab="itemTab">
        <i class="ri-stack-line"></i>
        <span>Items & Pricing</span>
      </div>
      <div class="nav-item" data-tab="reportsTab">
        <i class="ri-bar-chart-box-line"></i>
        <span>Market Sales Report</span>
      </div>

      <div class="mobile-sidebar-footer-actions">
        <button class="btn btn-warning" id="mobileDrawerShareBtn" onclick="closeMobileSidebar(); openPublicShareModal();" style="width: 100%; justify-content: flex-start; background: #f59e0b; border-color: #f59e0b; color: #0f172a; font-weight:700;">
          <i class="ri-share-line"></i> <span>Create & Share Link</span>
        </button>
        <button class="btn btn-primary" id="mobileDrawerSyncBtn" onclick="closeMobileSidebar(); openBackupRestoreModal();" style="width: 100%; justify-content: flex-start; background: #0d9488; border-color: #0d9488;">
          <i class="ri-refresh-line"></i> <span>Backup & Mobile Sync</span>
        </button>
        <button class="btn btn-secondary" id="mobileDrawerBackupBtn" onclick="closeMobileSidebar(); exportAppData();" style="width: 100%; justify-content: flex-start;">
          <i class="ri-download-cloud-line"></i> <span>Download Backup File</span>
        </button>
        <button class="btn btn-secondary" onclick="closeMobileSidebar(); window.print();" style="width: 100%; justify-content: flex-start;">
          <i class="ri-printer-line"></i> <span>Print Current Report</span>
        </button>
        <button class="btn btn-danger" onclick="closeMobileSidebar(); downloadCurrentTabPDF();" style="width: 100%; justify-content: flex-start; background: #e11d48; border-color: #e11d48; color: white;">
          <i class="ri-file-pdf-2-line"></i> <span>Download PDF Document</span>
        </button>
        <button class="btn btn-danger" onclick="closeMobileSidebar(); performUserLogout();" style="width: 100%; justify-content: flex-start; background: #be123c; border-color: #be123c; color: white; margin-top: 0.5rem; font-weight: 700;">
          <i class="ri-logout-box-r-line"></i> <span>Log Out of Account</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- App Main Layout -->
  <div class="app-container">

    <!-- Sidebar Navigation -->
    <aside class="sidebar no-print">
      <div class="nav-item active" data-tab="daybookTab">
        <i class="ri-book-line"></i>
        <span>Central Day Book</span>
      </div>
      <div class="nav-item" data-tab="masterInputTab">
        <i class="ri-file-input-line"></i>
        <span>Master Data Input Hub</span>
      </div>
      <div class="nav-item" data-tab="customerTab">
        <i class="ri-store-2-line"></i>
        <span>Customer Directory</span>
      </div>
      <div class="nav-item" data-tab="itemTab">
        <i class="ri-stack-line"></i>
        <span>Items & Pricing</span>
      </div>
      <div class="nav-item" data-tab="conveyanceTab">
        <i class="ri-route-line"></i>
        <span>Conveyance Bill</span>
      </div>
      <div class="nav-item" data-tab="conveyanceReportTab">
        <i class="ri-file-chart-line"></i>
        <span>Conveyance Report</span>
      </div>
      <div class="nav-item" data-tab="reportTab">
        <i class="ri-bar-chart-grouped-line"></i>
        <span>Market Sales Report</span>
      </div>
      <div class="nav-item" data-tab="ledgerTab">
        <i class="ri-booklet-line"></i>
        <span>Party Ledger</span>
      </div>
      <div class="nav-item" data-tab="invoicesTab">
        <i class="ri-file-list-3-line"></i>
        <span>All Invoices Report</span>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="content-area">

      <!-- Mobile 1-Tap Quick Action Pills (Visible on Mobile < 768px) -->
      <div class="mobile-quick-action-bar no-print">
        <button class="mobile-action-pill pill-collection" onclick="DayBookManager.openEntryModal('Collection')">
          <i class="ri-add-circle-fill"></i> + Collection
        </button>
        <button class="mobile-action-pill pill-delivery" onclick="DayBookManager.openEntryModal('Delivery')">
          <i class="ri-truck-fill"></i> + Delivery
        </button>
        <button class="mobile-action-pill pill-conveyance" onclick="ConveyanceManager.openModal()">
          <i class="ri-car-fill"></i> + Conveyance
        </button>
        <button class="mobile-action-pill pill-sync" onclick="openBackupRestoreModal()">
          <i class="ri-refresh-fill"></i> Sync Backup
        </button>
      </div>

      <!-- Metrics Ticker Bar -->
      <div class="metrics-grid no-print">
        <div class="metric-card">
          <div class="metric-icon collection">
            <i class="ri-wallet-3-line"></i>
          </div>
          <div class="metric-info">
            <h3>Total Collection</h3>
            <div class="value" id="metricCollection">৳ 0</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon delivery">
            <i class="ri-truck-line"></i>
          </div>
          <div class="metric-info">
            <h3>Total Delivery</h3>
            <div class="value" id="metricDelivery">৳ 0</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon cash">
            <i class="ri-safe-2-line"></i>
          </div>
          <div class="metric-info">
            <h3>Cash in Hand</h3>
            <div class="value" id="metricCash">৳ 0</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon order">
            <i class="ri-shopping-bag-3-line"></i>
          </div>
          <div class="metric-info">
            <h3>Order in Hand</h3>
            <div class="value" id="metricOrder">৳ 0</div>
          </div>
        </div>
      </div>

      <!-- TAB 1: CENTRAL DAY BOOK -->
      <div class="tab-panel active" id="daybookTab">
        <div class="card no-print">
          <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
            <div class="card-title">
              <i class="ri-book-line"></i> Daily Day Book Management
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-success btn-sm" onclick="openDaybookModalWithType('collection')" title="Log party payment collection">
                <i class="ri-money-dollar-circle-line"></i> + Log Payment / Collection
              </button>
              <button class="btn btn-primary btn-sm" onclick="openDaybookModalWithType('delivery')" title="Log product delivery to party">
                <i class="ri-truck-line"></i> + Log Product Delivery
              </button>
              <button class="btn btn-secondary btn-sm" onclick="openModal('daybookModal')">
                <i class="ri-add-circle-line"></i> + Other Entry
              </button>
            </div>
          </div>

          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Category / Type</th>
                  <th>Customer / Party Name</th>
                  <th>Item Details</th>
                  <th>Amount (৳)</th>
                  <th>Remark</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="daybookEntriesTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- PRINTABLE FINAL DAYBOOK REPORT (Excel Layout Match) -->
        <div id="daybookReportOutput">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- TAB: MASTER DATA INPUT HUB -->
      <div class="tab-panel" id="masterInputTab">
        <div class="card no-print" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
            <div class="card-title">
              <i class="ri-file-input-line"></i> Master Executive Data Input Hub
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <label for="masterHubDate" style="font-weight: 700; color: var(--text-main); font-size: 0.88rem; margin: 0;">Logging Date *</label>
              <input type="date" class="form-control" id="masterHubDate" style="width: 170px;" onchange="syncMasterHubDate(this.value)">
            </div>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
            Enter daily transactions below. All data automatically updates the Central Daybook, Customer Ledgers, Sales Reports, and Product Statements.
          </p>
        </div>

        <div id="masterHubAlert" style="display: none; padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: var(--success);">
          <i class="ri-checkbox-circle-fill"></i> Data entry saved successfully!
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.5rem;">
          
          <!-- SECTION 1: TODAY COLLECTION (DEPOSIT BANK) -->
          <div class="card">
            <div class="card-header" style="border-bottom: 2px solid var(--success);">
              <div class="card-title" style="color: var(--success);">
                <i class="ri-wallet-3-line"></i> 1. Today Collection (Deposit Bank)
              </div>
            </div>
            <form id="masterCollectionForm" style="padding-top: 1rem;">
              <div class="form-group">
                <label for="masterCollPartyName">Select Customer / Shop Name *</label>
                <select class="form-select customer-party-select" id="masterCollPartyName" required onchange="MasterInputManager.autoFillFromInvoice('masterCollPartyName', 'masterCollInvoiceNo', 'masterCollAmount', 'masterCollItemDetailsPreview')">
                  <!-- Prepopulated -->
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterCollInvoiceNo">Invoice No (Auto Lookup)</label>
                  <input type="text" class="form-control" id="masterCollInvoiceNo" placeholder="e.g. INV-1024">
                </div>
                <div class="form-group">
                  <label for="masterCollAmount">Collection Amount (৳) *</label>
                  <input type="number" step="0.01" class="form-control" id="masterCollAmount" required placeholder="0.00">
                </div>
              </div>

              <div id="masterCollItemDetailsPreview" style="display: none; padding: 0.6rem 0.8rem; margin-bottom: 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; background: rgba(2, 132, 199, 0.1); border: 1px solid var(--primary); color: var(--primary);">
                <!-- Item details auto preview -->
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterCollMethod">Payment Channel / Mode</label>
                  <select class="form-select" id="masterCollMethod">
                    <option value="Bank Deposit">Bank Deposit / Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="bKash / Nagad">bKash / Nagad</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="masterCollTime">Time</label>
                  <input type="text" class="form-control" id="masterCollTime" value="12:00 PM">
                </div>
              </div>

              <div class="form-group">
                <label for="masterCollBankNotes">Bank Deposit Details / Reference</label>
                <input type="text" class="form-control" id="masterCollBankNotes" placeholder="e.g. City Bank A/C #10029, Slip #8892">
              </div>

              <button type="submit" class="btn btn-success" style="width: 100%; margin-top: 0.5rem;">
                <i class="ri-check-line"></i> Save Collection Entry
              </button>
            </form>
          </div>

          <!-- SECTION 2: DATE-WISE DELIVERY -->
          <div class="card">
            <div class="card-header" style="border-bottom: 2px solid var(--primary);">
              <div class="card-title" style="color: var(--primary);">
                <i class="ri-truck-line"></i> 2. Date-Wise Product Delivery
              </div>
            </div>
            <form id="masterDeliveryForm" style="padding-top: 1rem;">
              <div class="form-group">
                <label for="masterDelivPartyName">Select Customer / Shop Name *</label>
                <select class="form-select customer-party-select" id="masterDelivPartyName" required>
                  <!-- Prepopulated -->
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterDelivInvoiceNo">Invoice No</label>
                  <input type="text" class="form-control" id="masterDelivInvoiceNo" placeholder="e.g. INV-2035">
                </div>
                <div class="form-group">
                  <label for="masterDelivVatInvoiceNo">VAT Invoice No</label>
                  <input type="text" class="form-control" id="masterDelivVatInvoiceNo" placeholder="e.g. VAT-9041">
                </div>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem; background: rgba(255,255,255,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <label style="font-weight: 700; color: var(--primary); font-size: 0.85rem; margin: 0;">
                    <i class="ri-shopping-cart-2-line"></i> Delivered Product Items
                  </label>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="MasterInputManager.addMasterDeliveryRow()">
                    <i class="ri-add-line"></i> + Add Item
                  </button>
                </div>

                <div id="masterDelivProdRowsContainer" style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <!-- Dynamic Product Rows -->
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterDelivAmount">Total Delivery Amount (৳) *</label>
                  <input type="number" step="0.01" class="form-control" id="masterDelivAmount" required placeholder="0.00">
                </div>
                <div class="form-group">
                  <label for="masterDelivTime">Time</label>
                  <input type="text" class="form-control" id="masterDelivTime" value="12:00 PM">
                </div>
              </div>

              <div class="form-group">
                <label for="masterDelivRemark">Delivery Remark / Courier Details</label>
                <input type="text" class="form-control" id="masterDelivRemark" placeholder="e.g. Delivered via S.A Paribahan Courier">
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
                <i class="ri-check-line"></i> Save Delivery Entry
              </button>
            </form>
          </div>

          <!-- SECTION 3: CASH IN HAND / CHEQUE -->
          <div class="card">
            <div class="card-header" style="border-bottom: 2px solid var(--warning);">
              <div class="card-title" style="color: var(--warning);">
                <i class="ri-safe-2-line"></i> 3. Cash in Hand / Money Custody
              </div>
            </div>
            <form id="masterCashForm" style="padding-top: 1rem;">
              <div class="form-group">
                <label for="masterCashPartyName">Select Customer / Shop Name *</label>
                <select class="form-select customer-party-select" id="masterCashPartyName" required onchange="MasterInputManager.autoFillFromInvoice('masterCashPartyName', 'masterCashInvoiceNo', 'masterCashAmount', 'masterCashItemDetailsPreview')">
                  <!-- Prepopulated -->
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterCashInvoiceNo">Invoice No (Optional Lookup)</label>
                  <input type="text" class="form-control" id="masterCashInvoiceNo" placeholder="e.g. INV-1024">
                </div>
                <div class="form-group">
                  <label for="masterCashAmount">Cash Amount (৳) *</label>
                  <input type="number" step="0.01" class="form-control" id="masterCashAmount" required placeholder="0.00">
                </div>
              </div>

              <div id="masterCashItemDetailsPreview" style="display: none; padding: 0.6rem 0.8rem; margin-bottom: 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; background: rgba(217, 119, 6, 0.1); border: 1px solid var(--warning); color: var(--warning);">
                <!-- Item details auto preview -->
              </div>

              <div class="form-group">
                <label for="masterCashRecipient">Where Sent / Money Custody *</label>
                <select class="form-select" id="masterCashRecipient" required onchange="toggleCashRecipientOtherInput(this.value)">
                  <option value="In My Hand (Sales Exec)">In My Hand (Sales Executive)</option>
                  <option value="Accounts Dept (Office)">Accounts Dept (Head Office)</option>
                  <option value="Other Office Person">Other Office Person (Specify Name)</option>
                </select>
              </div>

              <div class="form-group" id="masterCashRecipientOtherGroup" style="display: none;">
                <label for="masterCashRecipientOther">Specify Office Person Name</label>
                <input type="text" class="form-control" id="masterCashRecipientOther" placeholder="e.g. Mr. Shafiq (Manager)">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterCashTime">Time</label>
                  <input type="text" class="form-control" id="masterCashTime" value="12:00 PM">
                </div>
                <div class="form-group">
                  <label for="masterCashRemark">Notes / Memo</label>
                  <input type="text" class="form-control" id="masterCashRemark" placeholder="e.g. Partial cash advance">
                </div>
              </div>

              <button type="submit" class="btn btn-warning" style="width: 100%; margin-top: 0.5rem; color: #fff;">
                <i class="ri-check-line"></i> Save Cash Custody Entry
              </button>
            </form>
          </div>

          <!-- SECTION 4: ORDER IN HAND -->
          <div class="card">
            <div class="card-header" style="border-bottom: 2px solid #2563eb;">
              <div class="card-title" style="color: #2563eb;">
                <i class="ri-shopping-bag-3-line"></i> 4. Order in Hand (Pending Customer Order)
              </div>
            </div>
            <form id="masterOrderForm" style="padding-top: 1rem;">
              <div class="form-group">
                <label for="masterOrderPartyName">Select Customer / Shop Name *</label>
                <select class="form-select customer-party-select" id="masterOrderPartyName" required>
                  <!-- Prepopulated -->
                </select>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem; background: rgba(255,255,255,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <label style="font-weight: 700; color: #2563eb; font-size: 0.85rem; margin: 0;">
                    <i class="ri-shopping-cart-2-line"></i> Ordered Products List
                  </label>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="MasterInputManager.addMasterOrderRow()">
                    <i class="ri-add-line"></i> + Add Item
                  </button>
                </div>

                <div id="masterOrderProdRowsContainer" style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <!-- Dynamic Product Rows -->
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="masterOrderAmount">Total Quoted Amount (৳) *</label>
                  <input type="number" step="0.01" class="form-control" id="masterOrderAmount" required placeholder="0.00">
                </div>
                <div class="form-group">
                  <label for="masterOrderTime">Time</label>
                  <input type="text" class="form-control" id="masterOrderTime" value="12:00 PM">
                </div>
              </div>

              <div class="form-group">
                <label for="masterOrderRemark">Order Notes / Delivery Date</label>
                <input type="text" class="form-control" id="masterOrderRemark" placeholder="e.g. Expected delivery by 10-Sep-2026">
              </div>

              <button type="submit" class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem; background: #2563eb; color: white;">
                <i class="ri-check-line"></i> Save Order in Hand
              </button>
            </form>
          </div>

        </div>
      </div>

      <!-- TAB 2: CUSTOMER DIRECTORY -->
      <div class="tab-panel" id="customerTab">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-user-star-line"></i> Customer Details & Shop Directory
            </div>
            <button class="btn btn-primary" onclick="openModal('customerModal')">
              <i class="ri-user-add-line"></i> Add New Customer
            </button>
          </div>

          <div class="form-row" style="margin-bottom: 1.25rem;">
            <div class="form-group" style="flex: 2;">
              <input type="text" class="form-control" id="customerSearchInput" placeholder="Search by Shop Name, Owner, Phone or Address..." oninput="refreshCurrentTabContent()">
            </div>
            <div class="form-group" style="flex: 1;">
              <select class="form-select dhaka-zone-select filter-select" id="customerZoneFilterSelect" onchange="refreshCurrentTabContent()">
                <!-- Dhaka Zones Dropdown -->
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Shop Name & Address</th>
                  <th>Owner Name</th>
                  <th>Phone Number</th>
                  <th>Area / Zone</th>
                  <th>BIN Number</th>
                  <th>NID Number</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="customerTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: ITEMS & PRICE MANAGEMENT -->
      <div class="tab-panel" id="itemTab">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-water-flash-line"></i> Water Purifier Items & Accessories Catalog
            </div>
            <button class="btn btn-primary" onclick="ItemManager.openAddItemModal()">
              <i class="ri-add-line"></i> Add New Item
            </button>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <input type="text" class="form-control" id="itemSearchInput" placeholder="Search water purifier products or spare parts..." oninput="refreshCurrentTabContent()">
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Specifications / Details</th>
                  <th>Current Catalog Price</th>
                  <th>Price Revision</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="itemsTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-history-line"></i> Historical Price Revision Log
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Effective Date</th>
                  <th>Item Name</th>
                  <th>Previous Price</th>
                  <th>Updated Price</th>
                  <th>Revision Note</th>
                  <th>Updated By (User)</th>
                </tr>
              </thead>
              <tbody id="priceLogsTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: DAILY CONVEYANCE BILL -->
      <div class="tab-panel" id="conveyanceTab">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-car-line"></i> Daily Executive Conveyance Bill
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <select id="conveyanceDateFilterMode" class="form-select" style="width: auto;" onchange="refreshCurrentTabContent()">
                <option value="all" selected>View All Dates</option>
                <option value="selectedDate">Filter by Selected Date</option>
              </select>
              <div style="font-weight: 700; color: var(--danger);">
                Total Conveyance: <span id="conveyanceDailyTotal">৳ 0</span>
              </div>
              <button class="btn btn-primary" onclick="ConveyanceManager.openAddModal()">
                <i class="ri-add-line"></i> Log Conveyance Entry
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Route (From → To)</th>
                  <th>Transport Mode</th>
                  <th>Purpose / Customer Visited</th>
                  <th>Amount (৳)</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="conveyanceTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: MARKET SALES REPORT -->
      <div class="tab-panel" id="reportTab">

        <!-- EXECUTIVE MONTHLY CUSTOMER DUE & SALES SUMMARY REPORT -->
        <div class="card" style="margin-bottom: 1.5rem; border-top: 3px solid var(--primary);">
          <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
            <div class="card-title" style="font-size: 1.15rem; color: var(--primary);">
              <i class="ri-calendar-check-line"></i> Executive Monthly Customer Due & Sales Summary Report
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <label for="monthlyReportMonthSelect" style="font-size: 0.85rem; font-weight: 700; margin: 0; color: var(--text-main);">Month Scope *</label>
                <select id="monthlyReportMonthSelect" class="form-select" style="width: auto;" onchange="ReportManager.renderMonthlyExecutiveReport()">
                  <!-- Prepopulated with months -->
                </select>
              </div>
              <input type="text" id="monthlyReportSearchInput" class="form-control" placeholder="Search party or zone..." style="width: 200px;" oninput="ReportManager.renderMonthlyExecutiveReport()">
              <button class="btn btn-secondary btn-sm" onclick="ReportManager.printMonthlyExecutiveReport()">
                <i class="ri-printer-line"></i> Print Monthly Summary
              </button>
              <button class="btn btn-danger btn-sm" onclick="ReportManager.downloadMonthlyExecutiveReportPDF()" style="background: #e11d48; border-color: #e11d48; color: white;" title="Download Monthly Executive Summary as PDF Document">
                <i class="ri-file-pdf-2-line"></i> Download PDF
              </button>
            </div>
          </div>

          <!-- Monthly Ticker Summary Cards -->
          <div class="metrics-grid" style="margin-bottom: 1.25rem;">
            <div class="metric-card">
              <div class="metric-icon delivery">
                <i class="ri-shopping-cart-2-line"></i>
              </div>
              <div class="metric-info">
                <h3>Total Sales This Month</h3>
                <div class="value" id="monthlyReportTotalSales" style="color: var(--primary);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon collection">
                <i class="ri-wallet-3-line"></i>
              </div>
              <div class="metric-info">
                <h3>Bank / Paid Collection</h3>
                <div class="value" id="monthlyReportTotalCollection" style="color: var(--success);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon cash">
                <i class="ri-safe-2-line"></i>
              </div>
              <div class="metric-info">
                <h3>Cash in Hand (Custody)</h3>
                <div class="value" id="monthlyReportCashInHand" style="color: var(--warning);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon" style="background: rgba(239, 68, 68, 0.15); color: var(--danger);">
                <i class="ri-error-warning-line"></i>
              </div>
              <div class="metric-info">
                <h3>Net Customer Due (Uncollected)</h3>
                <div class="value" id="monthlyReportTotalDue" style="color: var(--danger);">৳ 0</div>
              </div>
            </div>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            <i class="ri-information-line"></i> <strong>Note on Cash in Hand:</strong> Money held in Cash in Hand remains flagged under Executive Custody and is included in the Customer Due balance until officially deposited into Bank / Office Accounts.
          </p>

          <!-- Monthly Customer Due & Sales Breakdown Table -->
          <div class="table-responsive">
            <table class="data-table" style="font-size: 0.88rem;">
              <thead>
                <tr>
                  <th>Customer / Shop Name</th>
                  <th>Dhaka Area / Zone</th>
                  <th>Last Activity Date</th>
                  <th>Monthly Sales (Deliveries ৳)</th>
                  <th>Bank / Office Collection (৳)</th>
                  <th>Cash in Hand (৳)</th>
                  <th>Net Customer Due Amount (৳)</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="monthlyReportTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-map-pin-2-line"></i> Zone-Wise Dhaka Sales Analytics
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dhaka Zone / Area</th>
                  <th>Total Delivery Sales</th>
                  <th>Total Money Collected</th>
                  <th>Delivery Volume</th>
                </tr>
              </thead>
              <tbody id="zoneReportTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="form-row">
          <div class="card" style="flex: 1;">
            <div class="card-header">
              <div class="card-title">
                <i class="ri-pie-chart-line"></i> Overall Product Sales Volume
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue (৳)</th>
                  </tr>
                </thead>
                <tbody id="productReportTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>

          <div class="card" style="flex: 1;">
            <div class="card-header">
              <div class="card-title">
                <i class="ri-account-circle-line"></i> Customer Account Summary
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Zone</th>
                    <th>Delivered (৳)</th>
                    <th>Collected (৳)</th>
                    <th>Outstanding Balance (৳)</th>
                  </tr>
                </thead>
                <tbody id="customerLedgerTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- NEW: CUSTOMER DATE-TO-DATE & MONTHLY MARKET SALES REPORT ANALYTICS -->
        <div class="card" id="customerMarketReportPrintableArea" style="margin-top: 1.5rem; border-top: 3px solid var(--primary);">
          <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
            <div class="card-title" style="font-size: 1.15rem; color: var(--primary);">
              <i class="ri-file-user-line"></i> Customer / Party Sales Report & Analytics Statement
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="ReportManager.printCustomerReport()">
                <i class="ri-printer-line"></i> Print Customer Report
              </button>
              <button class="btn btn-danger btn-sm" onclick="ReportManager.downloadCustomerReportPDF()" style="background: #e11d48; border-color: #e11d48; color: white;" title="Download Customer Sales & Analytics Report as PDF">
                <i class="ri-file-pdf-2-line"></i> Download PDF
              </button>
            </div>
          </div>
          
          <div class="form-row" style="margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div class="form-group" style="flex: 2; min-width: 200px;">
              <label for="custReportSelect" style="font-weight: 700; font-size: 0.82rem;">Select Customer / Shop *</label>
              <select class="form-select customer-party-select" id="custReportSelect" onchange="ReportManager.renderCustomerDateToDateReport()">
                <!-- Prepopulated customers -->
              </select>
            </div>
            <div class="form-group" style="flex: 1.5; min-width: 170px;">
              <label for="custReportPresetSelect" style="font-weight: 700; font-size: 0.82rem;">Quick Date Preset</label>
              <select class="form-select" id="custReportPresetSelect" onchange="ReportManager.handleCustReportPresetChange(this.value)">
                <option value="last3months" selected>📅 Last 3 Months (Quarterly)</option>
                <option value="thisMonth">🗓️ This Month</option>
                <option value="lastMonth">📆 Last Month</option>
                <option value="allTime">🌐 All Time History</option>
                <option value="custom">✏️ Custom Date Range</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1; min-width: 140px;">
              <label for="custReportFromDate" style="font-weight: 700; font-size: 0.82rem;">From Date *</label>
              <input type="date" class="form-control" id="custReportFromDate" onchange="ReportManager.renderCustomerDateToDateReport()">
            </div>
            <div class="form-group" style="flex: 1; min-width: 140px;">
              <label for="custReportToDate" style="font-weight: 700; font-size: 0.82rem;">To Date *</label>
              <input type="date" class="form-control" id="custReportToDate" onchange="ReportManager.renderCustomerDateToDateReport()">
            </div>
          </div>

          <!-- Summary Tickers for Selected Customer -->
          <div class="metrics-grid" style="margin-bottom: 1.25rem;">
            <div class="metric-card">
              <div class="metric-info">
                <h3>Delivered Sales</h3>
                <div class="value" id="custReportTotalDelivered" style="color: var(--primary);">৳ 0</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-info">
                <h3>Total Collected</h3>
                <div class="value" id="custReportTotalCollected" style="color: var(--success);">৳ 0</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-info">
                <h3>Outstanding Balance</h3>
                <div class="value" id="custReportBalance" style="color: var(--danger);">৳ 0</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-info">
                <h3>Total Purchased Quantity</h3>
                <div class="value" id="custReportTotalUnits" style="color: #8b5cf6;">0 pcs</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-info">
                <h3>Top Purchased Product</h3>
                <div class="value" id="custReportTopProduct" style="font-size: 0.88rem; color: #f59e0b;">-</div>
              </div>
            </div>
          </div>

          <!-- Main Date-to-Date Transaction Statement Table -->
          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Product Name & Specifications</th>
                  <th>Qty</th>
                  <th>Unit Price (৳)</th>
                  <th>Total Amount (৳)</th>
                  <th>Remark / Payment Channel</th>
                </tr>
              </thead>
              <tbody id="custReportTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>

          <!-- DUAL ANALYTICS CHARTS SECTION -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
            <!-- CHART 1: SALES VS COLLECTION TREND CHART (LAST 3 MONTHS / DATE-TO-DATE) -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
              <h4 style="margin-bottom: 1rem; color: var(--text-main); font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                <i class="ri-line-chart-line" style="color: var(--primary);"></i> Chart 1: Sales vs Collection Trend (Period / 3 Months)
              </h4>
              <div style="min-height: 240px; height: 240px; position: relative;" id="customerTrendChartWrap">
                <canvas id="customerTrendChart"></canvas>
              </div>
            </div>

            <!-- CHART 2: PRODUCT PURCHASE DISTRIBUTION CHART -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
              <h4 style="margin-bottom: 1rem; color: var(--text-main); font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                <i class="ri-pie-chart-2-line" style="color: #10b981;"></i> Chart 2: Product Sales & Purchase Distribution
              </h4>
              <div class="form-row">
                <div style="flex: 1.2; min-height: 220px; height: 220px; position: relative;">
                  <canvas id="customerProductChart"></canvas>
                </div>
                <div style="flex: 1; max-height: 220px; overflow-y: auto;" id="customerProductBreakdownList">
                  <!-- Distribution list -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 6: PARTY / CUSTOMER LEDGER STATEMENT -->
      <div class="tab-panel" id="ledgerTab">
        <div class="card no-print" style="margin-bottom: 1.5rem;">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-booklet-line"></i> Party / Customer Account Ledger Statement
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="ledgerCustomerSelect">Select Customer / Shop *</label>
              <select class="form-select customer-party-select" id="ledgerCustomerSelect" onchange="LedgerManager.renderLedgerView()">
                <!-- Prepopulated customers -->
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="ledgerFromDate">From Date (Optional)</label>
              <input type="date" class="form-control" id="ledgerFromDate" onchange="LedgerManager.renderLedgerView()">
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="ledgerToDate">To Date (Optional)</label>
              <input type="date" class="form-control" id="ledgerToDate" onchange="LedgerManager.renderLedgerView()">
            </div>
          </div>
        </div>

        <!-- Printable Statement Container -->
        <div id="ledgerStatementOutput">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- TAB 8: ALL INVOICES & BILLING REPORT -->
      <div class="tab-panel" id="invoicesTab">
        <div class="card no-print" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
            <div class="card-title">
              <i class="ri-file-list-3-line"></i> All Invoices & Master Billing Report
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.print()">
                <i class="ri-printer-line"></i> Print Invoices List
              </button>
              <button class="btn btn-danger btn-sm" onclick="InvoiceManager.downloadInvoicesPDF()" style="background: #e11d48; border-color: #e11d48; color: white;" title="Download Invoices Report as PDF Document">
                <i class="ri-file-pdf-2-line"></i> Download PDF
              </button>
            </div>
          </div>

          <!-- Invoices Ticker Metrics -->
          <div class="metrics-grid" style="margin-bottom: 1.25rem;">
            <div class="metric-card">
              <div class="metric-icon delivery">
                <i class="ri-file-text-line"></i>
              </div>
              <div class="metric-info">
                <h3>Total Invoices</h3>
                <div class="value" id="invoicesTotalCount" style="color: var(--primary);">0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon delivery">
                <i class="ri-shopping-cart-2-line"></i>
              </div>
              <div class="metric-info">
                <h3>Total Invoice Sales</h3>
                <div class="value" id="invoicesTotalSales" style="color: var(--primary);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon collection">
                <i class="ri-wallet-3-line"></i>
              </div>
              <div class="metric-info">
                <h3>Paid / Collected</h3>
                <div class="value" id="invoicesTotalCollected" style="color: var(--success);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon" style="background: rgba(239, 68, 68, 0.15); color: var(--danger);">
                <i class="ri-error-warning-line"></i>
              </div>
              <div class="metric-info">
                <h3>Outstanding Invoice Due</h3>
                <div class="value" id="invoicesTotalDue" style="color: var(--danger);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon cash">
                <i class="ri-article-line"></i>
              </div>
              <div class="metric-info">
                <h3>VAT Invoices</h3>
                <div class="value" id="invoicesVatCount" style="color: var(--accent);">0</div>
              </div>
            </div>
          </div>

          <!-- Advanced Filters Bar -->
          <div class="form-row" style="gap: 0.75rem; flex-wrap: wrap;">
            <div class="form-group" style="flex: 2; min-width: 200px;">
              <label for="invoicesSearchInput" style="font-size: 0.8rem; font-weight: 600;">Search Invoices</label>
              <input type="text" class="form-control" id="invoicesSearchInput" placeholder="Search by Invoice #, VAT #, Party, Item..." oninput="InvoiceManager.renderInvoicesTable()">
            </div>

            <div class="form-group" style="flex: 1.5; min-width: 170px;">
              <label for="invoicesCustomerFilter" style="font-size: 0.8rem; font-weight: 600;">Filter by Customer</label>
              <select class="form-select customer-party-select" id="invoicesCustomerFilter" onchange="InvoiceManager.renderInvoicesTable()">
                <!-- Prepopulated -->
              </select>
            </div>

            <div class="form-group" style="flex: 1; min-width: 140px;">
              <label for="invoicesStatusFilter" style="font-size: 0.8rem; font-weight: 600;">Payment Status</label>
              <select class="form-select" id="invoicesStatusFilter" onchange="InvoiceManager.renderInvoicesTable()">
                <option value="">All Statuses</option>
                <option value="paid">Paid / Settled</option>
                <option value="partial">Partial Paid</option>
                <option value="unpaid">Unpaid / Due</option>
              </select>
            </div>

            <div class="form-group" style="flex: 1; min-width: 130px;">
              <label for="invoicesFromDate" style="font-size: 0.8rem; font-weight: 600;">From Date</label>
              <input type="date" class="form-control" id="invoicesFromDate" onchange="InvoiceManager.renderInvoicesTable()">
            </div>

            <div class="form-group" style="flex: 1; min-width: 130px;">
              <label for="invoicesToDate" style="font-size: 0.8rem; font-weight: 600;">To Date</label>
              <input type="date" class="form-control" id="invoicesToDate" onchange="InvoiceManager.renderInvoicesTable()">
            </div>
          </div>
        </div>

        <!-- Master Invoices Table -->
        <div class="card">
          <div class="table-responsive">
            <table class="data-table" style="font-size: 0.88rem;">
              <thead>
                <tr>
                  <th>Invoice / VAT #</th>
                  <th>Date & Time</th>
                  <th>Customer & Zone</th>
                  <th>Delivered Product Items</th>
                  <th>Invoice Amount (৳)</th>
                  <th>Collected (৳)</th>
                  <th>Invoice Due (৳)</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="invoicesMasterTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 9: CONVEYANCE BILL REPORT & ANALYTICS -->
      <div class="tab-panel" id="conveyanceReportTab">
        <div class="card no-print" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
            <div class="card-title">
              <i class="ri-file-chart-line"></i> Conveyance Bill Executive Report & Analytics
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="ConveyanceManager.openConveyanceVoucherModal()">
                <i class="ri-printer-line"></i> Print Conveyance Claim Sheet
              </button>
              <button class="btn btn-danger btn-sm" onclick="ConveyanceManager.downloadConveyanceReportPDF()" style="background: #e11d48; border-color: #e11d48; color: white;" title="Download Conveyance Claim Sheet as PDF Document">
                <i class="ri-file-pdf-2-line"></i> Download PDF Sheet
              </button>
            </div>
          </div>

          <!-- Conveyance Ticker Metrics -->
          <div class="metrics-grid" style="margin-bottom: 1.25rem;">
            <div class="metric-card">
              <div class="metric-icon delivery">
                <i class="ri-money-dollar-circle-line"></i>
              </div>
              <div class="metric-info">
                <h3>Total Conveyance Bill</h3>
                <div class="value" id="convMetricTotal" style="color: var(--danger);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon collection">
                <i class="ri-route-line"></i>
              </div>
              <div class="metric-info">
                <h3>Total Trips Count</h3>
                <div class="value" id="convMetricTrips" style="color: var(--primary);">0 Trips</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon cash">
                <i class="ri-e-bike-2-line"></i>
              </div>
              <div class="metric-info">
                <h3>Rickshaw Expenses</h3>
                <div class="value" id="convMetricRickshaw" style="color: var(--accent);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">
                <i class="ri-taxi-line"></i>
              </div>
              <div class="metric-info">
                <h3>CNG & Uber / Pathao</h3>
                <div class="value" id="convMetricCngUber" style="color: var(--success);">৳ 0</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);">
                <i class="ri-bus-2-line"></i>
              </div>
              <div class="metric-info">
                <h3>Bus & Motorbike</h3>
                <div class="value" id="convMetricBusOther" style="color: var(--warning);">৳ 0</div>
              </div>
            </div>
          </div>

          <!-- Advanced Filters Bar -->
          <div class="form-row" style="gap: 0.75rem; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1.2; min-width: 170px;">
              <label for="convReportFilterMode" style="font-size: 0.8rem; font-weight: 600;">Report View Mode</label>
              <select id="convReportFilterMode" class="form-select" onchange="ConveyanceManager.onReportFilterModeChange()">
                <option value="all" selected>View All Recorded Dates (Cumulative)</option>
                <option value="dateRange">Date to Date Range</option>
                <option value="selectedDate">Single Day (Header Date)</option>
              </select>
            </div>

            <div class="form-group" id="convFromDateGroup" style="flex: 1; min-width: 130px; display: none;">
              <label for="convFromDate" style="font-size: 0.8rem; font-weight: 600;">From Date</label>
              <input type="date" class="form-control" id="convFromDate" onchange="ConveyanceManager.renderConveyanceReport()">
            </div>

            <div class="form-group" id="convToDateGroup" style="flex: 1; min-width: 130px; display: none;">
              <label for="convToDate" style="font-size: 0.8rem; font-weight: 600;">To Date</label>
              <input type="date" class="form-control" id="convToDate" onchange="ConveyanceManager.renderConveyanceReport()">
            </div>

            <div class="form-group" style="flex: 1.2; min-width: 150px;">
              <label for="convTransportFilter" style="font-size: 0.8rem; font-weight: 600;">Transport Mode</label>
              <select class="form-select" id="convTransportFilter" onchange="ConveyanceManager.renderConveyanceReport()">
                <option value="">All Transports</option>
                <option value="Rickshaw">Rickshaw</option>
                <option value="CNG">CNG Auto Rickshaw</option>
                <option value="Bus">Bus</option>
                <option value="Uber / Pathao">Uber / Pathao</option>
                <option value="Motorbike">Motorbike</option>
              </select>
            </div>

            <div class="form-group" style="flex: 2; min-width: 200px;">
              <label for="convSearchInput" style="font-size: 0.8rem; font-weight: 600;">Search Route / Purpose</label>
              <input type="text" class="form-control" id="convSearchInput" placeholder="Search route, location or visited customer..." oninput="ConveyanceManager.renderConveyanceReport()">
            </div>
          </div>
        </div>

        <!-- Day-Wise Grouped Separate Conveyance Reports Section -->
        <div id="conveyanceDayWiseReportContainer">
          <!-- Dynamically populated per day (e.g. 1 Sep, 2 Sep, 3 Sep...) -->
        </div>

        <!-- Date-by-Date Daily Breakdown Summary Table -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-calendar-event-line"></i> Daily Date-Wise Summary Breakdown
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Trips</th>
                  <th>Locations & Routes Covered</th>
                  <th>Rickshaw (৳)</th>
                  <th>CNG / Uber (৳)</th>
                  <th>Bus / Other (৳)</th>
                  <th>Daily Total Expense (৳)</th>
                </tr>
              </thead>
              <tbody id="conveyanceDailySummaryTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Master Conveyance Detailed Trip Logs Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="ri-list-check-2"></i> Detailed Conveyance Trip Logs
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Route (From → To)</th>
                  <th>Transport Mode</th>
                  <th>Purpose / Customer Visited</th>
                  <th>Amount (৳)</th>
                  <th style="text-align: right;" class="no-print">Action</th>
                </tr>
              </thead>
              <tbody id="conveyanceReportTableBody">
                <!-- Dynamically populated -->
              </tbody>
              <tfoot>
                <tr style="background: rgba(255,255,255,0.04); font-weight: 700;">
                  <td colspan="4" style="text-align: right;">Total Conveyance Claim Expense:</td>
                  <td style="color: var(--danger); font-size: 1.05rem;" id="conveyanceTableFooterTotal">৳ 0</td>
                  <td class="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- MODAL: ADD / EDIT CUSTOMER -->
  <div class="modal-overlay" id="customerModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modalCustomerTitle">Add New Customer</h3>
        <button class="btn-icon" onclick="closeModal('customerModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="customerForm">
        <div class="modal-body">
          <input type="hidden" id="custEditId">
          <div class="form-group">
            <label for="custShopName">Shop Name *</label>
            <input type="text" class="form-control" id="custShopName" placeholder="e.g. Bismillah Water Filter Shop" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="custOwnerName">Owner Name</label>
              <input type="text" class="form-control" id="custOwnerName" placeholder="e.g. Md. Hossain">
            </div>
            <div class="form-group">
              <label for="custPhone">Phone Number</label>
              <input type="text" class="form-control" id="custPhone" placeholder="01700-000000">
            </div>
          </div>
          <div class="form-group">
            <label for="custAddress">Full Address</label>
            <input type="text" class="form-control" id="custAddress" placeholder="Shop #, Market, Road, Dhaka">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="custZone">Area / Zone (Dhaka) *</label>
              <select class="form-select dhaka-zone-select" id="custZone" required>
                <!-- Prepopulated -->
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="custBin">BIN Number (Optional)</label>
              <input type="text" class="form-control" id="custBin" placeholder="If available">
            </div>
            <div class="form-group">
              <label for="custNid">NID Number (Optional)</label>
              <input type="text" class="form-control" id="custNid" placeholder="If available">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('customerModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Save Customer</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: ADD / EDIT ITEM -->
  <div class="modal-overlay" id="itemModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modalItemTitle">Add New Water Purifier Item</h3>
        <button class="btn-icon" onclick="closeModal('itemModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="itemForm">
        <div class="modal-body">
          <input type="hidden" id="itemEditId">
          <div class="form-group">
            <label for="itemNameInput">Item Name *</label>
            <input type="text" class="form-control" id="itemNameInput" placeholder="e.g. RO Membrane 75 GPD" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="itemPriceInput">Regular Item Price (৳) *</label>
              <input type="number" step="0.01" class="form-control" id="itemPriceInput" placeholder="1650" required>
            </div>
            <div class="form-group">
              <label for="itemCategoryInput">Category</label>
              <select class="form-select" id="itemCategoryInput">
                <option value="Purifier System">Purifier System</option>
                <option value="Filter Cartridge">Filter Cartridge</option>
                <option value="Membrane">Membrane</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="itemDetailsInput">Product Details / Specifications</label>
            <textarea class="form-control" id="itemDetailsInput" rows="3" placeholder="Enter specs, model details, warranty, technical info..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('itemModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Add Item</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: UPDATE ITEM PRICE (PRICE VERSIONING) -->
  <div class="modal-overlay" id="updatePriceModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Update Product Catalog Price</h3>
        <button class="btn-icon" onclick="closeModal('updatePriceModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="updatePriceForm">
        <div class="modal-body">
          <input type="hidden" id="updatePriceItemId">
          <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted);">
            Item: <strong id="updatePriceItemName" style="color: var(--text-main);"></strong><br>
            Current Catalog Price: <strong id="updatePriceCurrent" style="color: var(--success);"></strong>
          </p>
          <div class="form-row">
            <div class="form-group">
              <label for="updatePriceNewVal">New Catalog Price (৳) *</label>
              <input type="number" step="0.01" class="form-control" id="updatePriceNewVal" required>
            </div>
            <div class="form-group">
              <label for="updatePriceEffectiveDate">Effective Update Date *</label>
              <input type="date" class="form-control" id="updatePriceEffectiveDate" required>
            </div>
          </div>
          <div class="form-group">
            <label for="updatePriceNote">Revision Remark / Reason</label>
            <input type="text" class="form-control" id="updatePriceNote" placeholder="e.g. Dollar rate increase, Market adjustment">
          </div>
          <p style="font-size: 0.78rem; color: var(--warning);">
            <i class="ri-information-line"></i> Updating this price will not modify past daybook transactions or historical reports.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('updatePriceModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-check-line"></i> Apply Price Update</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: ITEM PRICE HISTORY LOGS -->
  <div class="modal-overlay" id="itemHistoryModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Product Price Revision History</h3>
        <button class="btn-icon" onclick="closeModal('itemHistoryModal')"><i class="ri-close-line"></i></button>
      </div>
      <div class="modal-body" id="itemHistoryModalBody">
        <!-- Dynamically populated -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal('itemHistoryModal')">Close</button>
      </div>
    </div>
  </div>

  <!-- MODAL: ADD DAYBOOK ENTRY -->
  <div class="modal-overlay" id="daybookModal">
    <div class="modal-card" style="max-width: 650px;">
      <div class="modal-header">
        <h3 id="daybookModalTitle">Add Daybook Entry</h3>
        <button class="btn-icon" onclick="closeModal('daybookModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="daybookForm">
        <div class="modal-body">
          <div id="dbModalAlert" style="display: none; padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: var(--radius-sm); font-size: 0.88rem; background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: var(--success);">
            <i class="ri-checkbox-circle-fill"></i> Entry saved successfully! You can add another party entry now.
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1.2;">
              <label for="dbEntryDate">Entry Date *</label>
              <input type="date" class="form-control" id="dbEntryDate" required>
            </div>
            <div class="form-group" style="flex: 1.5;">
              <label for="dbEntryType">Entry Category / Type *</label>
              <select class="form-select" id="dbEntryType" required>
                <option value="collection">1. Collection (Money Received)</option>
                <option value="delivery">2. Delivery (Product Delivered)</option>
                <option value="cashInHand">3. Cash in Hand / Cheque</option>
                <option value="orderInHand">4. Order in Hand (Pending Order)</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="dbTime">Time</label>
              <input type="text" class="form-control" id="dbTime" value="12:00 PM">
            </div>
          </div>

          <div class="form-group">
            <label for="dbPartyName">Party / Customer Name *</label>
            <select class="form-select customer-party-select" id="dbPartyName" required>
              <!-- Prepopulated customers -->
            </select>
          </div>

          <!-- Multi-Product Section (Shown for Delivery & Order in Hand) -->
          <div id="dbProductSection" style="display: none; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem; background: rgba(255,255,255,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <label style="font-weight: 700; color: var(--primary); font-size: 0.9rem;">
                <i class="ri-shopping-cart-2-line"></i> Ordered / Delivered Product Items
              </label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="addDaybookProductRow()">
                <i class="ri-add-line"></i> + Add Another Item
              </button>
            </div>

            <div id="dbProductRowsContainer" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <!-- Dynamically populated product rows -->
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dbAmount">Total Amount (৳) *</label>
              <input type="number" step="0.01" class="form-control" id="dbAmount" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="dbPaymentMethod">Payment Channel / Mode</label>
              <select class="form-select" id="dbPaymentMethod">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="bKash / Nagad">bKash / Nagad</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="dbRemark">Remark / Notes</label>
            <input type="text" class="form-control" id="dbRemark" placeholder="e.g. Courier memo #, Partial payment">
          </div>
        </div>

        <div class="modal-footer" style="gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="closeModal('daybookModal')">Close</button>
          <button type="button" class="btn btn-success" id="btnSaveAndAddAnother" onclick="handleSaveAndAddAnotherDaybookEntry()">
            <i class="ri-add-circle-line"></i> Save & Add Another Party
          </button>
          <button type="submit" class="btn btn-primary" id="btnSaveAndClose">
            <i class="ri-check-line"></i> Save & Finish
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: ADD / EDIT CONVEYANCE LOG -->
  <div class="modal-overlay" id="conveyanceModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modalConveyanceTitle">Log Daily Conveyance Entry</h3>
        <button class="btn-icon" onclick="closeModal('conveyanceModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="conveyanceForm">
        <div class="modal-body">
          <input type="hidden" id="convEditId">

          <div class="form-group">
            <label for="convDate">Conveyance Date *</label>
            <input type="date" class="form-control" id="convDate" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="convFrom">Starting Location * (Dropdown or Custom)</label>
              <input type="text" class="form-control" id="convFrom" list="savedFromLocationsDatalist" placeholder="Select or type location..." required autocomplete="off">
              <datalist id="savedFromLocationsDatalist"></datalist>
            </div>
            <div class="form-group">
              <label for="convTo">Destination * (Dropdown or Custom)</label>
              <input type="text" class="form-control" id="convTo" list="savedToLocationsDatalist" placeholder="Select or type destination..." required autocomplete="off">
              <datalist id="savedToLocationsDatalist"></datalist>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="convTransport">Transport Type *</label>
              <select class="form-select" id="convTransport" required>
                <option value="Rickshaw">Rickshaw</option>
                <option value="CNG">CNG Auto Rickshaw</option>
                <option value="Bus">Bus</option>
                <option value="Uber / Pathao">Uber / Pathao</option>
                <option value="Motorbike">Motorbike</option>
              </select>
            </div>
            <div class="form-group">
              <label for="convAmount">Fare Amount (৳) *</label>
              <input type="number" step="0.01" class="form-control" id="convAmount" required placeholder="e.g. 150">
            </div>
          </div>

          <div class="form-group">
            <label for="convPurpose">Purpose / Customer Visited</label>
            <input type="text" class="form-control" id="convPurpose" placeholder="e.g. Payment collection & item delivery">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('conveyanceModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Save Log</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: EDIT CUSTOMER OPENING BALANCE & REVISION HISTORY -->
  <div class="modal-overlay" id="openingBalanceModal">
    <div class="modal-card" style="max-width: 650px;">
      <div class="modal-header">
        <h3>Edit Customer Opening Balance</h3>
        <button class="btn-icon" onclick="closeModal('openingBalanceModal')"><i class="ri-close-line"></i></button>
      </div>
      <form id="openingBalanceForm">
        <div class="modal-body">
          <input type="hidden" id="obCustId">
          <p style="font-size: 0.95rem; margin-bottom: 1rem; color: var(--text-muted);">
            Customer / Party: <strong id="obCustName" style="color: var(--primary); font-size: 1.1rem;"></strong>
          </p>

          <div class="form-row">
            <div class="form-group">
              <label for="obAmountInput">Opening Balance Amount (৳) *</label>
              <input type="number" step="0.01" class="form-control" id="obAmountInput" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="obTypeInput">Balance Nature / Type *</label>
              <select class="form-select" id="obTypeInput" required>
                <option value="debit">Debit (Dr) - Customer Owes Money</option>
                <option value="credit">Credit (Cr) - Advance / We Owe Customer</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="obDateInput">Effective Balance Date *</label>
              <input type="date" class="form-control" id="obDateInput" required>
            </div>
            <div class="form-group">
              <label for="obNoteInput">Revision Reason / Note</label>
              <input type="text" class="form-control" id="obNoteInput" placeholder="e.g. Initial ledger setup, Adjusted previous balance">
            </div>
          </div>

          <!-- Revision History Section -->
          <div style="margin-top: 1.5rem; border-top: 1px dashed var(--border-color); padding-top: 1rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
              <i class="ri-history-line"></i> Opening Balance Revision Audit Log
            </h4>
            <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
              <table class="data-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Previous Balance</th>
                    <th>New Balance</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody id="obHistoryTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('openingBalanceModal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Save Opening Balance</button>
        </div>
      </form>
    </div>
  </div>

      <div class="modal-body" id="invoiceVoucherModalBody">
        <!-- Dynamically populated -->
      </div>
      <div class="modal-footer no-print">
        <button type="button" class="btn btn-secondary" onclick="closeModal('invoiceVoucherModal')">Close</button>
        <button type="button" class="btn btn-primary" onclick="InvoiceManager.printInvoiceVoucher()">
          <i class="ri-printer-line"></i> Print Invoice Voucher
        </button>
        <button type="button" class="btn btn-danger" onclick="InvoiceManager.downloadInvoiceVoucherPDF()" style="background: #e11d48; border-color: #e11d48; color: white;">
          <i class="ri-file-pdf-2-line"></i> Download PDF Voucher
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: DATA BACKUP & RESTORE / CLOUD SYNC CENTER -->
  <div class="modal-overlay" id="backupRestoreModal">
    <div class="modal-card" style="max-width: 650px; width: 95%;">
      <div class="modal-header">
        <h3><i class="ri-refresh-line" style="color: var(--primary);"></i> Data Backup & Mobile Sync Center</h3>
        <button class="btn-icon" onclick="closeModal('backupRestoreModal')"><i class="ri-close-line"></i></button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">
          Export and sync your system data between your computer and Android mobile app anytime.
        </p>

        <!-- DOWNLOAD SECTION -->
        <div style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
          <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--primary);">
            <i class="ri-download-cloud-fill"></i> 1. Download Backup File (.json)
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Exports all customer accounts, daybook entries, products, opening balance logs, and conveyance claims into a single downloadable file.
          </p>
          <div id="backupStatsSummary" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.88rem; font-size: 0.78rem; font-weight: 600;">
            <!-- Populated dynamically -->
          </div>
          <button type="button" class="btn btn-primary" onclick="exportAppData()" style="width: 100%; justify-content: center;">
            <i class="ri-download-cloud-line"></i> Download Backup File Now
          </button>
        </div>

        <!-- UPLOAD SECTION -->
        <div style="background: rgba(13, 148, 136, 0.08); border: 1px solid rgba(13, 148, 136, 0.25); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: #0d9488;">
            <i class="ri-upload-cloud-fill"></i> 2. Upload Backup File (Sync Mobile & PC)
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Select a `.json` backup file from your mobile storage or computer to update the database.
          </p>
          
          <div class="form-group" style="margin-bottom: 0.88rem;">
            <label style="font-weight: 600; font-size: 0.82rem;">Choose `.json` Backup File:</label>
            <input type="file" id="backupFileInput" accept=".json" class="form-control" style="padding: 0.4rem;">
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.35rem; display: block;">Sync Option:</label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <label style="font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <input type="radio" name="importSyncMode" value="overwrite" checked>
                <span><b>Full Overwrite</b> (Replace database)</span>
              </label>
              <label style="font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <input type="radio" name="importSyncMode" value="merge">
                <span><b>Smart Merge</b> (Append missing records)</span>
              </label>
            </div>
          </div>

          <button type="button" class="btn btn-primary" onclick="handleBackupUploadSubmit()" style="width: 100%; justify-content: center; background: #0d9488; border-color: #0d9488;">
            <i class="ri-upload-cloud-line"></i> Upload & Sync Data Now
          </button>
        </div>

        <!-- INSTANT FORCE RESET TO SEPT 06 BACKUP -->
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-top: 1.25rem;">
          <h4 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: #f59e0b;">
            <i class="ri-history-line"></i> 3. Restore Default Sept 06 Master Data
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Instantly re-load the complete authentic Sept 06 dataset (4 Customers, 21 Daybook entries, 19 Conveyance claims) for Md Nazmul Hasan.
          </p>
          <button type="button" class="btn btn-warning" onclick="handleForceResetBackupData()" style="width: 100%; justify-content: center; background: #f59e0b; color: #0f172a; font-weight: 700; border: none;">
            <i class="ri-refresh-line"></i> Restore Sept 06 Master Data Now
          </button>
        </div>

        <div id="backupSyncStatusBanner" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600;"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal('backupRestoreModal')">Close</button>
      </div>
    </div>
  </div>

  <!-- MODAL: FORMAL PRINTABLE CONVEYANCE CLAIM VOUCHER -->
  <div class="modal-overlay" id="conveyanceVoucherModal">
    <div class="modal-card" style="max-width: 850px; width: 95%;">
      <div class="modal-header no-print">
        <h3>Formal Conveyance Claim Sheet</h3>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" onclick="ConveyanceManager.printConveyanceVoucher()">
            <i class="ri-printer-line"></i> Print Claim Sheet
          </button>
          <button class="btn btn-danger btn-sm" onclick="ConveyanceManager.downloadConveyanceVoucherPDF()" style="background: #e11d48; border-color: #e11d48; color: white;">
            <i class="ri-file-pdf-2-line"></i> Download PDF
          </button>
          <button class="btn-icon" onclick="closeModal('conveyanceVoucherModal')"><i class="ri-close-line"></i></button>
        </div>
      </div>
      <div class="modal-body" id="conveyanceVoucherModalBody">
        <!-- Dynamically populated -->
      </div>
      <div class="modal-footer no-print">
        <button type="button" class="btn btn-secondary" onclick="closeModal('conveyanceVoucherModal')">Close</button>
        <button type="button" class="btn btn-primary" onclick="ConveyanceManager.printConveyanceVoucher()">
          <i class="ri-printer-line"></i> Print Claim Sheet
        </button>
        <button type="button" class="btn btn-danger" onclick="ConveyanceManager.downloadConveyanceVoucherPDF()" style="background: #e11d48; border-color: #e11d48; color: white;">
          <i class="ri-file-pdf-2-line"></i> Download PDF Claim Sheet
        </button>
      </div>
    </div>
  </div> <!-- End mainAppLayout -->

  <!-- LOGIN MODAL (Clean Portal Auth & Redirect Page) -->
  <div class="modal-overlay no-print" id="loginModal">
    <div class="modal-card" style="max-width: 420px; width: 92%; border-radius: 16px; background: var(--bg-card); color: var(--text-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; padding: 0;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0f172a 100%); padding: 1.75rem 1.5rem; text-align: center; color: white;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.8rem;">
          <i class="ri-shield-user-line"></i>
        </div>
        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 700; margin: 0; color: white;">JAGO CORPORATION PLC</h2>
        <p style="font-size: 0.82rem; opacity: 0.85; margin: 0.25rem 0 0;">Sales Portal Authentication</p>
      </div>

      <div style="padding: 1.5rem;">
        <div id="loginErrorAlert" style="display: none; background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; text-align: center; font-weight: 600;">
          <i class="ri-error-warning-fill"></i> Invalid User ID or Password.
        </div>

        <form id="loginForm" onsubmit="handleLoginSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group" style="margin:0;">
            <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; display: block; color: var(--text-color);">User ID</label>
            <div style="position: relative;">
              <i class="ri-user-line" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
              <input type="text" id="loginUserIdInput" required placeholder="Enter User ID" autocomplete="off" style="padding-left: 2.25rem; width: 100%; height: 42px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
            </div>
          </div>

          <div class="form-group" style="margin:0;">
            <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; display: block; color: var(--text-color);">Password</label>
            <div style="position: relative;">
              <i class="ri-lock-password-line" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
              <input type="password" id="loginPasswordInput" required placeholder="Enter Password" autocomplete="off" style="padding-left: 2.25rem; width: 100%; height: 42px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; height: 44px; font-weight: 700; font-size: 0.95rem; border-radius: 8px; margin-top: 0.5rem; background: #0284c7; border: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <i class="ri-login-box-line"></i> Log In to System
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- SUPER ADMIN USER MANAGEMENT MODAL -->
  <div class="modal-overlay no-print" id="userManagementModal">
    <div class="modal-card" style="max-width: 750px; width: 95%; border-radius: 16px; background: var(--bg-card); color: var(--text-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; padding: 0;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="ri-user-settings-fill" style="font-size: 1.4rem; color: #f59e0b;"></i>
          <div>
            <h3 style="font-size: 1.15rem; margin: 0; color: white;">Super Admin User Management</h3>
            <p style="font-size: 0.78rem; opacity: 0.8; margin: 0;">Create and manage executive user accounts & security passwords</p>
          </div>
        </div>
        <button class="btn-icon" onclick="closeUserManagementModal()" style="color: white;"><i class="ri-close-line"></i></button>
      </div>

      <div style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
        <!-- Create User Section -->
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; margin: 0 0 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
            <i class="ri-user-add-line"></i> Create New Executive Account
          </h4>
          <form id="createNewUserForm" onsubmit="handleCreateUserSubmit(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin:0;">
              <label style="font-size: 0.8rem; font-weight: 600;">User ID (Username)</label>
              <input type="text" id="newUserId" required placeholder="e.g. exec2" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color);">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size: 0.8rem; font-weight: 600;">Password</label>
              <input type="text" id="newUserPass" required placeholder="Set Password" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color);">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size: 0.8rem; font-weight: 600;">Full Executive Name</label>
              <input type="text" id="newUserName" required placeholder="e.g. Md. Maruf Hossain" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color);">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size: 0.8rem; font-weight: 600;">Executive Designation</label>
              <input type="text" id="newUserDesignation" placeholder="e.g. Area Sales Manager" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color);">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size: 0.8rem; font-weight: 600;">User Role</label>
              <select id="newUserRole" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-color);">
                <option value="user">Normal User (Sales Executive)</option>
                <option value="admin">Super Admin</option>
              </select>
            </div>
            <div class="form-group" style="margin:0; display:flex; align-items:center; gap:0.5rem; padding-top:1.25rem;">
              <input type="checkbox" id="newUserAllowBackup" style="width:18px; height:18px; cursor:pointer;">
              <label for="newUserAllowBackup" style="font-size: 0.82rem; font-weight: 600; cursor:pointer; color:var(--text-color);">Allow Data Backup & Sync Permissions</label>
            </div>
            <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button type="submit" class="btn btn-primary" style="background: #0284c7; border: none; padding: 0.5rem 1.25rem; font-weight: 700;">
                <i class="ri-user-add-fill"></i> Save New User Account
              </button>
            </div>
          </form>
        </div>

        <!-- Users Table Section -->
        <div>
          <h4 style="font-size: 0.95rem; margin: 0 0 0.75rem; color: var(--text-color); display: flex; align-items: center; gap: 0.4rem;">
            <i class="ri-group-line"></i> Registered System Users & Passwords
          </h4>
          <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;" id="adminUsersListTable">
              <!-- Rendered dynamically -->
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- SUPER ADMIN EDIT USER MODAL -->
  <div class="modal-overlay no-print" id="editUserModal">
    <div class="modal-card" style="max-width: 550px; width: 92%; border-radius: 16px; background: var(--bg-card); color: var(--text-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; padding: 0;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0f172a 100%); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="ri-edit-box-fill" style="font-size: 1.4rem; color: #38bdf8;"></i>
          <div>
            <h3 style="font-size: 1.1rem; margin: 0; color: white;">Edit Executive Account & Designation</h3>
            <p style="font-size: 0.78rem; opacity: 0.85; margin: 0;">User ID: <span id="editUserIdDisplay" style="font-weight:700;"></span></p>
          </div>
        </div>
        <button class="btn-icon" onclick="closeEditUserModal()" style="color: white;"><i class="ri-close-line"></i></button>
      </div>

      <div style="padding: 1.5rem;">
        <form id="editUserForm" onsubmit="handleEditUserSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="editUserIdHidden">

          <div class="form-group" style="margin:0;">
            <label style="font-size: 0.82rem; font-weight: 600;">Full Executive Name</label>
            <input type="text" id="editUserNameInput" required style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
          </div>

          <div class="form-group" style="margin:0;">
            <label style="font-size: 0.82rem; font-weight: 600;">Executive Designation / Position</label>
            <input type="text" id="editUserDesignationInput" placeholder="e.g. Senior Sales Manager" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
          </div>

          <div class="form-group" style="margin:0;">
            <label style="font-size: 0.82rem; font-weight: 600;">Account Password</label>
            <input type="text" id="editUserPassInput" required style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
          </div>

          <div class="form-group" style="margin:0;">
            <label style="font-size: 0.82rem; font-weight: 600;">User Role</label>
            <select id="editUserRoleSelect" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-color);">
              <option value="user">Normal User (Sales Executive)</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>

          <div class="form-group" style="margin:0; display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" id="editUserAllowBackupCheckbox" style="width:18px; height:18px; cursor:pointer;">
            <label for="editUserAllowBackupCheckbox" style="font-size: 0.85rem; font-weight: 600; cursor:pointer; color:var(--text-color);">Allow Data Backup & Restore Permissions</label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeEditUserModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: #0284c7; border: none; font-weight: 700;">
              <i class="ri-save-line"></i> Save Account Revisions
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- SUPER ADMIN PUBLIC SHARE LINK GENERATOR MODAL -->
  <div class="modal-overlay no-print" id="publicShareModal">
    <div class="modal-card" style="max-width: 550px; width: 92%; border-radius: 16px; background: var(--bg-card); color: var(--text-color); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; padding: 0;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #0f172a 100%); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="ri-share-forward-fill" style="font-size: 1.5rem; color: #fef08a;"></i>
          <div>
            <h3 style="font-size: 1.15rem; margin: 0; color: white;">Shareable Public View Link</h3>
            <p style="font-size: 0.78rem; opacity: 0.88; margin: 0;">Allow public viewing & PDF downloading without password</p>
          </div>
        </div>
        <button class="btn-icon" onclick="closePublicShareModal()" style="color: white;"><i class="ri-close-line"></i></button>
      </div>

      <div style="padding: 1.5rem;">
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: var(--text-color);">
          <i class="ri-shield-check-line" style="color: #f59e0b; font-size: 1.1rem; vertical-align: middle;"></i>
          <strong>Public Read-Only Access:</strong> Anyone with this link can view the complete Super Admin Merged Overview & download PDF reports. All create, edit, and delete actions remain safely blocked.
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label style="font-size: 0.82rem; font-weight: 700;">Public Shareable URL Link</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="publicShareUrlInput" readonly style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--primary); font-weight: 700; font-family: monospace; font-size: 0.82rem;">
            <button class="btn btn-primary" onclick="copyPublicShareUrl()" style="background: #0284c7; border: none; white-space: nowrap; font-weight: 700;">
              <i class="ri-file-copy-line"></i> Copy Link
            </button>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
          <div>
            <div style="font-weight: 700; font-size: 0.85rem;">Master Public Link Switch</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Enable or disable public link access instantly</div>
          </div>
          <label class="switch" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="publicShareToggleCheckbox" onchange="handleTogglePublicShare(this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <span style="font-weight: 700; font-size: 0.85rem; color: #10b981;">Active (ON)</span>
          </label>
        </div>

        <!-- GRANULAR MODULE PERMISSIONS SECTION -->
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.88rem; margin: 0 0 0.75rem; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
            <i class="ri-toggle-line"></i> Select Sections Allowed for Public View (ON / OFF)
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>📊 Market Sales Reports</span>
              <input type="checkbox" id="pubModule_reportTab" onchange="handleTogglePublicModule('reportTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>👥 Customer Directory</span>
              <input type="checkbox" id="pubModule_customerTab" onchange="handleTogglePublicModule('customerTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>📖 Central Day Book</span>
              <input type="checkbox" id="pubModule_daybookTab" onchange="handleTogglePublicModule('daybookTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>🚗 Daily Conveyance</span>
              <input type="checkbox" id="pubModule_conveyanceTab" onchange="handleTogglePublicModule('conveyanceTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>🚘 Conveyance Report</span>
              <input type="checkbox" id="pubModule_conveyanceReportTab" onchange="handleTogglePublicModule('conveyanceReportTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>📒 Party Ledger</span>
              <input type="checkbox" id="pubModule_ledgerTab" onchange="handleTogglePublicModule('ledgerTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>🧾 Master Invoices</span>
              <input type="checkbox" id="pubModule_invoicesTab" onchange="handleTogglePublicModule('invoicesTab', this.checked)" style="width: 18px; height: 18px;">
            </label>

            <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;">
              <span>📦 Items & Pricing</span>
              <input type="checkbox" id="pubModule_itemTab" onchange="handleTogglePublicModule('itemTab', this.checked)" style="width: 18px; height: 18px;">
            </label>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          <span>Created Date: <strong id="publicShareCreatedDate" style="color: var(--text-color);">-</strong></span>
          <button class="btn btn-secondary btn-sm" onclick="handleRegeneratePublicToken()" style="color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08);" title="Revoke current token & create a new link">
            <i class="ri-refresh-line"></i> Regenerate Token (Revoke Old)
          </button>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="closePublicShareModal()">Close Window</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/html2pdf.bundle.min.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/customers.js"></script>
  <script src="js/items.js"></script>
  <script src="js/daybook.js"></script>
  <script src="js/conveyance.js"></script>
  <script src="js/reports.js"></script>
  <script src="js/ledger.js"></script>
  <script src="js/master_input.js"></script>
  <script src="js/invoices.js"></script>
  <script src="js/pwa.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
