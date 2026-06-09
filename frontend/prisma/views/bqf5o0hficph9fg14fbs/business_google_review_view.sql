SELECT
  `a`.`BUSINESS_GOOGLE_REVIEWS_ID` AS `BUSINESS_GOOGLE_REVIEWS_ID`,
  `a`.`CREATION_DATETIME` AS `CREATION_DATETIME`,
  `b`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `a`.`PLACE_ID` AS `PLACE_ID`,
  `a`.`AUTHOR` AS `AUTHOR`,
  `a`.`RATING` AS `RATING`,
  `a`.`REVIEW` AS `REVIEW`,
  `a`.`RELATIVE_TIME` AS `RELATIVE_TIME`
FROM
  (
    `bqf5o0hficph9fg14fbs`.`business_google_reviews` `a`
    LEFT JOIN `bqf5o0hficph9fg14fbs`.`business` `b` ON((`a`.`PLACE_ID` = `b`.`PLACE_ID`))
  )