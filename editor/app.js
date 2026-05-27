import { initializeApp, getApps, deleteApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, onValue, get, set, remove } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

// ─── State ───────────────────────────────────────────────────────────────────

let nodes = {};   // { [id]: nodeObject }
let selectedNodeId = null;
let isDirty = false;

function markDirty() {
    isDirty = true;
    const btn = document.getElementById('btn-save-node');
    if (btn) btn.disabled = false;
}

function markClean() {
    isDirty = false;
    const btn = document.getElementById('btn-save-node');
    if (btn) btn.disabled = true;
}

/** Sets nodes.timestamp to the current Unix second, marking this as the latest version. */
function bumpTimestamp() {
    nodes.timestamp = Math.floor(Date.now() / 1000);
}

// ─── Icon management ──────────────────────────────────────────────────────────

const ICON_FILENAMES = [
    'barn.png',
    'blue_goat.png',
    'bottle.png',
    'bubble.png',
    'cattle_pen.png',
    'comb.png',
    'config.png',
    'drop.png',
    'edit.png',
    'filter.png',
    'goat_health.png',
    'hands.png',
    'heart.png',
    'info_help.png',
    'jacket.png',
    'logout.png',
    'milk_pail.png',
    'new_user.png',
    'pest.png',
    'sheet.png',
    'shroom.png',
    'udder.png',
    'user.png',
    'warning.png',
    'watch.png',
    'weed.png',
    'white_goat.png',
];

function populateIconGrid() {
    const grid = document.getElementById('icon-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    ICON_FILENAMES.forEach(filename => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; padding: 10px; border: 1px solid transparent; border-radius: 4px; transition: all 0.2s;';
        item.onmouseover = () => item.style.backgroundColor = 'var(--input-bg)';
        item.onmouseout = () => item.style.backgroundColor = 'transparent';
        
        const img = document.createElement('img');
        img.src = `/icons/${filename}`;
        img.style.cssText = 'width: 48px; height: 48px; object-fit: contain;';
        img.alt = filename;
        
        const label = document.createElement('small');
        label.textContent = filename;
        label.style.cssText = 'text-align: center; word-break: break-word; font-size: 0.75rem;';
        
        item.appendChild(img);
        item.appendChild(label);
        item.addEventListener('click', () => selectIcon(filename));
        
        grid.appendChild(item);
    });
}

function selectIcon(filename) {
    document.getElementById('field-icon').value = filename;
    updateIconPreview(filename);
    document.getElementById('modal-icon-picker').style.display = 'none';
    markDirty();
}

function updateIconPreview(filename) {
    const preview = document.getElementById('icon-preview');
    const label = document.getElementById('icon-label');
    
    if (!filename) {
        preview.src = '';
        preview.style.display = 'none';
        label.textContent = 'No icon selected';
    } else {
        preview.src = `/icons/${filename}`;
        preview.style.display = 'block';
        label.textContent = filename;
    }
}

// ─── Known actions ────────────────────────────────────────────────────────────
// Keep in sync with src/model/actions.js
const KNOWN_ACTIONS = [
    '',               // none
    'log_value',
    'save_to_storage',
    'log_answers',
];

// ─── Firebase ─────────────────────────────────────────────────────────────────

const FB_CONFIG_KEY = 'milc_firebase_config';
let fbDb = null;
let fbAuth = null;
let fbUser = null;
let fbUnsubscribe = null;
let fbAuthUnsubscribe = null;

function loadFbConfig() {
    try {
        const raw = localStorage.getItem(FB_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveFbConfig(config) {
    localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
}

function clearFbConfig() {
    localStorage.removeItem(FB_CONFIG_KEY);
}

function updateFirebaseStatusUI() {
    const statusBtn = document.getElementById('btn-firebase-status');
    const pushBtn   = document.getElementById('btn-push-firebase');
    const authBanner = document.getElementById('auth-banner');
    const appEl     = document.getElementById('app');
    if (!statusBtn) return;
    if (fbDb) {
        if (fbUser) {
            statusBtn.textContent = `🔥 ${fbUser.email} ✕`;
            statusBtn.title = 'Click to sign out';
        } else {
            statusBtn.textContent = '🔥 Firebase: Sign in required';
            statusBtn.title = 'Configure Firebase sync';
        }
        statusBtn.classList.add('status-connected');
        statusBtn.classList.remove('status-disconnected');
        if (pushBtn) pushBtn.style.display = fbUser ? 'inline-block' : 'none';
        const pullBtn = document.getElementById('btn-pull-firebase');
        if (pullBtn) pullBtn.style.display = fbUser ? 'inline-block' : 'none';
        if (authBanner) authBanner.style.display = fbUser ? 'none' : 'flex';
        if (appEl) appEl.style.display = fbUser ? 'flex' : 'none';
    } else {
        statusBtn.textContent = '🔥 Not connected';
        statusBtn.title = 'Configure Firebase sync';
        statusBtn.classList.remove('status-connected');
        statusBtn.classList.add('status-disconnected');
        if (pushBtn) pushBtn.style.display = 'none';
        const pullBtn2 = document.getElementById('btn-pull-firebase');
        if (pullBtn2) pullBtn2.style.display = 'none';
        if (authBanner) authBanner.style.display = 'none';
        if (appEl) appEl.style.display = 'flex';
    }
}

async function connectFirebase(config) {
    disconnectFirebase();
    // Clean up any existing default app to avoid duplicate-app errors
    for (const app of getApps()) await deleteApp(app);

    const app = initializeApp(config);
    fbDb = getDatabase(app);
    fbAuth = getAuth(app);

    fbAuthUnsubscribe = onAuthStateChanged(fbAuth, (user) => {
        fbUser = user;
        updateFirebaseStatusUI();
        if (user) subscribeToSurvey();
        else unsubscribeFromSurvey();
    });

    updateFirebaseStatusUI();
}

function subscribeToSurvey() {
    if (!fbDb || fbUnsubscribe) return;
    const surveyRef = ref(fbDb, 'survey');
    fbUnsubscribe = onValue(surveyRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
            nodes = data;
            saveToStorage();
            renderNodeList();
            if (selectedNodeId && nodes[selectedNodeId]) {
                loadNodeIntoForm(nodes[selectedNodeId]);
            } else if (selectedNodeId && !nodes[selectedNodeId]) {
                selectedNodeId = null;
                document.getElementById('editor-form').style.display = 'none';
                document.getElementById('editor-placeholder').style.display = 'block';
            }
        }
    });
}

function unsubscribeFromSurvey() {
    if (fbUnsubscribe) { fbUnsubscribe(); fbUnsubscribe = null; }
}

function disconnectFirebase() {
    unsubscribeFromSurvey();
    if (fbAuthUnsubscribe) { fbAuthUnsubscribe(); fbAuthUnsubscribe = null; }
    if (fbAuth && fbUser) signOut(fbAuth).catch(() => {});
    fbDb = null; fbAuth = null; fbUser = null;
    updateFirebaseStatusUI();
}

function fbSet(id, node) {
    if (!fbDb || !fbUser) return;
    set(ref(fbDb, `survey/${id}`), node).catch(err => console.error('Firebase write failed:', err));
}

function fbRemove(id) {
    if (!fbDb || !fbUser) return;
    remove(ref(fbDb, `survey/${id}`)).catch(err => console.error('Firebase remove failed:', err));
}

function fbPushAll() {
    if (!fbDb || !fbUser) return;
    set(ref(fbDb, 'survey'), nodes).catch(err => console.error('Firebase push-all failed:', err));
}

async function fbPullAll() {
    if (!fbDb || !fbUser) return;
    const snapshot = await get(ref(fbDb, 'survey'));
    const remote = snapshot.val();
    if (!remote || typeof remote !== 'object') {
        alert('No data found at /survey in Firebase.');
        return;
    }
    showPullDiff(nodes, remote);
}

function showPullDiff(local, remote) {
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    // Remove meta keys like 'timestamp'
    allKeys.delete('timestamp');

    const diffBody = document.getElementById('pull-diff-body');
    diffBody.innerHTML = '';

    let changeCount = 0;

    allKeys.forEach(key => {
        const inLocal  = Object.prototype.hasOwnProperty.call(local, key);
        const inRemote = Object.prototype.hasOwnProperty.call(remote, key);
        const localStr  = inLocal  ? JSON.stringify(local[key],  null, 2) : null;
        const remoteStr = inRemote ? JSON.stringify(remote[key], null, 2) : null;

        if (localStr === remoteStr) return; // identical — skip
        changeCount++;

        const block = document.createElement('div');
        block.className = 'diff-node';

        const titleEl = document.createElement('div');
        titleEl.className = 'diff-node-title';

        if (!inLocal) {
            titleEl.textContent = `+ ${key}  (added in remote)`;
            titleEl.classList.add('diff-added');
            remoteStr.split('\n').forEach(l => block.appendChild(diffLine(l, 'added')));
        } else if (!inRemote) {
            titleEl.textContent = `- ${key}  (removed in remote)`;
            titleEl.classList.add('diff-removed');
            localStr.split('\n').forEach(l => block.appendChild(diffLine(l, 'removed')));
        } else {
            titleEl.textContent = `~ ${key}  (changed)`;
            titleEl.classList.add('diff-changed');
            localStr.split('\n').forEach(l => block.appendChild(diffLine(l, 'removed')));
            const sep = document.createElement('div');
            sep.style.cssText = 'border-top:1px dashed var(--border);margin:4px 0';
            block.appendChild(sep);
            remoteStr.split('\n').forEach(l => block.appendChild(diffLine(l, 'added')));
        }

        block.insertBefore(titleEl, block.firstChild);
        diffBody.appendChild(block);
    });

    if (changeCount === 0) {
        const none = document.createElement('div');
        none.className = 'diff-none';
        none.textContent = 'No differences — local and remote are identical.';
        diffBody.appendChild(none);
    }

    const modal = document.getElementById('modal-pull-diff');
    modal.style.display = 'flex';
    // Store remote payload for use by the confirm handler
    modal._pendingRemote = remote;
}

function diffLine(text, type) {
    const el = document.createElement('div');
    el.className = `diff-line ${type}`;
    el.textContent = text;
    return el;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(localStorage.getItem('milc_theme') || 'light');
    populateIconGrid();
    loadFromStorage();
    renderNodeList();
    bindStaticEvents();

    const savedConfig = loadFbConfig();
    if (savedConfig) {
        try {
            await connectFirebase(savedConfig);
        } catch (err) {
            console.warn('Auto-connect to Firebase failed:', err);
            updateFirebaseStatusUI();
            openFirebaseModal();
        }
    } else {
        updateFirebaseStatusUI();
        openFirebaseModal();
    }
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('milc_theme', theme);
}

function loadFromStorage() {
    try {
        const n = localStorage.getItem('milc_nodes');
        if (n) nodes = JSON.parse(n);
    } catch (_) {}
}

function saveToStorage() {
    localStorage.setItem('milc_nodes', JSON.stringify(nodes));
}

// ─── Node list ────────────────────────────────────────────────────────────────

function renderNodeList() {
    const ul = document.getElementById('node-list');
    ul.innerHTML = '';
    Object.keys(nodes).forEach(id => {
        const li = document.createElement('li');
        li.textContent = id;
        li.dataset.id = id;
        li.className = id === selectedNodeId ? 'active' : '';
        li.addEventListener('click', () => selectNode(id));
        ul.appendChild(li);
    });
}

function selectNode(id) {
    selectedNodeId = id;
    renderNodeList();
    loadNodeIntoForm(nodes[id]);
}

function updateSetupFieldVisibility() {
    const scenario = document.getElementById('field-scenario')?.value || '';
    const group = document.getElementById('setup-field-name-group');
    if (!group) return;
    group.style.display = scenario === 'APP-SETUP' ? 'block' : 'none';
}

function handleScenarioChange() {
    const scenario = document.getElementById('field-scenario')?.value || '';
    if (scenario !== 'APP-SETUP') {
        document.getElementById('field-setup-field-name-en').value = '';
        document.getElementById('field-setup-field-name-es').value = '';
    }
    updateSetupFieldVisibility();
}

// ─── Node form ────────────────────────────────────────────────────────────────

function loadNodeIntoForm(node) {
    document.getElementById('editor-placeholder').style.display = 'none';
    document.getElementById('save-result').style.display = 'none';
    const form = document.getElementById('editor-form');
    form.style.display = 'block';

    document.getElementById('field-id').value = selectedNodeId || '';
    document.getElementById('field-milking-method').value = node['milking-method'] || '';
    document.getElementById('field-scenario').value = node.scenario || '';
    document.getElementById('field-manual-page').value = node['manual-page'] || '';
    document.getElementById('field-guide-id').value = node['guide-id'] || '';
    document.getElementById('field-severity').value = node.severity || '0';
    document.getElementById('field-periodicity').value = node.periodicity || '';
    document.getElementById('field-category').value = node.category || '';
    document.getElementById('field-score-answer').value = node['score-answer'] || '';
    document.getElementById('field-setup-field-name-en').value = node['setup-field-name']?.en || '';
    document.getElementById('field-setup-field-name-es').value = node['setup-field-name']?.es || '';
    document.getElementById('field-title-en').value = node.title?.en || '';
    document.getElementById('field-title-es').value = node.title?.es || '';
    document.getElementById('field-subtitle-en').value = node.subtitle?.en || '';
    document.getElementById('field-subtitle-es').value = node.subtitle?.es || '';
    document.getElementById('field-showDate').checked = !!node.showDate;
    document.getElementById('field-icon').value = node.icon || '';
    updateIconPreview(node.icon || '');
    updateSetupFieldVisibility();

    renderFields(node.fields || []);
    markClean();
}

function clearForm() {
    document.getElementById('field-id').value = '';
    document.getElementById('field-milking-method').value = '';
    document.getElementById('field-scenario').value = '';
    document.getElementById('field-manual-page').value = '';
    document.getElementById('field-guide-id').value = '';
    document.getElementById('field-severity').value = '0';
    document.getElementById('field-periodicity').value = '';
    document.getElementById('field-category').value = '';
    document.getElementById('field-score-answer').value = '';
    document.getElementById('field-setup-field-name-en').value = '';
    document.getElementById('field-setup-field-name-es').value = '';
    document.getElementById('field-title-en').value = '';
    document.getElementById('field-title-es').value = '';
    document.getElementById('field-subtitle-en').value = '';
    document.getElementById('field-subtitle-es').value = '';
    document.getElementById('field-showDate').checked = false;
    document.getElementById('field-icon').value = '';
    updateIconPreview('');
    updateSetupFieldVisibility();
    renderFields([]);
    markClean();
}

// ─── Bilingual input helper ───────────────────────────────────────────────────

function bilingualInputGroup(val, placeholder) {
    const wrap = document.createElement('div');
    wrap.className = 'bilingual-input';

    const enInput = document.createElement('input');
    enInput.type = 'text';
    enInput.value = val?.en || '';
    enInput.placeholder = `${placeholder || 'text'} (en)`;
    enInput.dataset.lang = 'en';

    const esInput = document.createElement('input');
    esInput.type = 'text';
    esInput.value = val?.es || '';
    esInput.placeholder = `${placeholder || 'text'} (es)`;
    esInput.dataset.lang = 'es';

    wrap.appendChild(enInput);
    wrap.appendChild(esInput);
    return wrap;
}

function getBilingual(el) {
    if (!el) return null;
    const en = el.querySelector('[data-lang="en"]')?.value.trim() || '';
    const es = el.querySelector('[data-lang="es"]')?.value.trim() || '';
    return (en || es) ? { en, es } : null;
}

// ─── Fields ───────────────────────────────────────────────────────────────────

function renderFields(fields) {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    fields.forEach((f, i) => container.appendChild(buildFieldEl(f, i)));
}

function buildFieldEl(field, index) {
    const wrap = document.createElement('div');
    wrap.className = 'field-block';
    wrap.dataset.index = index;

    const header = document.createElement('div');
    header.className = 'field-block-header';

    const badge = document.createElement('span');
    badge.className = 'field-type-badge';
    badge.textContent = field.type;
    header.appendChild(badge);

    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.placeholder = 'field id';
    idInput.value = field.id || '';
    idInput.className = 'field-id-input';
    idInput.addEventListener('change', () => {
        getFieldsFromDOM()[index].id = idInput.value;
    });
    header.appendChild(idInput);

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'btn-icon btn-danger';
    delBtn.addEventListener('click', () => { wrap.remove(); markDirty(); });
    header.appendChild(delBtn);

    wrap.appendChild(header);

    // Type-specific extras
    const extras = document.createElement('div');
    extras.className = 'field-extras';

    if (field.type === 'select') {
        extras.appendChild(buildSelectExtras(field));
    } else if (field.type === 'number_input') {
        extras.appendChild(buildNumberExtras(field));
    } else if (field.type === 'image_list') {
        extras.appendChild(buildImageListExtras(field));
    } else if (field.type === 'audio_list') {
        extras.appendChild(buildAudioListExtras(field));
    } else if (field.type === 'alert') {
        extras.appendChild(buildAlertExtras(field));
    } else if (field.type === 'text_block') {
        extras.appendChild(buildTextBlockExtras(field));
    } else if (field.type === 'month_picker') {
        extras.appendChild(buildMonthPickerExtras(field));
    } else if (field.type === 'bottom_navigation') {
        extras.appendChild(buildBottomNavigationExtras(field));
    }

    wrap.appendChild(extras);

    // Action selector (shared for all field types)
    const actionSection = document.createElement('div');
    actionSection.className = 'extra-row';
    const actionLabel = document.createElement('label');
    actionLabel.textContent = 'Action';
    actionLabel.style.marginTop = '10px';
    const actionSel = document.createElement('select');
    actionSel.style.marginTop = '10px';
    actionSel.dataset.role = 'action';
    KNOWN_ACTIONS.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id || '(none)';
        if (id === (field.action || '')) opt.selected = true;
        actionSel.appendChild(opt);
    });
    actionSection.appendChild(actionLabel);
    actionSection.appendChild(actionSel);
    wrap.appendChild(actionSection);

    return wrap;
}

function makeRow(labelText, inputEl) {
    const row = document.createElement('div');
    row.className = 'extra-row';
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    row.appendChild(lbl);
    row.appendChild(inputEl);
    return row;
}

function textInput(val, placeholder) {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = val || '';
    el.placeholder = placeholder || '';
    return el;
}

function numberInput(val, placeholder) {
    const el = document.createElement('input');
    el.type = 'number';
    el.value = val !== undefined ? val : '';
    el.placeholder = placeholder || '';
    return el;
}

function buildSelectExtras(field) {
    const wrap = document.createElement('div');

    const optionsTitle = document.createElement('div');
    optionsTitle.className = 'sub-section-title';
    optionsTitle.textContent = 'Options';
    wrap.appendChild(optionsTitle);

    const optList = document.createElement('div');
    optList.className = 'option-list';

    (field.options || []).forEach(opt => {
        optList.appendChild(buildOptionRow(opt.value, opt.label, opt.target));
    });
    wrap.appendChild(optList);

    const addBtn = document.createElement('button');
    addBtn.textContent = '＋ Add option';
    addBtn.className = 'btn-sm';
    addBtn.addEventListener('click', () => {
        optList.appendChild(buildOptionRow('', null, ''));
        markDirty();
    });
    wrap.appendChild(addBtn);

    return wrap;
}

function buildOptionRow(value, label, target) {
    const row = document.createElement('div');
    row.className = 'option-row';

    const vInput = textInput(value, 'value');
    vInput.dataset.role = 'opt-value';

    const lWrap = bilingualInputGroup(label, 'label');
    lWrap.dataset.role = 'opt-label';

    const tInput = textInput(target, 'target node (navigation)');
    tInput.dataset.role = 'opt-target';

    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => { row.remove(); markDirty(); });

    row.appendChild(vInput);
    row.appendChild(lWrap);
    row.appendChild(tInput);
    row.appendChild(del);
    return row;
}

function buildNumberExtras(field) {
    const wrap = document.createElement('div');

    const labelWrap = bilingualInputGroup(field.label, 'label');
    labelWrap.dataset.role = 'label';
    wrap.appendChild(makeRow('Label', labelWrap));

    const defInput = numberInput(field.default, '1');
    defInput.dataset.role = 'default';
    wrap.appendChild(makeRow('Default', defInput));

    const minInput = numberInput(field.min, '0');
    minInput.dataset.role = 'min';
    wrap.appendChild(makeRow('Min', minInput));

    const maxInput = numberInput(field.max, '');
    maxInput.dataset.role = 'max';
    wrap.appendChild(makeRow('Max', maxInput));

    const stepInput = numberInput(field.step, '1');
    stepInput.dataset.role = 'step';
    wrap.appendChild(makeRow('Step', stepInput));

    const targetInput = textInput(field.target, 'target node (navigation)');
    targetInput.dataset.role = 'field-target';
    wrap.appendChild(makeRow('Target node', targetInput));

    return wrap;
}

function buildImageListExtras(field) {
    const wrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'sub-section-title';
    title.textContent = 'Images (filename)';
    wrap.appendChild(title);

    const imgList = document.createElement('div');
    imgList.className = 'img-list';

    (field.images || []).forEach(img => {
        imgList.appendChild(buildImageRow(img.src));
    });
    wrap.appendChild(imgList);

    const addBtn = document.createElement('button');
    addBtn.textContent = '＋ Add image';
    addBtn.className = 'btn-sm';
    addBtn.addEventListener('click', () => { imgList.appendChild(buildImageRow('')); markDirty(); });
    wrap.appendChild(addBtn);

    return wrap;
}

function buildImageRow(src) {
    const row = document.createElement('div');
    row.className = 'option-row';
    const inp = textInput(src, 'filename.png');
    inp.dataset.role = 'img-src';
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => { row.remove(); markDirty(); });
    row.appendChild(inp);
    row.appendChild(del);
    return row;
}

function buildAudioListExtras(field) {
    const wrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'sub-section-title';
    title.textContent = 'Audio files (filename)';
    wrap.appendChild(title);

    const audioList = document.createElement('div');
    audioList.className = 'audio-list';

    (field.audios || []).forEach(audio => {
        audioList.appendChild(buildAudioRow(audio.src));
    });
    wrap.appendChild(audioList);

    const addBtn = document.createElement('button');
    addBtn.textContent = '＋ Add audio';
    addBtn.className = 'btn-sm';
    addBtn.addEventListener('click', () => { audioList.appendChild(buildAudioRow('')); markDirty(); });
    wrap.appendChild(addBtn);

    return wrap;
}

function buildAudioRow(src) {
    const row = document.createElement('div');
    row.className = 'option-row';
    const inp = textInput(src, 'filename.mp3');
    inp.dataset.role = 'audio-src';
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => { row.remove(); markDirty(); });
    row.appendChild(inp);
    row.appendChild(del);
    return row;
}

function buildAlertExtras(field) {
    const wrap = document.createElement('div');

    const messageWrap = bilingualInputGroup(field.message, 'message');
    messageWrap.dataset.role = 'message';
    wrap.appendChild(makeRow('Message', messageWrap));

    const severityInput = textInput(field.severity, 'info | warning | error');
    severityInput.dataset.role = 'severity';
    wrap.appendChild(makeRow('Severity', severityInput));

    return wrap;
}

function buildTextBlockExtras(field) {
    const wrap = document.createElement('div');

    const messageWrap = bilingualInputGroup(field.message, 'message');
    messageWrap.dataset.role = 'message';
    wrap.appendChild(makeRow('Message', messageWrap));

    return wrap;
}

function buildMonthPickerExtras(field) {
    const wrap = document.createElement('div');

    const targetInput = textInput(field.target, 'target node (navigation)');
    targetInput.dataset.role = 'field-target';
    wrap.appendChild(makeRow('Target node', targetInput));

    return wrap;
}

function buildBottomNavigationExtras(field) {
    const wrap = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'sub-section-title';
    title.textContent = 'Buttons (exactly 2)';
    wrap.appendChild(title);

    const btnList = document.createElement('div');
    btnList.className = 'option-list';
    btnList.dataset.role = 'btn-list';

    (field.buttons || [{}, {}]).slice(0, 2).forEach(btn => {
        btnList.appendChild(buildNavButtonRow(btn.label, btn.target || ''));
    });
    // ensure always exactly 2 rows
    while (btnList.children.length < 2) {
        btnList.appendChild(buildNavButtonRow(null, ''));
    }

    wrap.appendChild(btnList);
    return wrap;
}

function buildNavButtonRow(label, target) {
    const row = document.createElement('div');
    row.className = 'option-row';

    const lWrap = bilingualInputGroup(label, 'button label');
    lWrap.dataset.role = 'btn-label';

    const tInput = textInput(target, 'target node id');
    tInput.dataset.role = 'btn-target';

    row.appendChild(lWrap);
    row.appendChild(tInput);
    return row;
}

// ─── Read fields from DOM ─────────────────────────────────────────────────────

function getFieldsFromDOM() {
    const container = document.getElementById('fields-container');
    const blocks = container.querySelectorAll('.field-block');
    const result = [];

    blocks.forEach(block => {
        const type = block.querySelector('.field-type-badge').textContent;
        const id = block.querySelector('.field-id-input').value.trim();
        const extras = block.querySelector('.field-extras');

        const field = { id, type };

        const actionEl = block.querySelector('[data-role="action"]');
        const actionVal = actionEl?.value?.trim();
        if (actionVal) field.action = actionVal;

        if (type === 'select') {
            const optRows = extras.querySelectorAll('.option-row');
            field.options = [];
            optRows.forEach(row => {
                const v = row.querySelector('[data-role="opt-value"]').value.trim();
                const lWrap = row.querySelector('[data-role="opt-label"]');
                const l = getBilingual(lWrap);
                const t = row.querySelector('[data-role="opt-target"]')?.value.trim();
                if (v) {
                    const opt = { value: v, label: l || { en: '', es: '' } };
                    if (t) opt.target = t;
                    field.options.push(opt);
                }
            });
        } else if (type === 'number_input') {
            const labelEl = extras.querySelector('[data-role="label"]');
            const lbl = getBilingual(labelEl);
            if (lbl) field.label = lbl;
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            const def = parseFloat(get('default'));
            if (!isNaN(def)) field.default = def;
            const min = parseFloat(get('min'));
            if (!isNaN(min)) field.min = min;
            const max = parseFloat(get('max'));
            if (!isNaN(max)) field.max = max;
            const step = parseFloat(get('step'));
            if (!isNaN(step)) field.step = step;
            const targetVal = get('field-target');
            if (targetVal) field.target = targetVal;
        } else if (type === 'image_list') {
            const imgRows = extras.querySelectorAll('[data-role="img-src"]');
            field.images = [];
            imgRows.forEach(inp => {
                const src = inp.value.trim();
                if (src) field.images.push({ src });
            });
        } else if (type === 'audio_list') {
            const audioRows = extras.querySelectorAll('[data-role="audio-src"]');
            field.audios = [];
            audioRows.forEach(inp => {
                const src = inp.value.trim();
                if (src) field.audios.push({ src });
            });
        } else if (type === 'alert') {
            const messageEl = extras.querySelector('[data-role="message"]');
            const msg = getBilingual(messageEl);
            if (msg) field.message = msg;
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            if (get('severity')) field.severity = get('severity');
        } else if (type === 'text_block') {
            const messageEl = extras.querySelector('[data-role="message"]');
            const msg = getBilingual(messageEl);
            if (msg) field.message = msg;
        } else if (type === 'month_picker') {
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            const targetVal = get('field-target');
            if (targetVal) field.target = targetVal;
        } else if (type === 'bottom_navigation') {
            const rows = extras.querySelectorAll('.option-row');
            field.buttons = [];
            rows.forEach(row => {
                const lWrap = row.querySelector('[data-role="btn-label"]');
                const target = row.querySelector('[data-role="btn-target"]')?.value.trim() || '';
                const label = getBilingual(lWrap) || { en: '', es: '' };
                field.buttons.push({ label, target });
            });
        }

        result.push(field);
    });
    return result;
}

// ─── Next navigation ──────────────────────────────────────────────────────────

function renderNext(next) {
    const typeEl = document.getElementById('next-type');
    const directDiv = document.getElementById('next-direct');
    const fieldMapDiv = document.getElementById('next-field-map');

    if (!next) {
        typeEl.value = 'null';
    } else if (typeof next === 'string') {
        typeEl.value = 'direct';
        document.getElementById('next-direct-target').value = next;
    } else if (next && next.field) {
        typeEl.value = 'field';
        document.getElementById('next-field-id').value = next.field || '';
        renderMapRows(next.map || {});
    }
    updateNextVisibility();
}

function updateNextVisibility() {
    const type = document.getElementById('next-type').value;
    document.getElementById('next-direct').style.display = type === 'direct' ? 'block' : 'none';
    document.getElementById('next-field-map').style.display = type === 'field' ? 'block' : 'none';
}

function renderMapRows(map) {
    const container = document.getElementById('next-map-rows');
    container.innerHTML = '';
    Object.entries(map).forEach(([key, value]) => {
        container.appendChild(buildMapRow(key, value));
    });
}

function buildMapRow(key, value) {
    const row = document.createElement('div');
    row.className = 'option-row';

    const kInput = textInput(key, 'option value');
    kInput.dataset.role = 'map-key';
    const vInput = textInput(value, 'target node id');
    vInput.dataset.role = 'map-value';
    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => { row.remove(); markDirty(); });

    row.appendChild(kInput);
    row.appendChild(vInput);
    row.appendChild(del);
    return row;
}

function getNextFromDOM() {
    const type = document.getElementById('next-type').value;
    if (type === 'null') return null;
    if (type === 'direct') {
        return document.getElementById('next-direct-target').value.trim() || null;
    }
    if (type === 'field') {
        const field = document.getElementById('next-field-id').value.trim();
        const map = {};
        document.querySelectorAll('#next-map-rows .option-row').forEach(row => {
            const k = row.querySelector('[data-role="map-key"]').value.trim();
            const v = row.querySelector('[data-role="map-value"]').value.trim();
            if (k) map[k] = v;
        });
        return { field, map };
    }
    return null;
}

// ─── Save / Delete node ───────────────────────────────────────────────────────

function showSaveResult(success, nodeId, errorMsg) {
    const resultEl = document.getElementById('save-result');
    const formEl = document.getElementById('editor-form');
    formEl.style.display = 'none';
    resultEl.style.display = 'block';

    if (success) {
        resultEl.innerHTML = `
            <div class="save-result save-result--success">
                <span class="save-result-icon">✓</span>
                <p>Node <strong>${nodeId}</strong> saved successfully.</p>
                <button class="btn-sm save-result-back">← Back to editing</button>
            </div>`;
    } else {
        resultEl.innerHTML = `
            <div class="save-result save-result--error">
                <span class="save-result-icon">✕</span>
                <p>Failed to save node: ${errorMsg}</p>
                <button class="btn-sm save-result-back">← Back to editing</button>
            </div>`;
    }

    resultEl.querySelector('.save-result-back').addEventListener('click', () => {
        resultEl.style.display = 'none';
        formEl.style.display = 'block';
    });
}

function saveNode() {
    const id = document.getElementById('field-id').value.trim();
    if (!id) { alert('Node ID is required'); return; }

    try {
        const milkingMethod = document.getElementById('field-milking-method').value.trim();
        const scenario = document.getElementById('field-scenario').value.trim();
        const manualPage = document.getElementById('field-manual-page').value.trim();
        const guideId = document.getElementById('field-guide-id').value.trim();
        const severity = parseInt(document.getElementById('field-severity').value) || 0;
        const periodicity = document.getElementById('field-periodicity').value.trim();
        const category = document.getElementById('field-category').value.trim();
        const scoreAnswer = document.getElementById('field-score-answer').value.trim();
        const setupFieldNameEn = document.getElementById('field-setup-field-name-en').value.trim();
        const setupFieldNameEs = document.getElementById('field-setup-field-name-es').value.trim();

        const node = {
            'milking-method': milkingMethod,
            scenario,
            'manual-page': manualPage,
            'guide-id': guideId,
            severity,
            periodicity,
            category,
            'score-answer': scoreAnswer,
            title: {
                en: document.getElementById('field-title-en').value.trim(),
                es: document.getElementById('field-title-es').value.trim(),
            },
            fields: getFieldsFromDOM(),
        };

        if (scenario === 'APP-SETUP' && (setupFieldNameEn || setupFieldNameEs)) {
            node['setup-field-name'] = {
                en: setupFieldNameEn,
                es: setupFieldNameEs,
            };
        }

        const subtitleEn = document.getElementById('field-subtitle-en').value.trim();
        const subtitleEs = document.getElementById('field-subtitle-es').value.trim();
        if (subtitleEn || subtitleEs) node.subtitle = { en: subtitleEn, es: subtitleEs };

        if (document.getElementById('field-showDate').checked) node.showDate = true;

        const icon = document.getElementById('field-icon').value.trim();
        if (icon) node.icon = icon;

        // If ID changed, remove old entry
        if (selectedNodeId && selectedNodeId !== id) {
            delete nodes[selectedNodeId];
        }

        nodes[id] = node;
        selectedNodeId = id;
        bumpTimestamp();
        saveToStorage();
        fbSet(id, node);
        renderNodeList();
        markClean();
        showSaveResult(true, id);
    } catch (err) {
        showSaveResult(false, id, err.message);
    }
}

function deleteNode() {
    if (!selectedNodeId) return;
    if (!confirm(`Delete node "${selectedNodeId}"?`)) return;
    const removedId = selectedNodeId;
    delete nodes[removedId];
    selectedNodeId = null;
    bumpTimestamp();
    saveToStorage();
    fbRemove(removedId);
    renderNodeList();
    document.getElementById('editor-form').style.display = 'none';
    document.getElementById('editor-placeholder').style.display = 'block';
}

function suggestDuplicateId(sourceId) {
    const base = `${sourceId}-copy`;
    if (!Object.prototype.hasOwnProperty.call(nodes, base)) return base;

    let n = 2;
    while (Object.prototype.hasOwnProperty.call(nodes, `${base}-${n}`)) {
        n += 1;
    }
    return `${base}-${n}`;
}

function duplicateNode() {
    if (!selectedNodeId || !nodes[selectedNodeId]) {
        alert('Select a node to duplicate first.');
        return;
    }

    const sourceId = selectedNodeId;
    const defaultId = suggestDuplicateId(sourceId);
    const newId = prompt('New ID for duplicated node:', defaultId);
    if (newId === null) return;

    const cleanId = newId.trim();
    if (!cleanId) {
        alert('Node ID is required.');
        return;
    }

    if (Object.prototype.hasOwnProperty.call(nodes, cleanId)) {
        alert(`Node "${cleanId}" already exists.`);
        return;
    }

    const clone = JSON.parse(JSON.stringify(nodes[sourceId]));
    nodes[cleanId] = clone;
    selectedNodeId = cleanId;

    bumpTimestamp();
    saveToStorage();
    fbSet(cleanId, clone);
    renderNodeList();
    loadNodeIntoForm(clone);
    markClean();
}

// ─── Firebase modal ──────────────────────────────────────────────────────────

function openFirebaseModal() {
    const modal = document.getElementById('modal-firebase');
    if (!modal) return;
    const cfg = loadFbConfig() || {};
    document.getElementById('fb-api-key').value       = cfg.apiKey       || '';
    document.getElementById('fb-auth-domain').value   = cfg.authDomain   || '';
    document.getElementById('fb-project-id').value    = cfg.projectId    || '';
    document.getElementById('fb-database-url').value  = cfg.databaseURL  || '';
    document.getElementById('fb-modal-error').style.display = 'none';
    document.getElementById('fb-modal-disconnect').style.display = fbDb ? 'inline-block' : 'none';
    modal.style.display = 'flex';
}

function closeFirebaseModal() {
    const modal = document.getElementById('modal-firebase');
    if (modal) modal.style.display = 'none';
}

// ─── Graph view ───────────────────────────────────────────────────────────────

function sanitizeId(id) {
    // Mermaid node IDs must not contain hyphens as bare tokens
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildMermaidDef(nodeMap) {
    const lines = ['flowchart TD'];
    const nodeKeys = Object.keys(nodeMap).filter(k => k !== 'timestamp');
    const seenEdges = new Set();

    function addEdge(fromKey, toKey, label, style = '-->') {
        if (!fromKey || !toKey) return;
        const edgeKey = `${fromKey}::${toKey}::${label || ''}::${style}`;
        if (seenEdges.has(edgeKey)) return;
        seenEdges.add(edgeKey);
        const fromId = sanitizeId(fromKey);
        const toId = sanitizeId(toKey);
        if (label) {
            lines.push(`    ${fromId} ${style}|"${label}"| ${toId}`);
        } else {
            lines.push(`    ${fromId} ${style} ${toId}`);
        }
    }

    // Node labels
    nodeKeys.forEach(key => {
        const node = nodeMap[key];
        const title = node.title?.en || key;
        const sid = sanitizeId(key);
        lines.push(`    ${sid}["${title}\n<small>${key}</small>"]`);
    });

    // Edges
    nodeKeys.forEach(key => {
        const node = nodeMap[key];

        // Legacy node-level navigation support.
        if (node.next) {
            if (typeof node.next === 'string') {
                addEdge(key, node.next, '', '-->');
            } else if (node.next.map) {
                Object.entries(node.next.map).forEach(([val, target]) => {
                    addEdge(key, target, val, '-->');
                });
            }
        }

        // Current field-level navigation targets.
        (node.fields || []).forEach(field => {
            if (field.type === 'select') {
                (field.options || []).forEach(option => {
                    if (!option.target) return;
                    addEdge(key, option.target, option.value || '', '-->');
                });
            } else if (field.type === 'number_input' || field.type === 'month_picker') {
                if (field.target) addEdge(key, field.target, field.id || field.type, '-->');
            } else if (field.type === 'bottom_navigation') {
                (field.buttons || []).forEach(button => {
                    if (!button.target) return;
                    const label = button.label?.en || button.label || '';
                    addEdge(key, button.target, label, '-.->');
                });
            }
        });
    });

    return lines.join('\n');
}

async function openGraphModal() {
    const mermaid = window.__mermaid;
    if (!mermaid) { alert('Mermaid not loaded yet, please try again.'); return; }

    const def = buildMermaidDef(nodes);
    const inner = document.getElementById('graph-inner');
    inner.innerHTML = '';

    try {
        const id = 'milc-graph-' + Date.now();
        const { svg } = await mermaid.render(id, def);
        inner.innerHTML = svg;

        // Wire click-to-select on every node
        inner.querySelectorAll('.node').forEach(el => {
            const rawId = el.id?.replace(/^flowchart-/, '').replace(/-\d+$/, '');
            // Map sanitized id back to original key
            const originalKey = Object.keys(nodes).find(
                k => sanitizeId(k) === rawId
            );
            if (!originalKey) return;
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
                document.getElementById('modal-graph').style.display = 'none';
                selectNode(originalKey);
            });
        });
    } catch (err) {
        inner.textContent = 'Failed to render graph: ' + err.message;
    }

    document.getElementById('modal-graph').style.display = 'flex';
}

// ─── Export ───────────────────────────────────────────────────────────────────

function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ─── Import ───────────────────────────────────────────────────────────────────

function importFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                nodes = JSON.parse(e.target.result);
                saveToStorage();
                fbPushAll();
                renderNodeList();
            } catch (err) {
                alert(`Failed to parse ${file.name}: ${err.message}`);
            }
        };
        reader.readAsText(file);
    });
}

// ─── Static event bindings ────────────────────────────────────────────────────

function bindStaticEvents() {
    document.getElementById('btn-add-node').addEventListener('click', () => {
        selectedNodeId = null;
        renderNodeList();
        clearForm();
        document.getElementById('editor-placeholder').style.display = 'none';
        document.getElementById('editor-form').style.display = 'block';
        document.getElementById('field-id').focus();
    });

    document.querySelectorAll('.btn-add-field').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const container = document.getElementById('fields-container');
            const existing = container.querySelectorAll('.field-block').length;
            container.appendChild(buildFieldEl({ type, id: '' }, existing));
            markDirty();
        });
    });

    document.getElementById('btn-save-node').addEventListener('click', saveNode);
    document.getElementById('btn-duplicate-node').addEventListener('click', duplicateNode);
    document.getElementById('btn-delete-node').addEventListener('click', deleteNode);
    document.getElementById('btn-cancel-node').addEventListener('click', () => {
        document.getElementById('editor-form').style.display = 'none';
        document.getElementById('save-result').style.display = 'none';
        document.getElementById('editor-placeholder').style.display = 'block';
    });

    document.getElementById('editor-form').addEventListener('input', markDirty);
    document.getElementById('editor-form').addEventListener('change', markDirty);
    document.getElementById('field-scenario').addEventListener('change', handleScenarioChange);
    updateSetupFieldVisibility();

    document.getElementById('btn-graph').addEventListener('click', openGraphModal);
    document.getElementById('btn-graph-close').addEventListener('click', () => {
        document.getElementById('modal-graph').style.display = 'none';
    });
    document.getElementById('modal-graph').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-graph'))
            document.getElementById('modal-graph').style.display = 'none';
    });

    // Icon picker modal
    document.getElementById('btn-pick-icon').addEventListener('click', () => {
        document.getElementById('modal-icon-picker').style.display = 'flex';
    });
    document.getElementById('btn-icon-close').addEventListener('click', () => {
        document.getElementById('modal-icon-picker').style.display = 'none';
    });
    document.getElementById('btn-icon-none').addEventListener('click', () => {
        selectIcon('');
    });
    document.getElementById('modal-icon-picker').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-icon-picker'))
            document.getElementById('modal-icon-picker').style.display = 'none';
    });

    document.getElementById('btn-export-nodes').addEventListener('click', () => downloadJSON('nodes.json', nodes));

    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.dataset.theme || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', (e) => {
        importFiles(e.target.files);
        e.target.value = '';
    });

    // ─── Firebase modal ───────────────────────────────────────────────────────

    const modal = document.getElementById('modal-firebase');

    document.getElementById('btn-firebase-status').addEventListener('click', () => {
        // If connected and signed in, sign out; otherwise open config modal
        if (fbDb && fbUser) {
            if (confirm(`Sign out from Firebase (${fbUser.email})?`)) {
                signOut(fbAuth).catch(console.error);
            }
        } else {
            openFirebaseModal();
        }
    });
    document.getElementById('fb-modal-cancel').addEventListener('click', closeFirebaseModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeFirebaseModal(); });

    // .env file loader
    document.getElementById('fb-env-browse').addEventListener('click', () => {
        document.getElementById('fb-env-file').click();
    });
    document.getElementById('fb-env-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        document.getElementById('fb-env-filename').textContent = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const vars = {};
            ev.target.result.split(/\r?\n/).forEach(line => {
                const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
                if (m) vars[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
            });
            if (vars.VITE_FIREBASE_API_KEY)
                document.getElementById('fb-api-key').value = vars.VITE_FIREBASE_API_KEY;
            if (vars.VITE_FIREBASE_AUTH_DOMAIN)
                document.getElementById('fb-auth-domain').value = vars.VITE_FIREBASE_AUTH_DOMAIN;
            if (vars.VITE_FIREBASE_PROJECT_ID)
                document.getElementById('fb-project-id').value = vars.VITE_FIREBASE_PROJECT_ID;
            if (vars.VITE_FIREBASE_DATABASE_URL)
                document.getElementById('fb-database-url').value = vars.VITE_FIREBASE_DATABASE_URL;
            document.getElementById('fb-modal-error').style.display = 'none';
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Auth banner sign-in
    async function handleSignIn() {
        const email    = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const errEl    = document.getElementById('auth-banner-error');
        if (!email || !password) { errEl.textContent = 'Enter email and password.'; return; }
        try {
            errEl.textContent = '';
            await signInWithEmailAndPassword(fbAuth, email, password);
        } catch (err) {
            errEl.textContent = err.message;
        }
    }
    document.getElementById('btn-auth-signin').addEventListener('click', handleSignIn);
    document.getElementById('auth-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSignIn();
    });

    document.getElementById('fb-modal-connect').addEventListener('click', async () => {
        const config = {
            apiKey:      document.getElementById('fb-api-key').value.trim(),
            authDomain:  document.getElementById('fb-auth-domain').value.trim(),
            projectId:   document.getElementById('fb-project-id').value.trim(),
            databaseURL: document.getElementById('fb-database-url').value.trim(),
        };
        if (!config.apiKey || !config.databaseURL) {
            const errEl = document.getElementById('fb-modal-error');
            errEl.textContent = 'API Key and Database URL are required.';
            errEl.style.display = 'block';
            return;
        }
        try {
            await connectFirebase(config);
            saveFbConfig(config);
            closeFirebaseModal();
        } catch (err) {
            const errEl = document.getElementById('fb-modal-error');
            errEl.textContent = `Connection failed: ${err.message}`;
            errEl.style.display = 'block';
        }
    });

    document.getElementById('fb-modal-disconnect').addEventListener('click', () => {
        disconnectFirebase();
        clearFbConfig();
        closeFirebaseModal();
    });

    document.getElementById('btn-push-firebase').addEventListener('click', () => {
        if (!fbDb) return;
        if (confirm('Push all local nodes to Firebase? This will overwrite /survey.')) fbPushAll();
    });

    document.getElementById('btn-pull-firebase').addEventListener('click', () => {
        if (!fbDb) return;
        fbPullAll();
    });

    document.getElementById('pull-diff-confirm').addEventListener('click', () => {
        const modal = document.getElementById('modal-pull-diff');
        const remote = modal._pendingRemote;
        modal.style.display = 'none';
        modal._pendingRemote = null;
        if (!remote) return;
        nodes = remote;
        saveToStorage();
        renderNodeList();
        if (selectedNodeId && nodes[selectedNodeId]) {
            loadNodeIntoForm(nodes[selectedNodeId]);
        } else if (selectedNodeId && !nodes[selectedNodeId]) {
            selectedNodeId = null;
            document.getElementById('editor-form').style.display = 'none';
            document.getElementById('editor-placeholder').style.display = 'block';
        }
    });

    document.getElementById('pull-diff-cancel').addEventListener('click', () => {
        const modal = document.getElementById('modal-pull-diff');
        modal.style.display = 'none';
        modal._pendingRemote = null;
    });
}
