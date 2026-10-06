(function () {
  "use strict";

  var CONFIG_KEYS = [];
  var i;

  for (i = 1; i <= 20; i++) {
    CONFIG_KEYS.push("dim" + i + "Config");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseDimensionConfig(value) {
    var config;

    try {
      config = JSON.parse(value || "");
    } catch (error) {
      return null;
    }

    if (!config || !config.id) {
      return null;
    }

    config.fields = Array.isArray(config.fields) ? config.fields : [];

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

  function parseCSV(text) {
    var rows = [];
    var row = [];
    var value = "";
    var quoted = false;
    var character;
    var index;

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

        if (row.some(function (cell) {
          return cell !== "";
        })) {
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

  class MasterDataUploader extends HTMLElement {
    constructor() {
      super();

      this._props = {};
      this._rows = [];
      this._headers = [];
      this._selectedDimension = "";
      this._message = "";
      this._messageType = "info";
      this._started = false;

      this._root = this.attachShadow({ mode: "open" });
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
      this._message = "Import started. Select a dimension and upload a CSV file.";
      this._messageType = "info";

      this.dispatchEvent(new CustomEvent("onStart", {
        detail: {
          modelId: this._props.modelId || ""
        }
      }));

      this._render();
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

      return String(row.values[fieldKey] || "");
    }

    getImportPayload() {
      return JSON.stringify({
        tenantUrl: this._props.tenantUrl || "",
        modelId: this._props.modelId || "",
        dimensionId: this._selectedDimension || "",
        headers: this._headers,
        rows: this._rows
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
      var result = String(status || "error").toLowerCase();

      this._message = message || (
        result === "success"
          ? "Master data saved successfully."
          : "Master data save failed."
      );

      this._messageType = result;
      this._render();

      this.dispatchEvent(new CustomEvent(
        result === "success" ? "onSave" : "onError",
        {
          detail: {
            modelId: this._props.modelId || "",
            dimensionId: this._selectedDimension || "",
            message: this._message
          }
        }
      ));
    }

    resetWidget() {
      this._rows = [];
      this._headers = [];
      this._selectedDimension = "";
      this._message = "";
      this._messageType = "info";
      this._started = false;
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

    _getSelectedDimensionConfig() {
      var dimensions = this._getDimensions();
      var index;

      for (index = 0; index < dimensions.length; index++) {
        if (dimensions[index].id === this._selectedDimension) {
          return dimensions[index];
        }
      }

      return null;
    }

    _setMessage(message, type) {
      this._message = message;
      this._messageType = type || "info";
      this._render();
    }

    _readFile(file) {
      var self = this;
      var reader = new FileReader();

      if (!file) {
        return;
      }

      if (!/\.csv$/i.test(file.name)) {
        this._setMessage("Only CSV files are supported.", "error");
        return;
      }

      reader.onload = function (event) {
        self._loadCSV(String(event.target.result || ""));
      };

      reader.onerror = function () {
        self._setMessage("Unable to read the CSV file.", "error");
      };

      reader.readAsText(file);
    }

    _loadCSV(text) {
      var csvRows = parseCSV(text);
      var headers;
      var rows;

      if (csvRows.length < 2) {
        this._setMessage(
          "CSV must contain headers and at least one data row.",
          "error"
        );
        return;
      }

      headers = csvRows[0].map(function (header) {
        return String(header || "").trim();
      });

      if (headers.some(function (header) {
        return header === "";
      })) {
        this._setMessage("CSV headers cannot be empty.", "error");
        return;
      }

      rows = csvRows.slice(1);
      this._headers = headers;

      this._rows = rows.map(function (cells) {
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

    _submit() {
      var dimension = this._getSelectedDimensionConfig();
      var missingColumns = [];
      var invalidRows = [];
      var self = this;

      if (!this._started) {
        this.startImport();
      }

      if (!this._props.modelId) {
        this._setMessage("Planning Model ID is required.", "error");
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
          missingColumns.push(field.key);
        }
      });

      if (missingColumns.length > 0) {
        this._setMessage(
          "Missing required CSV columns: " + missingColumns.join(", "),
          "error"
        );
        return;
      }

      this._rows.forEach(function (row, rowIndex) {
        dimension.fields.forEach(function (field) {
          if (field.required && !String(row.values[field.key] || "").trim()) {
            row.status = "error";
            row.message = "Missing required value: " + field.key;
            invalidRows.push(rowIndex + 1);
          }
        });
      });

      if (invalidRows.length > 0) {
        this._setMessage(
          "Required values missing in row(s): " + invalidRows.join(", "),
          "error"
        );
        return;
      }

      this._setMessage(
        "Saving " + this._rows.length + " member(s) to the SAC model.",
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
      var selectedDimension = this._getSelectedDimensionConfig();
      var options = '<option value="">Select dimension</option>';
      var headerHtml = "";
      var rowsHtml = "";

      if (!this._selectedDimension && dimensions.length > 0) {
        this._selectedDimension = dimensions[0].id;
        selectedDimension = dimensions[0];
      }

      dimensions.forEach(function (dimension) {
        options +=
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

          rowsHtml +=
            "<tr>" +
            "<td>" + (rowIndex + 1) + "</td>" +
            cells +
            '<td class="status ' + escapeHtml(row.status) + '">' +
            escapeHtml(row.status) +
            "</td>" +
            "<td>" + escapeHtml(row.message) + "</td>" +
            "</tr>";
        });
      }

      this._root.innerHTML =
        "<style>" +
        ":host{display:block;font-family:Arial,sans-serif;color:#1f2937}" +
        ".box{padding:16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;box-sizing:border-box}" +
        "h3{margin:0 0 16px;font-size:18px}" +
        ".tools{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px}" +
        ".field{display:flex;flex-direction:column;gap:5px;min-width:230px}" +
        "label{font-size:12px;font-weight:bold;color:#475569}" +
        "select,input{height:34px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:4px;padding:6px;background:#fff}" +
        "button{height:34px;padding:0 14px;border:0;border-radius:4px;background:#0a6ed1;color:#fff;font-weight:bold;cursor:pointer}" +
        "button.alt{background:#64748b}" +
        ".info{padding:10px;margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;font-size:12px}" +
        ".message{margin-bottom:12px;min-height:18px;font-size:13px;font-weight:bold}" +
        ".message.success{color:#15803d}.message.error{color:#dc2626}.message.info{color:#0369a1}" +
        ".grid{overflow:auto;max-height:400px;border:1px solid #e2e8f0;border-radius:4px}" +
        "table{border-collapse:collapse;width:100%;min-width:700px;font-size:12px}" +
        "th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;white-space:nowrap}" +
        "th{background:#f1f5f9}" +
        ".status{font-weight:bold;text-transform:capitalize}" +
        ".pending{color:#a16207}.success{color:#15803d}.error{color:#dc2626}" +
        ".empty{padding:28px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:4px}" +
        "</style>" +
        '<div class="box">' +
        "<h3>Master Data Uploader</h3>" +
        '<div class="tools">' +
        '<div class="field"><label>Dimension</label><select id="dimension">' +
        options +
        "</select></div>" +
        '<div class="field"><label>CSV File</label><input id="file" type="file" accept=".csv"></div>' +
        '<button id="start" class="alt">Start Import</button>' +
        '<button id="save">Save to Model</button>' +
        '<button id="reset" class="alt">Reset</button>' +
        "</div>" +
        '<div class="info"><b>Model:</b> ' +
        escapeHtml(this._props.modelId || "Not configured") +
        " &nbsp; | &nbsp; <b>Dimension:</b> " +
        escapeHtml(selectedDimension ? selectedDimension.label : "Not configured") +
        " &nbsp; | &nbsp; <b>Rows:</b> " +
        this._rows.length +
        "</div>" +
        '<div class="message ' + escapeHtml(this._messageType) + '">' +
        escapeHtml(this._message) +
        "</div>" +
        (this._headers.length > 0
          ? '<div class="grid"><table><thead><tr><th>#</th>' +
            headerHtml +
            "<th>Status</th><th>Message</th></tr></thead><tbody>" +
            rowsHtml +
            "</tbody></table></div>"
          : '<div class="empty">Select a dimension and upload a CSV file.</div>') +
        "</div>";

      this._root.querySelector("#dimension").addEventListener("change", function (event) {
        self._selectedDimension = event.target.value;
        self._headers = [];
        self._rows = [];
        self._setMessage("Dimension changed. Upload a CSV file.", "info");
      });

      this._root.querySelector("#file").addEventListener("change", function (event) {
        self._readFile(event.target.files[0]);
      });

      this._root.querySelector("#start").addEventListener("click", function () {
        self.startImport();
      });

      this._root.querySelector("#save").addEventListener("click", function () {
        self._submit();
      });

      this._root.querySelector("#reset").addEventListener("click", function () {
        self.resetWidget();
      });
    }
  }

  class MasterDataUploaderStyling extends HTMLElement {
    constructor() {
      super();

      this._props = {};
      this._root = this.attachShadow({ mode: "open" });
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

      properties[name] = value;

      this.dispatchEvent(new CustomEvent("propertiesChanged", {
        detail: {
          properties: properties
        }
      }));
    }

    _render() {
      var self = this;
      var configFields = "";
      var index;

      for (index = 1; index <= 20; index++) {
        configFields +=
          '<div class="field">' +
          "<label>Dimension " + index + " Configuration</label>" +
          '<textarea data-key="dim' + index + 'Config"></textarea>' +
          "</div>";
      }

      this._root.innerHTML =
        "<style>" +
        ":host{display:block;font-family:Arial,sans-serif}" +
        ".panel{padding:12px}" +
        ".field{margin-bottom:14px}" +
        "label{display:block;margin-bottom:5px;font-size:12px;font-weight:bold}" +
        "input,textarea{box-sizing:border-box;width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:7px;font:12px Arial,sans-serif}" +
        "textarea{height:105px;resize:vertical}" +
        ".hint{font-size:12px;color:#64748b;line-height:1.45}" +
        "</style>" +
        '<div class="panel">' +
        "<h3>Master Data Uploader Settings</h3>" +
        '<p class="hint">CSV headers must match the field keys configured for the selected dimension.</p>' +
        '<div class="field"><label>SAC Tenant URL</label><input data-key="tenantUrl"></div>' +
        '<div class="field"><label>Planning Model ID</label><input data-key="modelId"></div>' +
        configFields +
        "</div>";

      Array.prototype.forEach.call(
        this._root.querySelectorAll("[data-key]"),
        function (element) {
          var key = element.getAttribute("data-key");

          element.value = self._props[key] || "";

          element.addEventListener("change", function (event) {
            self._setProperty(key, event.target.value);
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
