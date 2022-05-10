library(tidyverse)
library(tidybayes)

theme_set(theme_bw() + theme(text = element_text(family="sans")))



data_cascade <- read_csv(here::here("data", "TBPS.csv"))


d <- data_cascade %>% 
  filter(!is.na(CNR_public_2021)) %>%
  mutate(NotAware = NotRecognised + Ignored) %>% 
  select(Location, Prev = Prev_M,
         CS_Sym = Consulted, NotAware,
         CNR_pub = CNR_public_2019, CNR_eng = CNR_private_2019,
         TxI_pub = TxI_public_2019, TxI_eng = TxI_private_2019,
         TxSucc_pub = TxSucc_public_2019, TxSucc_eng = TxSucc_private_2019,
         TxDead_pub = TxDead_public_2019, TxDead_eng = TxDead_private_2019,
         TxLTFU_pub = TxLTFU_public_2019, TxLTFU_eng = TxLTFU_private_2019, TxPriPub) %>% 
  mutate(
    across(c(Prev, CNR_pub, CNR_eng), function(x) x * 1e-5),
    across(c(TxI_pub, TxI_eng), function(x) x * 1e-2),
    PrPublic = CNR_pub / (CNR_pub + CNR_eng),
    Tx_pub = TxSucc_pub + TxLTFU_pub + TxDead_pub,
    across(c(TxSucc_pub, TxLTFU_pub, TxDead_pub), function(x) x / Tx_pub),
    Tx_eng = TxSucc_eng + TxLTFU_eng + TxDead_eng,
    across(c(TxSucc_eng, TxLTFU_eng, TxDead_eng), function(x) x / Tx_eng)
  ) %>% 
  select(-Tx_pub, -Tx_eng)


TxI_pri <- 0.7
ratio_time <- 2

r_sc <- 0.2
r_die_untx <- 0.1
pr_asym <- 0.39


res_cascade <- d %>% 
  #select(Location, starts_with("CNR"), starts_with("Tx")) %>% 
  mutate(
    TxI_pri = TxI_pri,
    txi_pub = CNR_pub * TxI_pub,
    txi_eng = CNR_eng * TxI_eng,
    r_succ_pub = 2,
    r_succ_eng = 2,
    r_ltfu_pub = r_succ_pub / TxSucc_pub * TxLTFU_pub,
    r_dead_pub = r_succ_pub / TxSucc_pub * TxDead_pub,
    r_ltfu_eng = r_succ_eng / TxSucc_eng * TxLTFU_eng,
    r_dead_eng = r_succ_eng / TxSucc_eng * TxDead_eng,
    dur_tx_pub = 1 / (r_succ_pub + r_ltfu_pub + r_dead_pub),
    dur_tx_eng = 1 / (r_succ_eng + r_ltfu_eng + r_dead_eng),
    time_tx_pub = txi_pub * dur_tx_pub,
    time_tx_eng = txi_eng * dur_tx_eng,
    time_tx_pri = TxPriPub * time_tx_pub / ratio_time - time_tx_eng,
    txi_pri = time_tx_pri / dur_tx_eng,
    Det_pub = CNR_pub,
    Det_eng = CNR_eng,
    Det_pri = txi_pri / TxI_pri
  ) %>% 
  select(-starts_with('r_')) %>% 
  mutate(
    Det = Det_pub + Det_eng + Det_pri,
    PrAsym = pr_asym,
    Prev_A = Prev * PrAsym,
    Prev_Sym = Prev * (1 - PrAsym),
    Prev_S = Prev_Sym * (1 - CS_Sym) * (NotAware),
    Prev_C =Prev_Sym * (1 - CS_Sym) * (1 - NotAware),
    Prev_E = Prev_Sym * CS_Sym,
    r_mu_sym = r_sc + r_die_untx,
    r_mu_asym = r_sc,
    r_det = Det / Prev_E,
    r_cs = Prev_E / Prev_C * (r_mu_sym + r_det),
    r_aware = Prev_C / Prev_S * (r_mu_sym + r_cs),
    r_onset = Prev_S / Prev_A * (r_mu_sym + r_aware)
  ) %>% 
  select(Location, Det, Prev_A, Prev_S, Prev_C, Prev_E, starts_with("r_"))
  # ) %>% 
  # select(Location, starts_with("TxI_", ignore.case = F), starts_with("Det"), starts_with("CNR")) %>% 

res_cascade


# shared r_onset

res_cascade %>% 
  mutate(
    r_onset = r_onset[Location == "India"],
    Prev = Prev_A + Prev_S + Prev_C + Prev_E,
    Prev_SCE0 = Prev_S + Prev_C + Prev_E,
    Prev_A = (Det + r_mu_sym * Prev) / (r_onset + r_mu_sym),
    Prev_S = Prev_S / Prev_SCE0 * (Prev - Prev_A),
    Prev_C = Prev_C / Prev_SCE0 * (Prev - Prev_A),
    Prev_E = Prev_E / Prev_SCE0 * (Prev - Prev_A),
    r_aware = r_onset * Prev_A / Prev_S - r_mu_sym,
    r_cs = r_aware * Prev_S / Prev_C - r_mu_sym,
    r_det = r_cs * Prev_C / Prev_E - r_mu_sym, 
    Det2 = Prev_E * r_det,
    PrAsym = Prev_A / Prev,
    PNratio = Prev / Det
  ) %>% 
  select(-Prev_SCE0, - Prev)


