SELECT
  `bqf5o0hficph9fg14fbs`.`top_events`.`TOP_EVENTS_ID` AS `TOP_EVENTS_ID`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TITLE` AS `TITLE`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`ADDRESS` AS `ADDRESS`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_1` AS `DATE_1`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_1_FROM` AS `TIME_1_FROM`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_1_TO` AS `TIME_1_TO`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_2` AS `DATE_2`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_2_FROM` AS `TIME_2_FROM`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_2_TO` AS `TIME_2_TO`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_3` AS `DATE_3`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_3_FROM` AS `TIME_3_FROM`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_3_TO` AS `TIME_3_TO`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_4` AS `DATE_4`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_4_FROM` AS `TIME_4_FROM`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_4_TO` AS `TIME_4_TO`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_5` AS `DATE_5`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_5_FROM` AS `TIME_5_FROM`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`TIME_5_TO` AS `TIME_5_TO`,
  `bqf5o0hficph9fg14fbs`.`top_events`.`HREF` AS `HREF`
FROM
  `bqf5o0hficph9fg14fbs`.`top_events`
WHERE
  (
    `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_1` >= curdate()
  )
ORDER BY
  `bqf5o0hficph9fg14fbs`.`top_events`.`DATE_1`