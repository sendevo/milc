// ─── State ───────────────────────────────────────────────────────────────────

let nodes = {};   // { [id]: nodeObject }
let selectedNodeId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderNodeList();
    bindStaticEvents();
});

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
    delBtn.addEventListener('click', () => { wrap.remove(); });
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
    }

    wrap.appendChild(extras);
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
    del.addEventListener('click', () => row.remove());

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
    addBtn.addEventListener('click', () => imgList.appendChild(buildImageRow('')));
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
    del.addEventListener('click', () => row.remove());
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
    del.addEventListener('click', () => row.remove());

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

function saveNode() {
    const id = document.getElementById('field-id').value.trim();
    if (!id) { alert('Node ID is required'); return; }

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
    renderNodeList();
}

function deleteNode() {
    if (!selectedNodeId) return;
    if (!confirm(`Delete node "${selectedNodeId}"?`)) return;
    delete nodes[selectedNodeId];
    selectedNodeId = null;
    saveToStorage();
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
        });
    });

    document.getElementById('btn-save-node').addEventListener('click', saveNode);
    document.getElementById('btn-delete-node').addEventListener('click', deleteNode);

    document.getElementById('next-type').addEventListener('change', updateNextVisibility);

    document.getElementById('btn-add-map-row').addEventListener('click', () => {
        document.getElementById('next-map-rows').appendChild(buildMapRow('', ''));
    });

    document.getElementById('btn-export-nodes').addEventListener('click', () => downloadJSON('nodes.json', nodes));

    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', (e) => {
        importFiles(e.target.files);
        e.target.value = '';
    });
}
