import * as PD from "probability-distributions";
import { sqrt } from "mathjs";


function sample_prior(n, exo) {
    function r_triag(n, a, c, b) {
        const fc = (c - a) / (b - a);
        return PD.runif(n).map(u => {
            if (u < fc) {
                return a + sqrt(u * (b - a) * (c - a));
            } else {
                return b - sqrt((1 - u) * (b - a) * (b -c));
            }
        });
    }

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

export { sample_prior }
