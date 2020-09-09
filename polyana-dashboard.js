import "./node_modules/@polymer/paper-styles/typography.js";
import "./node_modules/@polymer/paper-styles/shadow.js";
import "./node_modules/@polymer/iron-flex-layout/iron-flex-layout.js";
import "./node_modules/@polymer/iron-ajax/iron-ajax.js";
import "./node_modules/@polymer/iron-icon/iron-icon.js";
import "./node_modules/@polymer/iron-collapse/iron-collapse.js";
import "./node_modules/@polymer/paper-button/paper-button.js";
import "./node_modules/@mistio/timerange-picker/timerange-picker.js"
import { Polymer } from './node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from './node_modules/@polymer/polymer/lib/utils/html-tag.js';
import moment from "./node_modules/moment/src/moment";
import initializeMomentRelative from "./node_modules/@mistio/timerange-picker/relative.time.parser.js"
import './dashboard-panel.js';
Polymer({
  _template: html`
        <style>
            :host {
                display: block;
                height: 100%;
                background-color: #fafafa;
            }

            .list-group-item {
                cursor: move;
            }

            .flex-stretch-align {
                @apply(--layout-vertical);
                height: 100%;
            }

            .row {
                @apply(--layout-horizontal);
                height: 100%;
                width: 100%;
                flex-wrap: wrap;
                clear: both;
                justify-content: space-evenly;
            }

            paper-button.row-header {
                justify-content: left;
                text-transform: none;
                font-weight: 500;
                font-size: 14px;
            }

            .shadow-2dp { @apply --shadow-elevation-2dp; }

            dashboard-panel {
                margin: 8px;
                background-color: #fff;
                padding: 8px;
            }

            .shadow {
                border: 1px solid #eee;
            }

            .shadow:hover {
                @apply --shadow-elevation-2dp;
            }
        </style>

        <timerange-picker from="{{from}}" to="{{to}}" refresh-interval="{{refreshInterval}}" time-range-duration-in-minutes="{{timeRangeDurationInMinutes}}"></timerange-picker>

        <div class="container flex-stretch-align">
            <template is="dom-repeat" items="{{dashboard.rows}}" as="row">
                <paper-button toggles="" active="{{row.collapsed}}" class="row-header" hidden\$="[[!row.title]]"><iron-icon icon\$="[[_computeRowIcon(row.collapsed)]]"></iron-icon>[[row.title]]</paper-button>
                <iron-collapse opened="{{!row.collapsed}}">
                    <template is="dom-if" if="[[!row.collapsed]]" restamp="">
                        <div class="collapse-content row" id="row-[[index]]" index="[[index]]" style\$="height: [[row.height]]*2;">
                            <template is="dom-repeat" items="{{row.panels}}" as="panel">
                                <dashboard-panel id="panel-[[panel.id]]" index="[[index]]" refresh-interval="[[refreshInterval]]" datasource-uri="[[_computeDatasourceUri(datasources, panel)]]" datasource-type="[[_computeDatasourceType(datasources, panel)]]" panel="{{panel}}" row-height="[[row.height]]" from="[[from]]" to="[[to]]" time-range-duration-in-minutes="[[timeRangeDurationInMinutes]]" replace-targets="[[replaceTargets]]" class="shadow" style\$="[[_calculatePanelStyle(panel)]]">
                                </dashboard-panel>
                            </template>
                        </div>
                    </template>
                </iron-collapse>
            </template>
        </div>

        <iron-ajax id="getDashboardAjax" handle-as="json" method="GET" url="[[uri]]" on-request="_clearDashboard" on-response="_handleDashboardResponse">
        </iron-ajax>

        <iron-ajax id="postDashboardAjax" handle-as="json" method="POST" url="[[uri]]" debounce-duration="300"></iron-ajax>
`,

  is: 'polyana-dashboard',

  properties: {
      dashboard: {
          type: Object,
          observer: '_dashboardUpdated'
      },
      datasources: {
          type: Array
      },
      meta: {
          type: Object
      },
      targets: {
          type: Array,
          computed: "_getTargets(dashboard, datasources)"
      },
      datapoints: {
          type: Object
      },
      from: {
          type: String
      },
      to: {
          type: String
      },
      timeRangeDurationInMinutes: {
          type: Number
      },
      refreshInterval: {
          type: Number
      },
      uri: {
          type: String
      },
      replaceTargets: {
          type: Object
      }
  },

  listeners: {
      'end': '_saveDashboard',
      'resizeDone': '_saveDashboard',
      'graphChanged': '_saveDashboard',
      'delete-row': 'deleteRow',
      'delete-panel': 'panelDeleted'
  },

  deleteRow: function(e) {
      this._saveDashboard();
  },

  panelDeleted: function(e) {
      this._saveDashboard();
  },

  attached: function() {
      /*if (typeof echarts == 'undefined' || typeof echarts.version == 'undefined'){
          delete echarts;
          this.importHref(this.resolveUrl('echarts-import.html'), this.initDashboard, function(e) {
              console.error('Failed to load echarts', e);
          }, true);
      } else {
          this.initDashboard();
      }*/
      this.initDashboard();
  },

  initDashboard: function(){
      let momnt = initializeMomentRelative(moment);
      this._updateDashboard();
  },

  detached: function() {
      console.debug('dashboard detached');
  },

  _updateDashboard: function() {
      this.$.getDashboardAjax.generateRequest();
  },

  _computeRefreshInterval: function(dashboard) {
      if (typeof this.dashboard.refresh === 'string') {
          var digits = parseInt(this.dashboard.refresh.match(/\d+/g));
          if (this.dashboard.refresh.search("min") > -1) {
              return digits * 60000;
          } else if (this.dashboard.refresh.search("sec") > -1 || this.dashboard.refresh.endsWith('s')) {
              return digits * 1000;
          }
      }
      return 0;
  },

  _saveDashboard: function(e) {
      if (this.uri) {
          this.$.postDashboardAjax.headers["Content-Type"] = 'application/json';
          this.$.postDashboardAjax.body = {
              dashboard: this.dashboard,
              overwrite: true
          };
          this.$.postDashboardAjax.generateRequest();
      } else {
          // TODO
      }
  },

  _clearDashboard: function() {
      this.set('dashboard', {});
  },

  _handleDashboardResponse: function(data) {
      if (data.detail.response) {
          this.meta = data.detail.response.meta;
          this.dashboard = data.detail.response.dashboard;
      }
  },

  _dashboardUpdated: function() {
      if (this.dashboard.time) {
          this.from = this.dashboard.time.from;
          this.to = this.dashboard.time.to;
          this.refreshInterval = this._computeRefreshInterval(this.dashboard);
      }
  },

  _getTargets: function(dashboard, datasources) {
      // Return object with all targets referenced in the dashboard, grouped by datasource
      var targets = {},
          defaultDatasource;
      if (!dashboard || !dashboard.rows)
          return {}
      for (var i = 0; i < dashboard.rows.length; i++) { // iterate rows
          if (dashboard.rows[i].panels) { // if row has panels
              for (var j = 0; j < dashboard.rows[i].panels.length; j++) { // iterate panels
                  if (dashboard.rows[i].panels[j] && dashboard.rows[i].panels[j].targets) { // if panel has targets
                      for (var k = 0; k < dashboard.rows[i].panels[j].targets.length; k++) { // iterate targets
                          if (dashboard.rows[i].panels[j].datasource == null) { // if panel has no datasource set
                              for (var p = 0; p < datasources.length; p++) { // iterate datasources
                                  if (datasources[p].isDefault) { // to find the default one
                                      defaultDatasource = datasources[p].name;
                                      break;
                                  }
                              }
                          }
                          var datasource = dashboard.rows[i].panels[j].datasource || defaultDatasource;
                          // initalize datasource targets if necessary
                          if (targets[datasource] == undefined) {
                              targets[datasource] = [];

                              if (dashboard.rows[i].panels[j].targets[k].target && targets[datasource].indexOf(dashboard.rows[i].panels[j].targets[k].target) == -1) {
                                  targets[datasource].push(dashboard.rows[i].panels[j].targets[k].target);
                              }
                          }
                      }
                  }
              }
          }
      }
      return targets
  },

  _computeRowIcon: function (collapsed) {
      return collapsed ? 'icons:chevron-right' : 'icons:expand-more';
  },

  _calculatePanelStyle: function(item) {
      var ret = '', height = '';
      if (item.span)
          ret += 'width: calc(' + (100 * item.span / 12) + '% - 16px);';
      if (item.height)
          height = item.height;
      else if (this.row && this.row.height)
          height = this.row.height;
      else
          height = 'auto';

      if (isNaN(height))
          ret += 'height: ' + height;
      else
          ret += 'height: ' + height + 'px';

      return ret;
  },

  _computeDatasource: function(datasources, panel) {
      if (!panel)
          return
      for (var i = 0; i < datasources.length; i++) {
          if (!panel.datasource && datasources[i].isDefault)
              return datasources[i];
          if (panel.datasource == datasources[i].name)
              return datasources[i];
      }
  },

  _computeDatasourceUri: function(datasources, panel) {
      var datasource = this._computeDatasource(datasources, panel);
      if (!datasource)
          return;
      var prefix = '/api/datasources/proxy/';
      return datasource.uri || prefix + datasource.id;
  },

  _computeDatasourceType: function(datasources, panel) {
      var datasource = this._computeDatasource(datasources, panel);
      if (!datasource)
          return
      return datasource.type;
  }
});
