const fs = require('fs');
const pp = require("./docs/.vuepress/model/cascade.js");


let rawdata = fs.readFileSync("./docs/.vuepress/public/Cascade.json");
let Raw = JSON.parse(rawdata);




let settings = {
    TxI_pri: 0.7,
    TxTime_pri2pub: 2,
    r_succ_pub: 2,
    r_succ_eng: 2,
    r_succ_pri: 2,
    rr_die_asym: 0,
    cnr_year: 2019,
    shared_r_onset: true,
    n_iter: 300
}

const prior = pp.sample_prior(settings.n_iter, {
    r_die_untx: { m: 0.16, l: 0.14, u: 0.18 },
    r_sc: { m: 0.2, l: 0.1, u: 0.3 }
})

console.log(prior);


res = pp.calc_cascade(Raw, prior, settings)
console.log(res[0].stats)