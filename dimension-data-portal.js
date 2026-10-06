(function () {
  "use strict";

  var CONFIG_KEYS = [];
  var i;

  for (i = 1; i <= 20; i++) {
    CONFIG_KEYS.push("dim" + i + "Config");
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseCSV(text) {
    var rows = [];
    var row = [];
    var value = "";
    var quoted = false;
    var index;
    var character;

    for (index = 0; index < text.length; index++) {
      character = text[index];

      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          value += '"';
          index++;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(value.trim());
        value = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") {
          index++;
        }

        row.push(value.trim());

        if (row.some(function (cell) { return cell !== ""; })) {
          rows.push(row);
        }

        row = [];
        value = "";
      } else {
        value += character;
      }
    }

    if (value !== "" || row.length > 0) {
      row.push(value.trim());
      rows.push(row);
    }

    return rows;
  }

  function parseDimensionConfig(value) {
    var config;

    if (!value || !String(value).trim()) {
      return null;
    }

    try {
      config = JSON.parse(value);
    } catch (error) {
      return null;
    }

    if (!config || !config.id) {
      return null;
    }

    if (!Array.isArray(config.fields)) {
      config.fields = [];
    }

    config.fields = config.fields.map(function (field) {
      if (typeof field === "string") {
        return {
          key: field,
          label: field,
          required: false
        };
      }

      return {
        key: field.key || field.id || "",
        label: field.label || field.key || field.id || "",
        required: field.required === true
      };
    }).filter(function (field) {
      return field.key !== "";
    });

    return config;
  }

  class MasterDataUploader extends HTMLElement {
    constructor() {
      super();

      this._props = {};
      this._rows = [];
      this._headers = [];
      this._selectedDimension = "";
      this._started = false;
      this._message = "";
      this._messageType = "";

      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._render();
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      var self = this;

      Object.keys(changedProperties || {}).forEach(function (key) {
        self._props[key] = changedProperties[key];
      });

      this._render();
    }

    startImport() {
      this._started = true;
      this._setMessage("Import started. Select a dimension and upload a CSV file.", "info");

      this.dispatchEvent(new CustomEvent("onStart", {
        detail: {
          modelId: this._props.modelId || ""
        }
      }));
    }

    getSelectedDimension() {
      return this._selectedDimension || "";
    }

    getRowCount() {
      return this._rows.length;
    }

    getRowFieldValue(index, fieldKey) {
      var row = this._rows[Number(index)];

      if (!row || !fieldKey) {
        return "";
      }

      return row.values[fieldKey] === undefined || row.values[fieldKey] === null
        ? ""
        : String(row.values[fieldKey]);
    }

    getImportPayload() {
      return JSON.stringify({
        tenantUrl: this._props.tenantUrl || "",
        modelId: this._props.modelId || "",
        dimensionId: this._selectedDimension || "",
        headers: this._headers,
        rows: this._rows.map(function (row) {
          return {
            values: row.values,
            status: row.status,
            message: row.message
          };
        })
      });
    }

    setRowStatus(index, status, message) {
      var row = this._rows[Number(index)];

      if (!row) {
        return;
      }

      row.status = String(status || "pending").toLowerCase();
      row.message = String(message || "");
      this._render();
    }

    setSaveResult(status, message) {
      var normalizedStatus = String(status || "").toLowerCase();

      this._setMessage(
        message || (normalizedStatus === "success"
          ? "Master data saved successfully."
          : "Master data save failed."),
        normalizedStatus
      );

      if (normalizedStatus === "success") {
        this.dispatchEvent(new CustomEvent("onSave", {
          detail: {
            modelId: this._props.modelId || "",
            dimensionId: this._selectedDimension || "",
            rowCount: this._rows.length
          }
        }));
      } else {
        this.dispatchEvent(new CustomEvent("onError", {
          detail: {
            message: message || "Save failed."
          }
        }));
      }
    }

    resetWidget() {
      this._rows = [];
      this._headers = [];
      this._selectedDimension = "";
      this._started = false;
      this._message = "";
      this._messageType = "";
      this._render();
    }

    _setMessage(message, type) {
      this._message = message || "";
      this._messageType = type || "info";
      this._render();
    }

    _getDimensions() {
      var self = this;
      var dimensions = [];

      CONFIG_KEYS.forEach(function (key) {
        var config = parseDimensionConfig(self._props[key]);

        if (config) {
          dimensions.push(config);
        }
      });

      return dimensions;
    }

    _getCurrentDimension() {
      var dimensions = this._getDimensions();
      var index;

      for (index = 0; index < dimensions.length; index++) {
        if (dimensions[index].id === this._selectedDimension) {
          return dimensions[index];
        }
      }

      return null;
    }

    _readFile(file) {
      var self = this;
      var reader = new FileReader();

      if (!file) {
        return;
      }

      if (!file.name.toLowerCase().match(/\.csv$/)) {
        this._setMessage("Only CSV files are supported.", "error");
        this.dispatchEvent(new CustomEvent("onError", {
          detail: { message: "Only CSV files are supported." }
        }));
        return;
      }

      reader.onload = function (event) {
        self._loadCSV(String(event.target.result || ""));
      };

      reader.onerror = function () {
        self._setMessage("Unable to read the selected file.", "error");
      };

      reader.readAsText(file);
    }

    _loadCSV(csvText) {
      var csvRows = parseCSV(csvText);
      var headers;
      var dataRows;
      var self = this;

      if (csvRows.length < 2) {
        this._setMessage("The CSV must contain a header row and at least one data row.", "error");
        return;
      }

      headers = csvRows[0].map(function (header) {
        return String(header || "").trim();
      });

      if (headers.some(function (header) { return header === ""; })) {
        this._setMessage("CSV column headers cannot be empty.", "error");
        return;
      }

      dataRows = csvRows.slice(1);

      this._headers = headers;
      this._rows = dataRows.map(function (cells) {
        var values = {};

        headers.forEach(function (header, index) {
          values[header] = cells[index] === undefined ? "" : cells[index];
        });

        return {
          values: values,
          status: "pending",
          message: ""
        };
      });

      this._setMessage(this._rows.length + " row(s) loaded successfully.", "success");
    }

    _validateAndSubmit() {
      var dimension = this._getCurrentDimension();
      var missingFields = [];
      var invalidRows = [];
      var self = this;

      if (!this._started) {
        this.startImport();
      }

      if (!this._props.modelId) {
        this._setMessage("Configure the Planning Model ID in the Styling panel.", "error");
        return;
      }

      if (!dimension) {
        this._setMessage("Select a configured dimension.", "error");
        return;
      }

      if (this._rows.length === 0) {
        this._setMessage("Upload a CSV file before saving.", "error");
        return;
      }

      dimension.fields.forEach(function (field) {
        if (field.required && self._headers.indexOf(field.key) === -1) {
          missingFields.push(field.key);
        }
      });

      if (missingFields.length > 0) {
        this._setMessage(
          "Missing required CSV column(s): " + missingFields.join(", "),
          "error"
        );
        return;
      }

      this._rows.forEach(function (row, rowIndex) {
        dimension.fields.forEach(function (field) {
          if (field.required && !String(row.values[field.key] || "").trim()) {
            invalidRows.push(rowIndex + 1);
            row.status = "error";
            row.message = "Required field missing: " + field.key;
          }
        });
      });

      if (invalidRows.length > 0) {
        this._setMessage(
          "Required values are missing in row(s): " + invalidRows.join(", "),
          "error"
        );
        return;
      }

      this._setMessage(
        "Data is ready. SAC application logic is now saving " +
        this._rows.length + " member(s).",
        "info"
      );

      this.dispatchEvent(new CustomEvent("onSubmit", {
        detail: {
          modelId: this._props.modelId,
          dimensionId: this._selectedDimension,
          rowCount: this._rows.length
        }
      }));
    }

    _render() {
      var self = this;
      var dimensions = this._getDimensions();
      var currentDimension = this._getCurrentDimension();
      var optionHtml = '<option value="">Select dimension</option>';
      var headerHtml = "";
      var bodyHtml = "";

      if (!this._selectedDimension && dimensions.length > 0) {
        this._selectedDimension = dimensions[0].id;
        currentDimension = dimensions[0];
      }

      dimensions.forEach(function (dimension) {
        optionHtml +=
          '<option value="' + escapeHtml(dimension.id) + '"' +
          (dimension.id === self._selectedDimension ? " selected" : "") +
          ">" + escapeHtml(dimension.label || dimension.id) + "</option>";
      });

      if (this._headers.length > 0) {
        headerHtml = this._headers.map(function (header) {
          return "<th>" + escapeHtml(header) + "</th>";
        }).join("");

        this._rows.forEach(function (row, rowIndex) {
          var cells = self._headers.map(function (header) {
            return "<td>" + escapeHtml(row.values[header]) + "</td>";
          }).join("");

          bodyHtml +=
            "<tr>" +
            "<td>" + (rowIndex + 1) + "</td>" +
            cells +
            '<td><span class="status ' + escapeHtml(row.status) + '">' +
            escapeHtml(row.status) +
            "</span></td>" +
            "<td>" + escapeHtml(row.message || "") + "</td>" +
            "</tr>";
        });
      }

      this._shadowRoot.innerHTML =
        "<style>" +
        ":host{display:block;font-family:Arial,sans-serif;color:#1f2937}" +
        ".container{height:100%;box-sizing:border-box;padding:16px;background:#ffffff;border:1px solid #d1d5db;border-radius:8px}" +
        ".title{margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a}" +
        ".toolbar{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px}" +
        ".field{display:flex;flex-direction:column;gap:5px;min-width:250px}" +
        "label{font-size:12px;font-weight:700;color:#475569}" +
        "select,input[type=file]{box-sizing:border-box;width:100%;height:34px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;background:#fff}" +
        "button{height:34px;padding:0 14px;border:0;border-radius:4px;background:#0a6ed1;color:#fff;font-size:13px;font-weight:600;cursor:pointer}" +
        "button:hover{background:#085caf}" +
        "button.secondary{background:#64748b}" +
        "button.secondary:hover{background:#475569}" +
        ".info{display:flex;gap:18px;margin:4px 0 14px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;color:#475569}" +
        ".message{min-height:20px;margin-bottom:12px;font-size:13px;font-weight:600}" +
        ".message.success{color:#15803d}.message.error{color:#dc2626}.message.info{color:#0369a1}" +
        ".table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:4px;max-height:420px}" +
        "table{width:100%;border-collapse:collapse;min-width:700px;font-size:12px}" +
        "th{position:sticky;top:0;background:#f1f5f9;color:#334155;text-align:left;font-weight:700}" +
        "th,td{padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap}" +
        "tr:last-child td{border-bottom:0}" +
        ".status{font-weight:700;text-transform:capitalize}" +
        ".status.pending{color:#a16207}.status.success{color:#15803d}.status.error{color:#dc2626}" +
        ".empty{padding:30px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:4px}" +
        "</style>" +
        '<div class="container">' +
        '<div class="title">Master Data Uploader</div>' +
        '<div class="toolbar">' +
        '<div class="field"><label>Dimension</label><select id="dimension">' +
        optionHtml +
        "</select></div>" +
        '<div class="field"><label>CSV File</label><input id="file" type="file" accept=".csv"></div>' +
        '<button id="start" class="secondary">Start Import</button>' +
        '<button id="save">Save to Model</button>' +
        '<button id="reset" class="secondary">Reset</button>' +
        "</div>" +
        '<div class="info">' +
        "<span><strong>Model:</strong> " + escapeHtml(this._props.modelId || "Not configured") + "</span>" +
        "<span><strong>Dimension:</strong> " + escapeHtml(currentDimension ? currentDimension.label : "Not configured") + "</span>" +
        "<span><strong>Rows:</strong> " + this._rows.length + "</span>" +
        "</div>" +
        '<div class="message ' + escapeHtml(this._messageType) + '">' +
        escapeHtml(this._message) +
        "</div>" +
        (this._headers.length > 0
          ? '<div class="table-wrap"><table><thead><tr><th>#</th>' +
            headerHtml +
            "<th>Status</th><th>Message</th></tr></thead><tbody>" +
            bodyHtml +
            "</tbody></table></div>"
          : '<div class="empty">Select a configured dimension and upload a CSV file.</div>') +
        "</div>";

      this._shadowRoot.querySelector("#dimension").addEventListener("change", function (event) {
        self._selectedDimension = event.target.value;
        self._rows = [];
        self._headers = [];
        self._setMessage("Dimension changed. Upload a CSV file for this dimension.", "info");
      });

      this._shadowRoot.querySelector("#file").addEventListener("change", function (event) {
        self._readFile(event.target.files[0]);
      });

      this._shadowRoot.querySelector("#start").addEventListener("click", function () {
        self.startImport();
      });

      this._shadowRoot.querySelector("#save").addEventListener("click", function () {
        self._validateAndSubmit();
      });

      this._shadowRoot.querySelector("#reset").addEventListener("click", function () {
        self.resetWidget();
      });
    }
  }

  class MasterDataUploaderStyling extends HTMLElement {
    constructor() {
      super();

      this._props = {};
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._render();
    }

    set changedProperties(properties) {
      var self = this;

      Object.keys(properties || {}).forEach(function (key) {
        self._props[key] = properties[key];
      });

      this._render();
    }

    _setProperty(name, value) {
      var properties = {};

      this._props[name] = value;
      properties[name] = value;

      this.dispatchEvent(new CustomEvent("propertiesChanged", {
        detail: {
          properties: properties
        }
      }));
    }

    _render() {
      var self = this;
      var dimensionFields = "";
      var index;

      for (index = 1; index <= 20; index++) {
        var propertyName = "dim" + index + "Config";

        dimensionFields +=
          '<div class="field">' +
          "<label>Dimension " + index + " configuration</label>" +
          '<textarea data-property="' + propertyName + '" placeholder=\'{"id":"COSTCENTER","label":"Cost Center","fields":[{"key":"ID","label":"ID","required":true},{"key":"DESCRIPTION","label":"Description","required":true},{"key":"SOURCE","label":"Source"}]}\'>' +
          escapeHtml(this._props[propertyName] || "") +
          "</textarea></div>";
      }

      this._shadowRoot.innerHTML =
        "<style>" +
        ":host{display:block;font-family:Arial,sans-serif;color:#1f2937}" +
        ".panel{padding:12px}" +
        "h3{margin:0 0 12px;font-size:16px}" +
        ".hint{font-size:12px;line-height:1.5;color:#64748b;margin-bottom:16px}" +
        ".field{margin-bottom:14px}" +
        "label{display:block;margin-bottom:5px;font-size:12px;font-weight:700;color:#334155}" +
        "input,textarea{box-sizing:border-box;width:100%;padding:7px;border:1px solid #cbd5e1;border-radius:4px;font:12px Arial,sans-serif}" +
        "textarea{height:104px;resize:vertical}" +
        "</style>" +
        '<div class="panel">' +
        "<h3>Master Data Uploader Settings</h3>" +
        '<p class="hint">The CSV header names must match the configured field keys. Required fields must exist in the CSV and contain values.</p>' +
        '<div class="field"><label>SAC Tenant URL</label>' +
        '<input data-property="tenantUrl" value="' + escapeHtml(this._props.tenantUrl || "") + '"></div>' +
        '<div class="field"><label>Planning Model ID</label>' +
        '<input data-property="modelId" value="' + escapeHtml(this._props.modelId || "") + '"></div>' +
        dimensionFields +
        "</div>";

      Array.prototype.forEach.call(
        this._shadowRoot.querySelectorAll("[data-property]"),
        function (element) {
          element.addEventListener("change", function (event) {
            self._setProperty(
              event.target.getAttribute("data-property"),
              event.target.value
            );
          });
        }
      );
    }
  }

  if (!customElements.get("com-sac-masterdatauploader")) {
    customElements.define("com-sac-masterdatauploader", MasterDataUploader);
  }

  if (!customElements.get("com-sac-masterdatauploader-styling")) {
    customElements.define(
      "com-sac-masterdatauploader-styling",
      MasterDataUploaderStyling
    );
  }
}());
