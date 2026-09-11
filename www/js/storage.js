/* Storage & Data Management for Jago Corporation PLC */

const STORAGE_KEYS = {
  USERS: 'jago_users_v1',
  SESSION: 'jago_session_v1',
  ADMIN_SCOPE: 'jago_admin_scope_v1',
  PUBLIC_SHARE: 'jago_public_share_config_v1',
  CUSTOMERS: 'jago_customers_v1',
  ITEMS: 'jago_items_v1',
  PRICE_LOGS: 'jago_price_logs_v1',
  OPENING_BALANCE_LOGS: 'jago_opening_balance_logs_v1',
  DAYBOOK: 'jago_daybook_v1',
  CONVEYANCE: 'jago_conveyance_v1',
  CONVEYANCE_LOCATIONS: 'jago_conveyance_locations_v1',
  THEME: 'jago_theme_v1'
};

const DEFAULT_USERS = [
  {
    userId: "nazmul",
    pass: "N@azmul",
    name: "Md Nazmul Hasan",
    role: "user",
    designation: "Senior Sales & Marketing Executive",
    allowBackup: true,
    dateCreated: "2026-01-01"
  },
  {
    userId: "jagoadmin",
    pass: "J@agoadmin",
    name: "Super Admin",
    role: "admin",
    designation: "System Administrator",
    allowBackup: true,
    dateCreated: "2026-01-01"
  }
];

const SessionManager = {
  getUsers() {
    return Storage.get(STORAGE_KEYS.USERS, DEFAULT_USERS);
  },
  saveUsers(users) {
    Storage.set(STORAGE_KEYS.USERS, users);
  },
  getPublicShareConfig() {
    const defaultConfig = {
      enabled: true,
      token: 'jagopublic2026',
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: 'jagoadmin',
      defaultVersion: 'v3_universal_share',
      modules: {
        daybookTab: true,
        reportTab: true,
        customerTab: false,
        conveyanceTab: false,
        conveyanceReportTab: false,
        ledgerTab: false,
        invoicesTab: false,
        itemTab: false,
        masterInputTab: false
      }
    };
    let config = Storage.get(STORAGE_KEYS.PUBLIC_SHARE, null);
    if (!config) {
      Storage.set(STORAGE_KEYS.PUBLIC_SHARE, defaultConfig);
      return defaultConfig;
    }
    if (!config.token || config.defaultVersion !== 'v3_universal_share') {
      config.defaultVersion = 'v3_universal_share';
      if (!config.token || config.token.startsWith('pub_share_')) {
        config.token = 'jagopublic2026';
      }
      Storage.set(STORAGE_KEYS.PUBLIC_SHARE, config);
    }
    return config;
  },
  savePublicShareConfig(config) {
    config.defaultVersion = 'v3_universal_share';
    Storage.set(STORAGE_KEYS.PUBLIC_SHARE, config);
  },
  isPublicModuleAllowed(tabId) {
    if (!this.isPublicViewMode()) return true;
    const config = this.getPublicShareConfig();
    if (!config || config.enabled !== true) return false;
    if (!config.modules) return (tabId === 'daybookTab' || tabId === 'reportTab');
    return config.modules[tabId] === true;
  },
  generatePublicShareToken() {
    const config = this.getPublicShareConfig();
    config.token = 'pub_share_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4);
    config.createdDate = new Date().toISOString().split('T')[0];
    config.enabled = true;
    this.savePublicShareConfig(config);
    return config;
  },
  isPublicViewMode() {
    return sessionStorage.getItem('jago_public_view_active') === 'true';
  },
  setPublicViewSession(active) {
    if (active) {
      sessionStorage.setItem('jago_public_view_active', 'true');
    } else {
      sessionStorage.removeItem('jago_public_view_active');
    }
  },
  getCurrentUser() {
    if (this.isPublicViewMode()) {
      return {
        userId: 'public_view',
        name: 'Public Executive Overview',
        role: 'admin',
        designation: 'Read-Only Mode (No Password)',
        isPublicView: true
      };
    }
    const session = Storage.get(STORAGE_KEYS.SESSION, null);
    if (session && session.userId) {
      const users = this.getUsers();
      const found = users.find(u => u.userId.toLowerCase() === session.userId.toLowerCase());
      if (found) {
        return found;
      }
      return session;
    }
    return null;
  },
  setCurrentUser(user) {
    this.setPublicViewSession(false);
    Storage.set(STORAGE_KEYS.SESSION, {
      userId: user.userId,
      name: user.name,
      role: user.role,
      designation: user.designation || (user.role === 'admin' ? 'Super Admin' : 'Sales Executive'),
      allowBackup: user.userId.toLowerCase() === 'nazmul' || user.role === 'admin' || user.allowBackup === true
    });
  },
  canUserBackup(user = null) {
    const u = user || this.getCurrentUser();
    if (!u || u.isPublicView) return false;
    const cleanId = (u.userId || '').toLowerCase();
    if (cleanId === 'nazmul' || u.role === 'admin' || u.allowBackup === true) {
      return true;
    }
    return false;
  },
  getAdminScope() {
    if (this.isPublicViewMode()) return 'ALL';
    const scope = localStorage.getItem(STORAGE_KEYS.ADMIN_SCOPE) || 'ALL';
    if (scope === 'ALL') return 'ALL';
    const users = this.getUsers();
    if (!users.some(u => u.userId.toLowerCase() === scope.toLowerCase())) {
      return 'ALL';
    }
    return scope;
  },
  setAdminScope(scope) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SCOPE, scope);
  },
  authenticate(userId, pass) {
    const users = this.getUsers();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanPass = (pass || "").trim();
    const matched = users.find(u => u.userId.toLowerCase() === cleanId && u.pass === cleanPass);
    if (matched) {
      this.setCurrentUser(matched);
      return matched;
    }
    return null;
  },
  logout() {
    this.setPublicViewSession(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  addUser(userData) {
    const users = this.getUsers();
    const cleanId = userData.userId.trim().toLowerCase();
    if (users.some(u => u.userId.toLowerCase() === cleanId)) {
      return { success: false, message: `User ID "${userData.userId}" already exists.` };
    }
    const newUser = {
      userId: userData.userId.trim(),
      pass: userData.pass.trim(),
      name: userData.name.trim(),
      designation: userData.designation ? userData.designation.trim() : (userData.role === 'admin' ? 'Super Admin' : 'Sales Executive'),
      role: userData.role || 'user',
      allowBackup: userData.userId.toLowerCase() === 'nazmul' || userData.role === 'admin' || userData.allowBackup === true,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  },
  updateUser(userId, updatedFields) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.userId.toLowerCase() === userId.toLowerCase());
    if (index !== -1) {
      const isMaster = users[index].userId.toLowerCase() === 'nazmul' || users[index].userId.toLowerCase() === 'jagoadmin';
      users[index] = {
        ...users[index],
        name: updatedFields.name ? updatedFields.name.trim() : users[index].name,
        designation: updatedFields.designation ? updatedFields.designation.trim() : users[index].designation,
        pass: updatedFields.pass ? updatedFields.pass.trim() : users[index].pass,
        role: isMaster ? users[index].role : (updatedFields.role || users[index].role),
        allowBackup: isMaster ? true : (typeof updatedFields.allowBackup === 'boolean' ? updatedFields.allowBackup : users[index].allowBackup)
      };
      this.saveUsers(users);

      const current = this.getCurrentUser();
      if (current && current.userId.toLowerCase() === userId.toLowerCase()) {
        this.setCurrentUser(users[index]);
      }
      return { success: true, user: users[index] };
    }
    return { success: false, message: "User account not found." };
  },
  toggleUserBackupPermission(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    if (user) {
      if (user.userId.toLowerCase() === 'nazmul' || user.role === 'admin') {
        return { success: false, message: 'Master user and admin backup permissions cannot be revoked.' };
      }
      user.allowBackup = !(user.allowBackup === true);
      this.saveUsers(users);
      return { success: true, allowBackup: user.allowBackup };
    }
    return { success: false, message: 'User not found.' };
  },
  deleteUser(userId) {
    let users = this.getUsers();
    if (userId.toLowerCase() === 'nazmul' || userId.toLowerCase() === 'jagoadmin') {
      return { success: false, message: 'Default master system accounts cannot be deleted.' };
    }
    users = users.filter(u => u.userId.toLowerCase() !== userId.toLowerCase());
    this.saveUsers(users);
    return { success: true };
  }
};

function filterRecordsByUserScope(records, isConveyance = false, overrideUserId = null) {
  if (!Array.isArray(records)) return [];
  const currentUser = SessionManager.getCurrentUser();
  if (!currentUser) return records;
  
  if (currentUser.role === 'admin') {
    const scope = overrideUserId || SessionManager.getAdminScope();
    
    if (isConveyance) {
      const targetUser = (scope === 'ALL') ? 'nazmul' : scope;
      return records.filter(r => (r.userId || '').toLowerCase() === targetUser.toLowerCase() || (!r.userId && targetUser.toLowerCase() === 'nazmul') || (r.userId || '').toLowerCase() === 'jagoadmin');
    }
    
    if (scope === 'ALL') {
      return records;
    } else {
      return records.filter(r => (r.userId || '').toLowerCase() === scope.toLowerCase() || (!r.userId && scope.toLowerCase() === 'nazmul'));
    }
  } else {
    const uid = (currentUser.userId || '').toLowerCase();
    return records.filter(r => {
      const recordUser = (r.userId || '').toLowerCase();
      if (uid === 'nazmul') {
        return recordUser === 'nazmul' || recordUser === 'jagoadmin' || !recordUser;
      } else {
        return recordUser === uid;
      }
    });
  }
}

const DEFAULT_LOCATIONS = [
  "Office (Motijheel)",
  "Gulisthan Market",
  "New Market",
  "Jatrabari Bus Stand",
  "Badda Link Road",
  "Malibugh Chawk",
  "Bonani Road 11",
  "Gulshan 1 Circle",
  "Mirpur 10 Circle",
  "Mirpur 1 Bus Stop",
  "Uttara Sector 3",
  "Stadium Market Gulisthan",
  "Nowabpur",
  "Bank / CRM  (Motijheel)",
  "Polton",
  "Bata Signal",
  "Head office (51, Central Road)"
];

const DHAKA_ZONES = [
  "Gulisthan",
  "New Market",
  "Jatrabari",
  "Badda",
  "Malibugh",
  "Bonani",
  "Gulshan",
  "Mirpur 10",
  "Mirpur 1",
  "Uttora"
];

// Authentic Restored Seed Data from Jago_Sales_Backup_2026-09-06.json
const DEFAULT_ITEMS = [
  {
    "id": "item-h3oodzvyn",
    "name": "PP 190 gm 20 inch",
    "price": 70,
    "category": "Filter Cartridge",
    "details": "",
    "dateAdded": "2026-09-04"
  },
  {
    "id": "item-ly72owps4",
    "name": "PP 120gm 10 inch",
    "price": 42,
    "category": "Filter Cartridge",
    "details": "",
    "dateAdded": "2026-09-04"
  },
  {
    "id": "item-8k2calrid",
    "name": "Osmo Smart",
    "price": 7300,
    "category": "Purifier System",
    "details": "Blue/White",
    "dateAdded": "2026-09-04"
  },
  {
    "id": "item-1",
    "name": "RO 105",
    "price": 7500,
    "category": "Purifier System",
    "dateAdded": "2026-01-01",
    "details": "(5-Stage Water Purifier System)"
  },
  {
    "id": "item-2",
    "name": "PP  90 gm 10 Inch",
    "price": 32,
    "category": "Filter Cartridge",
    "dateAdded": "2026-01-01",
    "details": "Sediment Filter"
  },
  {
    "id": "item-3",
    "name": "CTO  10 Inch",
    "price": 83,
    "category": "Filter Cartridge",
    "dateAdded": "2026-01-01",
    "details": "Carbon Block Filter"
  },
  {
    "id": "item-4",
    "name": "GAC  10 Inch",
    "price": 83,
    "category": "Filter Cartridge",
    "dateAdded": "2026-01-01",
    "details": "Granular Carbon Filter"
  }
];
const DEFAULT_CUSTOMERS = [
  {
    "id": "cust-n1y54a2cv",
    "shopName": "Al Karim water purifier",
    "ownerName": "Ali hasan",
    "address": "32/1, 1st floor, 6th gate, Shundorbon square market, gulisthan, Dhaka.",
    "phone": "01976708484",
    "bin": "",
    "nid": "",
    "zone": "Gulshan",
    "userId": "nazmul"
  },
  {
    "id": "cust-14meooown",
    "shopName": "Water source and electronic",
    "ownerName": "Md Sumon Lashkar",
    "address": "11/1, 12, Kazi Abdul Hamid Lane, North South Road, Dhaka, Bangladesh",
    "phone": "01703188291",
    "bin": "",
    "nid": "",
    "zone": "Gulisthan",
    "openingBalance": -14000,
    "balanceType": "credit",
    "openingBalanceDate": "2026-09-04",
    "openingBalanceNote": "",
    "userId": "nazmul"
  },
  {
    "id": "cust-1",
    "shopName": "Rajdhani electronics",
    "ownerName": "Md Faisal",
    "address": "Shop 36, national stadium market",
    "phone": "01716284747",
    "bin": "",
    "nid": "",
    "zone": "Gulisthan",
    "openingBalance": 16600,
    "balanceType": "debit",
    "openingBalanceDate": "2026-09-04",
    "openingBalanceNote": "",
    "userId": "nazmul"
  },
  {
    "id": "cust-5",
    "shopName": "Ss water technology",
    "ownerName": "Shipikur Rahman Rubel",
    "address": "149, kaptan bajar complex, bhaban 02, nawabpur, Dhaka,",
    "phone": "01712134550",
    "bin": "",
    "nid": "2398815233",
    "zone": "Gulisthan",
    "openingBalance": 17900,
    "balanceType": "debit",
    "openingBalanceDate": "2026-09-05",
    "openingBalanceNote": "",
    "userId": "nazmul"
  }
];
const DEFAULT_PRICE_LOGS = [
  {
    "id": "log-4hije5wod",
    "itemId": "item-h3oodzvyn",
    "itemName": "PP 190 gm 20 inch",
    "oldPrice": 0,
    "newPrice": 70,
    "effectiveDate": "2026-09-04",
    "note": "Item Created",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-s2k2uhgt2",
    "itemId": "item-ly72owps4",
    "itemName": "PP 120gm 10 inch",
    "oldPrice": 0,
    "newPrice": 42,
    "effectiveDate": "2026-09-04",
    "note": "Item Created",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-psxzucvje",
    "itemId": "item-8k2calrid",
    "itemName": "Osmo Smart",
    "oldPrice": 0,
    "newPrice": 7300,
    "effectiveDate": "2026-09-04",
    "note": "Item Created",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-rxek2ukea",
    "itemId": "item-4",
    "itemName": "GAC  10 Inch",
    "oldPrice": 400,
    "newPrice": 83,
    "effectiveDate": "2026-09-04",
    "note": "Price Edit",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-bigdngxp4",
    "itemId": "item-1",
    "itemName": "RO 105",
    "oldPrice": 18500,
    "newPrice": 7500,
    "effectiveDate": "2026-09-04",
    "note": "Price Edit",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-p8jegy6x9",
    "itemId": "item-2",
    "itemName": "PP Sediment Filter 10 Inch",
    "oldPrice": 32,
    "newPrice": 32,
    "effectiveDate": "2026-07-01",
    "note": "Price revision effective from 04 Sept 2026",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-txvx4eis9",
    "itemId": "item-3",
    "itemName": "CTO Carbon Block Filter 10 Inch",
    "oldPrice": 350,
    "newPrice": 83,
    "effectiveDate": "2026-09-01",
    "note": "Price revision effective from 04 Sept 2026",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-mn3cjlh9c",
    "itemId": "item-2",
    "itemName": "PP Sediment Filter 10 Inch",
    "oldPrice": 250,
    "newPrice": 32,
    "effectiveDate": "2026-09-04",
    "note": "Price revision effective from 04 Sept 2026",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-7do3yfdq8",
    "itemId": "item-1",
    "itemName": "RO 6-Stage Water Purifier System",
    "oldPrice": 18500,
    "newPrice": 18500,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-2643v4wxv",
    "itemId": "item-2",
    "itemName": "PP Sediment Filter 10 Inch",
    "oldPrice": 250,
    "newPrice": 250,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-vto84ajo3",
    "itemId": "item-3",
    "itemName": "CTO Carbon Block Filter 10 Inch",
    "oldPrice": 350,
    "newPrice": 350,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-53yvic039",
    "itemId": "item-4",
    "itemName": "GAC Granular Carbon Filter 10 Inch",
    "oldPrice": 400,
    "newPrice": 400,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-jfm8lzown",
    "itemId": "item-5",
    "itemName": "RO Membrane 75 GPD (Filmtec)",
    "oldPrice": 1650,
    "newPrice": 1650,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-drl81reqs",
    "itemId": "item-6",
    "itemName": "Post Carbon T33 Inline Filter",
    "oldPrice": 450,
    "newPrice": 450,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-rgm7n22ai",
    "itemId": "item-7",
    "itemName": "UV Sterilizer Lamp Assembly 6W",
    "oldPrice": 1200,
    "newPrice": 1200,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-sdwy6u7zb",
    "itemId": "item-8",
    "itemName": "Water Booster Pump 24V DC",
    "oldPrice": 2200,
    "newPrice": 2200,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  },
  {
    "id": "log-rom89n7c8",
    "itemId": "item-9",
    "itemName": "Gooseneck Faucet (SS 304)",
    "oldPrice": 650,
    "newPrice": 650,
    "effectiveDate": "2026-01-01",
    "note": "Initial Price Set",
    "updatedBy": "Md Nazmul Hasan (nazmul)"
  }
];
const DEFAULT_OPENING_BALANCE_LOGS = [
  {
    "id": "bal-log-31nrnm3gw",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 0,
    "oldType": "debit",
    "newBalance": 8000,
    "newType": "debit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T21:57:47.338Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-7i7xdfcgb",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 8000,
    "oldType": "debit",
    "newBalance": 8000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:13:17.172Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-5uf2obit3",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 8000,
    "oldType": "credit",
    "newBalance": 0,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:13:43.879Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-emim0hxk0",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 0,
    "oldType": "credit",
    "newBalance": -8000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:14:04.522Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-ix4sh9m7f",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": -8000,
    "oldType": "credit",
    "newBalance": 8000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:17:47.392Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-f7pb66vm2",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 8000,
    "oldType": "credit",
    "newBalance": 0,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:17:57.616Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-orkwml1oe",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 0,
    "oldType": "credit",
    "newBalance": -24000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:18:44.439Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-4gn047mn6",
    "customerId": "cust-14meooown",
    "shopName": "Water source and electronic",
    "oldBalance": 0,
    "oldType": "debit",
    "newBalance": -91275,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:21:00.912Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-bjssixdb9",
    "customerId": "cust-14meooown",
    "shopName": "Water source and electronic",
    "oldBalance": -91275,
    "oldType": "credit",
    "newBalance": -14000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:28:38.973Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-rd1zm0ehb",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": -24000,
    "oldType": "credit",
    "newBalance": 0,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:32:38.884Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-zzgopsszv",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 0,
    "oldType": "credit",
    "newBalance": 16000,
    "newType": "credit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:38:10.567Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-ecby4macj",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 16000,
    "oldType": "credit",
    "newBalance": 16000,
    "newType": "debit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:38:18.288Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-w7cmf3r37",
    "customerId": "cust-1",
    "shopName": "Rajdhani electronics",
    "oldBalance": 16000,
    "oldType": "debit",
    "newBalance": 16600,
    "newType": "debit",
    "effectiveDate": "2026-09-04",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-04T22:38:34.762Z",
    "userId": "nazmul"
  },
  {
    "id": "bal-log-d4xma10im",
    "customerId": "cust-5",
    "shopName": "Ss water technology",
    "oldBalance": 0,
    "oldType": "debit",
    "newBalance": 17900,
    "newType": "debit",
    "effectiveDate": "2026-09-05",
    "note": "Opening balance updated",
    "updatedAt": "2026-09-05T14:22:43.889Z",
    "userId": "nazmul"
  }
];
const DEFAULT_DAYBOOK = [
  {
    "id": "db-dif349qqe",
    "date": "2026-09-01",
    "type": "collection",
    "time": "10: 50 AM",
    "partyName": "Ss water technology",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 17900,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: Modhumoti 475",
    "userId": "nazmul"
  },
  {
    "id": "db-kq4yajmu7",
    "date": "2026-09-01",
    "type": "collection",
    "time": "10:50 AM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 16600,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: Modhumoti 475",
    "userId": "nazmul"
  },
  {
    "id": "db-0uya128fw",
    "date": "2026-09-01",
    "type": "orderInHand",
    "time": "12:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      },
      {
        "itemId": "item-ly72owps4",
        "itemName": "PP 120gm 10 inch",
        "qty": 200,
        "unitPrice": 42,
        "subtotal": 8400
      },
      {
        "itemId": "item-h3oodzvyn",
        "itemName": "PP 190 gm 20 inch",
        "qty": 100,
        "unitPrice": 70,
        "subtotal": 7000
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 31400,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-ihk6043ns",
    "date": "2026-09-02",
    "type": "delivery",
    "time": "12:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "83",
    "vatInvoiceNo": "77",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-h3oodzvyn",
        "itemName": "PP 190 gm 20 inch",
        "qty": 100,
        "unitPrice": 70,
        "subtotal": 7000
      },
      {
        "itemId": "item-ly72owps4",
        "itemName": "PP 120gm 10 inch",
        "qty": 200,
        "unitPrice": 42,
        "subtotal": 8400
      },
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      }
    ],
    "itemId": "item-h3oodzvyn",
    "itemName": "PP 190 gm 20 inch",
    "qty": 100,
    "unitPrice": 70,
    "amount": 31400,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-xefywyu48",
    "date": "2026-09-02",
    "type": "delivery",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "84",
    "vatInvoiceNo": "78",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-3",
        "itemName": "CTO  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      },
      {
        "itemId": "item-4",
        "itemName": "GAC  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      }
    ],
    "itemId": "item-3",
    "itemName": "CTO  10 Inch",
    "qty": 125,
    "unitPrice": 83,
    "amount": 20750,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-aa4blf8wq",
    "date": "2026-09-02",
    "type": "collection",
    "time": "1:30  PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "77",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 31400,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: 475",
    "userId": "nazmul"
  },
  {
    "id": "db-rgjkczh1b",
    "date": "2026-09-02",
    "type": "collection",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "84",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 20750,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: 475",
    "userId": "nazmul"
  },
  {
    "id": "db-2hddsu64a",
    "date": "2026-09-03",
    "type": "delivery",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "89",
    "vatInvoiceNo": "89",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 16000,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-8pz1xl4yb",
    "date": "2026-09-03",
    "type": "delivery",
    "time": "12:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "90",
    "vatInvoiceNo": "82",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-3",
        "itemName": "CTO  10 Inch",
        "qty": 150,
        "unitPrice": 83,
        "subtotal": 12450
      },
      {
        "itemId": "item-4",
        "itemName": "GAC  10 Inch",
        "qty": 150,
        "unitPrice": 83,
        "subtotal": 12450
      },
      {
        "itemId": "item-h3oodzvyn",
        "itemName": "PP 190 gm 20 inch",
        "qty": 100,
        "unitPrice": 70,
        "subtotal": 7000
      }
    ],
    "itemId": "item-3",
    "itemName": "CTO  10 Inch",
    "qty": 150,
    "unitPrice": 83,
    "amount": 31900,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-27mkmyu4e",
    "date": "2026-09-03",
    "type": "collection",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 14000,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: 475",
    "userId": "nazmul"
  },
  {
    "id": "db-sdjtvsm7z",
    "date": "2026-09-05",
    "type": "collection",
    "time": "4:30 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "89",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 16000,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: Modhumuti 475",
    "userId": "nazmul"
  },
  {
    "id": "db-gozk2z7x1",
    "date": "2026-09-05",
    "type": "collection",
    "time": "4:35 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "90",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 24000,
    "paymentMethod": "Bank Deposit",
    "remark": "Bank/Deposit: bank 475",
    "userId": "nazmul"
  },
  {
    "id": "db-frxnrxs6t",
    "date": "2026-09-05",
    "type": "cashInHand",
    "time": "3:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "90",
    "vatInvoiceNo": "",
    "recipientPerson": "In My Hand (Sales Exec)",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 900,
    "paymentMethod": "Cash",
    "remark": "partially paid 25000 whare bank 24000",
    "userId": "nazmul"
  },
  {
    "id": "db-yv4ibyo7y",
    "date": "2026-09-05",
    "type": "orderInHand",
    "time": "12:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 16000,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-u5dtwdh7o",
    "date": "2026-09-05",
    "type": "orderInHand",
    "time": "12:30 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "",
    "vatInvoiceNo": "",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      },
      {
        "itemId": "item-3",
        "itemName": "CTO  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      },
      {
        "itemId": "item-4",
        "itemName": "GAC  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 36750,
    "paymentMethod": "Cash",
    "remark": "Delivery tomorrow",
    "userId": "nazmul"
  },
  {
    "id": "db-dq6kjx4hz",
    "date": "2026-09-06",
    "type": "delivery",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "95",
    "vatInvoiceNo": "87",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      },
      {
        "itemId": "item-3",
        "itemName": "CTO  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      },
      {
        "itemId": "item-4",
        "itemName": "GAC  10 Inch",
        "qty": 125,
        "unitPrice": 83,
        "subtotal": 10375
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 36750,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-f4uouqyxk",
    "date": "2026-09-06",
    "type": "delivery",
    "time": "12:30 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "93",
    "vatInvoiceNo": "86",
    "recipientPerson": "",
    "items": [
      {
        "itemId": "item-2",
        "itemName": "PP  90 gm 10 Inch",
        "qty": 500,
        "unitPrice": 32,
        "subtotal": 16000
      }
    ],
    "itemId": "item-2",
    "itemName": "PP  90 gm 10 Inch",
    "qty": 500,
    "unitPrice": 32,
    "amount": 16000,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-080a5ane7",
    "date": "2026-09-06",
    "type": "cashInHand",
    "time": "12:20 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "95",
    "vatInvoiceNo": "",
    "recipientPerson": "Office Person: Jahid vai Nogod",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 6500,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-qn5aarli5",
    "date": "2026-09-06",
    "type": "cashInHand",
    "time": "12:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "95",
    "vatInvoiceNo": "",
    "recipientPerson": "Office Person: Jahid vai Bikash",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 6500,
    "paymentMethod": "Cash",
    "remark": "Jahid vai, \u09ac\u09bf\u0995\u09be\u09b6",
    "userId": "nazmul"
  },
  {
    "id": "db-841zypopf",
    "date": "2026-09-06",
    "type": "cashInHand",
    "time": "04:00 PM",
    "partyName": "Water source and electronic",
    "invoiceNo": "95",
    "vatInvoiceNo": "",
    "recipientPerson": "Accounts Dept (Office)",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 10000,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  },
  {
    "id": "db-2drhb18vv",
    "date": "2026-09-06",
    "type": "cashInHand",
    "time": "04:00 PM",
    "partyName": "Rajdhani electronics",
    "invoiceNo": "90",
    "vatInvoiceNo": "",
    "recipientPerson": "Accounts Dept (Office)",
    "items": [],
    "itemId": "",
    "itemName": "",
    "qty": 1,
    "unitPrice": 0,
    "amount": 7900,
    "paymentMethod": "Cash",
    "remark": "",
    "userId": "nazmul"
  }
];
const DEFAULT_CONVEYANCE = [
  {
    "id": "conv-ew6f4uy19",
    "date": "2026-09-05",
    "fromLocation": "Stadium Market Gulisthan",
    "toLocation": "Nowabpur",
    "transport": "Bus",
    "purpose": "Market visit",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-q8iiv5vdr",
    "date": "2026-09-05",
    "fromLocation": "Bank / CRM  (Motijheel)",
    "toLocation": "Stadium Market Gulisthan",
    "transport": "Rickshaw",
    "purpose": "Market visit",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-0kuc3u2i8",
    "date": "2026-09-05",
    "fromLocation": "Stadium Market Gulisthan",
    "toLocation": "Bank / CRM  (Motijheel)",
    "transport": "Rickshaw",
    "purpose": "Payment deposit to bank 475",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-yrxpgdtk4",
    "date": "2026-09-05",
    "fromLocation": "Nowabpur",
    "toLocation": "Stadium Market Gulisthan",
    "transport": "Bus",
    "purpose": "Order Collection",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-imywj4dbj",
    "date": "2026-09-03",
    "fromLocation": "Bata Signal",
    "toLocation": "Nowabpur",
    "transport": "Bus",
    "purpose": "Sales & Collection Visit",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-mjlhoo4a3",
    "date": "2026-09-03",
    "fromLocation": "Head office (51, Central Road)",
    "toLocation": "Bata Signal",
    "transport": "Rickshaw",
    "purpose": "Sales & Collection Visit",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-60rcmrd3r",
    "date": "2026-09-03",
    "fromLocation": "Bata Signal",
    "toLocation": "Head office (51, Central Road)",
    "transport": "Rickshaw",
    "purpose": "Sales & Collection Visit",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-983talxan",
    "date": "2026-09-03",
    "fromLocation": "Polton",
    "toLocation": "Bata Signal",
    "transport": "Bus",
    "purpose": "Sales & Collection Visit",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-8w2a7qe5r",
    "date": "2026-09-03",
    "fromLocation": "Bank / CRM  (Motijheel)",
    "toLocation": "Polton",
    "transport": "Rickshaw",
    "purpose": "Going to Head office for burying some products ED sir",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-v362ugd9j",
    "date": "2026-09-03",
    "fromLocation": "Stadium Market Gulisthan",
    "toLocation": "Bank / CRM  (Motijheel)",
    "transport": "Rickshaw",
    "purpose": "Payment deposit to  bank",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-0d1zynq1y",
    "date": "2026-09-03",
    "fromLocation": "Nowabpur",
    "toLocation": "Stadium Market Gulisthan",
    "transport": "Bus",
    "purpose": "Order Collection",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-bzt5y8ly4",
    "date": "2026-09-02",
    "fromLocation": "Bank / CRM  (Motijheel)",
    "toLocation": "Nowabpur",
    "transport": "Rickshaw",
    "purpose": "Market",
    "amount": 40,
    "userId": "nazmul"
  },
  {
    "id": "conv-px5sx166r",
    "date": "2026-09-02",
    "fromLocation": "Nowabpur",
    "toLocation": "Bank / CRM  (Motijheel)",
    "transport": "Rickshaw",
    "purpose": "Sales & Collection Visit",
    "amount": 40,
    "userId": "nazmul"
  },
  {
    "id": "conv-o31984uhr",
    "date": "2026-09-02",
    "fromLocation": "Stadium Market Gulisthan",
    "toLocation": "Nowabpur",
    "transport": "Bus",
    "purpose": "Payment collection",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-mpbwejipc",
    "date": "2026-09-02",
    "fromLocation": "Nowabpur",
    "toLocation": "Stadium Market Gulisthan",
    "transport": "Bus",
    "purpose": "Order collection and payment collection",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-ief7cgxct",
    "date": "2026-09-01",
    "fromLocation": "Bata signal",
    "toLocation": "Gulistan",
    "transport": "Bus",
    "purpose": "Water source",
    "amount": 10,
    "userId": "nazmul"
  },
  {
    "id": "conv-1eacmywxp",
    "date": "2026-09-01",
    "fromLocation": "Head office",
    "toLocation": "Bata signal",
    "transport": "Rickshaw",
    "purpose": "Order collection",
    "amount": 30,
    "userId": "nazmul"
  },
  {
    "id": "conv-j63xcmyv9",
    "date": "2026-09-01",
    "fromLocation": "Head office",
    "toLocation": "Gulisan",
    "transport": "Bus",
    "purpose": "Go to water source",
    "amount": 20,
    "userId": "nazmul"
  },
  {
    "id": "conv-09tlptaey",
    "date": "2026-09-01",
    "fromLocation": "Bata signal",
    "toLocation": "Head office",
    "transport": "Rickshaw",
    "purpose": "Sales & Collection Visit",
    "amount": 30,
    "userId": "nazmul"
  }
];

// Helper Functions
const Storage = {
  get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (key !== 'jago_lifetime_backup_v1') {
        this.autoSaveLifetimeBackup();
      }
      this.pushToPhpServer();
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  autoSaveLifetimeBackup() {
    try {
      const snapshot = {
        version: "1.0_LIFETIME",
        timestamp: new Date().toISOString(),
        users: this.get(STORAGE_KEYS.USERS, DEFAULT_USERS),
        customers: this.get(STORAGE_KEYS.CUSTOMERS, []),
        items: this.get(STORAGE_KEYS.ITEMS, []),
        priceLogs: this.get(STORAGE_KEYS.PRICE_LOGS, []),
        openingBalanceLogs: this.get(STORAGE_KEYS.OPENING_BALANCE_LOGS, []),
        daybook: this.get(STORAGE_KEYS.DAYBOOK, []),
        conveyance: this.get(STORAGE_KEYS.CONVEYANCE, []),
        conveyanceLocations: this.get(STORAGE_KEYS.CONVEYANCE_LOCATIONS, [])
      };
      localStorage.setItem('jago_lifetime_backup_v1', JSON.stringify(snapshot));
    } catch (e) {
      console.error('Auto lifetime backup error:', e);
    }
  },

  async syncWithPhpServer(isBackground = false) {
    try {
      let url = 'api.php?action=load';
      if (typeof jagoWpVars !== 'undefined' && jagoWpVars.ajaxUrl) {
        url = jagoWpVars.ajaxUrl + '?action=jago_load_data';
      }
      const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.daybook) && data.daybook.length > 0) {
          const currentDaybookStr = localStorage.getItem(STORAGE_KEYS.DAYBOOK) || '';
          const newDaybookStr = JSON.stringify(data.daybook);

          if (currentDaybookStr !== newDaybookStr || !localStorage.getItem(STORAGE_KEYS.DAYBOOK)) {
            if (Array.isArray(data.customers)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
            if (Array.isArray(data.items)) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data.items));
            if (Array.isArray(data.priceLogs)) localStorage.setItem(STORAGE_KEYS.PRICE_LOGS, JSON.stringify(data.priceLogs));
            if (Array.isArray(data.openingBalanceLogs)) localStorage.setItem(STORAGE_KEYS.OPENING_BALANCE_LOGS, JSON.stringify(data.openingBalanceLogs));
            if (Array.isArray(data.daybook)) localStorage.setItem(STORAGE_KEYS.DAYBOOK, JSON.stringify(data.daybook));
            if (Array.isArray(data.conveyance)) localStorage.setItem(STORAGE_KEYS.CONVEYANCE, JSON.stringify(data.conveyance));
            if (Array.isArray(data.conveyanceLocations)) localStorage.setItem(STORAGE_KEYS.CONVEYANCE_LOCATIONS, JSON.stringify(data.conveyanceLocations));
            if (Array.isArray(data.users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
            
            this.autoSaveLifetimeBackup();

            if (isBackground && typeof refreshCurrentTabContent === 'function') {
              refreshCurrentTabContent();
            }
          }
        }
      }
    } catch (e) {
      // Standalone or non-PHP mode
    }
  },

  startAutoPollingSync(intervalMs = 8000) {
    if (this._pollingStarted) return;
    this._pollingStarted = true;

    const runSync = async () => {
      await this.syncWithPhpServer(true);
    };

    setInterval(runSync, intervalMs);
    window.addEventListener('focus', runSync);
  },

  async pushToPhpServer() {
    try {
      let url = 'api.php?action=save';
      if (typeof jagoWpVars !== 'undefined' && jagoWpVars.ajaxUrl) {
        url = jagoWpVars.ajaxUrl + '?action=jago_save_data';
      }
      const payload = {
        version: "1.0",
        appName: "Jago Corporation PLC Sales & Marketing Management",
        exportDate: new Date().toISOString(),
        users: this.get(STORAGE_KEYS.USERS, DEFAULT_USERS),
        customers: this.get(STORAGE_KEYS.CUSTOMERS, []),
        items: this.get(STORAGE_KEYS.ITEMS, []),
        priceLogs: this.get(STORAGE_KEYS.PRICE_LOGS, []),
        openingBalanceLogs: this.get(STORAGE_KEYS.OPENING_BALANCE_LOGS, []),
        daybook: this.get(STORAGE_KEYS.DAYBOOK, []),
        conveyance: this.get(STORAGE_KEYS.CONVEYANCE, []),
        conveyanceLocations: this.get(STORAGE_KEYS.CONVEYANCE_LOCATIONS, [])
      };
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Standalone mode
    }
  },
  resetToDefaultBackupData() {
    this.set(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
    this.set(STORAGE_KEYS.ITEMS, DEFAULT_ITEMS);
    this.set(STORAGE_KEYS.PRICE_LOGS, DEFAULT_PRICE_LOGS);
    this.set(STORAGE_KEYS.OPENING_BALANCE_LOGS, DEFAULT_OPENING_BALANCE_LOGS);
    this.set(STORAGE_KEYS.DAYBOOK, DEFAULT_DAYBOOK);
    this.set(STORAGE_KEYS.CONVEYANCE, DEFAULT_CONVEYANCE);
    this.set(STORAGE_KEYS.CONVEYANCE_LOCATIONS, DEFAULT_LOCATIONS);
    localStorage.setItem('jago_data_seed_version_v7', 'LOADED_2026_09_06_AUTHENTIC');
    this.autoSaveLifetimeBackup();
  },

  init() {
    this.syncWithPhpServer();
    this.startAutoPollingSync();

    // Check for lifetime auto-backup snapshot first before defaulting
    const lifetimeBackupRaw = localStorage.getItem('jago_lifetime_backup_v1');
    const hasExistingData = localStorage.getItem(STORAGE_KEYS.DAYBOOK) || localStorage.getItem(STORAGE_KEYS.CUSTOMERS);

    if (!hasExistingData && lifetimeBackupRaw) {
      try {
        const backup = JSON.parse(lifetimeBackupRaw);
        if (backup && Array.isArray(backup.daybook)) {
          if (Array.isArray(backup.customers)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(backup.customers));
          if (Array.isArray(backup.items)) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(backup.items));
          if (Array.isArray(backup.priceLogs)) localStorage.setItem(STORAGE_KEYS.PRICE_LOGS, JSON.stringify(backup.priceLogs));
          if (Array.isArray(backup.openingBalanceLogs)) localStorage.setItem(STORAGE_KEYS.OPENING_BALANCE_LOGS, JSON.stringify(backup.openingBalanceLogs));
          if (Array.isArray(backup.daybook)) localStorage.setItem(STORAGE_KEYS.DAYBOOK, JSON.stringify(backup.daybook));
          if (Array.isArray(backup.conveyance)) localStorage.setItem(STORAGE_KEYS.CONVEYANCE, JSON.stringify(backup.conveyance));
          if (Array.isArray(backup.conveyanceLocations)) localStorage.setItem(STORAGE_KEYS.CONVEYANCE_LOCATIONS, JSON.stringify(backup.conveyanceLocations));
          if (Array.isArray(backup.users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backup.users));
        }
      } catch (e) {
        console.error('Failed to restore from lifetime backup:', e);
      }
    }

    const seedVersion = localStorage.getItem('jago_data_seed_version_v7');
    if (!seedVersion && !hasExistingData && !lifetimeBackupRaw) {
      this.resetToDefaultBackupData();
    } else if (!seedVersion) {
      localStorage.setItem('jago_data_seed_version_v7', 'LOADED_2026_09_06_AUTHENTIC');
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }

    // Migration pass: Ensure all existing seed records are explicitly tagged under 'nazmul' if missing or tagged as 'jagoadmin'
    ['CUSTOMERS', 'DAYBOOK', 'CONVEYANCE', 'OPENING_BALANCE_LOGS'].forEach(keyName => {
      const k = STORAGE_KEYS[keyName];
      let itemsList = this.get(k, []);
      if (itemsList && itemsList.length > 0) {
        let modified = false;
        itemsList.forEach(item => {
          if (!item.userId || item.userId.toLowerCase() === 'jagoadmin') {
            item.userId = 'nazmul';
            modified = true;
          }
        });
        if (modified) this.set(k, itemsList);
      }
    });

    // Ensure lifetime backup is initialized
    this.autoSaveLifetimeBackup();
  },

  getSavedLocations() {
    return this.get(STORAGE_KEYS.CONVEYANCE_LOCATIONS, DEFAULT_LOCATIONS);
  },

  saveConveyanceLocation(locName) {
    if (!locName || !locName.trim()) return;
    const nameClean = locName.trim();
    const locs = this.getSavedLocations();
    if (!locs.some(l => l.toLowerCase() === nameClean.toLowerCase())) {
      locs.push(nameClean);
      this.set(STORAGE_KEYS.CONVEYANCE_LOCATIONS, locs);
    }
  }
};

// Currency Formatter for Bangladeshi Taka
function formatBDT(amount) {
  const num = parseFloat(amount) || 0;
  return "৳ " + num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Format Date for display
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Export / Backup Application Data (Full JSON Dump)
function exportAppData() {
  const data = {
    version: "1.0",
    appName: "Jago Corporation PLC Sales & Marketing Management",
    exportDate: new Date().toISOString(),
    customers: Storage.get(STORAGE_KEYS.CUSTOMERS, []),
    items: Storage.get(STORAGE_KEYS.ITEMS, []),
    priceLogs: Storage.get(STORAGE_KEYS.PRICE_LOGS, []),
    openingBalanceLogs: Storage.get(STORAGE_KEYS.OPENING_BALANCE_LOGS, []),
    daybook: Storage.get(STORAGE_KEYS.DAYBOOK, []),
    conveyance: Storage.get(STORAGE_KEYS.CONVEYANCE, []),
    conveyanceLocations: Storage.get(STORAGE_KEYS.CONVEYANCE_LOCATIONS, [])
  };
  
  const jsonStr = JSON.stringify(data, null, 2);
  const filenameDate = new Date().toISOString().split('T')[0];
  const filename = `Jago_Sales_Backup_${filenameDate}.json`;

  if (window.AndroidHost && typeof window.AndroidHost.downloadFile === 'function') {
    const base64Data = "data:application/json;base64," + btoa(unescape(encodeURIComponent(jsonStr)));
    window.AndroidHost.downloadFile(base64Data, filename, 'application/json');
    if (typeof showToast === 'function') {
      showToast('✅ Backup saved to Downloads folder!', 'success');
    }
  } else {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Import / Restore Application Data (Supports Full Overwrite & Smart Merge)
function importAppData(jsonFile, syncMode = 'overwrite', callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') {
        if (callback) callback(false, "Invalid JSON backup file structure.");
        return;
      }

      const currentUser = SessionManager.getCurrentUser();
      const targetUserId = (currentUser && currentUser.userId) ? currentUser.userId : 'nazmul';

      const tagWithUser = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(item => ({
          ...item,
          userId: item.userId || targetUserId
        }));
      };

      if (syncMode === 'overwrite') {
        if (Array.isArray(data.customers)) Storage.set(STORAGE_KEYS.CUSTOMERS, tagWithUser(data.customers));
        if (Array.isArray(data.items)) Storage.set(STORAGE_KEYS.ITEMS, data.items);
        if (Array.isArray(data.priceLogs)) Storage.set(STORAGE_KEYS.PRICE_LOGS, data.priceLogs);
        if (Array.isArray(data.openingBalanceLogs)) Storage.set(STORAGE_KEYS.OPENING_BALANCE_LOGS, tagWithUser(data.openingBalanceLogs));
        if (Array.isArray(data.daybook)) Storage.set(STORAGE_KEYS.DAYBOOK, tagWithUser(data.daybook));
        if (Array.isArray(data.conveyance)) Storage.set(STORAGE_KEYS.CONVEYANCE, tagWithUser(data.conveyance));
        if (Array.isArray(data.conveyanceLocations)) Storage.set(STORAGE_KEYS.CONVEYANCE_LOCATIONS, data.conveyanceLocations);
      } else {
        const mergeArraysById = (existingKey, incomingArr) => {
          if (!Array.isArray(incomingArr)) return;
          const current = Storage.get(existingKey, []);
          const currentIds = new Set(current.map(item => item.id || JSON.stringify(item)));
          tagWithUser(incomingArr).forEach(newItem => {
            const idVal = newItem.id || JSON.stringify(newItem);
            if (!currentIds.has(idVal)) {
              current.push(newItem);
              currentIds.add(idVal);
            }
          });
          Storage.set(existingKey, current);
        };

        mergeArraysById(STORAGE_KEYS.CUSTOMERS, data.customers);
        mergeArraysById(STORAGE_KEYS.ITEMS, data.items);
        mergeArraysById(STORAGE_KEYS.PRICE_LOGS, data.priceLogs);
        mergeArraysById(STORAGE_KEYS.OPENING_BALANCE_LOGS, data.openingBalanceLogs);
        mergeArraysById(STORAGE_KEYS.DAYBOOK, data.daybook);
        mergeArraysById(STORAGE_KEYS.CONVEYANCE, data.conveyance);
        
        if (Array.isArray(data.conveyanceLocations)) {
          data.conveyanceLocations.forEach(loc => Storage.saveConveyanceLocation(loc));
        }
      }

      Storage.autoSaveLifetimeBackup();
      if (callback) callback(true, "Database successfully updated & synchronized!");
    } catch (err) {
      if (callback) callback(false, "Failed to read backup file: " + err.message);
    }
  };
  reader.readAsText(jsonFile);
}

function openBackupRestoreModal() {
  const customers = Storage.get(STORAGE_KEYS.CUSTOMERS, []);
  const items = Storage.get(STORAGE_KEYS.ITEMS, []);
  const daybook = Storage.get(STORAGE_KEYS.DAYBOOK, []);
  const conveyance = Storage.get(STORAGE_KEYS.CONVEYANCE, []);

  const statsContainer = document.getElementById('backupStatsSummary');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <span style="background: rgba(2, 132, 199, 0.15); color: var(--primary); padding: 0.25rem 0.5rem; border-radius: 4px;">👥 ${customers.length} Customers</span>
      <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px;">📦 ${items.length} Products</span>
      <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 0.25rem 0.5rem; border-radius: 4px;">📖 ${daybook.length} Daybook Records</span>
      <span style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; padding: 0.25rem 0.5rem; border-radius: 4px;">🚗 ${conveyance.length} Conveyance Claims</span>
    `;
  }

  const statusBanner = document.getElementById('backupSyncStatusBanner');
  if (statusBanner) statusBanner.style.display = 'none';

  const fileInput = document.getElementById('backupFileInput');
  if (fileInput) fileInput.value = '';

  openModal('backupRestoreModal');
}

function handleBackupUploadSubmit() {
  const fileInput = document.getElementById('backupFileInput');
  const statusBanner = document.getElementById('backupSyncStatusBanner');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    if (statusBanner) {
      statusBanner.style.display = 'block';
      statusBanner.style.background = 'rgba(239, 68, 68, 0.15)';
      statusBanner.style.color = '#ef4444';
      statusBanner.innerHTML = '<i class="ri-error-warning-line"></i> Please select a valid `.json` backup file from your computer or phone.';
    }
    return;
  }

  const selectedFile = fileInput.files[0];
  const modeRadio = document.querySelector('input[name="importSyncMode"]:checked');
  const syncMode = modeRadio ? modeRadio.value : 'overwrite';

  if (statusBanner) {
    statusBanner.style.display = 'block';
    statusBanner.style.background = 'rgba(2, 132, 199, 0.15)';
    statusBanner.style.color = 'var(--primary)';
    statusBanner.innerHTML = '<i class="ri-loader-4-line"></i> Synchronizing database, please wait...';
  }

  importAppData(selectedFile, syncMode, (success, msg) => {
    if (success) {
      if (statusBanner) {
        statusBanner.style.background = 'rgba(16, 185, 129, 0.15)';
        statusBanner.style.color = '#10b981';
        statusBanner.innerHTML = `<i class="ri-checkbox-circle-line"></i> ${msg} Reloading views...`;
      }
      setTimeout(() => {
        CustomerManager.populateCustomerDropdowns();
        ItemManager.populateItemDropdowns();
        if (typeof refreshCurrentTabContent === 'function') refreshCurrentTabContent();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
        closeModal('backupRestoreModal');
      }, 1000);
    } else {
      if (statusBanner) {
        statusBanner.style.background = 'rgba(239, 68, 68, 0.15)';
        statusBanner.style.color = '#ef4444';
        statusBanner.innerHTML = `<i class="ri-close-circle-line"></i> ${msg}`;
      }
    }
  });
}

function handleForceResetBackupData() {
  if (confirm("Are you sure you want to restore the complete authentic Sept 06 dataset for Md Nazmul Hasan?")) {
    Storage.resetToDefaultBackupData();
    CustomerManager.populateCustomerDropdowns();
    ItemManager.populateItemDropdowns();
    if (typeof refreshCurrentTabContent === 'function') refreshCurrentTabContent();
    if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
    closeModal('backupRestoreModal');
    if (typeof showToast === 'function') {
      showToast('✅ Sept 06 Master Data successfully restored!', 'success');
    }
  }
}

