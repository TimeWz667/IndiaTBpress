<template>
  <card>
    <template slot="header">
      <h4 v-if="$slots.title || title" class="card-title">
        <slot name="title">
          {{ title }}
        </slot>
      </h4>
      <p class="card-category">
        <slot name="subTitle">
          {{ subTitle }}
        </slot>
      </p>
    </template>
    <div>
      <slot></slot>
      <div :id="chartId" class="ct-chart"></div>
      <div class="footer">
        <div class="chart-legend">
          <slot name="legend"></slot>
        </div>
        <hr />
        <div class="stats">
          <slot name="footer"></slot>
        </div>
        <div class="pull-right"></div>
      </div>
    </div>
  </card>
</template>
<script>
import Card from "./Card.vue";
import * as d3 from "d3";

export default {
  name: "d3-card",
  components: {
    Card
  },
  props: {
    footerText: {
      type: String,
      default: ""
    },
    title: {
      type: String,
      default: ""
    },
    subTitle: {
      type: String,
      default: ""
    },
    drawChart: {
      type: Function,
      default: () => {
        return function() {};
      }
    },
    updateChart: {
      type: Function,
      default: () => {
        return function() {};
      }
    },
    chartData: {
      type: [Object, Array],
      default: () => {
        return {};
      }
    },
    margin: {
      type: Object,
      default: () => {
        return { top: 10, right: 30, bottom: 100, left: 100 };
      }
    }
  },
  data() {
    return {
      chartId: "no-id",
      svg: null,
      g: null,
      x: null,
      y: null,
      xAxis: null,
      yAxis: null,
      width: null,
      height: null,
      colours: null
    };
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.update();
      }
    }
  },
  mounted() {
    this.initialise();
    window.addEventListener("resize", this.resize);
  },
  methods: {
    initialise() {
      this.updateChartId();
      this.$nextTick(() => {
        const margin = this.margin;
        this.svg = d3
            .select("#" + this.chartId)
            .append("svg")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "#fff");

        this.width = this.svg.node().parentNode.clientWidth;
        this.height = this.svg.node().parentNode.clientHeight;
        this.g = this.svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        this.drawChart(this);
      });
    },
    update() {
      this.updateChart(this);
    },
    resize() {
      const width = this.svg.node().parentNode.clientWidth;
      const height = this.svg.node().parentNode.clientHeight;
      this.width = width;
      this.height = height;
      const margin = this.margin;
      if (this.x !== null) {
        this.x.range([margin.left, this.width - margin.right]);
      }
      if (this.y !== null) {
        this.y.range([height - margin.bottom, margin.top]);
      }
    },
    /***
     * Assigns a random id to the chart
     */
    updateChartId() {
      const currentTime = new Date().getTime().toString();
      const randomInt = this.getRandomInt(0, currentTime);
      this.chartId = `div_${randomInt}`;
    },
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }
};
</script>
<style></style>
