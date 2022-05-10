<template>
  <div>
    <div class="row">
      <div class="col-md-3">
        <card
          title="Controller"
        >
          <b-form @submit="onSubmit" @reset="onReset">
            <b-form-group :label="'Frac. Prev: ' + form.pr_prev" label-for="input-1">
              <b-form-input
                  id="input-1"
                  v-model="form.pr_prev"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="Proportion of prevalence estimates to use"
                  required
              ></b-form-input>
            </b-form-group>
            <b-form-group :label="'RR. mort. Asym: ' + form.rr_asym_die" label-for="input-1">
              <b-form-input
                  id="input-1"
                  v-model="form.rr_asym_die"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="RR. TB-related mortality, subclinical TB"
                  required
              ></b-form-input>
            </b-form-group>

            <b-button type="submit" variant="primary">Submit</b-button>
            <b-button type="reset" variant="danger">Reset</b-button>
          </b-form>

        </card>
      </div>
      <div class="col-md-9">
        <b-tabs v-model="index_sel" content-class="mt-3">
          <b-tab v-for="index in Indices" :key="index.Index" :title="index.Abv"></b-tab>
        </b-tabs>
        <tsplot-card
            :title="Indices[index_sel].title"
            :sub-title="Indices[index_sel].sub"
            :chartData="Chart"
            :value_format="Indices[index_sel].fmt"
            :ylab="Indices[index_sel].ylab"
        >
        </tsplot-card>
      </div>
    </div>

    <div class="row">
      <div class="col-md-3">
        <card
            title="Stats"
        >
          {{ form }}
          <br>
          {{ stats }}
        </card>
      </div>
    </div>
  </div>
</template>

<script>
import TsplotCard from "../Cards/TsplotCard";
import Card from "../Cards/Card";
import axios from "axios";
import * as d3 from "d3";
const { Cohort } = require("../../model/cohort.js");


export default {
  name: "basic",
  components : {
    Card,
    TsplotCard
  },
  watch: {
    index_sel(new_sel) {
      this.Chart.Sel = this.Indices[new_sel].Index;
    }
  },
  data: function() {
    function fmt100k(s) {
      return d3.format(".0f")(Math.round((+s) * 1e5));
    }

    const fmtpct = d3.format("~%");

    return {
      fmt100k,
      fmtpct,
      Raw: [],
      form: {
        pr_prev: 1,
        rr_asym_die: 1,
        r_sc: 0.2,
        r_tx_succ: 2
      },
      stats: {
        ADR: 0
      },
      Indices: [
        { Index: "Inc", Abv: "Inc", title: "Incidence", sub: "",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "Mor", Abv: "Mor", title: "Mortality", sub: "",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "PrevAsym", Abv: "Prev, A", title: "Prevalence", sub: "Asymptomatic",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "PrevSym", Abv: "Prev, S", title: "Prevalence", sub: "Symptomatic, no care-seeking",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "PrevCS", Abv: "Prev, C", title: "Prevalence", sub: "Symptomatic, sought care",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "PrevTx", Abv: "Prev, T", title: "Prevalence", sub: "On treatment",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "TxOutSucc", Abv: "Tx, Succ", title: "Treatment outcome", sub: "Successful",
          fmt: fmtpct, ylab: "Percent" },
        { Index: "TxOutLTFU", Abv: "Tx, LTFU", title: "Treatment outcome", sub: "LTFU",
          fmt: fmtpct, ylab: "Percent" },
        { Index: "TxOutDeath", Abv: "Tx, Death", title: "Treatment outcome", sub: "Death",
          fmt: fmtpct, ylab: "Percent" },
        { Index: "MorUt", Abv: "Mor, Ut", title: "Mortality", sub: "Untreated",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
        { Index: "MorTx", Abv: "Mor, Tx", title: "Mortality", sub: "On treatment",
          fmt: fmt100k, ylab: "Annual rate, per 100k" },
      ],
      index_sel: 0,
      model: undefined,
      Chart: {
        Sel: "Inc",
        Data: {

        },
        Sims: [

        ]
      }
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      axios.get("/Valid.json").then(res => {
        const ds = res.data.All;

        this.Raw = ds
        this.model = new Cohort(ds);
        this.Chart.Data = Object.fromEntries(d3.group(ds, d => d.Index));
        this.update();
      });
    },
    onSubmit(event) {
      event.preventDefault();
      this.update();
    },
    onReset(event) {
      event.preventDefault()

      this.form.pr_prev = 1;
      this.form.rr_asym_die = 1;
      this.update();
    },
    update() {
      this.stats = this.model.get_pars(this.form);
      this.Chart.Sims = this.model.simulate(this.stats, 2010, 2030);
    }
  }
}
</script>


<style>
.ct-chart {
  margin: 10px 0 10px;
  min-height: 250px;
  height: 300px;
}
</style>