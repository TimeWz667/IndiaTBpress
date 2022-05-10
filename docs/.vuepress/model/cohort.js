// import * as PD from "probability-distributions";
import * as odex from "odex";
import { mean, diff, log, exp, sum } from "mathjs";


class Cohort {
    constructor(x) {
        this.Raw = x;
        this.Year0 = 2016;

        const incs = x.filter(d => d.Index === "Inc");
        const mors = x.filter(d => d.Index === "Mor");
        const adr = - mean(diff(incs.map(d => log(d.M))));

        this.Inc0 = incs[0];
        this.Inc0 = {
            mean: this.Inc0.M,
            std: (this.Inc0.U - this.Inc0.L) / 1.96
        }

        this.DF = incs
            .map(d => {
                const yr = d.Year, inc = d.M;
                const fct = exp(-adr * (yr - this.Year0))
                const mor = mors.find(d => d.Year === yr).M;

                return {
                    Year: yr,
                    IncData: inc,
                    fct: fct,
                    Inc0: inc / fct,
                    Mor0: mor / fct
                }
            });

        this.D0 = x
            .filter(d => d.Year === this.Year0)
            .reduce((a, b) => { a[b.Index] = b.M; return a}, {});

        this.Stats = {
            Inc_hat: mean(this.DF.map(d => d.Inc0)),
            Mor_hat: mean(this.DF.map(d => d.Mor0)),
            TxOut: {
                Succ: mean(x.filter(d => d.Index === "TxOutSucc").map(d => d.M)),
                LTFU: mean(x.filter(d => d.Index === "TxOutLTFU").map(d => d.M)),
                Death: mean(x.filter(d => d.Index === "TxOutDeath").map(d => d.M))
            },
            ADR: adr
        }
    }

    get_pars(form) {
        const { r_sc, r_tx_succ, rr_asym_die } = form;

        const r_tx_die = r_tx_succ * this.Stats.TxOut.Death / this.Stats.TxOut.Succ;
        const r_tx_ltfu = r_tx_succ * this.Stats.TxOut.LTFU / this.Stats.TxOut.Succ;

        const { Mor_hat, Inc_hat, ADR } = this.Stats;
        const { PrevAsym, PrevSym, PrevCS, Prev } = this.D0;

        const tx = (Mor_hat - Prev * (ADR - r_sc) - Inc_hat) / (ADR - r_tx_succ - r_tx_ltfu);

        const r_uts_die = (Mor_hat - r_tx_die * tx) / (rr_asym_die * PrevAsym + PrevSym + PrevCS);
        const r_uta_die = rr_asym_die * r_uts_die;

        const r_onset = Inc_hat / PrevAsym + (ADR - r_uta_die - r_sc);
        const r_aware = r_onset * PrevAsym / PrevSym + (ADR - r_uts_die - r_sc);
        const r_det = r_aware * PrevSym / PrevCS + (ADR - r_uts_die - r_sc);

        return {
            adr: ADR,
            r_onset, r_aware, r_det,
            r_sc,
            r_tx_succ, r_tx_ltfu,
            r_uta_die, r_uts_die, r_tx_die
        }
    }

    get_y0(pars, t0) {
        const { Inc_hat, ADR } = this.Stats
        const {
            r_onset, r_aware, r_det,
            r_sc,
            r_tx_succ, r_tx_ltfu,
            r_uta_die, r_uts_die, r_tx_die } = pars;

        const inc0 = Inc_hat * exp(- ADR * (t0 - this.Year0));
        const prev_a = inc0 / (r_onset + r_sc + r_uta_die - ADR);
        const prev_s = r_onset * prev_a / (r_aware + r_sc + r_uts_die - ADR);
        const prev_c = r_aware * prev_s / (r_det + r_sc + r_uts_die - ADR);
        const prev_t = r_det * prev_c / (r_tx_succ + r_tx_ltfu + r_tx_die - ADR);

        return { prev_a, prev_s, prev_c, prev_t }
    }

    buildModel(pars) {
        function fn(x, y) {
            const {
                adr,
                r_onset, r_aware, r_det,
                r_sc,
                r_tx_succ, r_tx_ltfu,
                r_uta_die, r_uts_die, r_tx_die } = pars;

            const prev = sum(y);
            const inc = (r_sc + r_uta_die) * y[0] + (r_sc + r_uts_die) * (y[1] + y[2]) + (r_tx_die + r_tx_succ + r_tx_ltfu) * y[3] - prev * adr;

            return [
                inc - (r_onset + r_sc + r_uta_die) * y[0],
                r_onset * y[0] - (r_aware + r_sc + r_uts_die) * y[1],
                r_aware * y[1] - (r_det + r_sc + r_uts_die) * y[2],
                r_det * y[2] - (r_tx_succ + r_tx_ltfu + r_tx_die) * y[3]
            ]
        }
        return fn;
    }

    simulate(pars, t0, t1) {
        let y0 = this.get_y0(pars, t0);

        y0 = [y0.prev_a, y0.prev_s, y0.prev_c, y0.prev_t];

        const s = new odex.Solver(y0.length);
        s.denseOutput = true;

        const mea = [];

        s.solve(this.buildModel(pars), t0, y0, t1, s.grid(1, function(x,y) {
            const { adr, r_det, r_sc, r_tx_succ, r_tx_ltfu, r_uta_die, r_uts_die, r_tx_die } = pars;

            const sc = "M";

            const prev = sum(y);
            const inc = (r_sc + r_uta_die) * y[0] + (r_sc + r_uts_die) * (y[1] + y[2]) + (r_tx_die + r_tx_succ + r_tx_ltfu) * y[3] - prev * adr;
            const mor_ut = r_uta_die * y[0] + r_uts_die * (y[1] + y[2]);
            const mor_tx = r_tx_die * y[3];
            const tx = r_tx_die + r_tx_ltfu + r_tx_succ
            const p_tx_die = r_tx_die / tx, p_tx_ltfu = r_tx_ltfu / tx, p_tx_succ = r_tx_succ / tx;

            mea.push({
                Year: x,
                Scenario: sc,
                Prev: prev,
                PrevAsym: y[0],
                PrevSym: y[1],
                PrevCS: y[2],
                PrevTx: y[3],
                Inc: inc,
                MorUt: mor_ut,
                MorTx: mor_tx,
                Mor: mor_ut + mor_tx,
                TxI: r_det * y[2],
                TxOutDeath: p_tx_die,
                TxOutLTFU: p_tx_ltfu,
                TxOutSucc: p_tx_succ
            })
        }));

        return mea;
    }
}

export { Cohort };
