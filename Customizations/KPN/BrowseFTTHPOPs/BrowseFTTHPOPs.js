// -------------------------
// Demo data (mix of static and lazy child providers)
// Node shape:
// { id?: string, label: string, icon?: 'folder'|'file'|emoji|string(URL), children?: Node[]|() => Promise<Node[]>, meta?: any }
// -------------------------
const baseURL = 'https://swdclr0617.kpn.org';
const alphabates = [...Array(26)].map((_, i) => String.fromCharCode(i + 65));
const data = [
  {
    level:1,
    id: "RootnodeLocAdmin",
    label: "Location administration",
    icon: `${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Root_Node.ico`,
    children: async () =>{
      return alphabates.map( e =>({
        level:2,
        id:"LocAdminAlphabet",
        label:e,
        icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/FileFolder.ico`,
        children:async() =>{
          debugger;
          const cityPOPDataReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetCItyPOPs/${e}`);
          const cityPOPDataRes = await cityPOPDataReq.json();
          return cityPOPDataRes.map(el =>({
            level:3,
            id: `${el.G3E_FNO}|${el.G3E_FID}` ,
            label:`CP Area: [${el.ALIAS}] [${el.BUILDING_NAME}] ${el.CITY_NAME} ${el.G3E_FID}`,
            icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/CP_Area.ico`,
            children:()=> populatePOPs(el.G3E_FID,el.ALIAS)
            /*
            children:async() => {
              const popInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetPOPInfo/${el.G3E_FID}/${el.ALIAS}`);
              const popInfoRes = await popInfoReq.json();
              return popInfoRes.map(popel =>({
                level:4,
                id:`${popel.G3E_FNO}|${popel.G3E_FID}` ,
                label:`[${popel.ALIAS}] [${popel.BUILDING_NAME}] ${popel.CITY_NAME} ${popel.G3E_FID}`,
                icon: popel.POP_TYPE === 'AP' ? `${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Area_POP.ico`:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/City_POP.ico`,
                children:()=>populateRack(popel.G3E_FID,popel.ALIAS,popel.CASE,popel.POP_IN_POP)
                
                children:async() =>{
                  const rackInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetRackInfo/${popel.G3E_FID}/${popel.ALIAS}/${popel.CASE}/${popel.POP_IN_POP}`);
                  const rackInfoRes = await rackInfoReq.json();
                  return rackInfoRes.map(rackel => ({
                    level:5,
                    id:`${rackel.G3E_FNO}|${rackel.G3E_FID}`,
                    label:`${rackel.NAME} - ${rackel.G3E_FID}`,
                    icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Rack.ico`,
                    children:async() =>{
                      const shelfInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetShelfInfo/${rackel.G3E_FID}`);
                      const shelfInfoRes = await shelfInfoReq.json();  
                      return shelfInfoRes.map(shelfel => ({
                        level:6,
                        id:`${shelfel.G3E_FNO}|${shelfel.G3E_FID}`,
                        label:`Shelf - ${shelfel.POSITION} - ${shelfel.NODE_FULL_NAME} - ${shelfel.G3E_FID}`,
                        icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Shelf.ico`,
                        children:async() =>{
                          const cardInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetCardInfo/${shelfel.G3E_FID}`);
                          const cardInfoRes = await cardInfoReq.json();  
                          return cardInfoRes.map(cardel => ({
                            level:7,
                            id:`${cardel.G3E_FNO}|${cardel.G3E_FID}`,
                            label:`Card - ${cardel.FEATURE_TYPE} - ${cardel.POSITION} - ${cardel.G3E_FID}`,
                            icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Card.ico`,
                          }))
                        }
                      }));
                    }
                  }));
                }
                
              }));
            }*/
          }));
        }
      }));
    }
    },
    {
      id: "RootnodeCity",
      label: "POP's per City",
      icon: `${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Root_Node.ico`,
      children: async () =>{
        return alphabates.map(e =>({
          level:2,
          id:"CityAlphabet",
          label:e,
          icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/FileFolder.ico`,
          children:async() =>{
            const cityNameDataReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetCityNames/${e}`);
            const cityNameDataRes = await cityNameDataReq.json();
            return cityNameDataRes.map(cityel => ({
              level:3,
              id:"CityName",
              label:`${cityel.RESIDENCE}`,
              icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/FileFolder.ico`,
              children:async()=>{
                const popDataReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetPOPInfo/${cityel.RESIDENCE}`);
                const popDataRes = await popDataReq.json();
                return popDataRes.map(popel => ({
                  level:4,
                  id:`${popel.G3E_FNO}|${popel.G3E_FID}` ,
                  label:`[${popel.ALIAS}] [${popel.BUILDING_NAME}] ${popel.CITY_NAME} ${popel.G3E_FID}`,
                  icon: popel.CITY_AREA_POP === "2" ? `${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Area_POP.ico`:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/City_POP.ico`,
                  children:()=>populateRack(popel.G3E_FID,popel.ALIAS,popel.CASE,popel.POP_IN_POP)
                }));
              }
            })) ;
          }
        }));
      }
    }
]
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// --- Tooltip utilities (single shared tooltip) ---
let tipTimer, hideTimer;
let lastMouse = { x: 0, y: 0 };

function setTipContent(node) {
    tipEl.textContent = node.tooltip || node.label;
}
function positionTip(x, y) {
  // Keep within viewport with padding
  const pad = 10;
  tipEl.style.left = '0px'; tipEl.style.top = '0px'; // reset for accurate measure
  const rect = tipEl.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;

  let left = x + 14;  // offset from cursor
  let top  = y + 14;

  if (left + rect.width + pad > vw) left = Math.max(pad, vw - rect.width - pad);
  if (top + rect.height + pad > vh) top = Math.max(pad, vh - rect.height - pad);

  tipEl.style.left = left + 'px';
  tipEl.style.top  = top + 'px';
}
function showTip(node, delay = 250) {
  clearTimeout(hideTimer);
  clearTimeout(tipTimer);
  setTipContent(node);
  tipTimer = setTimeout(() => {
    tipEl.dataset.show = 'true';
    tipEl.setAttribute('aria-hidden', 'false');
    positionTip(lastMouse.x, lastMouse.y);
  }, delay);
}
function moveTip(x, y) {
  lastMouse = { x, y };
  if (tipEl.dataset.show === 'true') positionTip(x, y);
}
function hideTip(delay = 120) {
  clearTimeout(hideTimer);
  clearTimeout(tipTimer);
  hideTimer = setTimeout(() => {
    tipEl.dataset.show = 'false';
    tipEl.setAttribute('aria-hidden', 'true');
  }, delay);
}


/**
 * Create a TreeView with +/- toggles, lazy load and icons.
 * @param {HTMLElement} container
 * @param {Array} nodes
 * @param {Object} options
 *  - startExpanded: boolean | (node) => boolean
 *  - onLeafClick: (node, event) => void
 *  - icons: { folderClosed, folderOpen, file } // emoji|string(URL)|'folder'|'file'
 */
function createPlusMinusLazyTree(container, nodes, {
  startExpanded = true,
  onLeafClick,
  icons = { folderClosed: "📁", folderOpen: "📂", file: "📄"},
  buildContextMenu
} = {}) {
  const root = document.createElement('ul');
  root.className = 'tree';
  root.setAttribute('role', 'tree');

  // Render a single node and return <li>
  function renderNode(node) {
    const li = document.createElement('li');
    li.className = 'node';

    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('role', 'treeitem');

    const hasChildrenProp = typeof node.children !== 'undefined';
    const isLazy = typeof node.children === 'function'; // async provider
    const hasStaticChildren = Array.isArray(node.children);
    const initiallyHasChildren = isLazy || (hasStaticChildren && node.children.length > 0);

    // +/- button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle';
    btn.setAttribute('aria-label', initiallyHasChildren ? 'Expand/Collapse' : 'Leaf');
    if (!initiallyHasChildren) btn.setAttribute('aria-hidden', 'true');

    // Icon
    let iconEl = makeIconElement(node, icons, { open: false, hasChildren: initiallyHasChildren });

    // Label
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = node.label;

    row.append(btn, iconEl, label);
    li.appendChild(row);

    // Children container (added even if lazy)
    const kidsUL = document.createElement('ul');
    kidsUL.setAttribute('role', 'group');
    li.appendChild(kidsUL);

    // State
    let expanded = decideStartExpanded(node, startExpanded) && initiallyHasChildren;
    let loaded = false; // lazy flag once loaded

    const setExpanded = (val) => {
      expanded = !!val;
      btn.textContent = expanded ? '−' : '+';
      kidsUL.style.display = expanded ? 'block' : 'none';
      row.setAttribute('aria-expanded', String(expanded));
      // swap folder icons on open/close if using folder defaults or 'folder'
      iconEl.replaceWith(iconEl = makeIconElement(node, icons, { open: expanded, hasChildren: initiallyHasChildren }));
      row.insertBefore(iconEl, label);
    };

    // Initialize content
    if (hasStaticChildren) {
      node.children.forEach(ch => kidsUL.appendChild(renderNode(ch)));
    }
    setExpanded(expanded);

    // Toggle handler (handles lazy loading)
    const onToggle = async (evt) => {
      if (!initiallyHasChildren) return;

      // First expand on lazy: load children
      if (isLazy && !loaded) {
        btn.disabled = true;
        // temporary spinner after the +/- button
        const spin = document.createElement('span');
        spin.className = 'spinner';
        row.insertBefore(spin, iconEl);

        try {
          const res = await node.children(); // expect Promise<Node[]>
          kidsUL.innerHTML = '';
          (res || []).forEach(ch => kidsUL.appendChild(renderNode(ch)));
          loaded = true;
        } catch (err) {
          console.error('Failed to load children for', node.label, err);
          // Provide minimal error feedback
          kidsUL.innerHTML = '<li class="node"><div class="row" style="color:#b91c1c">Failed to load</div></li>';
          // Keep expanded to show the error
        } finally {
          btn.disabled = false;
          spin.remove();
        }
      }
      setExpanded(!expanded);
    };

    // Clicks
    btn.addEventListener('click', onToggle);
    label.addEventListener('click', onToggle); // group label toggles too

    // Leaf click (when there are no children)
    if (!initiallyHasChildren) {
      label.style.cursor = 'pointer';
      label.addEventListener('click', (e) => {
        // selection style
        root.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        row.classList.add('selected');
        onLeafClick?.(node, e);
      });
      // keep +/- area aligned even if hidden
      btn.textContent = '';
    }
    debugger;
      // --- Tooltip bindings (hover + focus) ---
    // mouse
    row.addEventListener('mouseenter', () => showTip(node));
    row.addEventListener('mousemove', (e) => moveTip(e.clientX, e.clientY));
    row.addEventListener('mouseleave', () => hideTip());

    // Context menu on right-click
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const node = li.__node;
      if (node.level === 4 || node.level === 5 || node.level === 6 || node.level === 7){
        showContextMenuFor(row, li, e.clientX, e.clientY);
      }
      
    });

    li.__node = node; // optional reference
    return li;
  }

  // helpers
  function decideStartExpanded(node, startExpanded) {
    return typeof startExpanded === 'function' ? !!startExpanded(node) : !!startExpanded;
  }

  function makeIconElement(node, defaults, { open, hasChildren }) {
    debugger;
    // Resolve icon to emoji or URL or default folder/file
    let icon = node.icon;
    if (!icon) icon = hasChildren ? 'folder' : 'file';
    if (icon === 'folder') icon = open ? defaults.folderOpen : defaults.folderClosed;
    if (icon === 'file') icon = defaults.file;

    const span = document.createElement('span');
    span.className = 'icon';

    // URL icon
    if (typeof icon === 'string' && /^https?:\/\//.test(icon)) {
      const img = document.createElement('img');
      img.src = icon; img.alt = ''; img.width = 16; img.height = 16;
      span.appendChild(img);
    } else {
      // Emoji or text
      span.textContent = icon;
    }
    return span;
  }

  // ---- Context Menu ----
  const menuEl = document.getElementById('ctxMenu');
  let menuOpen = false;

  function buildDefaultMenu(node, li) {
    const items = [];
    items.push({
      id: 'viewfeature', label: 'View Feature',
      action: () => viewFeature(node.id)
    });
    return items;
  }

  async function viewFeature(nodeID){
    debugger;
    const [fno,fid] = nodeID.split("|");
    console.log(fid,fno);
    const result = await parent.$NWP.features.fetchGTechFeatures({ G3E_FNO: fno, G3E_FID: fid });
    if (result.success && result.data && result.data.length > 0) {
      if (fno==14100){
      	parent.$NWP.features.highlight(result.data, true, true);
      }
      if (fno==15700){
      	parent.$NWP.features.highlight(result.data, false, true);
      }
      parent.$NWP.features.edit(result.data[0]);
    }
  }

  function showContextMenuFor(row, li, x, y) {
    const node = li.__node;
    // Build items (custom if provided)
    const items = buildContextMenu ? buildContextMenu(node, !!(li.querySelector(':scope > ul') || li.__hasLazy)) : buildDefaultMenu(node, li);

    menuEl.innerHTML = '';
    for (const it of items) {
      if (it === 'sep') {
        const sep = document.createElement('div');
        sep.className = 'ctx-sep';
        menuEl.appendChild(sep);
        continue;
      }
      const btn = document.createElement('div');
      btn.className = 'ctx-item' + (it.danger ? ' ctx-danger' : '');
      btn.setAttribute('role', 'menuitem');
      btn.tabIndex = 0;

      const ic = document.createElement('span');
      ic.className = 'ctx-icon';
      ic.textContent = it.icon || '';
      const label = document.createElement('span');
      label.textContent = it.label;

      btn.append(ic, label);
      btn.addEventListener('click', () => { closeMenu(); it.action?.(node, li); reapplyFilter(); });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      });
      menuEl.appendChild(btn);
    }

    menuEl.style.display = 'block';
    menuEl.setAttribute('aria-hidden', 'false');
    menuOpen = true;

    // Position within viewport
    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.min(x, vw - rect.width - 8);
    const top  = Math.min(y, vh - rect.height - 8);
    menuEl.style.left = left + 'px';
    menuEl.style.top  = top + 'px';

    // Focus first item for accessibility
    const first = menuEl.querySelector('.ctx-item');
    first?.focus();

    // Close on outside click or ESC
    setTimeout(() => {
      document.addEventListener('mousedown', onDocMouseDown);
      document.addEventListener('keydown', onDocKey);
    }, 0);
  }

  

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menuEl.style.display = 'none';
    menuEl.setAttribute('aria-hidden', 'true');
    document.removeEventListener('mousedown', onDocMouseDown);
    document.removeEventListener('keydown', onDocKey);
  }
  const onDocMouseDown = (e) => {
    if (!menuEl.contains(e.target)) closeMenu();
  };
  const onDocKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };


  // Build root
  root.innerHTML = '';
  nodes.forEach(n => root.appendChild(renderNode(n)));
  container.innerHTML = '';
  container.appendChild(root);
  return root;
}


async function populatePOPs(fid,fttx){
  const popInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetPOPInfo/${fid}/${fttx}`);
  const popInfoRes = await popInfoReq.json();
  return popInfoRes.map(popel =>({
    level:4,
    id:`${popel.G3E_FNO}|${popel.G3E_FID}` ,
    label:`[${popel.ALIAS}] [${popel.BUILDING_NAME}] ${popel.CITY_NAME} ${popel.G3E_FID}`,
    icon: popel.POP_TYPE === 'AP' ? `${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Area_POP.ico`:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/City_POP.ico`,
    children:()=>populateRack(popel.G3E_FID,popel.ALIAS,popel.CASE,popel.POP_IN_POP)
  }));
}

async function populateRack(rackfid,fttx,pop_case,pop_in_pop){
  const rackInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetRackInfo/${rackfid}/${fttx}/${pop_case}/${pop_in_pop}`);
  const rackInfoRes = await rackInfoReq.json();
  return rackInfoRes.map(rackel => ({
    level:5,
    id:`${rackel.G3E_FNO}|${rackel.G3E_FID}`,
    label:`${rackel.NAME} - ${rackel.G3E_FID}`,
    icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Rack.ico`,
    children:() => populateShelf(rackel.G3E_FID),
  }));
}

async function populateShelf(rackfid){
  const shelfInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetShelfInfo/${rackfid}`);
  const shelfInfoRes = await shelfInfoReq.json();  
  return shelfInfoRes.map(shelfel => ({
    level:6,
    id:`${shelfel.G3E_FNO}|${shelfel.G3E_FID}`,
    label:`Shelf - ${shelfel.POSITION} - ${shelfel.NODE_FULL_NAME}${shelfel.DIRECTION != null?shelfel.DIRECTION:''} - ${shelfel.G3E_FID}`,
    icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Shelf.ico`,
    children:() => populateCard(shelfel.G3E_FID),
  }));
}

async function populateCard(shelffid){
   const cardInfoReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetCardInfo/${shelffid}`);
   const cardInfoRes = await cardInfoReq.json();  
   return cardInfoRes.map(cardel => ({
     level:7,
     id:`${cardel.G3E_FNO}|${cardel.G3E_FID}`,
     label:`Card - ${cardel.FEATURE_TYPE} - ${cardel.POSITION} - ${cardel.G3E_FID}`,
     icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/Card.ico`,
   }));
 }

async function searchPOP(){
  debugger;
  document.body.style.cursor = "wait";
  const popSearchReq = await fetch(`${baseURL}/BrowseFTTHPOPsPortalCustomService/api/GetSearchedPOP/${searchInput.value}`);
  const popSearchRes = await popSearchReq.json();  
  const searchedNodes = popSearchRes.map(el => ({
    level:3,
    id: `${el.G3E_FNO}|${el.G3E_FID}` ,
    label:`CP Area: [${el.ALIAS}] [${el.BUILDING_NAME}] ${el.CITY_NAME} ${el.G3E_FID}`,
    icon:`${baseURL}/PortalCustomizations/BrowseFTTHPOPs/Icons/CP_Area.ico`,
    children:()=> populatePOPs(el.G3E_FID,el.ALIAS)
    
  }));
  
  createPlusMinusLazyTree(host, searchedNodes, {
    startExpanded: (node) => node.id === 'docs', // example: open only "Documents" initially
    onLeafClick: (node) => {
      if (node.meta?.href) {
        window.open(node.meta.href, '_blank');
      } else {
        console.log('Leaf clicked:', node.label);
      }
    }
  });
  document.body.style.cursor = "default";
}

function clearSearch(){
  document.getElementById('popsearch').value='';
  createPlusMinusLazyTree(host, data, {
  startExpanded: (node) => node.id === 'docs', // example: open only "Documents" initially
  onLeafClick: (node) => {
      if (node.meta?.href) {
        window.open(node.meta.href, '_blank');
      } else {
        console.log('Leaf clicked:', node.label);
      }
    },
  });
  
}