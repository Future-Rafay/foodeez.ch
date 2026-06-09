SELECT
  `bqf5o0hficph9fg14fbs`.`adlinks`.`ADLINK_ID` AS `ADLINK_ID`,
  `bqf5o0hficph9fg14fbs`.`adlinks`.`BUSINESS_NAME` AS `BUSINESS_NAME`,
  `bqf5o0hficph9fg14fbs`.`adlinks`.`LOGO_FILE` AS `LOGO_FILE`,
  `bqf5o0hficph9fg14fbs`.`adlinks`.`WEB_ADDRESS` AS `WEB_ADDRESS`
FROM
  `bqf5o0hficph9fg14fbs`.`adlinks`
WHERE
  (
    (`bqf5o0hficph9fg14fbs`.`adlinks`.`ACTIVE` = 1)
    AND (`bqf5o0hficph9fg14fbs`.`adlinks`.`APPROVED` = 1)
    AND (
      curdate() BETWEEN IFNULL(
        `bqf5o0hficph9fg14fbs`.`adlinks`.`DATE_FROM`,
(curdate() + INTERVAL -(1) DAY)
      )
      AND IFNULL(
        `bqf5o0hficph9fg14fbs`.`adlinks`.`DATE_TO`,
(curdate() + INTERVAL 365 DAY)
      )
    )
  )
ORDER BY
  rand()