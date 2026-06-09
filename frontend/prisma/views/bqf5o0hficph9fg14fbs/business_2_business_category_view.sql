SELECT
  `b`.`BUSINESS_CATEGORY_ID` AS `BUSINESS_CATEGORY_ID`,
  `b`.`CATEGORY_NAME` AS `CATEGORY_NAME`,
  `a`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `a`.`STATUS` AS `STATUS`,
  `a`.`DISPLAY_SEQ` AS `DISPLAY_SEQ`
FROM
  (
    `bqf5o0hficph9fg14fbs`.`business_2_business_category` `a`
    JOIN `bqf5o0hficph9fg14fbs`.`business_category` `b`
  )
WHERE
  (
    `a`.`BUSINESS_CATEGORY_ID` = `b`.`BUSINESS_CATEGORY_ID`
  )