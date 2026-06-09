SELECT
  DISTINCT `a`.`BUSINESS_ID` AS `BUSINESS_ID`
FROM
  `bqf5o0hficph9fg14fbs`.`business_food_menu_card` `a`
WHERE
  (
    (`a`.`VALID_FROM` <= NOW())
    AND (IFNULL(`a`.`VALID_TO`, NOW()) >= NOW())
  )