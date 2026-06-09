SELECT
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`VISITOR_BUSINESS_REVIEW_ID` AS `VISITOR_BUSINESS_REVIEW_ID`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`CREATION_DATETIME` AS `CREATION_DATETIME`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`VISITORS_ACCOUNT_ID` AS `VISITORS_ACCOUNT_ID`,
  `bqf5o0hficph9fg14fbs`.`visitors_account`.`FIRST_NAME` AS `FIRST_NAME`,
  `bqf5o0hficph9fg14fbs`.`visitors_account`.`LAST_NAME` AS `LAST_NAME`,
  `bqf5o0hficph9fg14fbs`.`visitors_account`.`PIC` AS `PIC`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`RATING` AS `RATING`,
  IFNULL(
    `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`REMARKS`,
    ''
  ) AS `REMARKS`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_1` AS `PIC_1`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_2` AS `PIC_2`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_3` AS `PIC_3`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_4` AS `PIC_4`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_5` AS `PIC_5`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_6` AS `PIC_6`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_7` AS `PIC_7`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_8` AS `PIC_8`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_9` AS `PIC_9`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`PIC_10` AS `PIC_10`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`VIDEO_1` AS `VIDEO_1`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`LIKE_COUNT` AS `LIKE_COUNT`,
  `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`APPROVED` AS `APPROVED`
FROM
  (
    `bqf5o0hficph9fg14fbs`.`visitor_business_review`
    JOIN `bqf5o0hficph9fg14fbs`.`visitors_account`
  )
WHERE
  (
    `bqf5o0hficph9fg14fbs`.`visitor_business_review`.`VISITORS_ACCOUNT_ID` = `bqf5o0hficph9fg14fbs`.`visitors_account`.`VISITORS_ACCOUNT_ID`
  )