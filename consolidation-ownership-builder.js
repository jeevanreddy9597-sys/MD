
//   - Initial version.
//************************************************************************
(function () {
  "use strict";

  var TPL = document.createElement("template");
  TPL.innerHTML = `
<style>
  :host{display:block;font-family:"72","72full",Arial,Helvetica,sans-serif;font-size:.8125rem;color:#1D2D3E}
  .sec{border-bottom:1px solid #E5E5E5;padding:.75rem 0}
  .sec h3{margin:0 0 .5rem;font-size:.8125rem;font-weight:700}
  .frm{display:grid;gap:.25rem;margin-bottom:.75rem}
  .frm label{font-size:.75rem;color:#556B82}
  .fld{width:100%;height:1.875rem;border:1px solid #556B82;border-radius:.25rem;background:#fff;
       font-family:inherit;font-size:.8125rem;padding:0 .5rem;color:#1D2D3E}
  .fld:focus{border-color:#0064D9;outline:1px dotted #0032A5;outline-offset:-3px}
  textarea.fld{height:4.5rem;padding:.375rem .5rem;resize:vertical;line-height:1.4}
  .row{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.5rem}
  .sw{position:relative;width:2.5rem;height:1.375rem;flex:none}
  .sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;width:100%;height:100%}
  .sw span{position:absolute;inset:0;border-radius:.6875rem;background:#fff;border:1px solid #556B82;pointer-events:none}
  .sw span::after{content:"";position:absolute;top:.1875rem;left:.1875rem;width:.875rem;height:.875rem;
    border-radius:50%;background:#556B82;transition:transform .15s,background .15s}
  .sw input:checked + span{background:#0070F2;border-color:#0070F2}
  .sw input:checked + span::after{transform:translateX(1.125rem);background:#fff}
  .hint{font-size:.6875rem;color:#556B82;margin:-.375rem 0 .625rem}
  .two{display:flex;gap:.5rem}
  .two .frm{flex:1 1 0}
</style>

<div class="sec">
  <h3>General</h3>
  <div class="frm"><label for="t">Title</label><input class="fld" id="t"></div>
  <div class="frm"><label for="sc">Context line</label><input class="fld" id="sc" placeholder="Set from the story script"></div>
</div>

<div class="sec">
  <h3>Columns and behaviour</h3>
  <div class="row"><span>Show NCI % column</span><label class="sw"><input type="checkbox" id="nci"><span></span></label></div>
  <div class="hint">NCI % = Consolidation % - Ownership %, calculated in the widget only. Never written to the model.</div>
  <div class="row"><span>Group rows by consolidation group</span><label class="sw"><input type="checkbox" id="gr"><span></span></label></div>
  <div class="frm"><label for="pip">Period id pattern</label><input class="fld" id="pip" placeholder="^\d{6}$"></div>
  <div class="hint">Regular expression for the period picker. The default keeps base periods such as 202601 and hides year and quarter nodes. Leave empty to show everything.</div>
  <div class="row"><span>Show filter bar</span><label class="sw"><input type="checkbox" id="fb"><span></span></label></div>
  <div class="row"><span>Show PGROUP column</span><label class="sw"><input type="checkbox" id="pg"><span></span></label></div>
  <div class="hint">PGROUP is derived from the method and always written to the model, whether or not the column is shown.</div>
  <div class="row"><span>Show unbooked combinations</span><label class="sw"><input type="checkbox" id="emp"><span></span></label></div>
  <div class="hint">On: every in-scope group/unit appears as an empty maintainable row. Off: only units that already have data.</div>
  <div class="row"><span>Show progress dialog</span><label class="sw"><input type="checkbox" id="sd"><span></span></label></div>
  <div class="row"><span>Read-only</span><label class="sw"><input type="checkbox" id="ro"><span></span></label></div>
  <div class="frm"><label for="ps">Model percentage scale</label>
    <select class="fld" id="ps">
      <option value="100">Model stores fractions (1 = 100%)</option>
      <option value="1">Model stores 0-100</option>
    </select></div>
  <div class="frm"><label for="dec">Decimal places</label>
    <select class="fld" id="dec"><option>0</option><option>1</option><option>2</option><option>3</option></select></div>
</div>

<div class="sec">
  <h3>Consolidation methods</h3>
  <div class="frm"><label for="def">Default method for new entries</label><select class="fld" id="def"></select></div>
  <div class="frm"><label for="ml">Method list</label><textarea class="fld" id="ml"></textarea></div>
  <div class="hint">One method per record: id~text~pgroup, records separated by ;;<br>pgroup 0 marks a not-consolidated method - its percentages are locked to zero.<br>To fix a method's percentages add consolidation % and ownership %: 101~Holding~1~100~100. Leave one empty to fix only the other: 100~Full~1~100~<br>To WARN instead of fixing, use the two fields after those: 101~Holding~1~~~100 warns when the consolidation % is not 100, and still saves.</div>
</div>

<div class="sec">
  <h3>Master data API</h3>
  <div class="row"><span>Load master data from API</span><label class="sw"><input type="checkbox" id="au"><span></span></label></div>
  <div class="hint">Reads the hierarchy parent, which story scripting cannot provide. Turn off to feed master data from the script instead.</div>
  <div class="frm"><label for="mid">Model id</label><input class="fld" id="mid" placeholder="Set from the story script"></div>
  <div class="hint">Leave empty when the story script calls setModelId(). A typed id has to be changed by hand on every tenant.</div>
  <div class="frm"><label for="turl">Tenant URL (blank = current)</label><input class="fld" id="turl" placeholder="https://tenant.eu10.hcs.cloud.sap"></div>
  <div class="two">
    <div class="frm"><label for="udim">Unit dimension</label><input class="fld" id="udim"></div>
    <div class="frm"><label for="gdim">Group dimension</label><input class="fld" id="gdim"></div>
  </div>
  <div class="two">
    <div class="frm"><label for="cid">Id column</label><input class="fld" id="cid"></div>
    <div class="frm"><label for="cdesc">Description column</label><input class="fld" id="cdesc"></div>
  </div>
  <div class="row"><span>Use MasterWithHierarchy for units</span><label class="sw"><input type="checkbox" id="uh"><span></span></label></div>
  <div class="frm"><label for="exu">Exclude units</label><input class="fld" id="exu" placeholder="#, SNONE, TMP*"></div>
  <div class="frm"><label for="exg">Exclude groups</label><input class="fld" id="exg" placeholder="#, SNONE"></div>
  <div class="hint">Comma separated ids. A trailing * excludes everything with that prefix.</div>
  <div class="frm"><label for="cpar">Parent column</label><input class="fld" id="cpar"></div>
</div>

<div class="sec">
  <h3>Advanced</h3>
  <div class="two">
    <div class="frm"><label for="fs">Field separator</label><input class="fld" id="fs"></div>
    <div class="frm"><label for="rs">Record separator</label><input class="fld" id="rs"></div>
  </div>
  <div class="hint">Change these only if a consolidation unit description can contain the default characters.</div>
  <div class="row"><span>Check loaded scope</span><label class="sw"><input type="checkbox" id="cls"><span></span></label></div>
  <div class="hint">On: data whose version or period is not the one asked for is refused. Switch off only if correct data is being refused.</div>
  <div class="row"><span>Diagnostics</span><label class="sw"><input type="checkbox" id="dg"><span></span></label></div>
  <div class="hint">Prints record detail, including ownership values, to the browser console. Keep off in production.</div>
</div>`;

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  class OwnershipBuilder extends HTMLElement {
    constructor() {
      super();
      this._sr = this.attachShadow({ mode: "open" });
      this._sr.appendChild(TPL.content.cloneNode(true));
      var self = this;
      ["t", "sc", "nci", "pip", "fb", "gr", "pg", "emp", "sd", "ro", "ps", "dec", "def", "ml", "fs", "rs", "au", "mid", "turl", "udim", "gdim", "cid", "cdesc", "cpar", "uh", "exu", "exg", "cls", "dg"].forEach(function (id) {
        self._sr.getElementById(id).addEventListener("change", function () {
          if (id === "ml" || id === "fs" || id === "rs") { self._fillMethods(); }
          self._emit();
        });
      });
    }

    set widgetTitle(v) { this._sr.getElementById("t").value = v || ""; }
    get widgetTitle() { return this._sr.getElementById("t").value; }
    set scopeText(v) { this._sr.getElementById("sc").value = v || ""; }
    get scopeText() { return this._sr.getElementById("sc").value; }
    set showNci(v) { this._sr.getElementById("nci").checked = !!v; }
    get showNci() { return this._sr.getElementById("nci").checked; }
    set periodIdPattern(v) { this._sr.getElementById("pip").value = v == null ? "" : v; }
    get periodIdPattern() { return this._sr.getElementById("pip").value; }
    set showFilterBar(v) { this._sr.getElementById("fb").checked = v !== false; }
    get showFilterBar() { return this._sr.getElementById("fb").checked; }
    set grouped(v) { this._sr.getElementById("gr").checked = !!v; }
    get grouped() { return this._sr.getElementById("gr").checked; }
    set showPgroup(v) { this._sr.getElementById("pg").checked = !!v; }
    get showPgroup() { return this._sr.getElementById("pg").checked; }
    set includeEmptyRows(v) { this._sr.getElementById("emp").checked = !!v; }
    get includeEmptyRows() { return this._sr.getElementById("emp").checked; }
    set showSaveDialog(v) { this._sr.getElementById("sd").checked = v !== false; }
    get showSaveDialog() { return this._sr.getElementById("sd").checked; }
    set readOnly(v) { this._sr.getElementById("ro").checked = !!v; }
    get readOnly() { return this._sr.getElementById("ro").checked; }
    set percentScale(v) { this._sr.getElementById("ps").value = String(v == null ? 100 : v); }
    get percentScale() { return parseInt(this._sr.getElementById("ps").value, 10); }
    set decimals(v) { this._sr.getElementById("dec").value = String(v == null ? 2 : v); }
    get decimals() { return parseInt(this._sr.getElementById("dec").value, 10); }
    set fieldSeparator(v) { this._sr.getElementById("fs").value = v || "~"; }
    get fieldSeparator() { return this._sr.getElementById("fs").value || "~"; }
    set recordSeparator(v) { this._sr.getElementById("rs").value = v || ";;"; }
    get recordSeparator() { return this._sr.getElementById("rs").value || ";;"; }
    set methodList(v) { this._sr.getElementById("ml").value = v || ""; this._fillMethods(); }
    get methodList() { return this._sr.getElementById("ml").value; }
    set defaultMethod(v) { this._pending = v; this._fillMethods(); }
    get defaultMethod() { return this._sr.getElementById("def").value; }

    set autoLoadMasterData(v) { this._sr.getElementById("au").checked = v !== false; }
    get autoLoadMasterData() { return this._sr.getElementById("au").checked; }
    set apiModelId(v) { this._sr.getElementById("mid").value = v || ""; }
    get apiModelId() { return this._sr.getElementById("mid").value; }
    set apiTenantUrl(v) { this._sr.getElementById("turl").value = v || ""; }
    get apiTenantUrl() { return this._sr.getElementById("turl").value; }
    set unitDimension(v) { this._sr.getElementById("udim").value = v || "CL_V3_CONSUNIT"; }
    get unitDimension() { return this._sr.getElementById("udim").value; }
    set groupDimension(v) { this._sr.getElementById("gdim").value = v || "CL_V3_CONSGROUP"; }
    get groupDimension() { return this._sr.getElementById("gdim").value; }
    set memberIdColumn(v) { this._sr.getElementById("cid").value = v || "ID"; }
    get memberIdColumn() { return this._sr.getElementById("cid").value; }
    set memberDescColumn(v) { this._sr.getElementById("cdesc").value = v || "Description"; }
    get memberDescColumn() { return this._sr.getElementById("cdesc").value; }
    set excludeUnits(v) { this._sr.getElementById("exu").value = v == null ? "" : v; }
    get excludeUnits() { return this._sr.getElementById("exu").value; }
    set excludeGroups(v) { this._sr.getElementById("exg").value = v == null ? "" : v; }
    get excludeGroups() { return this._sr.getElementById("exg").value; }
    set useHierarchy(v) { this._sr.getElementById("uh").checked = v !== false; }
    get useHierarchy() { return this._sr.getElementById("uh").checked; }
    set memberParentColumn(v) { this._sr.getElementById("cpar").value = v || "H1_PARENTID"; }
    get memberParentColumn() { return this._sr.getElementById("cpar").value; }
    set checkLoadedScope(v) { this._sr.getElementById("cls").checked = v !== false; }
    get checkLoadedScope() { return this._sr.getElementById("cls").checked; }
    set diagnostics(v) { this._sr.getElementById("dg").checked = v === true; }
    get diagnostics() { return this._sr.getElementById("dg").checked; }

    _fillMethods() {
      var sel = this._sr.getElementById("def");
      var want = this._pending || sel.value;
      var fs = this.fieldSeparator, rs = this.recordSeparator;
      var html = "";
      String(this._sr.getElementById("ml").value || "").split(rs).forEach(function (line) {
        if (!line) return;
        var p = line.split(fs);
        if (!p[0]) return;
        html += '<option value="' + esc(p[0].trim()) + '">' + esc(p[0].trim()) + " - " + esc((p[1] || p[0]).trim()) + "</option>";
      });
      sel.innerHTML = html;
      if (want) sel.value = want;
      this._pending = null;
    }

    _emit() {
      this.dispatchEvent(new CustomEvent("propertiesChanged", {
        detail: {
          properties: {
            widgetTitle: this.widgetTitle,
            scopeText: this.scopeText,
            showNci: this.showNci,
            periodIdPattern: this.periodIdPattern,
            showFilterBar: this.showFilterBar,
            grouped: this.grouped,
            showPgroup: this.showPgroup,
            includeEmptyRows: this.includeEmptyRows,
            showSaveDialog: this.showSaveDialog,
            readOnly: this.readOnly,
            percentScale: this.percentScale,
            decimals: this.decimals,
            defaultMethod: this.defaultMethod,
            methodList: this.methodList,
            fieldSeparator: this.fieldSeparator,
            recordSeparator: this.recordSeparator,
            autoLoadMasterData: this.autoLoadMasterData,
            apiModelId: this.apiModelId,
            apiTenantUrl: this.apiTenantUrl,
            unitDimension: this.unitDimension,
            groupDimension: this.groupDimension,
            memberIdColumn: this.memberIdColumn,
            memberDescColumn: this.memberDescColumn,
            memberParentColumn: this.memberParentColumn,
            useHierarchy: this.useHierarchy,
            excludeUnits: this.excludeUnits,
            excludeGroups: this.excludeGroups,
            checkLoadedScope: this.checkLoadedScope,
            diagnostics: this.diagnostics
          }
        }
      }));
    }
  }

  customElements.define("nttdata-consolidation-ownership-builder", OwnershipBuilder);
})();
