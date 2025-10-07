# Date/Time Integration Traceability Map

Project: Calendar-Todo Application  
Version: 1.0.0  
Last Updated (UTC): 2025-09-07T12:12:08Z

Purpose  
Map legacy and existing Date/Time tests to new DTTZ test IDs for coverage tracking, reproducibility, and end-to-end traceability from requirements to execution artifacts.

Conventions  

- DTTZ ID format: DTTZ-<category>-<sequence>  
- Categories:
  - TZC: Timezone Conversion
  - DST: DST Handling
  - FMT: Date Formatting
  - TRV: Time Range Validation
  - RRULE: Recurring Events

Legend  

- Legacy File denotes existing test sources under tests/integration/datetime or UI-level basic tests.  
- New File denotes new or designated-path tests under tests/integration/date_time.  
- Notes indicates relationship, reused utilities, or scope notes.

1. Timezone Conversion (DTTZ-TZC-###)

| DTTZ ID | Test Name | Legacy File | New File | Notes |
| --- | --- | --- | --- | --- |
| DTTZ-TZC-001 | UTC to major timezones conversion | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ to be orchestrated by matrix | Validates UTC to EST/PST/Auckland/Chatham; uses DateTimeTestDataFactory |
| DTTZ-TZC-002 | Timezone offset calculations | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ | get_timezone_offset behavior across seasons |
| DTTZ-TZC-003 | Timezone identifier validation | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ | Supported tz list and invalid tz rejection |
| DTTZ-TZC-004 | Cross-timezone synchronization | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ | Create in one tz, view in another tz |
| DTTZ-TZC-005 | Rare offsets and edge cases | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ | Chatham +12:45, Kathmandu +05:45, Kiritimati +14, Baker -12 |
| DTTZ-TZC-006 | Bulk timezone conversion performance | tests/integration/datetime/timezone_conversion.test.ts | tests/integration/date_time/ | 1000 conversions performance envelope |
| DTTZ-TZC-007 | UI basic: UTC to local conversion | ui/src/tests/integration/datetime/timezone_basic.test.ts | tests/integration/date_time/ | UI sanity coverage; retained for smoke |

2. DST Handling (DTTZ-DST-###)

| DTTZ ID | Test Name | Legacy File | New File | Notes |
| --- | --- | --- | --- | --- |
| DTTZ-DST-001 | Spring forward EST to EDT | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Gap detection and new offset -4 |
| DTTZ-DST-002 | Spring forward CET to CEST | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Skipped hour validation in Europe/Berlin |
| DTTZ-DST-003 | Non-existent local time detection | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Suggested canonical replacement time |
| DTTZ-DST-004 | Fall back EDT to EST | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Overlap handling and deduplication |
| DTTZ-DST-005 | Ambiguous time resolution | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | First vs second occurrence defaults |
| DTTZ-DST-006 | Southern hemisphere DST behavior | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Australia/Sydney transitions |
| DTTZ-DST-007 | Historical DST transitions verification | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Multi-year verified transitions |
| DTTZ-DST-008 | DST rule change validation | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | US 2007 rule change scenarios |
| DTTZ-DST-009 | DST calculation performance | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | Bulk transition checks within SLA |
| DTTZ-DST-010 | Non-DST timezone handling | tests/integration/datetime/dst_handling.test.ts | tests/integration/date_time/ | UTC no-DST expectations |
| DTTZ-DST-011 | UI basic: spring and fall windows | ui/src/tests/integration/datetime/timezone_basic.test.ts | tests/integration/date_time/ | UI sanity checks retained |

3. Date Formatting (DTTZ-FMT-###)

| DTTZ ID | Test Name | Legacy File | New File | Notes |
| --- | --- | --- | --- | --- |
| DTTZ-FMT-001 | Locale-specific date formatting | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | en-US, en-GB, ja-JP, ar-SA |
| DTTZ-FMT-002 | International format variations | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | short, medium, long, full |
| DTTZ-FMT-003 | RTL language formatting | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Arabic, Hebrew, Persian |
| DTTZ-FMT-004 | Cultural calendar systems | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Hebrew, Islamic, Persian, Chinese |
| DTTZ-FMT-005 | Cultural date preferences | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Era handling, honorifics, Buddhist year |
| DTTZ-FMT-006 | Cross-component consistency | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Calendar view, lists, exports |
| DTTZ-FMT-007 | Dynamic preference changes | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Update user locale and re-render |
| DTTZ-FMT-008 | Multi-format date parsing | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Parse and normalize to ISO-UTC |
| DTTZ-FMT-009 | Format-locale compatibility | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Ambiguity detection and conflicts |
| DTTZ-FMT-010 | High-volume formatting performance | tests/integration/datetime/date_formatting.test.ts | tests/integration/date_time/ | Bulk and cache behavior |
| DTTZ-FMT-011 | UI basic: consistent and locale formats | ui/src/tests/integration/datetime/timezone_basic.test.ts | tests/integration/date_time/ | UI-level sanity retained |

4. Time Range Validation (DTTZ-TRV-###)

| DTTZ ID | Test Name | Legacy File | New File | Notes |
| --- | --- | --- | --- | --- |
| DTTZ-TRV-001 | Basic time range validation | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Start less than end; duration checks |
| DTTZ-TRV-002 | Cross-day range handling | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Midnight crossing, multi-day spans |
| DTTZ-TRV-003 | Leap year Feb 29 validation | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Leap and non-leap behaviors |
| DTTZ-TRV-004 | Leap year transition windows | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Leap to regular and vice versa |
| DTTZ-TRV-005 | Century and millennium boundaries | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Y2K and future boundaries |
| DTTZ-TRV-006 | System min and max date limits | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Before epoch, 2038, far future |
| DTTZ-TRV-007 | Invalid date detection | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Month/day/hour/minute constraints |
| DTTZ-TRV-008 | Temporal data integrity | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | Overlap detection and sequences |
| DTTZ-TRV-009 | Bulk validation performance | tests/integration/datetime/time_range_validation.test.ts | tests/integration/date_time/ | 2000+ range validations |
| DTTZ-TRV-010 | UI basic: range and leap year | ui/src/tests/integration/datetime/timezone_basic.test.ts | tests/integration/date_time/ | UI-level basic assertions |

5. Recurring Events (DTTZ-RRULE-###)

| DTTZ ID | Test Name | Legacy File | New File | Notes |
| --- | --- | --- | --- | --- |
| DTTZ-RRULE-001 | Daily recurrence across DST and months | - | tests/integration/date_time/recurrence/date_time_recurrence_daily.test.ts | Validate count-in-window, UTC and local, DST boundaries |
| DTTZ-RRULE-002 | Weekly recurrence with multiple weekdays | - | tests/integration/date_time/recurrence/date_time_recurrence_weekly.test.ts | Correct week rollovers across timezones |
| DTTZ-RRULE-003 | Monthly recurrence variants | - | tests/integration/date_time/recurrence/date_time_recurrence_monthly.test.ts | Day-of-month, DOW, last-day, nth weekday, missing-day months |
| DTTZ-RRULE-004 | Custom patterns and bounded rules | - | tests/integration/date_time/recurrence/date_time_recurrence_custom_patterns.test.ts | Every N hours, mixed rules, COUNT and UNTIL |
| DTTZ-RRULE-005 | Exceptions via EXDATE and RDATE | - | tests/integration/date_time/recurrence/date_time_recurrence_exceptions.test.ts | Skips, moved occurrences, series edits, integrity checks |

6. Requirements Coverage and Cross-References

- Timezone conversion requirements: Covered by DTTZ-TZC-001..006
- DST handling requirements: Covered by DTTZ-DST-001..010
- Date formatting requirements: Covered by DTTZ-FMT-001..010
- Time range validation requirements: Covered by DTTZ-TRV-001..009
- Recurrence requirements: Covered by DTTZ-RRULE-001..005

7. Execution Artifacts and Mapping

- Results logs and summaries map to DTTZ IDs:
  - Results JSON: results/integration/date_time/results_summary.json
  - Results Markdown: results/integration/date_time/results_summary.md
  - Per-run logs: logs/integration/date_time/date_time_<category>_<descriptor>_YYYYMMDDTHHMMSSZ.log
- integration_test_overview.md Recurring Event Processing table will be updated post-execution with statuses and notes derived from DTTZ-RRULE-001..005 runs.

8. Notes

- Existing tests under tests/integration/datetime will be executed by the matrix runner; no duplication is planned.
- UI-level basic tests remain as a lightweight smoke layer and are not considered comprehensive; they complement but do not replace DTTZ coverage.
- Where a single legacy test covers multiple assertions, multiple DTTZ IDs have been mapped to the corresponding logical subtests as listed above.

End of document.
