import { initializeApp, getApps, deleteApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, onValue, set, remove } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
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
        if (authBanner) authBanner.style.display = fbUser ? 'none' : 'flex';
        if (appEl) appEl.style.display = fbUser ? 'flex' : 'none';
    } else {
        statusBtn.textContent = '🔥 Not connected';
        statusBtn.title = 'Configure Firebase sync';
        statusBtn.classList.remove('status-connected');
        statusBtn.classList.add('status-disconnected');
        if (pushBtn) pushBtn.style.display = 'none';
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

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(localStorage.getItem('milc_theme') || 'dark');
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
        }
    } else {
        updateFirebaseStatusUI();
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

// ─── Node form ────────────────────────────────────────────────────────────────

function loadNodeIntoForm(node) {
    document.getElementById('editor-placeholder').style.display = 'none';
    document.getElementById('save-result').style.display = 'none';
    const form = document.getElementById('editor-form');
    form.style.display = 'block';

    document.getElementById('field-id').value = node.id || '';
    document.getElementById('field-title-en').value = node.title?.en || '';
    document.getElementById('field-title-es').value = node.title?.es || '';
    document.getElementById('field-subtitle-en').value = node.subtitle?.en || '';
    document.getElementById('field-subtitle-es').value = node.subtitle?.es || '';
    document.getElementById('field-showDate').checked = !!node.showDate;
    document.getElementById('field-icon').value = node.icon || '';

    renderFields(node.fields || []);
    renderNext(node.next);
    markClean();
}

function clearForm() {
    document.getElementById('field-id').value = '';
    document.getElementById('field-title-en').value = '';
    document.getElementById('field-title-es').value = '';
    document.getElementById('field-subtitle-en').value = '';
    document.getElementById('field-subtitle-es').value = '';
    document.getElementById('field-showDate').checked = false;
    document.getElementById('field-icon').value = '';
    renderFields([]);
    renderNext(null);
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
    } else if (field.type === 'alert') {
        extras.appendChild(buildAlertExtras(field));
    } else if (field.type === 'month_picker') {
        const lbl = document.createElement('span');
        lbl.className = 'hint';
        lbl.textContent = 'No extra options for month_picker';
        extras.appendChild(lbl);
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
        optList.appendChild(buildOptionRow(opt.value, opt.label));
    });
    wrap.appendChild(optList);

    const addBtn = document.createElement('button');
    addBtn.textContent = '＋ Add option';
    addBtn.className = 'btn-sm';
    addBtn.addEventListener('click', () => {
        optList.appendChild(buildOptionRow('', null));
        markDirty();
    });
    wrap.appendChild(addBtn);

    return wrap;
}

function buildOptionRow(value, label) {
    const row = document.createElement('div');
    row.className = 'option-row';

    const vInput = textInput(value, 'value');
    vInput.dataset.role = 'opt-value';

    const lWrap = bilingualInputGroup(label, 'label');
    lWrap.dataset.role = 'opt-label';

    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => { row.remove(); markDirty(); });

    row.appendChild(vInput);
    row.appendChild(lWrap);
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
                if (v) field.options.push({ value: v, label: l || { en: '', es: '' } });
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
        } else if (type === 'image_list') {
            const imgRows = extras.querySelectorAll('[data-role="img-src"]');
            field.images = [];
            imgRows.forEach(inp => {
                const src = inp.value.trim();
                if (src) field.images.push({ src });
            });
        } else if (type === 'alert') {
            const messageEl = extras.querySelector('[data-role="message"]');
            const msg = getBilingual(messageEl);
            if (msg) field.message = msg;
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            if (get('severity')) field.severity = get('severity');
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
        const node = {
            id,
            title: {
                en: document.getElementById('field-title-en').value.trim(),
                es: document.getElementById('field-title-es').value.trim(),
            },
            fields: getFieldsFromDOM(),
            next: getNextFromDOM(),
        };

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
    saveToStorage();
    fbRemove(removedId);
    renderNodeList();
    document.getElementById('editor-form').style.display = 'none';
    document.getElementById('editor-placeholder').style.display = 'block';
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
    document.getElementById('btn-delete-node').addEventListener('click', deleteNode);
    document.getElementById('btn-cancel-node').addEventListener('click', () => {
        document.getElementById('editor-form').style.display = 'none';
        document.getElementById('save-result').style.display = 'none';
        document.getElementById('editor-placeholder').style.display = 'block';
    });

    document.getElementById('editor-form').addEventListener('input', markDirty);
    document.getElementById('editor-form').addEventListener('change', markDirty);

    document.getElementById('next-type').addEventListener('change', updateNextVisibility);

    document.getElementById('btn-add-map-row').addEventListener('click', () => {
        document.getElementById('next-map-rows').appendChild(buildMapRow('', ''));
        markDirty();
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

    function openFirebaseModal() {
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
        modal.style.display = 'none';
    }

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
}
