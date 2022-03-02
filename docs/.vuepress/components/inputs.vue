<template>
  <div>
    <div class="row">
      <div class="col-md-6">
        <tsplot-card
            title="Incidence"
            v-bind:chartData="Inc"
            :value_format="fmt100k"
            ylab="Annual rate per 100 000"
        >
          <div slot="footer">WHO TB burden estimates</div>
        </tsplot-card>
      </div>
      <div class="col-md-6">
        <tsplot-card
            title="Mortality"
            :chartData="Mor"
            :value_format="fmt100k"
            ylab="Annual rate"
        >
          <div slot="footer">WHO TB burden estimates</div>
        </tsplot-card>
      </div>
    </div>

    <div class="row">
      <div class="col-md-4">
        <tsplot-card
            title="Prevalence"
            sub-title="Asymptomatic"
            :chartData="PrevA"
            :value_format="fmtpct"
            ylab="proportion, %"
        >
          <div slot="footer">Gujarat TB prevalence survey 2016</div>
        </tsplot-card>
      </div>
      <div class="col-md-4">
        <tsplot-card
            title="Prevalence"
            sub-title="Symptomatic without care-seeking"
            :chartData="PrevS"
            :value_format="fmtpct"
            ylab="proportion, %"
        >
          <div slot="footer">Gujarat TB prevalence survey 2016</div>
        </tsplot-card>
      </div>
      <div class="col-md-4">
        <tsplot-card
            title="Prevalence"
            sub-title="Symptomatic with care-seeking"
            :chartData="PrevC"
            :value_format="fmtpct"
            ylab="proportion, %"
        >
          <div slot="footer">Gujarat TB prevalence survey 2016</div>
        </tsplot-card>
      </div>
    </div>
  </div>
</template>

<script>
import TsplotCard from "./Cards/TsplotCard"
import axios from "axios";
import * as d3 from "d3";


export default {
  name: "inputs",
  components : {
    TsplotCard
  },
  data: function() {
    function fmt100k(s) {
      return d3.format(".0f")(Math.round((+s) * 1e5));
    }

    return {
      fmt100k,
      fmtpct: d3.format("~%"),
      PrevA: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
      PrevS: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
      PrevC: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
      Prev: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
      Inc: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
      Mor: { Data: [{Year: 2010, M: 0.01, L: 0.005, U: 0.015}], Sims: []},
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      axios.get("/Targets.json").then(res => {
        const ds = res.data.All;

        this.PrevA.Data = ds.filter(d => d.Index === "PrAsym");
        this.PrevS.Data = ds.filter(d => d.Index === "PrSym");
        this.PrevC.Data = ds.filter(d => d.Index === "PrCS");

        this.Inc.Data = ds.filter(d => d.Index === "Inc");
        this.Mor.Data = ds.filter(d => d.Index === "Mor");
      });
    },
  }
}
</script>


<style>
.ct-chart {
  margin: 10px 0 10px;
  min-height: 150px;
  height: 200px;
}
</style>