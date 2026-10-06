(function() {
    var template = document.createElement('template');
    template.innerHTML = '<style>' +
        ':host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif; }' +
        '.portal-container { background: #ffffff; border: 1px solid #e8e8e8; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); padding: 28px; min-height: 520px; display: flex; flex-direction: column; position: relative; overflow: hidden; }' +
        '.portal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }' +
        '.portal-title { font-size: 20px; font-weight: 700; color: #1a1a1a; }' +
        '.progress-bar { display: flex; align-items: center; gap: 4px; background: #f5f5f5; border-radius: 20px; padding: 4px 12px; }' +
        '.progress-step { font-size: 11px; font-weight: 600; color: #999; padding: 4px 10px; border-radius: 12px; }' +
        '.progress-step.active { background: #0070d2; color: #fff; }' +
        '.progress-step.completed { background: #2e844a; color: #fff; }' +
        '.progress-arrow { color: #ccc; font-size: 10px; }' +
        '.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }' +
        '.dim-card { background: #fff; border: 2px solid #eaeaea; border-radius: 10px; padding: 18px 14px; text-align: center; cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden; }' +
        '.dim-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #e0e0e0; transition: background 0.3s; }' +
        '.dim-card:hover { border-color: #0070d2; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,112,210,0.12); }' +
        '.dim-card:hover::before { background: #0070d2; }' +
        '.dim-card.selected { border-color: #0070d2; background: #f0f7ff; box-shadow: 0 4px 16px rgba(0,112,210,0.15); }' +
        '.dim-card.selected::before { background: #0070d2; }' +
        '.dim-card-icon { font-size: 24px; margin-bottom: 8px; }' +
        '.dim-card-name { font-size: 12px; font-weight: 600; color: #333; }' +
        '.dim-card-fields { font-size: 10px; color: #888; margin-top: 4px; }' +
        '.content-section { flex: 1; display: flex; flex-direction: column; }' +
        '.section-heading { font-size: 16px; font-weight: 600; color: #222; margin-bottom: 6px; }' +
        '.section-desc { font-size: 13px; color: #777; margin-bottom: 18px; }' +
        '.no-dims-msg { text-align: center; padding: 60px 20px; color: #999; font-size: 14px; line-height: 1.6; }' +
        '.no-dims-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }' +
        '.spreadsheet-container { flex: 1; display: flex; flex-direction: column; border: 1px solid #d0d5dd; border-radius: 8px; overflow: hidden; min-height: 240px; }' +
        '.spreadsheet-table-wrap { flex: 1; overflow: auto; max-height: 260px; }' +
        '.spreadsheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; }' +
        '.spreadsheet-table th { position: sticky; top: 0; z-index: 2; background: #f0f3f7; padding: 10px 10px; font-size: 11px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #d0d5dd; border-right: 1px solid #d0d5dd; text-align: left; vertical-align: top; }' +
        '.spreadsheet-table th:last-child { border-right: none; }' +
        '.spreadsheet-table th .col-tag { display: block; font-size: 9px; font-weight: 500; color: #888; text-transform: none; letter-spacing: 0; margin-top: 2px; }' +
        '.spreadsheet-table th .col-required { color: #dc3545; font-size: 12px; }' +
        '.th-rownum { width: 40px; text-align: center; }' +
        '.spreadsheet-table td { padding: 0; border-bottom: 1px solid #f0f0f0; border-right: 1px solid #f0f0f0; vertical-align: middle; }' +
        '.spreadsheet-table td:last-child { border-right: none; }' +
        '.spreadsheet-table tr:nth-child(even) td { background: #fafbfc; }' +
        '.spreadsheet-table tr:hover td { background: #f0f7ff; }' +
        '.td-rownum { width: 40px; text-align: center; font-size: 11px; color: #999; background: #f8f9fb !important; border-right: 1px solid #e0e0e0 !important; padding: 6px 4px; }' +
        '.cell-input { width: 100%; border: none; outline: none; padding: 7px 10px; font-size: 13px; font-family: "SF Mono","Courier New",monospace; color: #333; background: transparent; box-sizing: border-box; }' +
        '.cell-input:focus { background: #fff; box-shadow: inset 0 0 0 2px #0070d2; }' +
        '.cell-input::placeholder { color: #ccc; font-style: italic; font-family: -apple-system,sans-serif; }' +
        '.paste-empty { display: flex; align-items: center; justify-content: center; min-height: 160px; flex-direction: column; gap: 8px; cursor: pointer; }' +
        '.paste-empty-icon { font-size: 36px; opacity: 0.4; }' +
        '.paste-empty-text { font-size: 13px; color: #999; }' +
        '.paste-empty-hint { font-size: 11px; color: #bbb; }' +
        '.row-actions { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f8f9fb; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }' +
        '.row-actions .count { font-weight: 600; color: #333; }' +
        '.row-actions-btns { display: flex; gap: 8px; }' +
        '.btn-row-action { font-size: 11px; cursor: pointer; font-weight: 600; background: none; border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; color: #555; }' +
        '.btn-row-action:hover { background: #f0f0f0; }' +
        '.btn-row-action.danger { color: #dc3545; border-color: #f5c6cb; }' +
        '.btn-row-action.danger:hover { background: #fef2f2; }' +
        '.btn-row-action.add { color: #0070d2; border-color: #b8daff; }' +
        '.btn-row-action.add:hover { background: #f0f7ff; }' +
        '.hidden-paste-area { position: absolute; left: -9999px; top: -9999px; opacity: 0; }' +
        '.actions-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }' +
        '.btn { padding: 10px 22px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }' +
        '.btn-primary { background: linear-gradient(135deg,#0070d2,#005fb2); color: #fff; }' +
        '.btn-primary:hover { transform: translateY(-1px); }' +
        '.btn-secondary { background: #fff; color: #555; border: 1px solid #ddd; }' +
        '.btn-success { background: linear-gradient(135deg,#2e844a,#236b3b); color: #fff; }' +
        '.btn-success:hover { transform: translateY(-1px); }' +
        '.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }' +
        '.review-container { flex: 1; overflow: hidden; display: flex; flex-direction: column; }' +
        '.review-summary { background: #f0f7ff; border: 1px solid #b8daff; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }' +
        '.review-summary-text { font-size: 14px; color: #004085; } .review-summary-text strong { font-weight: 700; }' +
        '.dup-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }' +
        '.dup-summary-text { font-size: 13px; color: #991b1b; } .dup-summary-text strong { font-weight: 700; }' +
        '.review-table-wrap { flex: 1; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; max-height: 220px; }' +
        '.review-table { width: 100%; border-collapse: collapse; font-size: 13px; }' +
        '.review-table thead { position: sticky; top: 0; z-index: 1; }' +
        '.review-table th { background: #f8f9fb; padding: 10px 14px; text-align: left; font-weight: 600; color: #444; border-bottom: 1px solid #e0e0e0; font-size: 11px; text-transform: uppercase; }' +
        '.review-table td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #333; }' +
        '.review-table .id-cell { font-weight: 600; color: #0070d2; }' +
        '.review-table tr.dup-row td { background: #fef2f2; color: #999; text-decoration: line-through; }' +
        '.review-table tr.dup-row .id-cell { color: #991b1b; }' +
        '.dup-badge { background: #fee2e2; color: #991b1b; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-decoration: none !important; display: inline-block; }' +
        '.new-badge { background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-block; }' +
        '.status-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }' +
        '.status-open { background: #dbeafe; color: #1e40af; } .status-closed { background: #f3f4f6; color: #374151; } .status-onhold { background: #fef3c7; color: #92400e; } .status-cancelled { background: #fee2e2; color: #991b1b; }' +
        '.empty-desc { color: #ccc; font-style: italic; }' +
        '.alert-box { border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-top: 12px; display: none; align-items: flex-start; gap: 8px; } .alert-box.visible { display: flex; } .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; } .alert-content { flex: 1; line-height: 1.5; }' +
        '.success-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; } .success-circle { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#d1fae5,#a7f3d0); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; } .success-circle-icon { font-size: 36px; color: #059669; } .success-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; } .success-detail { font-size: 14px; color: #666; margin-bottom: 24px; }' +
        '.confirm-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.92); display: none; align-items: center; justify-content: center; z-index: 10; border-radius: 12px; } .confirm-overlay.visible { display: flex; } .confirm-dialog { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 28px 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); text-align: center; max-width: 420px; } .confirm-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; } .confirm-text { font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.5; } .confirm-actions { display: flex; gap: 10px; justify-content: center; }' +
        '.loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.88); display: none; align-items: center; justify-content: center; z-index: 5; border-radius: 12px; flex-direction: column; gap: 12px; } .loading-overlay.visible { display: flex; } .loading-spinner { width: 36px; height: 36px; border: 3px solid #e0e0e0; border-top-color: #0070d2; border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }' +
    '</style>' +
    '<div class="portal-container" id="root"><div class="portal-header"><div class="portal-title">Master Data Portal</div><div class="progress-bar" id="progressBar"></div></div><div class="content-section" id="contentArea"></div><div class="alert-box alert-error" id="alertBox"><span>&#9888;</span><div class="alert-content" id="alertContent"></div></div><div class="confirm-overlay" id="confirmOverlay"><div class="confirm-dialog"><div style="font-size:40px;margin-bottom:12px">&#9889;</div><div class="confirm-title">Confirm Submission</div><div class="confirm-text" id="confirmText"></div><div class="confirm-actions"><button class="btn btn-secondary" id="btnCC">Cancel</button><button class="btn btn-success" id="btnCY">&#10003; Yes, Submit</button></div></div></div><div class="loading-overlay" id="loadO"><div class="loading-spinner"></div><div id="loadT">Processing...</div></div><textarea class="hidden-paste-area" id="hp"></textarea></div>';

    class DimensionDataPortal extends HTMLElement {
        constructor() {
            super();
            this._s = this.attachShadow({mode:'open'});
            this._s.appendChild(template.content.cloneNode(true));
            this._p = {};
            this._stage = 'entry';
            this._sel = '';
            this._rows = [];
            this._parsed = [];
            this._clean = [];
            this._dups = [];
            this._csrf = null;
            var self = this;
            setTimeout(function() {
                self._s.getElementById('btnCC').addEventListener('click', function() { self._s.getElementById('confirmOverlay').classList.remove('visible'); });
                self._s.getElementById('btnCY').addEventListener('click', function() { self._s.getElementById('confirmOverlay').classList.remove('visible'); self._submit(); });
                self._s.getElementById('hp').addEventListener('paste', function(e) { e.preventDefault(); self._paste((e.clipboardData || window.clipboardData).getData('text')); });
            }, 50);
        }

        _dims() {
            var d = [];
            var ic = ['&#128203;','&#128221;','&#128100;','&#127970;','&#128230;','&#128196;','&#128200;','&#128188;','&#128640;','&#127760;','&#128218;','&#128736;','&#127891;','&#128161;','&#128295;','&#128187;','&#128225;','&#128176;','&#128202;','&#128204;'];
            for (var i = 1; i <= 20; i++) {
                var cfg = this._p['dim' + i + 'Config'] || '';
                if (!cfg) continue;
                var pp = cfg.split('|');
                if (pp.length < 3) continue;
                var id = pp[0].trim();
                var lb = pp[1].trim();
                if (!id || !lb) continue;
                var fields = [];
                var fds = pp.slice(2).join('|').split(';');
                for (var j = 0; j < fds.length; j++) {
                    var fd = fds[j].trim();
                    if (!fd) continue;
                    var fp = fd.split(':');
                    var k = (fp[0] || '').trim();
                    var dp = (fp[1] || k).trim();
                    var at = (fp[2] || k).trim();
                    var fl = (fp[3] || '').trim().toLowerCase();
                    var vv = (fp[4] || '').trim();
                    if (!k) continue;
                    var f = {key: k, display: dp, attr: at, required: fl.indexOf('r') > -1};
                    if (vv) {
                        f.validValues = vv.split(',');
                        for (var v = 0; v < f.validValues.length; v++) f.validValues[v] = f.validValues[v].trim();
                    }
                    if (fl.indexOf('d') > -1 && f.validValues && f.validValues.length > 0) f.defaultValue = f.validValues[0];
                    fields.push(f);
                }
                if (fields.length > 0) d.push({id: id, label: lb, icon: ic[(i - 1) % 20], fields: fields});
            }
            return d;
        }

        _selDim() {
            var d = this._dims();
            for (var i = 0; i < d.length; i++) {
                if (d[i].id === this._sel) return d[i];
            }
            return null;
        }

        onCustomWidgetBeforeUpdate(c) {
            this._p = Object.assign({}, this._p, c);
        }

        onCustomWidgetAfterUpdate() {
            this.render();
        }

        connectedCallback() {
            this.render();
        }

        _fetchAll(u, t, a, cb) {
            var self = this;
            a = a || [];
            fetch(u, {method: 'GET', headers: {'Accept': 'application/json', 'x-csrf-token': t}, credentials: 'include'})
            .then(function(r) {
                if (!r.ok) { cb('err', a); return; }
                return r.json();
            })
            .then(function(j) {
                if (!j) return;
                var m = (j.value && Array.isArray(j.value)) ? j.value : (Array.isArray(j) ? j : []);
                a = a.concat(m);
                var n = j['@odata.nextLink'] || '';
                if (n) self._fetchAll(n, t, a, cb);
                else cb('ok', a);
            })
            .catch(function() { cb('err', a); });
        }

        _fetchEx(did) {
            var self = this;
            var tu = this._p.tenantUrl || '';
            var mi = this._p.modelId || '';
            if (!tu || !mi) { self._hl(); self._sa('Set Tenant URL & Model ID in Styling panel.'); return; }
            fetch(tu + '/api/v1/csrf', {method: 'GET', headers: {'x-csrf-token': 'fetch'}, credentials: 'include'})
            .then(function(r) {
                self._csrf = r.headers.get('x-csrf-token');
                self._fetchAll(tu + '/api/v1/dataexport/providers/sac/' + mi + '/' + did + 'Master', self._csrf, [], function(s, m) {
                    if (s === 'ok') self._procEx(m);
                    else { self._hl(); self._sa('Fetch failed.'); }
                });
            })
            .catch(function(e) { self._hl(); self._sa('Error: ' + e); });
        }

        _procEx(m) {
            var ei = {};
            for (var i = 0; i < m.length; i++) {
                var id = m[i].ID || m[i].id || '';
                if (id) ei[id] = true;
            }
            this._clean = [];
            this._dups = [];
            for (var j = 0; j < this._parsed.length; j++) {
                var r = this._parsed[j];
                if (ei[r.id]) { r.isDup = true; this._dups.push(r); }
                else { r.isDup = false; this._clean.push(r); }
            }
            this._hl();
            this._stage = 'confirm';
            this.render();
        }

        _paste(text) {
            if (!text || !this._sel) return;
            var dim = this._selDim();
            if (!dim) return;
            var lines = text.split('\n');
            var cc = dim.fields.length;
            for (var i = 0; i < lines.length; i++) {
                var l = lines[i].trim();
                if (!l) continue;
                var cols = l.split('\t');
                var row = [];
                for (var c = 0; c < cc; c++) row.push((cols[c] || '').trim());
                this._rows.push(row);
            }
            this.render();
        }

        _readG() {
            var dim = this._selDim();
            if (!dim) return;
            var cc = dim.fields.length;
            var rows = [];
            for (var r = 0; r < this._rows.length; r++) {
                var row = [];
                for (var c = 0; c < cc; c++) {
                    var inp = this._s.getElementById('c_' + r + '_' + c);
                    row.push(inp ? inp.value : (this._rows[r][c] || ''));
                }
                rows.push(row);
            }
            this._rows = rows;
        }

        render() {
            this._rp();
            this._rc();
            this._ha();
        }

        _rp() {
            var b = this._s.getElementById('progressBar');
            var st = ['Entry', 'Validate', 'Confirm', 'Submit'];
            var so = ['entry', 'validate', 'confirm', 'submit'];
            var ci = so.indexOf(this._stage);
            var h = '';
            for (var i = 0; i < st.length; i++) {
                var cls = 'progress-step';
                if (i === ci) cls += ' active';
                else if (i < ci) cls += ' completed';
                h += '<span class="' + cls + '">' + st[i] + '</span>';
                if (i < 3) h += '<span class="progress-arrow">&#9654;</span>';
            }
            b.innerHTML = h;
        }

        _rc() {
            var c = this._s.getElementById('contentArea');
            if (this._stage === 'entry') this._re(c);
            else if (this._stage === 'confirm') this._rconf(c);
            else if (this._stage === 'submit') this._rs(c);
        }

        _re(con) {
            var dims = this._dims();
            var h = '<div class="section-heading">Select Dimension</div><div class="section-desc">Choose a dimension, then paste or type data.</div>';
            if (!dims.length) {
                h += '<div class="no-dims-msg"><div class="no-dims-icon">&#9881;</div>No dimensions configured yet.<br>Open the <strong>Styling panel</strong> and click <strong>+ Add Dimension</strong> to get started.</div>';
                con.innerHTML = h;
                return;
            }
            h += '<div class="cards-grid">';
            for (var i = 0; i < dims.length; i++) {
                var d = dims[i];
                var cls = 'dim-card' + (this._sel === d.id ? ' selected' : '');
                var fn = [];
                for (var f = 0; f < d.fields.length; f++) fn.push(d.fields[f].display);
                h += '<div class="' + cls + '" data-d="' + d.id + '"><div class="dim-card-icon">' + d.icon + '</div><div class="dim-card-name">' + d.label + '</div><div class="dim-card-fields">' + fn.join(' \u2022 ') + '</div></div>';
            }
            h += '</div>';
            var dim = this._selDim();
            if (dim) {
                h += '<div class="spreadsheet-container" id="sc"><div class="spreadsheet-table-wrap"><table class="spreadsheet-table"><thead><tr><th class="th-rownum">#</th>';
                for (var j = 0; j < dim.fields.length; j++) {
                    var fl = dim.fields[j];
                    h += '<th>' + fl.display + (fl.required ? ' <span class="col-required">*</span>' : '') + (fl.validValues ? '<span class="col-tag">' + fl.validValues.join(' | ') + '</span>' : (!fl.required ? '<span class="col-tag">optional</span>' : '')) + '</th>';
                }
                h += '</tr></thead>';
                if (this._rows.length > 0) {
                    h += '<tbody>';
                    for (var r = 0; r < this._rows.length; r++) {
                        h += '<tr><td class="td-rownum">' + (r + 1) + '</td>';
                        for (var c = 0; c < dim.fields.length; c++) {
                            var v = this._rows[r][c] || '';
                            h += '<td><input class="cell-input" let type="text" id="c_' + r + '_' + c + '" let value="' + v.replace(/"/g, '&quot;') + '" let placeholder="' + dim.fields[c].display + '" /></td>';
                        }
                        h += '</tr>';
                    }
                    h += '</tbody>';
                }
                h += '</table>';
                if (!this._rows.length) h += '<div class="paste-empty" id="pe"><div class="paste-empty-icon">&#128203;</div><div class="paste-empty-text">Click here and paste (Ctrl+V)</div><div class="paste-empty-hint">Or click + Add Row</div></div>';
                h += '</div><div class="row-actions"><span><span class="count">' + this._rows.length + '</span> row(s)</span><div class="row-actions-btns"><button class="btn-row-action add" id="bA">+ Add Row</button>' + (this._rows.length ? '<button class="btn-row-action danger" id="bC">Clear All</button>' : '') + '</div></div></div>';
            }
            h += '<div class="actions-bar"><div></div><button class="btn btn-primary" id="bV"' + ((!dim || !this._rows.length) ? ' disabled' : '') + '>Validate &amp; Preview &#8594;</button></div>';
            con.innerHTML = h;
            var self = this;
            con.querySelectorAll('.dim-card').forEach(function(card) {
                card.addEventListener('click', function() {
                    if (self._rows.length) self._readG();
                    self._sel = this.getAttribute('data-d');
                    self._rows = [];
                    self._parsed = [];
                    self._clean = [];
                    self._dups = [];
                    self.render();
                });
            });
            var pe = this._s.getElementById('pe');
            if (pe) pe.addEventListener('click', function() { self._s.getElementById('hp').focus(); });
            var sc = this._s.getElementById('sc');
            if (sc) sc.addEventListener('paste', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('cell-input')) return;
                e.preventDefault();
                self._readG();
                self._paste((e.clipboardData || window.clipboardData).getData('text'));
            });
            var bA = this._s.getElementById('bA');
            if (bA) bA.addEventListener('click', function() {
                self._readG();
                var er = [];
                for (var x = 0; x < dim.fields.length; x++) er.push('');
                self._rows.push(er);
                self.render();
                var lf = self._s.getElementById('c_' + (self._rows.length - 1) + '_0');
                if (lf) lf.focus();
            });
            var bC = this._s.getElementById('bC');
            if (bC) bC.addEventListener('click', function() { self._rows = []; self.render(); });
            var bV = this._s.getElementById('bV');
            if (bV) bV.addEventListener('click', function() { self._readG(); self._val(); });
        }

        _val() {
            var dim = this._selDim();
            if (!dim) return;
            var parsed = [];
            var errs = [];
            var seen = {};
            for (var i = 0; i < this._rows.length; i++) {
                var cols = this._rows[i];
                var empty = true;
                for (var x = 0; x < cols.length; x++) { if (cols[x]) { empty = false; break; } }
                if (empty) continue;
                var row = {isDup: false};
                var bad = false;
                for (var c = 0; c < dim.fields.length; c++) {
                    var fd = dim.fields[c];
                    var val = (cols[c] || '').trim();
                    if (fd.required && !val) { errs.push('Row ' + (i + 1) + ': ' + fd.display + ' required.'); bad = true; break; }
                    if (fd.validValues && val && fd.validValues.indexOf(val) === -1) { errs.push('Row ' + (i + 1) + ': Invalid ' + fd.display + '.'); bad = true; break; }
                    if (fd.defaultValue && !val) val = fd.defaultValue;
                    row[fd.key] = val;
                }
                if (bad) continue;
                if (!row.id) { errs.push('Row ' + (i + 1) + ': ID required.'); continue; }
                if (seen[row.id]) { errs.push('Row ' + (i + 1) + ': Duplicate ID.'); continue; }
                seen[row.id] = true;
                parsed.push(row);
            }
            if (errs.length) { this._sa(errs.join('<br>')); return; }
            if (!parsed.length) { this._sa('No valid rows.'); return; }
            this._parsed = parsed;
            this._sl('Checking existing...');
            this._fetchEx(this._sel);
        }

        _rconf(con) {
            var dim = this._selDim();
            if (!dim) return;
            var h = '<div class="review-container"><div class="section-heading">Review &amp; Confirm</div>';
            if (this._clean.length) h += '<div class="review-summary"><span>&#10003;</span><div class="review-summary-text"><strong>' + this._clean.length + ' new</strong> for <strong>' + dim.label + '</strong></div></div>';
            if (this._dups.length) {
                h += '<div class="dup-summary"><span>&#9888;</span><div class="dup-summary-text"><strong>' + this._dups.length + ' duplicate(s)</strong> skipped: ';
                var di = [];
                for (var d = 0; d < this._dups.length && d < 5; d++) di.push(this._dups[d].id);
                h += di.join(', ') + (this._dups.length > 5 ? ' +more' : '') + '</div></div>';
            }
            h += '<div class="review-table-wrap"><table class="review-table"><thead><tr><th>Status</th><th>#</th>';
            for (var i = 0; i < dim.fields.length; i++) h += '<th>' + dim.fields[i].display + '</th>';
            h += '</tr></thead><tbody>';
            for (var j = 0; j < this._parsed.length; j++) {
                var row = this._parsed[j];
                h += '<tr' + (row.isDup ? ' class="dup-row"' : '') + '><td>' + (row.isDup ? '<span class="dup-badge">Dup</span>' : '<span class="new-badge">New</span>') + '</td><td>' + (j + 1) + '</td>';
                for (var k = 0; k < dim.fields.length; k++) {
                    var fd = dim.fields[k];
                    var cv = row[fd.key] || '';
                    if (fd.validValues && cv) {
                        h += '<td><span class="status-pill status-' + cv.toLowerCase().replace(/ /g, '') + '">' + cv + '</span></td>';
                    } else if (!cv && !fd.required) {
                        h += '<td><span class="empty-desc">\u2014</span></td>';
                    } else {
                        h += '<td' + (fd.key === 'id' ? ' class="id-cell"' : '') + '>' + cv + '</td>';
                    }
                }
                h += '</tr>';
            }
            h += '</tbody></table></div></div><div class="actions-bar"><button class="btn btn-secondary" id="bB">&#8592; Back</button>' + (this._clean.length ? '<button class="btn btn-success" id="bS">&#10003; Submit ' + this._clean.length + '</button>' : '<button class="btn btn-success" disabled>All Duplicates</button>') + '</div>';
            con.innerHTML = h;
            var self = this;
            con.querySelector('#bB').addEventListener('click', function() { self._stage = 'entry'; self.render(); });
            var bS = con.querySelector('#bS');
            if (bS) bS.addEventListener('click', function() {
                var ov = self._s.getElementById('confirmOverlay');
                self._s.getElementById('confirmText').innerHTML = 'Create <strong>' + self._clean.length + '</strong> in <strong>' + dim.label + '</strong>?' + (self._dups.length ? '<br><em>' + self._dups.length + ' skipped.</em>' : '');
                ov.classList.add('visible');
            });
        }

        _submit() {
            this._sl('Submitting...');
            this.dispatchEvent(new CustomEvent('onSubmit', {detail: {dimension: this._sel, rowCount: this._clean.length}, bubbles: true, composed: true}));
        }

        _rs(con) {
            var dim = this._selDim();
            con.innerHTML = '<div class="success-view"><div class="success-circle"><span class="success-circle-icon">&#10003;</span></div><div class="success-title">Complete</div><div class="success-detail"><strong>' + this._clean.length + '</strong> created in <strong>' + (dim ? dim.label : '') + '</strong>.' + (this._dups.length ? '<br>' + this._dups.length + ' skipped.' : '') + '</div><button class="btn btn-primary" id="bR">&#8634; New Update</button></div>';
            var self = this;
            con.querySelector('#bR').addEventListener('click', function() {
                self._stage = 'entry';
                self._sel = '';
                self._parsed = [];
                self._rows = [];
                self._clean = [];
                self._dups = [];
                self.render();
            });
        }

        _sa(m) { var b = this._s.getElementById('alertBox'); this._s.getElementById('alertContent').innerHTML = m; b.classList.add('visible'); }
        _ha() { var b = this._s.getElementById('alertBox'); if (b) b.classList.remove('visible'); }
        _sl(m) { var o = this._s.getElementById('loadO'); var t = this._s.getElementById('loadT'); if (t) t.textContent = m || ''; if (o) o.classList.add('visible'); }
        _hl() { var o = this._s.getElementById('loadO'); if (o) o.classList.remove('visible'); }

        getSelectedDimension() { return this._sel; }
        getRowCount() { return this._clean.length; }
        getRowId(i) { return (i >= 0 && i < this._clean.length) ? this._clean[i].id : ''; }
        getRowDescription(i) { return (i >= 0 && i < this._clean.length) ? (this._clean[i].description || '') : ''; }
        getRowStatus(i) { return (i >= 0 && i < this._clean.length) ? (this._clean[i].status || '') : ''; }
        getRowSource(i) { return (i >= 0 && i < this._clean.length) ? (this._clean[i].source || '') : ''; }
        getRowFieldValue(i, k) { return (i >= 0 && i < this._clean.length) ? (this._clean[i][k] || '') : ''; }
        setComplete(s) { this._hl(); if (s === 'success') { this._stage = 'submit'; this.render(); } else this._sa(s); }
        resetWidget() { this._stage = 'entry'; this._sel = ''; this._parsed = []; this._rows = []; this._clean = []; this._dups = []; this.render(); }
    }
    customElements.define('com-sac-dimensiondataportal', DimensionDataPortal);
})();