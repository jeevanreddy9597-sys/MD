(function () {
  "use strict";

  const TAG = "com-example-master-data-uploader";

  class MasterDataUploader extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.records = [];
      this.columns = [];
      this.validation = { errors: [], warnings: [] };
      this._initialized = false;
    }

    static get observedAttributes() {
      return ["targetdimension", "existingids"];
    }

    connectedCallback() {
      // Widget initialization / on-start lifecycle.
      if (!this._initialized) {
        this._initialized = true;
        this.render();
      }
    }

    attributeChangedCallback() {
      if (this._initialized) {
        this.validateAndRender();
      }
    }

    get targetDimension() {
      return this.getAttribute("targetdimension") || "";
    }

    get existingIds() {
      const raw = this.getAttribute("existingids") || "";
      if (!raw.trim()) return [];

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (_) {
        // Fall back to comma-separated IDs.
      }

      return raw.split(",").map((id) => id.trim()).filter(Boolean);
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: Arial, sans-serif;
            color: #202124;
            font-size: 14px;
          }
          .box {
            border: 1px solid #c9cdd2;
            border-radius: 8px;
            padding: 16px;
            background: #fff;
          }
          h3 { margin: 0 0 12px; font-size: 18px; }
          .row { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
          label { display: block; margin: 6px 0; }
          input, select, button {
            font: inherit;
            padding: 7px 9px;
            border: 1px solid #aeb4bb;
            border-radius: 4px;
          }
          input[type="file"] { max-width: 100%; }
          button { cursor: pointer; background: #f5f7f9; }
          button.primary { background: #0070f2; color: #fff; border-color: #0070f2; }
          button:disabled { opacity: .5; cursor: not-allowed; }
          .columns { display: flex; gap: 16px; flex-wrap: wrap; }
          .status { margin-top: 12px; padding: 10px; border-radius: 4px; }
          .ok { background: #e8f5e9; }
          .bad { background: #ffebee; }
          .muted { color: #60666d; font-size: 12px; }
          .member-form { border-top: 1px solid #ddd; margin-top: 16px; padding-top: 12px; }
          .member-form input { min-width: 140px; }
          ul { margin: 6px 0; padding-left: 20px; }
          .preview { overflow: auto; max-height: 220px; margin-top: 12px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background: #f3f5f7; }
        </style>

        <div class="box">
          <h3>Master data uploader</h3>
          <div class="muted">
            Target dimension: <strong id="dimension"></strong>
          </div>

          <div class="row">
            <input id="file" type="file" accept=".csv,.json,application/json,text/csv">
            <button id="clear" type="button">Clear data</button>
          </div>

          <div id="mapping"></div>

          <div class="member-form">
            <strong>Add a member manually</strong>
            <div id="manual-fields" class="row"></div>
            <button id="add-member" type="button">Add member</button>
          </div>

          <div id="status" class="status" hidden></div>
          <div id="preview" class="preview"></div>

          <div class="row">
            <button id="upload" class="primary" type="button" disabled>
              Validate and send to SAC
            </button>
          </div>
          <div class="muted">
            Sending data raises the onUploadRequested event. A SAC script must handle
            that event and create the members in the model.
          </div>
        </div>
      `;

      this.shadowRoot.getElementById("dimension").textContent =
        this.targetDimension || "(not configured)";

      this.shadowRoot.getElementById("file").addEventListener("change", (event) => {
        this.loadFile(event.target.files && event.target.files[0]);
      });

      this.shadowRoot.getElementById("clear").addEventListener("click", () => {
        this.records = [];
        this.columns = [];
        this.renderMapping();
        this.validateAndRender();
      });

      this.shadowRoot.getElementById("add-member").addEventListener("click", () => {
        this.addManualMember();
      });

      this.shadowRoot.getElementById("upload").addEventListener("click", () => {
        this.submit();
      });

      this.renderMapping();
      this.renderManualFields();
      this.validateAndRender();
    }

    async loadFile(file) {
      if (!file) return;

      try {
        const text = await file.text();
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".json")) {
          this.loadJson(text);
        } else {
          this.loadCsv(text);
        }

        this.renderMapping();
        this.renderManualFields();
        this.validateAndRender();
      } catch (error) {
        this.records = [];
        this.columns = [];
        this.setStatus(`Could not read file: ${error.message}`, true);
      }
    }

    loadJson(text) {
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed.members;

      if (!Array.isArray(rows)) {
        throw new Error('JSON must be an array or an object containing a "members" array.');
      }

      this.records = rows.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          throw new Error("Each JSON member must be an object.");
        }

        const properties =
          row.properties && typeof row.properties === "object"
            ? row.properties
            : {};

        return { ...row, ...properties };
      });

      this.columns = [...new Set(this.records.flatMap((row) => Object.keys(row)))];
    }

    loadCsv(text) {
      const rows = this.parseCsv(text);
      if (rows.length < 2) {
        throw new Error("CSV must contain a header row and at least one data row.");
      }

      this.columns = rows[0].map((value) => value.trim());
      if (this.columns.some((column) => !column)) {
        throw new Error("CSV contains an empty column name.");
      }

      this.records = rows.slice(1)
        .filter((row) => row.some((value) => String(value || "").trim()))
        .map((row) => {
          const record = {};
          this.columns.forEach((column, index) => {
            record[column] = row[index] === undefined ? "" : row[index];
          });
          return record;
        });
    }

    parseCsv(text) {
      const rows = [];
      let row = [];
      let cell = "";
      let quoted = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && quoted && next === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          row.push(cell);
          cell = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
          if (char === "\r" && next === "\n") i++;
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        } else {
          cell += char;
        }
      }

      if (quoted) throw new Error("CSV contains an unclosed quoted value.");

      if (cell.length || row.length) {
        row.push(cell);
        rows.push(row);
      }

      return rows;
    }

    renderMapping() {
      const container = this.shadowRoot.getElementById("mapping");

      if (!this.columns.length) {
        container.innerHTML = '<p class="muted">Upload a CSV or JSON file to select columns.</p>';
        return;
      }

      const options = this.columns.map((column) =>
        `<option value="${this.escapeHtml(column)}">${this.escapeHtml(column)}</option>`
      ).join("");

      container.innerHTML = `
        <div class="row">
          <label>ID column
            <select id="id-column">${options}</select>
          </label>
          <label>Description column (optional)
            <select id="description-column">
              <option value="">(none)</option>${options}
            </select>
          </label>
        </div>
        <div><strong>Properties to include</strong></div>
        <div id="property-list" class="columns"></div>
      `;

      const idSelect = this.shadowRoot.getElementById("id-column");
      const descSelect = this.shadowRoot.getElementById("description-column");

      const idCandidate = this.findColumn(["id", "memberid", "member_id", "code"]);
      const descCandidate = this.findColumn(["description", "name", "text"]);
      if (idCandidate) idSelect.value = idCandidate;
      if (descCandidate) descSelect.value = descCandidate;

      const propertyList = this.shadowRoot.getElementById("property-list");
      this.columns.forEach((column) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = column;
        checkbox.checked = column !== idSelect.value && column !== descSelect.value;
        checkbox.addEventListener("change", () => {
          this.renderManualFields();
          this.validateAndRender();
        });
        label.append(checkbox, document.createTextNode(` ${column}`));
        propertyList.appendChild(label);
      });

      idSelect.addEventListener("change", () => {
        this.updatePropertyDefaults();
        this.renderManualFields();
        this.validateAndRender();
      });

      descSelect.addEventListener("change", () => {
        this.updatePropertyDefaults();
        this.renderManualFields();
        this.validateAndRender();
      });
    }

    findColumn(candidates) {
      return this.columns.find((column) =>
        candidates.includes(column.toLowerCase().replace(/[\s-]/g, ""))
      );
    }

    updatePropertyDefaults() {
      const id = this.shadowRoot.getElementById("id-column").value;
      const desc = this.shadowRoot.getElementById("description-column").value;

      this.shadowRoot.querySelectorAll("#property-list input[type=checkbox]").forEach((box) => {
        if (box.value === id || box.value === desc) box.checked = false;
      });
    }

    selectedProperties() {
      return [...this.shadowRoot.querySelectorAll(
        "#property-list input[type=checkbox]:checked"
      )].map((box) => box.value);
    }

    renderManualFields() {
      const container = this.shadowRoot.getElementById("manual-fields");
      const properties = this.selectedProperties();

      container.innerHTML = `
        <input id="manual-id" placeholder="Member ID *">
        <input id="manual-description" placeholder="Description">
        ${properties.map((property, index) =>
          `<input data-property="${this.escapeHtml(property)}"
                  placeholder="${this.escapeHtml(property)}">`
        ).join("")}
      `;
    }

    addManualMember() {
      const id = this.shadowRoot.getElementById("manual-id").value.trim();
      const description =
        this.shadowRoot.getElementById("manual-description").value.trim();
      const record = { id, description };

      this.shadowRoot.querySelectorAll("#manual-fields [data-property]").forEach((input) => {
        record[input.dataset.property] = input.value.trim();
      });

      this.records.push(record);

      this.columns = [...new Set([
        ...this.columns,
        "id",
        "description",
        ...this.selectedProperties()
      ])];

      this.renderMapping();
      this.renderManualFields();
      this.validateAndRender();
    }

    validate() {
      const errors = [];
      const warnings = [];
      const idColumn =
        this.shadowRoot.getElementById("id-column")?.value || "id";
      const descColumn =
        this.shadowRoot.getElementById("description-column")?.value || "";
      const propertyColumns = this.selectedProperties();
      const seen = new Set();
      const existing = new Set(this.existingIds);

      if (!this.targetDimension) {
        errors.push("Configure the targetDimension widget property.");
      }
      if (!this.records.length) {
        errors.push("No member records are loaded.");
      }

      const members = this.records.map((record, index) => {
        const id = String(record[idColumn] ?? record.id ?? "").trim();
        const description = String(
          (descColumn && record[descColumn]) ?? record.description ?? ""
        ).trim();

        if (!id) errors.push(`Row ${index + 1}: member ID is blank.`);
        if (id && seen.has(id)) errors.push(`Duplicate ID in upload: ${id}`);
        if (id && existing.has(id)) errors.push(`Member already exists: ${id}`);
        if (id) seen.add(id);

        const properties = {};
        propertyColumns.forEach((column) => {
          const value = record[column];
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            properties[column] = String(value).trim();
          }
        });

        return { id, description, properties };
      });

      if (members.length && !errors.length) {
        warnings.push(`${members.length} member(s) passed client-side validation.`);
      }

      return { errors, warnings, members };
    }

    validateAndRender() {
      this.validation = this.validate();
      const { errors, warnings } = this.validation;
      const status = this.shadowRoot.getElementById("status");
      const upload = this.shadowRoot.getElementById("upload");

      status.hidden = false;
      status.className = `status ${errors.length ? "bad" : "ok"}`;
      status.innerHTML = errors.length
        ? `<strong>Validation errors</strong><ul>${errors.map(
            (error) => `<li>${this.escapeHtml(error)}</li>`
          ).join("")}</ul>`
        : `<strong>Ready</strong><div>${warnings.map(this.escapeHtml).join("<br>")}</div>`;

      upload.disabled = errors.length > 0;

      this.renderPreview();

      this.dispatchEvent(new CustomEvent("onValidationChanged", {
        detail: {
          valid: errors.length === 0,
          errors,
          recordCount: this.records.length
        },
        bubbles: true,
        composed: true
      }));
    }

    renderPreview() {
      const container = this.shadowRoot.getElementById("preview");
      const members = this.validation.members || [];

      if (!members.length) {
        container.innerHTML = "";
        return;
      }

      const headers = ["ID", "Description", ...this.selectedProperties()];
      const visible = members.slice(0, 20);

      container.innerHTML = `
        <table>
          <thead><tr>${headers.map((h) => `<th>${this.escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${visible.map((member) => `
              <tr>
                <td>${this.escapeHtml(member.id)}</td>
                <td>${this.escapeHtml(member.description)}</td>
                ${this.selectedProperties().map((p) =>
                  `<td>${this.escapeHtml(member.properties[p] || "")}</td>`
                ).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${members.length > 20 ? `<p class="muted">Showing 20 of ${members.length} members.</p>` : ""}
      `;
    }

    submit() {
      this.validation = this.validate();
      if (this.validation.errors.length) {
        this.validateAndRender();
        return;
      }

      this.dispatchEvent(new CustomEvent("onUploadRequested", {
        detail: {
          dimensionId: this.targetDimension,
          members: this.validation.members
        },
        bubbles: true,
        composed: true
      }));
    }

    setStatus(message, isError) {
      const status = this.shadowRoot.getElementById("status");
      status.hidden = false;
      status.className = `status ${isError ? "bad" : "ok"}`;
      status.textContent = message;
    }

    escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);
    }
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, MasterDataUploader);
  }
})();
