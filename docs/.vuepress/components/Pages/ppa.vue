<template>
  <div>
    <div class="row">
      <div class="col-md-3">
        <card
            title="Settings"
        >
          <div>
            <b-form-select v-model="sel_location" :options="Locations" class="mb-3"></b-form-select>
          </div>
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

            <b-button type="submit" variant="primary">Update</b-button>
            <b-button type="reset" variant="danger">Reset</b-button>
          </b-form>

        </card>

        <card
            title="Stats"
        >
          {{ Settings }}
        </card>

      </div>
      <div class="col-md-9">
        <cascade-card
            title="Care cascade"
            :chartData="sel_cascade"
            ylab="Percentage, %"
        >
        </cascade-card>
        <p v-for="g in sel_cascade">{{ g }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Card from "../Cards/Card";
import CascadeCard from "../Cards/CascadeCard";
import { calc_cascade, sample_prior } from "../../model/cascade.js";

export default {
  name: "ppa",
  components: {
    Card,
    CascadeCard
  },
  watch: {
    sel_location(new_sel) {
      this.select_cascade();
    }
  },
  data: function() {
    return {
      Raw: [],
      form: {
        pr_prev: 1,
        rr_asym_die: 1,
        r_sc: 0.2,
        r_tx_succ: 2
      },
      Locations: ["India"],
      Settings: {
        TxI_pri: 0.7,
        TxTime_pri2pub: 2,
        r_succ_pub: 2,
        r_succ_eng: 2,
        r_succ_pri: 2,
        rr_die_asym: 0,
        cnr_year: 2019,
        shared_r_onset: true,
        n_iter: 300
      },
      Prior: [],
      Cascade: [],
      sel_location: "India",
      sel_cascade: []
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.Prior = sample_prior(this.Settings.n_iter, {
        r_die_untx: { m: 0.16, l: 0.14, u: 0.18 },
        r_sc: { m: 0.2, l: 0.1, u: 0.3 }
      });

      axios.get("/cascade.json").then(res => {
        const ds = res.data;

        this.Raw = ds
        this.Locations = this.Raw.map(d => d.Location);
        this.update();
      });
    },
    onSubmit(event) {
      event.preventDefault();
      this.update();
    },
    onReset(event) {
      event.preventDefault()

      this.update();
    },
    update() {
      this.Cascade = calc_cascade(this.Raw, this.Prior, this.Settings)
      this.select_cascade();
      // this.stats = this.model.get_pars(this.form);
      // this.Chart.Sims = this.model.simulate(this.stats, 2010, 2030);
    },
    select_cascade() {
      this.sel_cascade = this.Cascade.filter(d => d.Location === this.sel_location)[0]
          .stats
          .filter(d => d.Index.endsWith("Prog") || d.Index.endsWith("Succ"))
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