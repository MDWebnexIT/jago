/* Market Sales Report & Customer Date-to-Date Product Analytics for Jago Corporation PLC */

let customerProductChartInstance = null;
let customerTrendChartInstance = null;

const ReportManager = {
  generateSalesReport() {
    const daybookEntries = DayBookManager.getDaybookEntries();
    const customers = CustomerManager.getCustomers();
    const items = Storage.get(STORAGE_KEYS.ITEMS);

    // 1. Zone-wise Analysis
    const zoneSalesMap = {};
    DHAKA_ZONES.forEach(z => {
      zoneSalesMap[z] = { zone: z, deliveryAmount: 0, collectionAmount: 0, count: 0 };
    });

    // Create lookup for customer shop -> zone
    const shopToZoneMap = {};
    customers.forEach(c => {
      shopToZoneMap[c.shopName.toLowerCase()] = c.zone;
    });

    daybookEntries.forEach(entry => {
      const partyLower = (entry.partyName || "").toLowerCase();
      let matchedZone = null;

      // Find zone for party
      for (const [shop, zone] of Object.entries(shopToZoneMap)) {
        if (partyLower.includes(shop) || shop.includes(partyLower)) {
          matchedZone = zone;
          break;
        }
      }

      if (!matchedZone) {
        // Search if zone name is explicitly in party name string
        DHAKA_ZONES.forEach(z => {
          if (partyLower.includes(z.toLowerCase())) matchedZone = z;
        });
      }

      if (matchedZone && zoneSalesMap[matchedZone]) {
        if (entry.type === 'delivery') {
          zoneSalesMap[matchedZone].deliveryAmount += parseFloat(entry.amount) || 0;
          zoneSalesMap[matchedZone].count += 1;
        } else if (entry.type === 'collection') {
          zoneSalesMap[matchedZone].collectionAmount += parseFloat(entry.amount) || 0;
        }
      }
    });

    // Render Zone-wise Table
    const zoneTbody = document.getElementById('zoneReportTableBody');
    if (zoneTbody) {
      zoneTbody.innerHTML = DHAKA_ZONES.map(z => {
        const data = zoneSalesMap[z];
        return `
          <tr>
            <td style="font-weight: 700;">${z}</td>
            <td style="font-weight: 600; color: var(--primary);">${formatBDT(data.deliveryAmount)}</td>
            <td style="font-weight: 600; color: var(--success);">${formatBDT(data.collectionAmount)}</td>
            <td><span class="badge badge-secondary">${data.count} deliveries</span></td>
          </tr>
        `;
      }).join('');
    }

    // 2. Product-wise Sales Analysis (Supports multi-item entries)
    const productSalesMap = {};
    items.forEach(i => {
      productSalesMap[i.id] = { name: i.name, category: i.category, qtySold: 0, totalRevenue: 0 };
    });

    daybookEntries.filter(e => e.type === 'delivery').forEach(e => {
      if (e.items && Array.isArray(e.items) && e.items.length > 0) {
        e.items.forEach(it => {
          if (it.itemId && productSalesMap[it.itemId]) {
            productSalesMap[it.itemId].qtySold += parseFloat(it.qty) || 0;
            productSalesMap[it.itemId].totalRevenue += parseFloat(it.subtotal) || 0;
          }
        });
      } else if (e.itemId && productSalesMap[e.itemId]) {
        productSalesMap[e.itemId].qtySold += parseFloat(e.qty) || 0;
        productSalesMap[e.itemId].totalRevenue += parseFloat(e.amount) || 0;
      }
    });

    const productTbody = document.getElementById('productReportTableBody');
    if (productTbody) {
      productTbody.innerHTML = Object.values(productSalesMap).map(p => `
        <tr>
          <td style="font-weight: 700;">${p.name}</td>
          <td><span class="badge badge-primary">${p.category}</span></td>
          <td style="font-weight: 600;">${p.qtySold} pcs</td>
          <td style="font-weight: 700; color: var(--success);">${formatBDT(p.totalRevenue)}</td>
        </tr>
      `).join('');
    }

    // 3. Customer Ledger Summary
    const customerLedgerMap = {};
    customers.forEach(c => {
      customerLedgerMap[c.shopName] = { shopName: c.shopName, zone: c.zone, delivered: 0, collected: 0 };
    });

    daybookEntries.forEach(e => {
      if (e.partyName && customerLedgerMap[e.partyName]) {
        if (e.type === 'delivery') customerLedgerMap[e.partyName].delivered += parseFloat(e.amount) || 0;
        if (e.type === 'collection') customerLedgerMap[e.partyName].collected += parseFloat(e.amount) || 0;
      }
    });

    const customerTbody = document.getElementById('customerLedgerTableBody');
    if (customerTbody) {
      customerTbody.innerHTML = Object.values(customerLedgerMap).map(c => {
        const balance = c.delivered - c.collected;
        return `
          <tr>
            <td style="font-weight: 700;">${c.shopName}</td>
            <td><span class="badge badge-primary">${c.zone}</span></td>
            <td>${formatBDT(c.delivered)}</td>
            <td>${formatBDT(c.collected)}</td>
            <td style="font-weight: 700; color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${formatBDT(balance)}
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render Date-to-Date Customer Report
    this.renderCustomerDateToDateReport();
  },

  handleCustReportPresetChange(presetVal) {
    const fromInput = document.getElementById('custReportFromDate');
    const toInput = document.getElementById('custReportToDate');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (!fromInput || !toInput) return;

    if (presetVal === 'last3months') {
      const d = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      fromInput.value = d.toISOString().split('T')[0];
      toInput.value = todayStr;
    } else if (presetVal === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      fromInput.value = d.toISOString().split('T')[0];
      toInput.value = todayStr;
    } else if (presetVal === 'lastMonth') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      fromInput.value = first.toISOString().split('T')[0];
      toInput.value = last.toISOString().split('T')[0];
    } else if (presetVal === 'allTime') {
      fromInput.value = '2026-01-01';
      toInput.value = todayStr;
    }

    this.renderCustomerDateToDateReport();
  },

  renderCustomerDateToDateReport() {
    const custSelect = document.getElementById('custReportSelect');
    const fromInput = document.getElementById('custReportFromDate');
    const toInput = document.getElementById('custReportToDate');

    if (!custSelect) return;

    // Set default dates if empty (Default: Last 3 Months)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (fromInput && !fromInput.value) {
      const d3 = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      fromInput.value = d3.toISOString().split('T')[0];
    }
    if (toInput && !toInput.value) {
      toInput.value = todayStr;
    }

    const selectedCustomer = custSelect.value;
    const fromDate = fromInput ? fromInput.value : "2026-01-01";
    const toDate = toInput ? toInput.value : todayStr;

    const daybookEntries = DayBookManager.getDaybookEntries();

    // Filter entries by customer and date range
    const filteredEntries = daybookEntries.filter(entry => {
      if (selectedCustomer && selectedCustomer !== 'ALL' && entry.partyName !== selectedCustomer) return false;
      if (entry.date < fromDate || entry.date > toDate) return false;
      return true;
    });

    // Sort by date ascending
    filteredEntries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    let totalDelivered = 0;
    let totalCollected = 0;
    let totalUnits = 0;
    const productStats = {}; // { itemName: { qty: 0, revenue: 0 } }

    filteredEntries.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      if (e.type === 'delivery') {
        totalDelivered += amt;

        if (e.items && Array.isArray(e.items) && e.items.length > 0) {
          e.items.forEach(it => {
            const q = parseFloat(it.qty) || 1;
            const sub = parseFloat(it.subtotal) || 0;
            totalUnits += q;

            const prodName = it.itemName || "Product Item";
            if (!productStats[prodName]) productStats[prodName] = { qty: 0, revenue: 0 };
            productStats[prodName].qty += q;
            productStats[prodName].revenue += sub;
          });
        } else {
          const q = parseFloat(e.qty) || 1;
          totalUnits += q;
          const prodName = e.itemName || "Product Item";
          if (!productStats[prodName]) productStats[prodName] = { qty: 0, revenue: 0 };
          productStats[prodName].qty += q;
          productStats[prodName].revenue += amt;
        }
      } else if (e.type === 'collection') {
        totalCollected += amt;
      }
    });

    // Find top purchased product for this customer
    let topProduct = "-";
    let maxQty = 0;
    Object.entries(productStats).forEach(([pName, stat]) => {
      if (stat.qty > maxQty) {
        maxQty = stat.qty;
        topProduct = `${pName} (${stat.qty} pcs)`;
      }
    });

    // Update Ticker Cards
    const delivElem = document.getElementById('custReportTotalDelivered');
    const collElem = document.getElementById('custReportTotalCollected');
    const balElem = document.getElementById('custReportBalance');
    const unitsElem = document.getElementById('custReportTotalUnits');
    const topElem = document.getElementById('custReportTopProduct');

    if (delivElem) delivElem.innerText = formatBDT(totalDelivered);
    if (collElem) collElem.innerText = formatBDT(totalCollected);
    if (balElem) {
      const bal = totalDelivered - totalCollected;
      balElem.innerText = formatBDT(bal);
      balElem.style.color = bal > 0 ? 'var(--danger)' : 'var(--success)';
    }
    if (unitsElem) unitsElem.innerText = `${totalUnits} pcs`;
    if (topElem) topElem.innerText = topProduct;

    // Render Main Statement Table
    const tbody = document.getElementById('custReportTableBody');
    if (tbody) {
      if (filteredEntries.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              No order/delivery transactions found for ${selectedCustomer && selectedCustomer !== 'ALL' ? selectedCustomer : 'all customers'} from ${formatDate(fromDate)} to ${formatDate(toDate)}.
            </td>
          </tr>`;
      } else {
        const typeBadges = {
          collection: '<span class="badge badge-success">Collection</span>',
          delivery: '<span class="badge badge-primary">Delivery</span>',
          cashInHand: '<span class="badge badge-warning">Cash in Hand</span>',
          orderInHand: '<span class="badge badge-secondary">Order in Hand</span>'
        };

        tbody.innerHTML = filteredEntries.map(e => {
          const itemFormatted = DayBookManager.formatItemDetailsHTML(e);

          return `
            <tr>
              <td style="font-weight:700;">${formatDate(e.date)}</td>
              <td>${e.time}</td>
              <td>${typeBadges[e.type] || e.type}</td>
              <td>
                ${itemFormatted || '-'}
              </td>
              <td style="font-weight:600;">${e.items && e.items.length > 0 ? `${e.items.reduce((s,i)=>s+(i.qty||0), 0)} pcs total` : (e.qty ? `${e.qty} pcs` : '-')}</td>
              <td>${e.unitPrice ? formatBDT(e.unitPrice) : '-'}</td>
              <td style="font-weight:700; color:${e.type === 'delivery' ? 'var(--primary)' : 'var(--success)'};">${formatBDT(e.amount)}</td>
              <td style="font-size:0.82rem; color:var(--text-muted);">${e.remark || e.paymentMethod || '-'}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Chart 1: 3-Month / Date-to-Date Sales vs Collection Trend Chart
    this.renderCustomerTrendChart(filteredEntries, fromDate, toDate);

    // Render Chart 2: Product Buying Chart & Breakdown List
    this.renderCustomerProductChart(productStats, totalUnits);
  },

  renderCustomerProductChart(productStats, totalUnits) {
    const listContainer = document.getElementById('customerProductBreakdownList');
    const canvas = document.getElementById('customerProductChart');

    const productNames = Object.keys(productStats);
    const productQuantities = productNames.map(p => productStats[p].qty);
    const productRevenues = productNames.map(p => productStats[p].revenue);

    // Render Breakdown Progress Bars HTML
    if (listContainer) {
      if (productNames.length === 0) {
        listContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No product purchases in this period.</div>`;
      } else {
        listContainer.innerHTML = productNames.map((pName, idx) => {
          const qty = productQuantities[idx];
          const rev = productRevenues[idx];
          const pct = totalUnits > 0 ? Math.round((qty / totalUnits) * 100) : 0;
          return `
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                <strong style="color: var(--text-main);">${pName}</strong>
                <span style="color: var(--primary); font-weight: 700;">${qty} pcs (${pct}%) - ${formatBDT(rev)}</span>
              </div>
              <div style="background: rgba(255,255,255,0.1); border-radius: 10px; height: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #0284c7, #2dd4bf); height: 100%; width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Canvas Chart using Chart.js if available
    if (canvas && typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      if (customerProductChartInstance) {
        customerProductChartInstance.destroy();
      }

      if (productNames.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      customerProductChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: productNames,
          datasets: [
            {
              label: 'Quantity Bought (Pcs)',
              data: productQuantities,
              backgroundColor: 'rgba(2, 132, 199, 0.7)',
              borderColor: '#0284c7',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Revenue (৳)',
              data: productRevenues,
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: '#10b981',
              borderWidth: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: 'Outfit, sans-serif' } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.datasetIndex === 1) {
                    label += formatBDT(context.raw);
                  } else {
                    label += context.raw + ' pcs';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              type: 'linear',
              position: 'left',
              ticks: { color: '#38bdf8', stepSize: 1 },
              grid: { color: 'rgba(255,255,255,0.05)' },
              title: { display: true, text: 'Quantity (pcs)', color: '#38bdf8' }
            },
            y1: {
              type: 'linear',
              position: 'right',
              ticks: { color: '#10b981' },
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Revenue (৳)', color: '#10b981' }
            }
          }
        }
      });
    }
  },

  renderMonthlyExecutiveReport() {
    const monthSelect = document.getElementById('monthlyReportMonthSelect');
    const searchInput = document.getElementById('monthlyReportSearchInput');
    const tbody = document.getElementById('monthlyReportTableBody');

    if (!tbody) return;

    const defaultMonth = typeof getLocalMonthString === 'function' ? getLocalMonthString() : new Date().toISOString().slice(0, 7);
    let selectedMonth = monthSelect && monthSelect.value ? monthSelect.value : defaultMonth;

    const daybookEntries = DayBookManager.getDaybookEntries();
    const customers = CustomerManager.getCustomers();
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    // Filter daybook entries for selected month YYYY-MM or ALL
    const monthEntries = selectedMonth === 'ALL' 
      ? daybookEntries 
      : daybookEntries.filter(e => e.date && e.date.startsWith(selectedMonth));

    let grandSales = 0;
    let grandCollection = 0;
    let grandCashInHand = 0;
    let grandNetDue = 0;

    const partyStats = {};

    customers.forEach(c => {
      let initialBal = 0;
      if (c.openingBalance) {
        initialBal = c.balanceType === 'credit' ? -parseFloat(c.openingBalance) : parseFloat(c.openingBalance);
      }

      partyStats[c.shopName] = {
        id: c.id,
        shopName: c.shopName,
        zone: c.zone,
        lastDate: '',
        openingBalance: initialBal,
        monthlySales: 0,
        monthlyCollection: 0,
        cashInHand: 0,
        netDue: initialBal
      };
    });

    // Include any party in daybook
    daybookEntries.forEach(e => {
      if (e.partyName && !partyStats[e.partyName]) {
        partyStats[e.partyName] = {
          id: 'temp-' + Math.random(),
          shopName: e.partyName,
          zone: 'Dhaka',
          lastDate: '',
          openingBalance: 0,
          monthlySales: 0,
          monthlyCollection: 0,
          cashInHand: 0,
          netDue: 0
        };
      }
    });

    // Calculate historical balances before this month (if month is specific)
    if (selectedMonth !== 'ALL') {
      daybookEntries.forEach(e => {
        if (!e.partyName || !partyStats[e.partyName]) return;
        const amt = parseFloat(e.amount) || 0;

        if (e.date < `${selectedMonth}-01`) {
          if (e.type === 'delivery') partyStats[e.partyName].openingBalance += amt;
          else if (e.type === 'collection') partyStats[e.partyName].openingBalance -= amt;
        }
      });
    }

    // Calculate month entries
    monthEntries.forEach(e => {
      if (!e.partyName || !partyStats[e.partyName]) return;
      const amt = parseFloat(e.amount) || 0;
      const stat = partyStats[e.partyName];

      if (!stat.lastDate || e.date > stat.lastDate) {
        stat.lastDate = e.date;
      }

      if (e.type === 'delivery') {
        stat.monthlySales += amt;
      } else if (e.type === 'collection') {
        stat.monthlyCollection += amt;
      } else if (e.type === 'cashInHand') {
        stat.cashInHand += amt;
      }
    });

    const tableRows = [];

    Object.values(partyStats).forEach(stat => {
      stat.netDue = stat.openingBalance + stat.monthlySales - stat.monthlyCollection;

      // Search term filter
      if (searchTerm && !stat.shopName.toLowerCase().includes(searchTerm) && !stat.zone.toLowerCase().includes(searchTerm)) {
        return;
      }

      // Display party in report table if party has activity, due balance, or if no search filter is entered
      if (stat.monthlySales > 0 || stat.monthlyCollection > 0 || stat.cashInHand > 0 || Math.abs(stat.netDue) > 0.01 || !searchTerm) {
        grandSales += stat.monthlySales;
        grandCollection += stat.monthlyCollection;
        grandCashInHand += stat.cashInHand;
        if (stat.netDue > 0) grandNetDue += stat.netDue;

        let statusBadge = '<span class="badge badge-success">Clear / Paid</span>';
        if (stat.cashInHand > 0 && stat.netDue <= 0) {
          statusBadge = `<span class="badge badge-warning">Cash Pending (${formatBDT(stat.cashInHand)})</span>`;
        } else if (stat.netDue > 0 && stat.monthlyCollection === 0) {
          statusBadge = '<span class="badge badge-danger">Uncollected Due</span>';
        } else if (stat.netDue > 0) {
          statusBadge = '<span class="badge badge-primary">Partial Due</span>';
        }

        tableRows.push(`
          <tr>
            <td><strong style="color: var(--text-main);">${stat.shopName}</strong></td>
            <td><span class="badge badge-primary">${stat.zone}</span></td>
            <td>${stat.lastDate ? formatDate(stat.lastDate) : '-'}</td>
            <td style="font-weight: 700; color: var(--primary);">${formatBDT(stat.monthlySales)}</td>
            <td style="font-weight: 700; color: var(--success);">${formatBDT(stat.monthlyCollection)}</td>
            <td style="font-weight: 600; color: var(--warning);">${stat.cashInHand > 0 ? formatBDT(stat.cashInHand) : '-'}</td>
            <td style="font-weight: 800; color: ${stat.netDue > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${formatBDT(stat.netDue)}
            </td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" onclick="ReportManager.selectCustomerForLedger('${stat.shopName}')" title="View Customer Ledger">
                <i class="ri-booklet-line"></i> Ledger
              </button>
            </td>
          </tr>
        `);
      }
    });

    // Update Summary Tickers
    const salesElem = document.getElementById('monthlyReportTotalSales');
    const collElem = document.getElementById('monthlyReportTotalCollection');
    const cashElem = document.getElementById('monthlyReportCashInHand');
    const dueElem = document.getElementById('monthlyReportTotalDue');

    if (salesElem) salesElem.innerText = formatBDT(grandSales);
    if (collElem) collElem.innerText = formatBDT(grandCollection);
    if (cashElem) cashElem.innerText = formatBDT(grandCashInHand);
    if (dueElem) dueElem.innerText = formatBDT(grandNetDue);

    if (tableRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No sales, collection, or outstanding due records found for ${selectedMonth}.
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = tableRows.join('');
    }
  },

  selectCustomerForLedger(shopName) {
    const ledgerTabBtn = document.querySelector('.nav-item[data-tab="ledgerTab"]');
    if (ledgerTabBtn) ledgerTabBtn.click();

    const custSelect = document.getElementById('ledgerCustomerSelect');
    if (custSelect) {
      custSelect.value = shopName;
      LedgerManager.renderLedgerView();
    }
  },

  printMonthlyExecutiveReport() {
    window.print();
  },

  downloadMonthlyExecutiveReportPDF() {
    const monthSelect = document.getElementById('monthlyReportMonthSelect');
    const mVal = monthSelect && monthSelect.value ? monthSelect.value : 'Monthly_Summary';
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('reportTab', `Jago_Executive_Monthly_Sales_Report_${mVal}.pdf`);
    } else {
      window.print();
    }
  },

  renderCustomerTrendChart(filteredEntries, fromDate, toDate) {
    const canvas = document.getElementById('customerTrendChart');
    if (!canvas) return;

    // Aggregate entries by month or date
    const trendMap = {}; // { 'Sep 2026': { sales: 0, collection: 0 } }
    filteredEntries.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!trendMap[key]) trendMap[key] = { sales: 0, collection: 0 };

      const amt = parseFloat(e.amount) || 0;
      if (e.type === 'delivery') trendMap[key].sales += amt;
      if (e.type === 'collection') trendMap[key].collection += amt;
    });

    const labels = Object.keys(trendMap);
    const salesData = labels.map(k => trendMap[k].sales);
    const collectionData = labels.map(k => trendMap[k].collection);

    if (typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      if (customerTrendChartInstance) {
        customerTrendChartInstance.destroy();
      }

      if (labels.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      customerTrendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Delivered Sales (৳)',
              data: salesData,
              backgroundColor: 'rgba(2, 132, 199, 0.85)',
              borderColor: '#0284c7',
              borderWidth: 1,
              borderRadius: 6
            },
            {
              label: 'Money Collection (৳)',
              data: collectionData,
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: 'Outfit, sans-serif', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  return `${ctx.dataset.label}: ${formatBDT(ctx.raw)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      });
    }
  },

  printCustomerReport() {
    window.print();
  },

  downloadCustomerReportPDF() {
    const custSelect = document.getElementById('custReportSelect');
    const custName = custSelect && custSelect.value ? custSelect.value.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
    const dateStr = new Date().toISOString().split('T')[0];
    if (typeof downloadElementAsPDF === 'function') {
      downloadElementAsPDF('customerMarketReportPrintableArea', `Jago_Customer_Market_Sales_Report_${custName}_${dateStr}.pdf`);
    } else {
      window.print();
    }
  }
};
