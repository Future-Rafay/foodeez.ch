DROP FUNCTION IF EXISTS `calculate_distance_km`;

CREATE FUNCTION `calculate_distance_km`(
    lat1 DOUBLE,
    lon1 DOUBLE,
    lat2 DOUBLE,
    lon2 DOUBLE
) RETURNS DOUBLE
DETERMINISTIC
RETURN (
    6371 * ACOS(
        LEAST(
            1,
            GREATEST(
                -1,
                COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * COS(RADIANS(lon2) - RADIANS(lon1))
                + SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
            )
        )
    )
);