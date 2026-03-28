import mqtt from 'mqtt';

let client = null;
let onAlert = null;
let onStatus = null;

export function setAlertCallback(fn)  { onAlert  = fn; }
export function setStatusCallback(fn) { onStatus = fn; }

export function getMqttStatus(){
  if(!client) return 'disconnected';
  if(client.connected) return 'connected';
  return 'connecting';
}

export function connectMqtt({ url, topic, username, password }){
  if(client){ client.end(true); client=null; }

  const opts = { clean:true, reconnectPeriod:5000, connectTimeout:10000 };
  if(username) opts.username = username;
  if(password) opts.password = password;

  try { client = mqtt.connect(url, opts); }
  catch(e){ console.error('[MQTT]',e); return; }

  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe(topic, err => {
      if(err) console.error('[MQTT] Subscribe error:', err);
    });
    onStatus?.(true);
  });

  client.on('message', (t, msg) => {
    try {
      const payload = JSON.parse(msg.toString());
      onAlert?.(payload);
    } catch {
      onAlert?.({ missing:[], raw:msg.toString() });
    }
  });

  client.on('error',   e => { console.error('[MQTT]',e.message); onStatus?.(false); });
  client.on('close',   ()  => { onStatus?.(false); });
  client.on('reconnect', () => console.log('[MQTT] Reconnecting…'));
}

export function disconnectMqtt(){
  client?.end(true); client=null; onStatus?.(false);
}