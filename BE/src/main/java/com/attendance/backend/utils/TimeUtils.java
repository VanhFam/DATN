package com.attendance.backend.utils;

import java.time.format.DateTimeFormatter;

public final class TimeUtils {
    public static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("[HH:mm][H:mm][HH:mm:ss]");

    private TimeUtils() {}
}
