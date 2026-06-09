SELECT
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`VISITOR_FOOD_JOURNEY_ID` AS `VISITOR_FOOD_JOURNEY_ID`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`VISITOR_ID` AS `VISITOR_ACCOUNT_ID`,
  IFNULL(
    `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`VISITOR_NAME`,
    'Guest'
  ) AS `VISITOR_NAME`,
  IFNULL(
    `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`VISITOR_PIC`,
    'star.jpg'
  ) AS `VISITOR_PIC`,
  IFNULL(
    `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`VISITOR_EMAIL_ADDRESS`,
    'Not Available'
  ) AS `VISITOR_EMAIL_ADDRESS`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`TITLE` AS `TITLE`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`DESCRIPTION` AS `DESCRIPTION`,
  IFNULL(
    `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`RESTAURANT_NAME`,
    'Not Mentioned'
  ) AS `RESTAURANT_NAME`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`ADDRESS_GOOGLE_URL` AS `ADDRESS_GOOGLE_URL`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`PIC_1` AS `PIC_1`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`PIC_2` AS `PIC_2`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`PIC_3` AS `PIC_3`,
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`APPROVED` AS `APPROVED`
FROM
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`
ORDER BY
  `bqf5o0hficph9fg14fbs`.`visitor_food_journey`.`CREATION_DATETIME` DESC