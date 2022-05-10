library(tidyverse)
library(jsonlite)


data_cascade <- read_csv(here::here("data", "TBPS.csv"))


d <- data_cascade %>% 
  filter(!is.na(CNR_public_2021)) %>%
  mutate(
    Pr_NA_NC = NotRecognised + Ignored,
    Prev_Std = (Prev_U - Prev_L) / 2 / 1.96  
  ) %>% 
  select(Location, Prev = Prev_M, Prev_Std,
         Pr_CS_Sym = Consulted, Pr_NA_NC,
         CNR_pub_2019 = CNR_public_2019, CNR_eng_2019 = CNR_private_2019,
         CNR_pub_2020 = CNR_public_2020, CNR_eng_2020 = CNR_private_2020,
         CNR_pub_2021 = CNR_public_2021, CNR_eng_2021 = CNR_private_2021,
         TxI_pub = TxI_public_2019, TxI_eng = TxI_private_2019,
         TxSucc_pub = TxSucc_public_2019, TxSucc_eng = TxSucc_private_2019,
         TxDead_pub = TxDead_public_2019, TxDead_eng = TxDead_private_2019,
         TxLTFU_pub = TxLTFU_public_2019, TxLTFU_eng = TxLTFU_private_2019, TxPriPub) %>% 
  mutate(
    across(c(starts_with("Prev"), starts_with("CNR_")), function(x) x * 1e-5),
    across(c(TxI_pub, TxI_eng), function(x) x * 1e-2),
    Tx_pub = TxSucc_pub + TxLTFU_pub + TxDead_pub,
    across(c(TxSucc_pub, TxLTFU_pub, TxDead_pub), function(x) x / Tx_pub),
    Tx_eng = TxSucc_eng + TxLTFU_eng + TxDead_eng,
    across(c(TxSucc_eng, TxLTFU_eng, TxDead_eng), function(x) x / Tx_eng)
  ) %>% 
  select(-Tx_pub, -Tx_eng)


d %>% jsonlite::write_json(path=here::here("data", "cascade.json"), digits=8)

