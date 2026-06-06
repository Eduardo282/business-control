UPDATE quotes
SET folio = CONCAT(
  CHAR(65 + MOD(FLOOR((id - 1) / 17576000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 676000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 26000), 26)),
  CHAR(65 + MOD(FLOOR((id - 1) / 1000), 26)),
  LPAD(MOD(id, 1000), 3, '0')
)
WHERE id IS NOT NULL;

ALTER TABLE quotes ADD UNIQUE INDEX uq_quotes_folio (folio);
