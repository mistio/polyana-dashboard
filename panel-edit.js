Polymer({
  _template: Polymer.html`
        <style is="custom-style">
             :host {
                display: inline-block;
            }
            
            #alignedDialog {
                margin: 20px 0;
            }
            
            paper-header-panel {
                background-color: #03a9f4;
            }
            
            paper-icon-button#settings {
                padding: 8px;
                opacity: 0.32;
            }
            
            .settings-section h2 {
                padding: 0;
                margin: 0;
            }
            
            .settings-section {
                padding-bottom: 16px;
            }
            
            #step-number,
            #step-unit {
                max-width: 100px;
                display: inline-block;
            }
            
            #step-unit {
                max-width: 150px;
            }
            
            .x-axis paper-checkbox {
                margin: 16px 8px 16px 0;
                float: right;
            }
            
            .display paper-checkbox {
                margin-left: 16px;
            }
        </style>
        <paper-icon-button id="settings" icon="icons:settings" on-tap="openDialog">Edit Graph</paper-icon-button>

        <paper-dialog id="alignedDialog" no-overlap="" horizontal-align="right" vertical-align="bottom" with-backdrop="">
            <paper-dialog-scrollable>
                <div class="settings-section display">
                    <h2>[[computeTitle(panel.title)]] Data display</h2>
                    <paper-dropdown-menu label="Select graph draw mode" placeholder="Spline" on-select="_changeGraph">
                        <paper-listbox class="dropdown-content" selected="{{type}}" attr-for-selected="data-value">
                            <paper-item data-value="bar">Bar</paper-item>
                            <paper-item data-value="spline">Spline</paper-item>
                            <paper-item data-value="line">Line</paper-item>
                        </paper-listbox>
                    </paper-dropdown-menu>
                    <paper-checkbox id="step" on-tap="_changeGraph">Stack</paper-checkbox>
                </div>
                <div class="settings-section">
                    <h2>Step Interval</h2>
                    <paper-input id="step-number" type="number" on-input="_clearDropDown" value="{{validInput}}" label="Step number" placeholder="eg. 5"></paper-input>
                    <paper-dropdown-menu id="step-unit" label="Time unit" placeholder="minutes" on-select="_changeStep">
                        <paper-listbox class="dropdown-content" selected="{{stepType}}" attr-for-selected="data-value">
                            <paper-item data-value="sec">seconds</paper-item>
                            <paper-item data-value="min">minutes</paper-item>
                            <paper-item data-value="d">days</paper-item>
                            <paper-item data-value="month">month</paper-item>
                            <paper-item data-value="y">year</paper-item>
                        </paper-listbox>
                    </paper-dropdown-menu>
                </div>
                <div class="settings-section x-axis">
                    <h2>X-axis</h2>
                    <paper-checkbox id="year" on-tap="_dateFormat">Years</paper-checkbox>
                    <paper-checkbox id="month" on-tap="_dateFormat">Months</paper-checkbox>
                    <paper-checkbox id="day" on-tap="_dateFormat">Days</paper-checkbox>
                    <paper-checkbox id="hour" on-tap="_dateFormat">Hours</paper-checkbox>
                    <paper-checkbox id="minute" on-tap="_dateFormat">Mins</paper-checkbox>
                    <paper-checkbox id="second" on-tap="_dateFormat">Secs</paper-checkbox>
                </div>
            </paper-dialog-scrollable>
        </paper-dialog>
`,

  is: "panel-edit",

  properties: {
      panel: {
          type: Object,
      },
      step: {
          type: String,
          notify: true
      },
      dateFormat: {
          type: String,
          notify: true
      }
  },

  openDialog: function() {
      var dialog = this.querySelector('paper-dialog');
      dialog.positionTarget = this;
      this._initDialog();
      dialog.open();
      this.validInput = "";
      this.stepType = "";
      console.log();
  },

  _dateFormat: function() {
      var year = this.querySelector('#year');
      var month = this.querySelector('#month');
      var day = this.querySelector('#day');
      var hour = this.querySelector('#hour');
      var minute = this.querySelector('#minute');
      var second = this.querySelector('#second');
      var yearVal;
      var monthVal;
      var dayVal;
      var hourVal;
      var minuteVal;
      var secVal;
      if (year.checked) {
          yearVal = "%Y"
      } else {
          yearVal = "";
      }
      if (month.checked) {
          monthVal = "%m";
      } else {
          monthVal = "";
      }
      if (day.checked) {
          dayVal = "%d";
      } else {
          dayVal = "";
      }
      if (hour.checked) {
          hourVal = "%H";
      } else {
          hourVal = "";
      }
      if (minute.checked) {
          minuteVal = "%M";
      } else {
          minuteVal = "";
      }
      if (second.checked) {
          secVal = "%S";
      } else {
          secVal = "";
      }
      if (second.checked) {
          minute.checked = true;
          minuteVal = "%M";
      }
      if (year.checked && month.checked)
          yearVal += "-";
      if ((year.checked || month.checked) && day.checked)
          monthVal += "-";
      if (hour.checked && minute.checked)
          hourVal += ":";
      if (minute.checked && second.checked)
          minuteVal += ":";

      this.dateFormat = yearVal + monthVal + dayVal + " " + hourVal + minuteVal + secVal;
      this.fire('panelChanged', "dateFormat");
  },

  _clearDropDown: function() {
      this.stepType = " "
  },

  _changeStep: function() {
      if (this.validInput == "" || this.validInput == null || !isNaN(parseInt(this.validInput))) {
          this.step = this.validInput + this.stepType;
          this.fire('panelChanged', "step");
      }
  },

  _changeGraph: function() {
      if (this.type == "bar") {
          this.panel.bars = true;
          this.panel.lines = false;
          this.panel.stack = false;
      } else if (this.type == "spline") {
          this.panel.bars = false;
          this.panel.lines = true;
          this.panel.stack = false;
      } else if (this.type == "line") {
          this.panel.bars = false;
          this.panel.lines = false;
          this.panel.stack = false;
      }
      if (this.querySelector('paper-checkbox').checked) {
          this.panel.stack = true;
      } else {
          this.panel.stack = false;
      }
      this.fire('panelChanged');
  },

  _initDialog: function() {
      if (this.panel.bars) {
          this.type = "bar";
      } else if (this.panel.lines) {
          this.type = "spline";
      }
      if (this.panel.stack) {
          this.querySelector('#step').checked = true;
      } else {
          this.querySelector('#step').checked = false;
      }
  },

  computeTitle: function(title) {
      if (title)
          return title.replace(/_/g, " ").slice(0, 11);
      else
          return "";
  }
});
