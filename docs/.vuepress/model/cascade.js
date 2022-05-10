import { quantileSeq, median, sqrt } from "mathjs";


function r_prev(n, mu, sd) {

    function fn() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        let num = Math.sqrt( -2.0 * Math.log(u) ) * Math.cos( 2.0 * Math.PI * v );
        num = num * sd + mu;
        if (num > 1 || num < 0) return fn() // resample between 0 and 1
        return num
    }

    return Array(n).fill().map(fn);
}


function r_triag(n, a, c, b) {
    const fc = (c - a) / (b - a);
    return Array(n)
        .fill()
        .map(Math.random).map(u => {
        if (u < fc) {
            return a + sqrt(u * (b - a) * (c - a));
        } else {
            return b - sqrt((1 - u) * (b - a) * (b -c));
        }
    });
}



function sample_prior(n, exo) {
    const s = {
        r_die_untx: r_triag(n, exo.r_die_untx.l, exo.r_die_untx.m, exo.r_die_untx.u),
        r_sc: r_triag(n, exo.r_sc.l, exo.r_sc.m, exo.r_sc.u),
    };
    const res = [];
    for (let i = 0; i < n; i++) {
        res.push({
            r_die_untx: s.r_die_untx[i],
            r_sc: s.r_sc[i],
        })
    }
    return res;
}


function calc_cascade(raw, prior, settings) {
    const rows = [];
    for (let i = 0; i < settings.n_iter; i++) {
        rows.push(i);
    }

    let cas = raw
        .map(ent => {
            const prev = r_prev(settings.n_iter, ent.Prev, ent.Prev_Std);

            const src = rows.map(i => {
                const p = prev[i];
                const d = {
                    DetR_pub: ent['CNR_pub_' + settings.cnr_year],
                    DetR_eng: ent['CNR_eng_' + settings.cnr_year],
                    TxI_pub: ent.TxI_pub,
                    TxI_eng: ent.TxI_eng,
                    TxI_pri: settings.TxI_pri,
                };

                d.r_succ_pub = settings.r_succ_pub;
                d.r_succ_eng = settings.r_succ_eng;
                d.r_succ_pri = settings.r_succ_pri;
                d.r_ltfu_pub = d.r_succ_pub / ent.TxSucc_pub * ent.TxLTFU_pub;
                d.r_dead_pub = d.r_succ_pub / ent.TxSucc_pub * ent.TxDead_pub;
                d.r_ltfu_eng = d.r_succ_eng / ent.TxSucc_eng * ent.TxLTFU_eng;
                d.r_dead_eng = d.r_succ_eng / ent.TxSucc_eng * ent.TxDead_eng;
                d.r_ltfu_pri = d.r_succ_pri / ent.TxSucc_eng * ent.TxLTFU_eng;
                d.r_dead_pri = d.r_succ_pri / ent.TxSucc_eng * ent.TxDead_eng;
                d.dur_tx_pub = 1 / (d.r_succ_pub + d.r_ltfu_pub + d.r_dead_pub);
                d.dur_tx_eng = 1 / (d.r_succ_eng + d.r_ltfu_eng + d.r_dead_eng);
                d.dur_tx_pri = 1 / (d.r_succ_pri + d.r_ltfu_pri + d.r_dead_pri);

                d.TxR_pub = d.DetR_pub * d.TxI_pub;
                d.TxR_eng = d.DetR_eng * d.TxI_eng;

                d.time_tx_pub = d.TxR_pub * d.dur_tx_pub;
                d.time_tx_eng = d.TxR_eng * d.dur_tx_eng;
                d.time_tx_pri = ent.TxPriPub * d.time_tx_pub / settings.TxTime_pri2pub - d.time_tx_eng;

                d.TxR_pri = d.time_tx_pri / d.dur_tx_pri;
                d.DetR_pri = d.TxR_pri / d.TxI_pri;
                d.DetR = d.DetR_pub + d.DetR_eng + d.DetR_pri;

                d.Prev = p;
                d.Prev_A = p * 0.39;
                d.Prev_S = p * (1 - 0.39) * (1 - ent.Pr_CS_Sym) * ent.Pr_NA_NC;
                d.Prev_C = p * (1 - 0.39) * (1 - ent.Pr_CS_Sym) * (1 - ent.Pr_NA_NC);
                d.Prev_E = p * (1 - 0.39) * ent.Pr_CS_Sym;

                d.r_sc = prior[i].r_sc;
                d.r_die_asym = prior[i].r_die_untx * settings.rr_die_asym;
                d.r_die_sym = prior[i].r_die_untx;
                d.r_mu_asym = prior[i].r_sc + prior[i].r_die_untx * settings.rr_die_asym;
                d.r_mu_sym = prior[i].r_sc + prior[i].r_die_untx;
                return d;
            });
            return {
                Location: ent.Location,
                src
            }
        })

    // collect parameters for cascade calculation
    cas.forEach(ent => {
        ent.src.forEach(d => {
            d.r_det = d.DetR / d.Prev_E;
            d.r_cs = d.Prev_E / d.Prev_C * (d.r_mu_sym + d.r_det);
            d.r_aware = d.Prev_C / d.Prev_S * (d.r_mu_sym + d.r_cs);
            d.r_onset = d.Prev_S / d.Prev_A * (d.r_mu_sym + d.r_aware);
        });
    })

    // assume the r_onset are not state-dep
    if (settings.shared_r_onset) {
        const rs = cas.filter(ent => ent.Location === "India")[0].src.map(d => d.r_onset);

        cas.filter(ent => ent.Location !== "India").forEach(ent => {
            ent.src.forEach((d, i) => {
                const prev_sce0 = d.Prev_S + d.Prev_C + d.Prev_E;
                d.r_onset = rs[i];

                d.Prev_A = (d.DetR + d.r_mu_sym * d.Prev) / (d.r_onset + d.r_mu_sym);
                d.Prev_S = d.Prev_S / prev_sce0 * (d.Prev - d.Prev_A);
                d.Prev_C = d.Prev_C / prev_sce0 * (d.Prev - d.Prev_A);
                d.Prev_E = d.Prev_E / prev_sce0 * (d.Prev - d.Prev_A);
                d.r_aware = d.r_onset * d.Prev_A / d.Prev_S - d.r_mu_sym;
                d.r_cs = d.r_aware * d.Prev_S / d.Prev_C - d.r_mu_sym;
                d.r_det = d.r_cs * d.Prev_C / d.Prev_E - d.r_mu_sym;
            });
        });
    }

    // cascade calculation
    cas.forEach(ent => {
        ent.src.forEach(d => {
            const rate_g1 = d.r_onset + d.r_sc + d.r_die_asym,
                rate_g2 = d.r_aware + d.r_sc + d.r_die_sym,
                rate_g3 = d.r_cs + d.r_sc + d.r_die_sym,
                rate_g4 = d.r_det + d.r_sc + d.r_die_sym,
                rate_g6_pub = d.r_succ_pub + d.r_dead_pub + d.r_ltfu_pub,
                rate_g6_eng = d.r_succ_eng + d.r_dead_eng + d.r_ltfu_eng,
                rate_g6_pri = d.r_succ_pri + d.r_dead_pri + d.r_ltfu_pri;

            const ent_pub = d.DetR_pub / d.DetR, ent_eng = d.DetR_eng / d.DetR, ent_pri = d.DetR_pri / d.DetR;

            d.Gap1_Prog = d.r_onset / rate_g1;
            d.Gap1_Dead = d.r_die_asym / rate_g1;
            d.Gap1_SelfCure = d.r_sc / rate_g1;
            d.Gap2_Prog = d.Gap1_Prog * d.r_aware / rate_g2;
            d.Gap2_Dead = d.Gap1_Prog * d.r_die_sym / rate_g2;
            d.Gap2_SelfCure = d.Gap1_Prog * d.r_sc / rate_g2;
            d.Gap3_Prog = d.Gap2_Prog * d.r_cs / rate_g3;
            d.Gap3_Dead = d.Gap2_Prog * d.r_die_sym / rate_g3;
            d.Gap3_SelfCure = d.Gap2_Prog * d.r_sc / rate_g3;
            d.Gap4_Prog = d.Gap3_Prog * d.r_det / rate_g4;
            d.Gap4_Dead = d.Gap3_Prog * d.r_die_sym / rate_g4;
            d.Gap4_SelfCure = d.Gap3_Prog * d.r_sc / rate_g4;

            d.Gap5_Prog_pub = d.Gap4_Prog * (ent_pub * d.TxI_pub);
            d.Gap5_Prog_eng = d.Gap4_Prog * (ent_eng * d.TxI_eng);
            d.Gap5_Prog_pri = d.Gap4_Prog * (ent_pri * d.TxI_pri);

            d.Gap5_Prog = d.Gap5_Prog_pub + d.Gap5_Prog_eng + d.Gap5_Prog_pri;
            d.Gap5_LTFU = d.Gap4_Prog - d.Gap5_Prog;

            d.Gap6_Succ_Pub = d.r_succ_pub / rate_g6_pub * d.Gap5_Prog_pub;
            d.Gap6_Succ_Eng = d.r_succ_eng / rate_g6_eng * d.Gap5_Prog_eng;
            d.Gap6_Succ_Pri = d.r_succ_pri / rate_g6_pri * d.Gap5_Prog_pri;
            d.Gap6_LTFU_Pub = d.r_ltfu_pub / rate_g6_pub * d.Gap5_Prog_pub;
            d.Gap6_LTFU_Eng = d.r_ltfu_eng / rate_g6_eng * d.Gap5_Prog_eng;
            d.Gap6_LTFU_Pri = d.r_ltfu_pri / rate_g6_pri * d.Gap5_Prog_pri;
            d.Gap6_Dead_Pub = d.r_dead_pub / rate_g6_pub * d.Gap5_Prog_pub;
            d.Gap6_Dead_Eng = d.r_dead_eng / rate_g6_eng * d.Gap5_Prog_eng;
            d.Gap6_Dead_Pri = d.r_dead_pri / rate_g6_pri * d.Gap5_Prog_pri;

            d.Gap6_Succ = d.Gap6_Succ_Pub + d.Gap6_Succ_Eng + d.Gap6_Succ_Pri;
            d.Gap6_LTFU = d.Gap6_LTFU_Pub + d.Gap6_LTFU_Eng + d.Gap6_LTFU_Pri;
            d.Gap6_Dead = d.Gap6_Dead_Pub + d.Gap6_Dead_Eng + d.Gap6_Dead_Pri;
        })
    });

    // delay calculation
    cas.forEach(ent => {
        ent.src.forEach(d => {
            const rate_g1 = d.r_onset + d.r_sc + d.r_die_asym,
                rate_g2 = d.r_aware + d.r_sc + d.r_die_sym,
                rate_g3 = d.r_cs + d.r_sc + d.r_die_sym,
                rate_g4 = d.r_det + d.r_sc + d.r_die_sym;

            d.DelayPatient = 1 / rate_g1 + 1 / rate_g2 + 1 / rate_g3;
            d.DelaySystem = 1 / rate_g4;
            d.DelayTotal = d.DelayPatient + d.DelaySystem;
        })
    });

    cas.forEach(ent => {
        const keys = Object.keys(ent.src[0]);
        ent.stats = keys.map(k => {
            const vs = ent.src.map(d => d[k]);
            console.log(k, vs)
            return {
                Index: k,
                M: median(vs),
                L: quantileSeq(vs, 0.025),
                U: quantileSeq(vs, 0.975)
            }
        })
    })

    return cas
}

// module.exports = { sample_prior, calc_cascade }
export { sample_prior, calc_cascade };
