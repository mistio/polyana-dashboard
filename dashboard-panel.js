/*script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/3.8.5/echarts.min.js" integrity="sha256-7aRWxAaH0PFLbAt5oJLWIliWFHPZWuFbCGchtzd6njk=" crossorigin="anonymous"></script*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import "@polymer/paper-styles/typography.js";
import "@polymer/paper-material/paper-material.js";
import "@polymer/paper-icon-button/paper-icon-button.js";
import "@polymer/paper-spinner/paper-spinner.js";
import "@polymer/iron-flex-layout/iron-flex-layout-classes.js";
import "@polymer/iron-ajax/iron-ajax.js";
import "@polymer/iron-resizable-behavior/iron-resizable-behavior.js";
import "@polymer/iron-icon/iron-icon.js";
import "@polymer/paper-tooltip/paper-tooltip.js";
import "@polymer/paper-toolbar/paper-toolbar.js";
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import moment from "moment/src/moment.js";
import * as echarts from  "echarts/src/echarts.js";

import './panel-edit.js';

//<script src='../timerange-picker/relative.time.parser.js'></script>


function nFormatter(num, digits) {
    var si = [{
            value: 1E18,
            symbol: "E"
        }, {
            value: 1E15,
            symbol: "P"
        }, {
            value: 1E12,
            symbol: "T"
        }, {
            value: 1E9,
            symbol: "G"
        }, {
            value: 1E6,
            symbol: "M"
        }, {
            value: 1E3,
            symbol: "k"
        }],
        rx = /\.0+$|(\.[0-9]*[1-9])0+$/,
        i;
    for (i = 0; i < si.length; i++) {
        if (num >= si[i].value) {
            return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
        }
    }
    return num && num.toFixed(digits).replace(rx, "$1");
}


Polymer({
  _template: html`
        <style>
             :host {
                box-sizing: border-box;
                transition: height 500ms ease-in;
                min-width: 400px;
                min-height: 300px;
                max-height: 400px;
            }

            paper-spinner {
                margin: 6px 12px;
                width: 20px;
                height: 20px;
                padding-left: 16px;
            }

            paper-icon-button {
                opacity: 0.5;
                z-index: 5;
            }

            .head {
                position: relative;
                display: flex;
                align-items: center;
                margin: 0;
            }

            div.title {
                font-weight: 500;
                font-size: 16px;
                margin: 0;
                flex: 1;
                text-align: center;
            }

            iron-icon {
                --iron-icon-height: 20px;
                --iron-icon-width: 20px;
                margin-left: 0px;
                margin-right: 8px;
                color: #000;
                fill: #999;
            }

            paper-tooltip {
                --paper-tooltip-delay-in: 100;
            }

            paper-toolbar {
                width: 100%;
                color: #000;
                --paper-toolbar-height: 36px;
                --paper-toolbar-background: transparent;
                --paper-toolbar-title: {
                    font-size: 16px;
                    color: #000;
                };
            }

            paper-icon-button.more {
                height: 32px;
                width: 32px;
            }
        </style>

        <iron-ajax id="panelDataRequest" handle-as="json" method="GET" contenttype="application/json" url="[[_computeUrl(datasourceUri)]]" params="[[params]]" loading="{{loading}}" on-response="_handlePanelResponse" debounce-duration="300"></iron-ajax>

        <div class="head layout horizontal">
            <paper-toolbar justify="center">
                <iron-icon icon="icons:info" id="infoIcon" hidden\$="[[!panel.description]]" slot="top"></iron-icon>
                <paper-tooltip for="infoIcon" slot="top">[[panel.description]]</paper-tooltip>
                <paper-spinner active="[[loading]]" slot="top"></paper-spinner>
                <div slot="top" class="title">
                    [[panel.title]]
                </div>
                <paper-icon-button slot="top" icon="icons:close" on-tap="deletePanel" hidden\$="[[!_computeIsPanelRemovable(panel)]]"></paper-icon-button>
                <!--paper-icon-button slot="top" class="more" icon="more-vert" on-tap="moreAction"></paper-icon-button-->
            </paper-toolbar>
            <template is="dom-if" if="[[panel.editable]]">
                <panel-edit date-format="{{chartAxis.x.tick.format}}" step="{{step}}" panel="{{panel}}"></panel-edit>
            </template>
        </div>
        <div id="container" style="width: 100%; height: 100%;">
            [[_getPanelContent(panel)]]
        </div>
`,

  is: 'dashboard-panel',

  properties: {
      from: {
          type: String,
      },
      to: {
          type: String,
      },
      timeRangeDurationInMinutes: {
          type: Number
      },
      step: {
          type: String,
      },
      params: {
          type: Object
      },
      refreshInterval: {
          type: Number,
          value: 0,
      },
      hasRenderedData: {
          type: Boolean,
          value: false,
          reflectToAttribute: true
      },
      panel: {
          type: Object,
          observer: '_updatePanel'
      },
      chart: {
          type: Object
      },
      chartData: {
          type: Object,
          value: function() {
              return {
                  series: [],
                  legend: {
                      data: [],
                      top: 12,
                      left: 40,
                      right: 18,
                      type: 'scroll',
                      orient: 'horizontal',
                      height: 60
                  }
              }
          }
      },
      chartOptions: {
          type: Object,
          value: function() {
              return {
                  xAxis: {
                      type: 'time',
                      splitLine: {
                          show: false
                      },
                      axisLabel: {
                          formatter: function (value, index) {
                              if (echarts && echarts.format) {
                                  if (index == 0)
                                      return echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value)
                                  return echarts.format.formatTime('hh:mm:ss', value)
                              }
                              return value;
                          }
                      }
                  },
                  yAxis: {
                      type: 'value',
                      axisLabel: {
                          formatter: function(value) {
                              return nFormatter(value, 2);
                          }
                      }
                  }
              };
          }
      },
      loading: {
          type: Boolean,
          value: false
      },
      datasourceUri: {
          type: String,
          reflectToAttribute: true
      },
      replaceTargets: {
          type: Object,
          value: {}
      },
      intervalId: {
          type: Number
      },
      index: {
          type: Number
      },
      unit: {
          type: String,
          value: ''
      }
  },

  behaviors: [Polymer.IronResizableBehavior],

  listeners: {
      'panelChanged': '_updatePanel',
      "iron-resize": "_resize",
  },

  observers: [
      '_updateParams(from, to, refreshInterval, panel.targets, datasourceType)'
  ],

  attached: function() {
      // console.debug('panel attached', this.panel && this.panel.id, this.datasourceType);
      var colorPalette = ['#607D8B', '#d96557', '#3F51B5', '#009688', '#795548', '#8c76d1', '#795548',
                          '#0277BD', '#0099cc', '#424242', '#D48900', '#43A047', '#2F2F3E'],
          _this = this;
      echarts.registerTheme('polyana', {
          color: colorPalette,
          backgroundColor: 'transparent',
          graph: {
              color: colorPalette
          }
      });
      this.chart = echarts.init(this.$.container, 'polyana');
      this.unit = _this.panel && _this.panel.yaxes && _this.panel.yaxes[0] && _this.panel.yaxes[0].label || '';
      this.set('chartOptions.xAxis.min', this._convertToDate(this.from));
      this.set('chartOptions.xAxis.max', this._convertToDate(this.to));
      this.set('chartOptions.yAxis.name', this.unit);
      this.set('chartOptions.tooltip', {
          trigger: 'axis',
          axisPointer: {
              animation: false,
              label: {
                  precision: 2
              }
          },
          formatter: function(params) {
              var ret = echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', params[0].data[0]);
              for (var i = 0, l = params.length; i < l; i++) {
                  ret += '<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:' + params[i].color + ';"></span>';
                  ret += params[i].seriesName + ' : ' + nFormatter(params[i].value[1], 5) + _this.unit;
              }
              return ret;
          }
      });
      this.chart.setOption(this.chartOptions);
      this.chart.setOption(this.chartData);
      this._updatePanel();
  },

  detached: function() {
      console.debug('panel detached', this.panel && this.panel.id, this.datasourceType);
      if (this.chart) {
          this.chart.dispose();
          this.chart = null;
      }
  },

  deletePanel: function(e) {
      this.cancelAsync(this.intervalId);
      this.set('intervalId', null);
      this.loading = true;
      this.fire('delete-panel', {
          panelId: this.panel.id,
          index: this.index,
          panel: this
      });
  },

  _resize: function() {
      if (this.panel)
          this.debounce(
              'resizePanel' + this.panel.id,
              function(){
                  if (this.chart)
                      this.chart.resize();
              },
              200
          );
  },

  _generateDataRequest: function() {
      this.debounce('_generateDataRequest', function() {
          console.debug("generating data request", this.params.start, this.params.stop, this.step, this.params.metrics);
          if (this.datasourceType == 'graphite') {
              if (this.$.panelDataRequest.lastRequest)
                  this.$.panelDataRequest.lastRequest.abort()
              this.$.panelDataRequest.generateRequest();
          } else if (this.datasourceType == 'mist.monitor') {
              var socket = document.querySelector('mist-app').shadowRoot.querySelector('mist-socket');
              var prefix = this.panel.machine || [false, false];
              var payload = prefix.concat([this.params.start, this.params.stop, this.step, 0, this.params.metrics]);
              // TODO abort last request
              if (socket){
                  socket.getStats(payload, this._handlePanelResponse.bind(this));
              }
              this.set('loading', true);
          }
      }.bind(this), 100);
  },

  _filterTarget: function(target) {
      var k = Object.keys(this.get('replaceTargets'));
      for (var i = 0; i < k.length; i++) {
          target = target.replace(k[i], this.replaceTargets[k[i]])
      }
      return target;
  },

  _handlePanelResponse: function(e) {
      if (!this || !this.chart)
          return;
      // set new min max values
      this.set('chartOptions.xAxis.min', this._convertToDate(this.from));
      this.set('chartOptions.xAxis.max', this._convertToDate(this.to));
      this.chart.setOption(this.chartOptions);

      // get data from response
      var data = e.detail ? e.detail.response : e;
      this.set('loading', false);
      this.updateChartData(data);

      if (!this.hasRenderedData && this.chartData.series.length)
          this.hasRenderedData = true;

      if (this.refreshInterval > 0) {
          var to = this.to;
          if (typeof to == "string" && (to.trim().startsWith('now') || to.trim().startsWith('-') || to.trim() == "")) {
              var intervalId = this.async(function() {
                  if (this.hasRenderedData) {
                      if (this.datasourceType == "graphite") {
                          this.set("params.from", "-2min");
                      } else if (this.datasourceType == "mist.monitor") {
                          this.set("params.start", "-2min");
                      }
                  }
                  this._generateDataRequest();
              }.bind(this), this.refreshInterval);
              this.set('intervalId', intervalId);
          }
      }
  },

  updateChartData: function(data) {
      var columns = [],
          response,
          x = [],
          points = [],
          datanames = [];
      if (this.datasourceType == "mist.monitor") {
          // for http
          if (data.detail != null) {
              response = data.detail.response;
          } else {
              response = data.metrics;
          }
          for (var metr in response) {
              if (columns.length >= 20) // no more than 20 metrics per graph
                  break;
              x = [];
              points = [];
              if (response[metr] != null) {
                  for (var i = 0; i < response[metr].datapoints.length; i++) {
                      points.push([
                          new Date(response[metr].datapoints[i][1] * 1000),
                          response[metr].datapoints[i][0]
                      ])
                  }
                  datanames.push(response[metr].name);
                  columns.push(points);
              }
          }
      } else { //for graphite
          for (var j = 0; j < data.length; j++) {
              x = [];
              points = [];
              if (data[j] != null) {
                  for (var i = 0; i < data[j].datapoints.length; i++) {
                      points.push([
                          new Date(data[j].datapoints[i][1] * 1000),
                          data[j].datapoints[i][0]
                      ])
                  }
                  datanames.push(data[j].target);
                  columns.push(points);
              }
          }
      }

      var ret = this.chartData;

      for (var k = 0; k < datanames.length; k++) {
          // remove incoming datapoints that are outside the time window
          var dateOffset;
          if (typeof(this.from) === 'number')
              dateOffset = moment(this.from * 1000)._d;
          else if (typeof(this.from) === 'string')
              dateOffset = moment().relativeTime(this.from)._d;
          for (var i = 0; i < columns[k].length; i++)
              if (columns[k][i][0] >= dateOffset)
                  break;
          if (i)
              columns[k].splice(0, i);
          var seriesName = this._filterTarget(datanames[k]),
              seriesIndex = ret.series.findIndex(function(s){
              return s.name == seriesName
          });
          if (seriesIndex == -1) { // if a series with that name does not exist
              var seriesType = this.panel.bars ? 'bar' : 'line';
              ret.series.push({
                  name: seriesName,
                  data: columns[k],
                  type: seriesType,
                  stack: this.panel.stack,
                  areaStyle: this.panel.stack ? { normal: { opacity: .25 } } : { normal: { opacity: .0 } },
                  showSymbol: this.panel.points, // TODO: enable series overrides,
                  symbol: 'roundRect'
              });
              ret.legend.data.push(seriesName);
          } else { // if the series is already there, just stream the new data
              // remove pre-existing datapoints that are now outside the time window
              for (var i = 0; i < ret.series[seriesIndex].data.length; i++)
                  if (ret.series[seriesIndex].data[i][0] >= dateOffset)
                      break;
              if (i)
                  ret.series[seriesIndex].data.splice(0, i);

              // find first common datapoint
              var firstCommonDatapointIndex = ret.series[seriesIndex].data.findIndex(
                  function(p) {
                      return p[0].getTime() == columns[k][0][0].getTime();
                  }
              );
              if (firstCommonDatapointIndex > -1)
                  ret.series[seriesIndex].data.splice(firstCommonDatapointIndex, ret.series[seriesIndex].data.length - firstCommonDatapointIndex);
              for (var l = 0; l < columns[k].length; l++) {
                  ret.series[seriesIndex].data.push(columns[k][l]);
              }

              ret.series[seriesIndex].animation = false;
          }
      }
      this.set('chartData', ret);
      this.chart.setOption(this.chartData);
  },

  _convertToDate: function(time){
      var convertedTime;
      if (typeof(time) === 'number')
          convertedTime = moment(time*1000).toDate();
      else if (typeof(time) === 'string')
          convertedTime = moment().relativeTime(time).toDate();
      return convertedTime;
  },

  _timeRangeUpdated: function() {
      console.debug("_timeRangeUpdated", this.to, this.from);
      // clear previous async task
      if (this.intervalId) {
          this.cancelAsync(this.intervalId);
          this.set('intervalId', null);
      }
      this.set('chartData.series', []);
      this.hasRenderedData = false;
      this._updateStep();
      this._generateDataRequest();
  },

  _updateStep: function() {
      var from = this.from,
          to = this.to,
          datasourceType = this.datasourceType;
      if (this.datasourceType != 'mist.monitor')
          return; // step is needed only for mist.monitor datasource
      var steps = ["", "10min", "6h", "1d", "4d", "7d", "1month"];
      var timeDelta = this.timeRangeDurationInMinutes;
      if (timeDelta <= 60) { //less than an  hour
          this.step = steps[0];
      } else if (timeDelta <= 1440) { //less than a day
          this.step = steps[1];
      } else if (timeDelta <= 1440 * 7) { //less than a week
          this.step = steps[2];
      } else if (timeDelta <= 43200) { //less than a month
          this.step = steps[3];
      } else if (timeDelta < 259200) { //less than 6 months
          this.step = steps[4];
      } else if (timeDelta <= 2 * 259200) { //less than year)
          this.step = steps[5];
      } else { //more than year
          this.step = steps[6];
      }
  },

  _computeGraphiteTimestamp: function(timestamp) {
      if (typeof timestamp != 'string')
          return timestamp;
      ret = timestamp;
      if (ret.endsWith("m"))
          ret = ret.replace("m", "min");
      ret = ret.replace("now", "");
      return ret;
  },

  _updatePanel: function(e) {
      if (this.chart && this.panel)
          this.chart.setOption({
              title: {
                  text: this.panel.title,
                  show: false,
                  link: this.panel.links && this.panel.links.length && this.panel.links[0].uri || '',
                  left: 24
              }
          });
  },

  _updateParams: function(from, to, refreshInterval, targets, datasourceType) {
      if (this.datasourceType == "graphite") {
          //some graphite versions expect 'until' paramater and others "to"
          var params = {
                  'format': 'json',
                  'from': this._computeGraphiteTimestamp(from),
                  'to': this._computeGraphiteTimestamp(to),
                  'until': this._computeGraphiteTimestamp(to)
              },
              tlist = [];
          for (var i = 0; i < targets.length; i++) {
              if (targets[i].target)
                  tlist.push(targets[i].target)
          }
          params['target'] = tlist;
      } else if (this.datasourceType == "mist.monitor") {
          var params = {
                  'start': this._computeGraphiteTimestamp(from),
                  'stop': this._computeGraphiteTimestamp(to)
              },
              tlist = [];
          for (var i = 0; i < targets.length; i++) {
              tlist.push(targets[i].target)
          }
          params['metrics'] = tlist;
      }
      this.set('params', params);
      this._timeRangeUpdated();
  },

  _computeIsPanelRemovable: function(panel) {
      return panel.editable || panel.removable;
  },

  _computeUrl: function(datasourceUri) {
      if (this.datasourceType == "graphite")
          return this.datasourceUri + '/render';
      return this.datasourceUri;
  },

  _getPanelContent: function(panel) {
      if (panel.type == "text")
          return panel.content;
      else if (panel.type == "singlestat")
          return ''; // [[panel.prefix]] [[panel.postfix]] [[panel.valueMaps.0.op]]
      else if (panel.type == "table")
          return '';
      else if (panel.type == "dashlist")
          return '';
      else if (panel.type == "graph")
          return '';
      return ''
  }
});
