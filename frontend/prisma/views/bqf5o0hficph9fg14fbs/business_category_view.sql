SELECT
  `a`.`CNT` AS `CNT`,
  `a`.`Business_category_id` AS `BUSINESS_CATEGORY_ID`,
  `a`.`Category_name` AS `CATEGORY_NAME`,
  REPLACE(
    (
      CASE
        WHEN (
          length(
            substr(
              `a`.`Category_name`,
              1,
              locate(' ', `a`.`Category_name`)
            )
          ) = 0
        ) THEN REPLACE(`a`.`Category_name`, '-', ' ')
        ELSE REPLACE(
          substr(
            `a`.`Category_name`,
            1,
            locate(' ', `a`.`Category_name`)
          ),
          '-',
          ' '
        )
      END
    ),
    'Restaurant',
    'All'
  ) AS `CATEGORY`
FROM
  (
    SELECT
      count(1) AS `CNT`,
      `bqf5o0hficph9fg14fbs`.`business_2_business_category_view`.`BUSINESS_CATEGORY_ID` AS `Business_category_id`,
      `bqf5o0hficph9fg14fbs`.`business_2_business_category_view`.`CATEGORY_NAME` AS `Category_name`
    FROM
      `bqf5o0hficph9fg14fbs`.`business_2_business_category_view`
    GROUP BY
      `bqf5o0hficph9fg14fbs`.`business_2_business_category_view`.`BUSINESS_CATEGORY_ID`,
      `bqf5o0hficph9fg14fbs`.`business_2_business_category_view`.`CATEGORY_NAME`
  ) `a`
ORDER BY
  `a`.`CNT` DESC