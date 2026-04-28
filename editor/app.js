// ─── State ───────────────────────────────────────────────────────────────────

let nodes = {};   // { [id]: nodeObject }
let labels = {};  // { [key]: { en, es } }
let selectedNodeId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderNodeList();
    renderLabelList();
    bindStaticEvents();
});

function loadFromStorage() {
    try {
        const n = localStorage.getItem('milc_nodes');
        const l = localStorage.getItem('milc_labels');
        if (n) nodes = JSON.parse(n);
        if (l) labels = JSON.parse(l);
    } catch (_) {}
}

function saveToStorage() {
    localStorage.setItem('milc_nodes', JSON.stringify(nodes));
    localStorage.setItem('milc_labels', JSON.stringify(labels));
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
    document.getElementById('field-title').value = node.title || '';
    document.getElementById('field-subtitle').value = node.subtitle || '';
    document.getElementById('field-showDate').checked = !!node.showDate;
    document.getElementById('field-icon').value = node.icon || '';

    renderFields(node.fields || []);
    renderNext(node.next);
}

function clearForm() {
    document.getElementById('field-id').value = '';
    document.getElementById('field-title').value = '';
    document.getElementById('field-subtitle').value = '';
    document.getElementById('field-showDate').checked = false;
    document.getElementById('field-icon').value = '';
    renderFields([]);
    renderNext(null);
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

    const labelInput = textInput(field.label, 'label key (optional)');
    wrap.appendChild(makeRow('Label key', labelInput));
    labelInput.dataset.role = 'label';

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
        optList.appendChild(buildOptionRow('', ''));
    });
    wrap.appendChild(addBtn);

    return wrap;
}

function buildOptionRow(value, label) {
    const row = document.createElement('div');
    row.className = 'option-row';

    const vInput = textInput(value, 'value');
    vInput.dataset.role = 'opt-value';
    const lInput = textInput(label, 'label key');
    lInput.dataset.role = 'opt-label';

    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'btn-icon btn-danger';
    del.addEventListener('click', () => row.remove());

    row.appendChild(vInput);
    row.appendChild(lInput);
    row.appendChild(del);
    return row;
}

function buildNumberExtras(field) {
    const wrap = document.createElement('div');

    const labelInput = textInput(field.label, 'label key');
    labelInput.dataset.role = 'label';
    wrap.appendChild(makeRow('Label key', labelInput));

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
    const labelInput = textInput(field.label, 'label key');
    labelInput.dataset.role = 'label';
    wrap.appendChild(makeRow('Label key', labelInput));

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
            const labelEl = extras.querySelector('[data-role="label"]');
            if (labelEl && labelEl.value.trim()) field.label = labelEl.value.trim();
            const optRows = extras.querySelectorAll('.option-row');
            field.options = [];
            optRows.forEach(row => {
                const v = row.querySelector('[data-role="opt-value"]').value.trim();
                const l = row.querySelector('[data-role="opt-label"]').value.trim();
                if (v) field.options.push({ value: v, label: l });
            });
        } else if (type === 'number_input') {
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            if (get('label')) field.label = get('label');
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
            const get = (role) => extras.querySelector(`[data-role="${role}"]`)?.value.trim();
            if (get('label')) field.label = get('label');
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
        title: document.getElementById('field-title').value.trim(),
        fields: getFieldsFromDOM(),
        next: getNextFromDOM(),
    };

    const subtitle = document.getElementById('field-subtitle').value.trim();
    if (subtitle) node.subtitle = subtitle;

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

// ─── Labels ───────────────────────────────────────────────────────────────────

function renderLabelList(filter = '') {
    const ul = document.getElementById('label-list');
    ul.innerHTML = '';
    const q = filter.toLowerCase();
    Object.entries(labels)
        .filter(([k, v]) => !q || k.toLowerCase().includes(q) || (v.en || '').toLowerCase().includes(q) || (v.es || '').toLowerCase().includes(q))
        .forEach(([key, val]) => {
            const li = document.createElement('li');
            const keySpan = document.createElement('span');
            keySpan.className = 'label-key';
            keySpan.textContent = key;
            const valSpan = document.createElement('span');
            valSpan.className = 'label-val';
            valSpan.textContent = `${val.en || ''} / ${val.es || ''}`;
            li.appendChild(keySpan);
            li.appendChild(valSpan);
            li.addEventListener('click', () => openLabelModal(key));
            ul.appendChild(li);
        });
}

let editingLabelKey = null;

function openLabelModal(key) {
    editingLabelKey = key || null;
    document.getElementById('modal-title').textContent = key ? 'Edit label' : 'New label';
    document.getElementById('modal-key').value = key || '';
    document.getElementById('modal-en').value = key ? (labels[key]?.en || '') : '';
    document.getElementById('modal-es').value = key ? (labels[key]?.es || '') : '';
    document.getElementById('modal-delete').style.display = key ? 'inline-block' : 'none';
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-key').focus();
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    editingLabelKey = null;
}

function saveLabel() {
    const key = document.getElementById('modal-key').value.trim();
    if (!key) { alert('Key is required'); return; }
    if (editingLabelKey && editingLabelKey !== key) {
        delete labels[editingLabelKey];
    }
    labels[key] = {
        en: document.getElementById('modal-en').value,
        es: document.getElementById('modal-es').value,
    };
    saveToStorage();
    closeModal();
    renderLabelList(document.getElementById('label-search').value);
}

function deleteLabel() {
    if (!editingLabelKey) return;
    if (!confirm(`Delete label "${editingLabelKey}"?`)) return;
    delete labels[editingLabelKey];
    saveToStorage();
    closeModal();
    renderLabelList(document.getElementById('label-search').value);
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
                const data = JSON.parse(e.target.result);
                if (file.name.includes('nodes')) {
                    nodes = data;
                } else if (file.name.includes('labels')) {
                    labels = data;
                } else {
                    // Guess by structure: if values have en/es it's labels
                    const firstVal = Object.values(data)[0];
                    if (firstVal && typeof firstVal === 'object' && ('en' in firstVal || 'es' in firstVal)) {
                        labels = data;
                    } else {
                        nodes = data;
                    }
                }
                saveToStorage();
                renderNodeList();
                renderLabelList();
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
    document.getElementById('btn-export-labels').addEventListener('click', () => downloadJSON('labels.json', labels));

    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', (e) => {
        importFiles(e.target.files);
        e.target.value = '';
    });

    document.getElementById('btn-add-label').addEventListener('click', () => openLabelModal(null));

    document.getElementById('label-search').addEventListener('input', (e) => {
        renderLabelList(e.target.value);
    });

    document.getElementById('modal-save').addEventListener('click', saveLabel);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-delete').addEventListener('click', deleteLabel);

    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}
