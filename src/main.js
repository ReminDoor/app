import './style.css';
import { connectMqtt, setAlertCallback, getMqttStatus } from './mqtt.js';
import { requestNotificationPermission, sendNotification } from './notifications.js';
import {
  getItems, addItem, removeItem,
  getEvents, addEvent, removeEvent,
  getMqttConfig, saveMqttConfig,
  formatDays, getTodayEvents,
} from './stores/items.js';

// ─── i18n ─────────────────────────────────────────────────────
const S = {
  en: {
    tab_items:'Items', tab_events:'Events', tab_settings:'Settings',
    items_title:'Your Items', items_sub:'Checked every time you leave',
    events_title:'Events', events_sub:'Extra reminders for specific days',
    settings_title:'Settings',
    add_item:'New Item', add_event:'New Event',
    lbl_name:'Name', lbl_icon:'Icon', lbl_days:'Days', lbl_type:'Type',
    lbl_time:'Time', lbl_datetime:'Date & Time',
    lbl_topic:'Topic', lbl_device:'Device ID', lbl_user:'Username', lbl_pass:'Password',
    type_weekly:'Weekly', type_once:'One-time',
    mac_hint:'Find this in your Bluetooth settings or nRF Connect app',
    optional:'optional',
    placeholder_name:'e.g. Wallet', placeholder_event:'e.g. Gym bag',
    cancel:'Cancel', save:'Save', close:'Close',
    btn_connect:'Save & Connect',
    btn_notif:'Enable Notifications',
    btn_sim:'Simulate leaving home',
    grp_connection:'Connection', grp_notifications:'Notifications',
    grp_language:'Language', grp_debug:'Debug', grp_about:'About',
    notif_desc:'Enable push notifications to receive alerts even when the app is in the background.',
    sim_desc:'Simulate a trigger from the hardware — useful for testing notifications.',
    concept_badge:'Concept Project',
    concept_text:'ReminDoor is a hardware concept currently in the prototyping phase. Not a commercial product.',
    link_legal:'Legal',
    offline:'Offline', connected:'Connected',
    ob_lang_title:'Choose your language', ob_lang_desc:'You can change this anytime in Settings.',
    ob_concept:'⚠ Concept project — not a commercial product',
    ob1_title:'You forget.\nWe don\'t.',
    ob1_desc:'ReminDoor detects when you leave home and alerts you about forgotten items — instantly.',
    ob2_title:'How it works',
    ob2_s1:'Place Bluetooth tags in your wallet, keys and bag',
    ob2_s2:'ReminDoor scans for them when you leave',
    ob2_s3:'Missing something? Push notification — instantly',
    ob3_title:'Quick setup',
    ob3_s1:'Add your items and their Bluetooth tag MAC address',
    ob3_s2:'Connect to your ReminDoor device via MQTT',
    ob3_s3:'Enable push notifications — done',
    ob_next:'Continue', ob_start:'Get started',
    alert_title:"Don't forget!", alert_sub:"You're leaving home",
    got_it:'Got it',
    d_mo:'Mo',d_tu:'Tu',d_we:'We',d_th:'Th',d_fr:'Fr',d_sa:'Sa',d_su:'Su',
    no_items:'No items yet — tap + to add your first',
    no_events:'No events yet',
    item_saved:'Item saved', event_saved:'Event saved',
    connecting:'Connecting…', conn_ok:'Connected!',
    conn_err:'Connection failed. Check URL and credentials.',
    err_name:'Please enter a name.',
    err_mac_empty:'Please enter the MAC address.',
    err_mac:'Invalid MAC. Format: AA:BB:CC:DD:EE:FF',
    err_days:'Select at least one day.',
    err_datetime:'Select a date and time.',
    err_url:'Please enter a broker URL.',
    err_topic:'Please enter a topic.',
    all_present:'✓ All items present!',
    status_present:'Present', status_missing:'Missing', status_unknown:'Unknown',
    legal_concept:'Concept project — not a registered business.',
    legal_privacy_title:'Privacy / Datenschutz',
    legal_p1:'Hosted via GitHub Pages. GitHub may collect technical data per their Privacy Policy.',
    legal_p2:'No personal data stored on our servers. Data is stored only locally in your browser.',
    legal_cookies_title:'Cookies & Storage',
    legal_p3:'No tracking cookies. No analytics. Only localStorage for saving your settings.',
    ble_title:'Find your MAC address',
    ble_s1_title:'Download nRF Connect',
    ble_s1_desc:'Free app by Nordic Semiconductor — available on iOS and Android',
    ble_s2_title:'Scan for devices',
    ble_s2_desc:'Open nRF Connect and tap "Scan". Hold your Bluetooth tag close to your phone.',
    ble_s3_title:'Copy the address',
    ble_s3_desc:'Your tag appears as a device. The MAC address looks like AA:BB:CC:DD:EE:FF — copy and paste it here.',
  },
  de: {
    tab_items:'Gegenstände', tab_events:'Events', tab_settings:'Einstellungen',
    items_title:'Deine Gegenstände', items_sub:'Wird jedes Mal geprüft wenn du gehst',
    events_title:'Events', events_sub:'Extra Erinnerungen für bestimmte Tage',
    settings_title:'Einstellungen',
    add_item:'Neuer Gegenstand', add_event:'Neues Event',
    lbl_name:'Name', lbl_icon:'Symbol', lbl_days:'Wochentage', lbl_type:'Typ',
    lbl_time:'Uhrzeit', lbl_datetime:'Datum & Uhrzeit',
    lbl_topic:'Topic', lbl_device:'Geräte-ID', lbl_user:'Benutzername', lbl_pass:'Passwort',
    type_weekly:'Wöchentlich', type_once:'Einmalig',
    mac_hint:'Zu finden in den Bluetooth-Einstellungen oder in der nRF Connect App',
    optional:'optional',
    placeholder_name:'z.B. Geldbeutel', placeholder_event:'z.B. Sporttasche',
    cancel:'Abbrechen', save:'Speichern', close:'Schließen',
    btn_connect:'Speichern & Verbinden',
    btn_notif:'Benachrichtigungen aktivieren',
    btn_sim:'Hausverlassen simulieren',
    grp_connection:'Verbindung', grp_notifications:'Benachrichtigungen',
    grp_language:'Sprache', grp_debug:'Debug', grp_about:'Über',
    notif_desc:'Aktiviere Push-Benachrichtigungen damit ReminDoor dich auch im Hintergrund erreichen kann.',
    sim_desc:'Simuliere einen Hardware-Auslöser — nützlich zum Testen.',
    concept_badge:'Konzeptprojekt',
    concept_text:'ReminDoor ist ein Hardware-Konzept aktuell in der Prototypenphase. Kein kommerzielles Produkt.',
    link_legal:'Impressum',
    offline:'Offline', connected:'Verbunden',
    ob_lang_title:'Sprache wählen', ob_lang_desc:'Du kannst das jederzeit in den Einstellungen ändern.',
    ob_concept:'⚠ Konzeptprojekt — kein kommerzielles Produkt',
    ob1_title:'Du vergisst.\nWir nicht.',
    ob1_desc:'ReminDoor erkennt wenn du das Haus verlässt und erinnert dich an vergessene Gegenstände — sofort.',
    ob2_title:'So funktioniert\'s',
    ob2_s1:'Bluetooth-Tags in Geldbeutel, Schlüssel und Tasche legen',
    ob2_s2:'ReminDoor scannt nach ihnen wenn du gehst',
    ob2_s3:'Fehlt etwas? Push-Benachrichtigung — sofort',
    ob3_title:'Schnell-Setup',
    ob3_s1:'Gegenstände mit ihrer Bluetooth-Tag-MAC-Adresse hinzufügen',
    ob3_s2:'Mit dem ReminDoor-Gerät via MQTT verbinden',
    ob3_s3:'Benachrichtigungen aktivieren — fertig',
    ob_next:'Weiter', ob_start:'Loslegen',
    alert_title:'Nicht vergessen!', alert_sub:'Du verlässt das Haus',
    got_it:'Verstanden',
    d_mo:'Mo',d_tu:'Di',d_we:'Mi',d_th:'Do',d_fr:'Fr',d_sa:'Sa',d_su:'So',
    no_items:'Noch keine Gegenstände — tippe + um den ersten hinzuzufügen',
    no_events:'Noch keine Events',
    item_saved:'Gegenstand gespeichert', event_saved:'Event gespeichert',
    connecting:'Verbinde…', conn_ok:'Verbunden!',
    conn_err:'Verbindung fehlgeschlagen. URL und Zugangsdaten prüfen.',
    err_name:'Bitte einen Namen eingeben.',
    err_mac_empty:'Bitte die MAC-Adresse eingeben.',
    err_mac:'Ungültige MAC. Format: AA:BB:CC:DD:EE:FF',
    err_days:'Mindestens einen Tag auswählen.',
    err_datetime:'Bitte Datum und Uhrzeit auswählen.',
    err_url:'Bitte eine Broker-URL eingeben.',
    err_topic:'Bitte ein Topic eingeben.',
    all_present:'✓ Alle Gegenstände dabei!',
    status_present:'Dabei', status_missing:'Fehlt', status_unknown:'Unbekannt',
    legal_concept:'Konzeptprojekt — kein eingetragenes Unternehmen.',
    legal_privacy_title:'Datenschutz / Privacy',
    legal_p1:'Gehostet via GitHub Pages. GitHub kann technische Daten erfassen gemäß ihrer Datenschutzrichtlinie.',
    legal_p2:'Keine personenbezogenen Daten auf unseren Servern. Daten werden nur lokal im Browser gespeichert.',
    legal_cookies_title:'Cookies & Speicher',
    legal_p3:'Keine Tracking-Cookies. Kein Analytics. Nur localStorage für deine Einstellungen.',
    ble_title:'MAC-Adresse finden',
    ble_s1_title:'nRF Connect herunterladen',
    ble_s1_desc:'Kostenlose App von Nordic Semiconductor — für iOS und Android verfügbar',
    ble_s2_title:'Nach Geräten scannen',
    ble_s2_desc:'nRF Connect öffnen und auf "Scan" tippen. Bluetooth-Tag nah ans Handy halten.',
    ble_s3_title:'Adresse kopieren',
    ble_s3_desc:'Dein Tag erscheint als Gerät. Die MAC-Adresse sieht so aus: AA:BB:CC:DD:EE:FF — kopieren und hier einfügen.',
  }
};

let lang = localStorage.getItem('rd_lang') || null;
function t(k){ return (S[lang]||S.en)[k] || k; }

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.dataset.i18n);
    el.innerHTML = v.replace(/\n/g,'<br>');
  });
  document.querySelectorAll('[data-ph]').forEach(el => {
    el.placeholder = t(el.dataset.ph);
  });
  // lang seg buttons
  document.getElementById('slang-en')?.classList.toggle('active', lang==='en');
  document.getElementById('slang-de')?.classList.toggle('active', lang==='de');
}

function setLang(l){ lang=l; localStorage.setItem('rd_lang',l); applyI18n(); renderItems(); renderEvents(); }

// ─── State ────────────────────────────────────────────────────
let selIcon = '👜';
let selDays = [];
let selEvType = 'weekly';

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!lang) { showOnboarding(); }
  else { applyI18n(); showApp(); }
});

// ─── Onboarding ───────────────────────────────────────────────
function showOnboarding(){
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  let step = 0;

  const goStep = n => {
    document.getElementById('ob-'+step).classList.remove('active');
    step = n;
    document.getElementById('ob-'+step).classList.add('active');
    applyI18n();
  };

  document.getElementById('ob-lang-en').onclick = () => { setLang('en'); goStep(1); };
  document.getElementById('ob-lang-de').onclick = () => { setLang('de'); goStep(1); };
  document.getElementById('ob-next-1').onclick  = () => goStep(2);
  document.getElementById('ob-next-2').onclick  = () => goStep(3);
  document.getElementById('ob-finish').onclick  = () => {
    localStorage.setItem('rd_onboarded','1');
    document.getElementById('onboarding').style.display = 'none';
    showApp();
  };
}

function showApp(){
  document.getElementById('app').style.display = 'flex';
  applyI18n();
  initTabs();
  initItemForm();
  initEventForm();
  initSettings();
  initModals();
  renderItems();
  renderEvents();
  loadMqttCfg();
  autoConnect();
  registerSW();
  setAlertCallback(handleAlert);
}

// ─── Tabs ─────────────────────────────────────────────────────
function initTabs(){
  document.querySelectorAll('.tabbar-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tabbar-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    };
  });
}

// ─── Item form ────────────────────────────────────────────────
function initItemForm(){
  const sheet = document.getElementById('add-item-sheet');

  document.getElementById('btn-add-item').onclick = () => {
    sheet.classList.toggle('open');
    if(sheet.classList.contains('open')) document.getElementById('item-name').focus();
  };

  document.getElementById('btn-cancel-item').onclick = () => { sheet.classList.remove('open'); clearItemForm(); };

  document.getElementById('btn-save-item').onclick = () => {
    const name = document.getElementById('item-name').value.trim();
    const mac  = document.getElementById('item-mac').value.trim();
    if(!name){ toast(t('err_name')); return; }
    if(!mac) { toast(t('err_mac_empty')); return; }
    if(!validMac(mac)){ toast(t('err_mac')); return; }
    addItem({name, mac, icon:selIcon});
    renderItems();
    sheet.classList.remove('open');
    clearItemForm();
    toast(t('item_saved'));
  };

  document.querySelectorAll('.icon-chip').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.icon-chip').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); selIcon = b.dataset.icon;
    };
  });

  // BLE scan button → show guide
  document.getElementById('btn-scan-ble').onclick = () => {
    document.getElementById('ble-guide-overlay').style.display = 'flex';
  };
}

function clearItemForm(){
  document.getElementById('item-name').value = '';
  document.getElementById('item-mac').value  = '';
  selIcon = '👜';
  document.querySelectorAll('.icon-chip').forEach((b,i)=>b.classList.toggle('active',i===0));
}

function validMac(m){ return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(m); }

// ─── Render items ─────────────────────────────────────────────
function renderItems(){
  const list = document.getElementById('item-list');
  const items = getItems();
  list.innerHTML = '';
  if(!items.length){
    list.innerHTML=`<li><div class="empty-card">${t('no_items')}</div></li>`;
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-row">
        <span class="item-row-icon">${item.icon}</span>
        <div class="item-row-info">
          <div class="item-row-name">${esc(item.name)}</div>
          <div class="item-row-mac">${esc(item.mac)}</div>
          <div class="item-row-status status-unknown" id="st-${item.id}">${t('status_unknown')}</div>
        </div>
        <button class="item-row-del" data-id="${item.id}">✕</button>
      </div>`;
    li.querySelector('.item-row-del').onclick = () => { removeItem(item.id); renderItems(); };
    list.appendChild(li);
  });
}

// ─── Event form ───────────────────────────────────────────────
function initEventForm(){
  const sheet = document.getElementById('add-event-sheet');

  document.getElementById('btn-add-event').onclick = () => {
    sheet.classList.toggle('open');
    if(sheet.classList.contains('open')) document.getElementById('event-name').focus();
  };

  document.getElementById('btn-cancel-event').onclick = () => { sheet.classList.remove('open'); clearEventForm(); };

  document.querySelectorAll('#ev-type-seg .seg-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#ev-type-seg .seg-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      selEvType = b.dataset.type;
      document.getElementById('ev-weekly').style.display = selEvType==='weekly'?'block':'none';
      document.getElementById('ev-once').style.display   = selEvType==='once'?'block':'none';
    };
  });

  document.querySelectorAll('#day-picker .day-chip').forEach(b => {
    b.onclick = () => {
      b.classList.toggle('active');
      const d = parseInt(b.dataset.day);
      selDays = selDays.includes(d) ? selDays.filter(x=>x!==d) : [...selDays,d];
    };
  });

  document.getElementById('btn-save-event').onclick = () => {
    const name = document.getElementById('event-name').value.trim();
    if(!name){ toast(t('err_name')); return; }
    if(selEvType==='weekly'){
      if(!selDays.length){ toast(t('err_days')); return; }
      addEvent({name, type:'weekly', days:selDays, time:document.getElementById('event-time').value||null});
    } else {
      const dt = document.getElementById('event-datetime').value;
      if(!dt){ toast(t('err_datetime')); return; }
      addEvent({name, type:'once', datetime:dt});
    }
    renderEvents();
    sheet.classList.remove('open');
    clearEventForm();
    toast(t('event_saved'));
  };
}

function clearEventForm(){
  document.getElementById('event-name').value = '';
  document.getElementById('event-time').value = '';
  document.getElementById('event-datetime').value = '';
  selDays=[]; selEvType='weekly';
  document.querySelectorAll('#day-picker .day-chip').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('#ev-type-seg .seg-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('ev-weekly').style.display='block';
  document.getElementById('ev-once').style.display='none';
}

// ─── Render events ────────────────────────────────────────────
function renderEvents(){
  const list = document.getElementById('event-list');
  const evs  = getEvents();
  list.innerHTML='';
  if(!evs.length){
    list.innerHTML=`<li><div class="empty-card">${t('no_events')}</div></li>`;
    return;
  }
  evs.forEach(ev => {
    const sub = ev.type==='once'
      ? new Date(ev.datetime).toLocaleString(lang==='de'?'de-DE':'en-US',{dateStyle:'medium',timeStyle:'short'})
      : formatDays(ev.days,lang)+(ev.time?' · '+ev.time:'');
    const li = document.createElement('li');
    li.innerHTML=`
      <div class="item-row">
        <span class="item-row-icon">${ev.type==='once'?'📅':'🔁'}</span>
        <div class="item-row-info">
          <div class="item-row-name">${esc(ev.name)}</div>
          <div class="item-row-mac">${sub}</div>
        </div>
        <button class="item-row-del" data-id="${ev.id}">✕</button>
      </div>`;
    li.querySelector('.item-row-del').onclick=()=>{removeEvent(ev.id);renderEvents();};
    list.appendChild(li);
  });
}

// ─── Settings ─────────────────────────────────────────────────
function initSettings(){
  document.getElementById('btn-save-mqtt').onclick = () => {
    const cfg = {
      url:      document.getElementById('mqtt-url').value.trim(),
      topic:    document.getElementById('mqtt-topic').value.trim(),
      deviceId: document.getElementById('mqtt-device').value.trim(),
      username: document.getElementById('mqtt-user').value.trim(),
      password: document.getElementById('mqtt-pass').value,
    };
    if(!cfg.url)  { toast(t('err_url'));   return; }
    if(!cfg.topic){ toast(t('err_topic')); return; }
    saveMqttConfig(cfg);
    connectMqtt(cfg);
    setStatus('mqtt-status', t('connecting'), '');
    setTimeout(()=>{
      const ok = getMqttStatus()==='connected';
      setStatus('mqtt-status', ok?t('conn_ok'):t('conn_err'), ok?'ok':'err');
    },3000);
  };

  document.getElementById('btn-notif').onclick = async () => {
    const {ok,msg} = await requestNotificationPermission();
    setStatus('notif-status', msg, ok?'ok':'err');
  };

  document.getElementById('btn-sim').onclick = simulateAlert;

  document.getElementById('slang-en').onclick = ()=>setLang('en');
  document.getElementById('slang-de').onclick = ()=>setLang('de');

  // header lang button
  document.getElementById('lang-btn').onclick = ()=>setLang(lang==='de'?'en':'de');
}

function loadMqttCfg(){
  const c = getMqttConfig();
  document.getElementById('mqtt-url').value    = c.url;
  document.getElementById('mqtt-topic').value  = c.topic;
  document.getElementById('mqtt-device').value = c.deviceId||'';
  document.getElementById('mqtt-user').value   = c.username;
  document.getElementById('mqtt-pass').value   = c.password;
}

function autoConnect(){
  const c = getMqttConfig();
  if(c.url&&c.topic) connectMqtt(c);
}

// ─── Modals ───────────────────────────────────────────────────
function initModals(){
  document.getElementById('link-impressum').onclick = e => {
    e.preventDefault();
    document.getElementById('impressum-overlay').style.display='flex';
  };
  document.getElementById('btn-close-impressum').onclick = ()=>{
    document.getElementById('impressum-overlay').style.display='none';
  };
  document.getElementById('impressum-overlay').onclick = e=>{
    if(e.target===e.currentTarget) e.currentTarget.style.display='none';
  };

  document.getElementById('btn-close-ble').onclick = ()=>{
    document.getElementById('ble-guide-overlay').style.display='none';
  };
  document.getElementById('ble-guide-overlay').onclick = e=>{
    if(e.target===e.currentTarget) e.currentTarget.style.display='none';
  };
}

// ─── Alert ────────────────────────────────────────────────────
function handleAlert(payload){
  const items    = getItems();
  const todayEvs = getTodayEvents();
  let missing    = [];

  if(payload.missing&&Array.isArray(payload.missing)){
    missing = items.filter(i=>payload.missing.some(m=>m.toUpperCase()===i.mac.toUpperCase()));
  }

  const all = [...missing, ...todayEvs.map(e=>({name:e.name,icon:'📅'}))];

  if(!all.length){ toast(t('all_present')); return; }

  // show overlay
  const overlay = document.getElementById('alert-overlay');
  const list    = document.getElementById('alert-list');
  list.innerHTML = all.map(i=>`
    <li class="alert-item">
      <span class="alert-item-icon">${i.icon||'📦'}</span>
      <span>${esc(i.name)}</span>
    </li>`).join('');
  overlay.style.display='flex';

  document.getElementById('btn-dismiss').onclick = ()=>{ overlay.style.display='none'; };

  sendNotification('ReminDoor','',all);

  // update status dots
  items.forEach(item=>{
    const el=document.getElementById('st-'+item.id);
    if(!el) return;
    const isMissing = missing.some(m=>m.id===item.id);
    el.className = 'item-row-status '+(isMissing?'status-missing':'status-present');
    el.textContent = isMissing?t('status_missing'):t('status_present');
  });
}

function simulateAlert(){
  const items = getItems();
  if(!items.length){ toast(t('no_items')); return; }
  handleAlert({missing:[items[0].mac]});
}

// ─── Conn status ──────────────────────────────────────────────
function updateConnUI(online){
  const pill  = document.getElementById('conn-pill');
  const label = document.getElementById('conn-label');
  if(!pill) return;
  pill.classList.toggle('online', online);
  label.textContent = online ? t('connected') : t('offline');
}

// patch mqtt to call this
import { setStatusCallback } from './mqtt.js';
setStatusCallback(updateConnUI);

// ─── SW ───────────────────────────────────────────────────────
function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
      .then(()=>console.log('[SW] ok'))
      .catch(e=>console.warn('[SW]',e));
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function toast(msg,d=2400){
  const el=document.getElementById('toast');
  el.textContent=msg; el.style.display='block';
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.style.display='none',d);
}

function setStatus(id,msg,type){
  const el=document.getElementById(id);
  if(!el) return;
  el.textContent=msg; el.className='status-line '+(type||'');
}

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}