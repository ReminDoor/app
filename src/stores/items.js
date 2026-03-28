const IK='rd_items', EK='rd_events', MK='rd_mqtt';

export function getItems(){ try{return JSON.parse(localStorage.getItem(IK))||[];}catch{return [];} }
export function saveItems(i){ localStorage.setItem(IK,JSON.stringify(i)); }
export function addItem({name,mac,icon}){
  const items=[...getItems(),{id:crypto.randomUUID(),name:name.trim(),mac:mac.trim().toUpperCase(),icon:icon||'👜',active:true}];
  saveItems(items); return items;
}
export function removeItem(id){ const i=getItems().filter(x=>x.id!==id); saveItems(i); return i; }

export function getEvents(){ try{return JSON.parse(localStorage.getItem(EK))||[];}catch{return [];} }
export function saveEvents(e){ localStorage.setItem(EK,JSON.stringify(e)); }
export function addEvent({name,type,days,time,datetime}){
  const evs=[...getEvents(),{id:crypto.randomUUID(),name:name.trim(),type:type||'weekly',days:days||[],time:time||null,datetime:datetime||null}];
  saveEvents(evs); return evs;
}
export function removeEvent(id){ const e=getEvents().filter(x=>x.id!==id); saveEvents(e); return e; }

const DEF={url:'wss://broker.hivemq.com:8884/mqtt',topic:'remindoor/alert',deviceId:'',username:'',password:''};
export function getMqttConfig(){ try{return{...DEF,...JSON.parse(localStorage.getItem(MK))};}catch{return DEF;} }
export function saveMqttConfig(c){ localStorage.setItem(MK,JSON.stringify(c)); }

const DN_EN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DN_DE=['So','Mo','Di','Mi','Do','Fr','Sa'];
export function formatDays(days,lang='en'){
  if(!days||!days.length) return lang==='de'?'Keine Tage':'No days';
  if(days.length===7) return lang==='de'?'Täglich':'Every day';
  return days.map(d=>(lang==='de'?DN_DE:DN_EN)[d]).join(', ');
}

export function getTodayEvents(){
  const today=new Date().getDay();
  const todayStr=new Date().toISOString().slice(0,10);
  return getEvents().filter(e=>{
    if(e.type==='weekly') return e.days&&e.days.includes(today);
    if(e.type==='once')   return e.datetime&&e.datetime.slice(0,10)===todayStr;
    return false;
  });
}