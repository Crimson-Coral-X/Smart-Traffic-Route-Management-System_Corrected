
const state = {
  nodes: [
    {id:0,name:"Central Square",x:49,y:50},
    {id:1,name:"Tech Park",x:20,y:29},
    {id:2,name:"City Hospital",x:20,y:72},
    {id:3,name:"Railway Station",x:49,y:13},
    {id:4,name:"University Gate",x:49,y:86},
    {id:5,name:"Airport Junction",x:84,y:70},
    {id:6,name:"Market Street",x:72,y:35},
    {id:7,name:"River Bridge",x:80,y:14}
  ],
  roads: [
    [0,1,8],[0,2,12],[0,6,7],[1,3,10],[1,4,9],[2,4,6],
    [2,5,15],[3,5,11],[3,6,5],[4,6,8],[4,7,13],[5,7,9],[6,7,10]
  ],
  route: []
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("toast-show");
  setTimeout(()=>t.classList.remove("toast-show"),2200);
}
function adjacency(){
  const a=Array.from({length:state.nodes.length},()=>[]);
  state.roads.forEach(([u,v,w])=>{a[u].push([v,w]);a[v].push([u,w]);});
  return a;
}
function dijkstra(source,target){
  if (!Number.isInteger(source) || !Number.isInteger(target) ||
      source < 0 || target < 0 || source >= state.nodes.length || target >= state.nodes.length) return null;
  const a=adjacency(), d=Array(state.nodes.length).fill(Infinity), p=Array(state.nodes.length).fill(-1), used=Array(state.nodes.length).fill(false);
  d[source]=0;
  for(let k=0;k<state.nodes.length;k++){
    let u=-1;
    for(let i=0;i<d.length;i++) if(!used[i]&&(u<0||d[i]<d[u])) u=i;
    if(u<0||d[u]===Infinity) break;
    used[u]=true;
    for(const [v,w] of a[u]) if(d[u]+w<d[v]){d[v]=d[u]+w;p[v]=u;}
  }
  const path=[]; for(let v=target;v>=0;v=p[v]){path.push(v);if(v===source)break;}
  if(path[path.length-1]!==source) return null;
  return {cost:d[target],path:path.reverse()};
}
function bfs(source){
  const a=adjacency(), seen=Array(state.nodes.length).fill(false), q=[source], order=[];seen[source]=true;
  while(q.length){const u=q.shift();order.push(u);for(const [v] of a[u])if(!seen[v]){seen[v]=true;q.push(v);}}
  return order;
}
function dfs(source){
  const a=adjacency(), seen=Array(state.nodes.length).fill(false), order=[];
  function visit(u){seen[u]=true;order.push(u);for(const [v] of a[u])if(!seen[v])visit(v);}
  visit(source); return order;
}
function mst(){
  const edges=state.roads.map(([from,to,weight])=>({from,to,weight})).sort((a,b)=>a.weight-b.weight);
  const parent=state.nodes.map((_,i)=>i), rank=state.nodes.map(()=>0);
  function find(x){return parent[x]===x?x:(parent[x]=find(parent[x]));}
  function unite(a,b){a=find(a);b=find(b);if(a===b)return false;if(rank[a]<rank[b])[a,b]=[b,a];parent[b]=a;if(rank[a]===rank[b])rank[a]++;return true;}
  const out=[];let cost=0;for(const e of edges)if(unite(e.from,e.to)){out.push(e);cost+=e.weight;}
  return {edges:out,cost,connected:out.length===state.nodes.length-1};
}
function roadStatus(w){return w<=10?["LOW","traffic-low"]:w<=20?["MODERATE","traffic-mid"]:["CONGESTED","traffic-high"]}

function drawMap(containerId, highlight=[]){
  const el=$(containerId); if(!el)return; el.innerHTML="";
  const activeEdges=new Set();
  for(let i=0;i<highlight.length-1;i++) activeEdges.add(`${Math.min(highlight[i],highlight[i+1])}-${Math.max(highlight[i],highlight[i+1])}`);
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  // One shared 0–100 coordinate plane keeps nodes, roads and route highlights aligned.
  svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("preserveAspectRatio","xMidYMid meet");svg.setAttribute("role","img");svg.setAttribute("aria-label","Schematic city road network map");
  el.appendChild(svg);
  const y=n=>n.y;
  state.roads.forEach(([u,v])=>{
    const a=state.nodes[u],b=state.nodes[v],line=document.createElementNS(svg.namespaceURI,"line");
    line.setAttribute("x1",a.x);line.setAttribute("y1",y(a));line.setAttribute("x2",b.x);line.setAttribute("y2",y(b));
    line.setAttribute("class","map-road"+(activeEdges.has(`${Math.min(u,v)}-${Math.max(u,v)}`)?" active":""));svg.appendChild(line);
  });
  state.nodes.forEach(n=>{
    const group=document.createElementNS(svg.namespaceURI,"g"),circle=document.createElementNS(svg.namespaceURI,"circle"),label=document.createElementNS(svg.namespaceURI,"text");
    circle.setAttribute("cx",n.x);circle.setAttribute("cy",y(n));circle.setAttribute("r","1.35");circle.setAttribute("class","map-node"+(highlight.includes(n.id)?" active":""));
    const title=document.createElementNS(svg.namespaceURI,"title");title.textContent=`${n.id}: ${n.name}`;circle.appendChild(title);
    const labelLayout={
      0:{dx:2.5,dy:3.8,anchor:"start"},
      1:{dx:2.5,dy:-2.8,anchor:"start"},
      2:{dx:2.5,dy:4.2,anchor:"start"},
      3:{dx:0,dy:5.0,anchor:"middle"},
      4:{dx:0,dy:-3.2,anchor:"middle"},
      5:{dx:-2.8,dy:4.2,anchor:"end"},
      6:{dx:2.5,dy:-3.0,anchor:"start"},
      7:{dx:0,dy:5.0,anchor:"middle"}
    }[n.id];
    label.setAttribute("x",n.x+labelLayout.dx);label.setAttribute("y",y(n)+labelLayout.dy);label.setAttribute("text-anchor",labelLayout.anchor);label.setAttribute("class","map-label");label.textContent=`${n.id} · ${n.name}`;
    // Transparent labels: no backing rectangle is drawn behind the text.
    group.append(circle,label);
    svg.appendChild(group);
  });
}
function populateSelects(){
  ["#routeSource","#routeTarget","#emergencySource"].forEach(sel=>{
    const el=$(sel);if(!el)return;el.innerHTML=state.nodes.map(n=>`<option value="${n.id}">${n.id} — ${n.name}</option>`).join("");
  });
  $("#routeTarget").value="5";
}
function renderTraffic(){
  $("#trafficTable").innerHTML=state.roads.map((r,i)=>{
    const [u,v,w]=r,[status,cls]=roadStatus(w);
    return `<tr><td>${state.nodes[u].name} ↔ ${state.nodes[v].name}</td><td><input class="weight-input" id="w${i}" type="number" min="1" max="999" value="${w}"></td><td class="${cls}">${status}</td><td><button class="small-btn" onclick="updateWeight(${i})">UPDATE</button></td></tr>`;
  }).join("");
}
window.updateWeight=function(i){
  const val=Math.max(1,Math.min(999,Number($(`#w${i}`).value)||1));state.roads[i][2]=val;renderAll();toast("Traffic weight updated");
};
function renderStats(){
  $("#nodeCount").textContent=state.nodes.length;$("#roadCount").textContent=state.roads.length;
  $("#avgTraffic").textContent=Math.round(state.roads.reduce((s,r)=>s+r[2],0)/state.roads.length);
  const connected=bfs(0).length===state.nodes.length;$("#connectivity").textContent=connected?"100%":"DEGRADED";$("#health").textContent=connected?"100%":"75%";$("#healthBar").style.width=connected?"100%":"75%";
}
function renderAll(){renderStats();renderTraffic();populateSelects();drawMap("#map",state.route);drawMap("#routeMap",state.route);}
$$(".nav").forEach(btn=>btn.onclick=()=>{$$(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$$(".view").forEach(x=>x.classList.remove("active-view"));$("#"+btn.dataset.view).classList.add("active-view");if(btn.dataset.view==="routes")drawMap("#routeMap",state.route);});
function calculateSelectedRoute(showToast=false){
  const s=Number($("#routeSource").value),t=Number($("#routeTarget").value),r=dijkstra(s,t);state.route=r?r.path:[];
  const box=$("#routeResult");box.classList.remove("hidden");
  if(!r){box.innerHTML="<b style='color:#ff4f81'>NO ROUTE</b>";}else{box.innerHTML=`<b style="color:#39ff88">FASTEST ROUTE FOUND</b><br>Traffic cost: <b>${r.cost}</b><br>${r.path.map(i=>state.nodes[i].name).join(" → ")}`;if(showToast)toast("Dijkstra route calculated");}
  drawMap("#routeMap",state.route);drawMap("#map",state.route);
}
$("#findRoute").onclick=()=>calculateSelectedRoute(true);
$("#routeSource").addEventListener("change",()=>calculateSelectedRoute());
$("#routeTarget").addEventListener("change",()=>calculateSelectedRoute());
$("#runBfs").onclick=()=>{$("#emergencyResult").innerHTML="<b style='color:#00eaff'>BFS ORDER</b><br>"+bfs(+$(`#emergencySource`).value).map(i=>state.nodes[i].name).join(" → ");toast("BFS clearance completed");};
$("#runDfs").onclick=()=>{$("#emergencyResult").innerHTML="<b style='color:#b86cff'>DFS ORDER</b><br>"+dfs(+$(`#emergencySource`).value).map(i=>state.nodes[i].name).join(" → ");toast("DFS validation completed");};
$("#runMst").onclick=()=>{
  const r=mst();$("#mstResult").innerHTML=`<div class="stat"><span>TOTAL INFRASTRUCTURE COST</span><b class="green">${r.cost}</b></div><div class="stat"><span>BACKBONE EDGES</span><b>${r.edges.length}</b></div>`+
  r.edges.map(e=>`<div class="mst-edge">${state.nodes[e.from].name} ↔ ${state.nodes[e.to].name} <b>cost ${e.weight}</b></div>`).join("");
  toast("Kruskal MST optimized");
};
setInterval(()=>$("#clock").textContent=new Date().toLocaleTimeString(),1000);
const themeToggle=$("#themeToggle");
let savedTheme="dark";
try{savedTheme=localStorage.getItem("traffic-theme")||"dark";}catch(_){/* Storage can be blocked for directly opened files. */}
if(savedTheme==="light")document.body.classList.add("light-mode");
function updateThemeButton(){const light=document.body.classList.contains("light-mode");themeToggle.textContent=light?"☾ Dark mode":"☀ Light mode";themeToggle.setAttribute("aria-label",light?"Switch to dark mode":"Switch to light mode");}
updateThemeButton();themeToggle.onclick=()=>{document.body.classList.toggle("light-mode");try{localStorage.setItem("traffic-theme",document.body.classList.contains("light-mode")?"light":"dark");}catch(_){/* Theme still changes for this page view. */}updateThemeButton();};
// Add the OAuth client ID from Google Cloud Console to enable the Google Identity Services button.
const GOOGLE_CLIENT_ID="949522346463-73v6n0uro7v5m1islhc68hu0qnc5kud2.apps.googleusercontent.com";
const googleFallback=$("#googleFallback"),loginMessage=$("#loginMessage");
function enterDashboard(mode){
  $("#loginScreen").classList.add("hidden");
  document.body.dataset.loginMode=mode;
  toast(mode==="google"?"Google sign-in completed":"Demo mode opened");
}
$("#demoLogin").onclick=()=>enterDashboard("demo");
googleFallback.onclick=()=>{loginMessage.textContent=GOOGLE_CLIENT_ID?"Google sign-in is loading. Please wait and try again.":"To enable Google sign-in, add your Google OAuth client ID in app.js and open the page from an authorized web origin.";};
function initializeGoogleSignIn(){
  if(!GOOGLE_CLIENT_ID||!window.google?.accounts?.id)return false;
  window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:response=>{
    if(!response.credential)return;
    // This UI demo has no C endpoint for server-side token verification.
    enterDashboard("google");
  }});
  googleFallback.hidden=true;
  window.google.accounts.id.renderButton($("#googleSignIn"),{theme:"outline",size:"large",shape:"rectangular",text:"continue_with",width:320});
  loginMessage.textContent="Google sign-in is ready. Server-side C verification is required before production use.";
  return true;
}
if(!initializeGoogleSignIn())window.addEventListener("load",initializeGoogleSignIn,{once:true});
renderAll();
calculateSelectedRoute();
