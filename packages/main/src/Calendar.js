import UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js";
import litRender from "@ui5/webcomponents-base/dist/renderer/LitRenderer.js";
import { fetchCldr } from "@ui5/webcomponents-base/dist/asset-registries/LocaleData.js";
import { getCalendarType } from "@ui5/webcomponents-base/dist/config/CalendarType.js";
import getLocale from "@ui5/webcomponents-base/dist/locale/getLocale.js";
import DateFormat from "@ui5/webcomponents-localization/dist/DateFormat.js";
import getCachedLocaleDataInstance from "@ui5/webcomponents-localization/dist/getCachedLocaleDataInstance.js";
import CalendarDate from "@ui5/webcomponents-localization/dist/dates/CalendarDate.js";
import CalendarType from "@ui5/webcomponents-base/dist/types/CalendarType.js";
import Integer from "@ui5/webcomponents-base/dist/types/Integer.js";
import { isF4, isF4Shift } from "@ui5/webcomponents-base/dist/Keys.js";
import CalendarHeader from "./CalendarHeader.js";
import DayPicker from "./DayPicker.js";
import MonthPicker from "./MonthPicker.js";
import YearPicker from "./YearPicker.js";

// Default calendar for bundling
import "@ui5/webcomponents-localization/dist/features/calendar/Gregorian.js";

// Template
import CalendarTemplate from "./generated/templates/CalendarTemplate.lit.js";

// Styles
import calendarCSS from "./generated/themes/Calendar.css.js";

/**
 * @public
 */
const metadata = {
	tag: "ui5-calendar",
	properties: /** @lends  sap.ui.webcomponents.main.Calendar.prototype */ {
		/**
		 * Defines the UNIX timestamp - seconds since 00:00:00 UTC on Jan 1, 1970.
		 * @type {Integer}
		 * @public
		*/
		timestamp: {
			type: Integer,
		},

		/**
		 * Defines the calendar type used for display.
		 * If not defined, the calendar type of the global configuration is used.
		 * Available options are: "Gregorian", "Islamic", "Japanese", "Buddhist" and "Persian".
		 * @type {CalendarType}
		 * @public
		 */
		primaryCalendarType: {
			type: CalendarType,
		},

		/**
		 * Defines the selected dates as UTC timestamps.
		 * @type {Array}
		 * @public
		 */
		selectedDates: {
			type: Integer,
			multiple: true,
		},

		/**
		 * Determines the мinimum date available for selection.
		 *
		 * @type {string}
		 * @defaultvalue ""
		 * @since 1.0.0-rc.6
		 * @public
		 */
		minDate: {
			type: String,
		},

		/**
		 * Determines the maximum date available for selection.
		 *
		 * @type {string}
		 * @defaultvalue ""
		 * @since 1.0.0-rc.6
		 * @public
		 */
		maxDate: {
			type: String,
		},

		/**
		 * Defines the visibility of the week numbers column.
		 * <br><br>
		 *
		 * <b>Note:<b> For calendars other than Gregorian,
		 * the week numbers are not displayed regardless of what is set.
		 *
		 * @type {boolean}
		 * @defaultvalue false
		 * @public
		 * @since 1.0.0-rc.8
		 */
		hideWeekNumbers: {
			type: Boolean,
		},

		_header: {
			type: Object,
		},

		_oMonth: {
			type: Object,
		},

		_monthPicker: {
			type: Object,
		},

		_yearPicker: {
			type: Object,
		},

		_calendarWidth: {
			type: String,
			noAttribute: true,
		},

		_calendarHeight: {
			type: String,
			noAttribute: true,
		},

		formatPattern: {
			type: String,
		},
	},
	events: /** @lends  sap.ui.webcomponents.main.Calendar.prototype */ {
		/**
		 * Fired when the selected dates changed.
		 * @event sap.ui.webcomponents.main.Calendar#selected-dates-change
		 * @param {Array} dates The selected dates' timestamps
		 * @public
		 */
		"selected-dates-change": { type: Array },
	},
};

/**
 * @class
 *
 * <h3>Keyboard Handling</h3>
* The <code>ui5-calendar</code> provides advanced keyboard handling.
* If the <code>ui5-calendar</code> is focused the user can
* choose a picker by using the following shortcuts: <br>
* <ul>
* <li>[F4] - Shows month picker</li>
* <li>[SHIFT] + [F4] - Shows year picker</li>
* <br>
* When a picker is showed and focused the user can use the following keyboard
* shortcuts in order to perform a navigation:
* <br>
* - Day picker: <br>
* <ul>
* <li>[PAGEUP] - Navigate to the previous month</li>
* <li>[PAGEDOWN] - Navigate to the next month</li>
* <li>[SHIFT] + [PAGEUP] - Navigate to the previous year</li>
* <li>[SHIFT] + [PAGEDOWN] - Navigate to the next year</li>
* <li>[CTRL] + [SHIFT] + [PAGEUP] - Navigate ten years backwards</li>
* <li>[CTRL] + [SHIFT] + [PAGEDOWN] - Navigate ten years forwards</li>
* </ul>
* <br>
* - Month picker: <br>
* <ul>
* <li>[PAGEUP] - Navigate to the previous month</li>
* <li>[PAGEDOWN] - Navigate to the next month</li>
* </ul>
* <br>
* - Year picker: <br>
* <ul>
* <li>[PAGEUP] - Navigate to the previous year range</li>
* <li>[PAGEDOWN] - Navigate the next year range</li>
* </ul>
*/

/**
 * @class
 *
 * The <code>ui5-calendar</code> can be used standale to display the years, months, weeks and days,
 * but the main purpose of the <code>ui5-calendar</code> is to be used within a <code>ui5-date-picker</code>.
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.Calendar
 * @extends sap.ui.webcomponents.base.UI5Element
 * @tagname ui5-calendar
 * @public
 */
class Calendar extends UI5Element {
	static get metadata() {
		return metadata;
	}

	static get render() {
		return litRender;
	}

	static get template() {
		return CalendarTemplate;
	}

	static get styles() {
		return calendarCSS;
	}

	constructor() {
		super();
		this._header = {};
		this._header.onPressPrevious = this._handlePrevious.bind(this);
		this._header.onPressNext = this._handleNext.bind(this);
		this._header.onBtn1Press = this._handleMonthButtonPress.bind(this);
		this._header.onBtn2Press = this._handleYearButtonPress.bind(this);

		this._oMonth = {};
		this._oMonth.onSelectedDatesChange = this._handleSelectedDatesChange.bind(this);
		this._oMonth.onNavigate = this._handleMonthNavigate.bind(this);

		this._monthPicker = {};
		this._monthPicker._hidden = true;
		this._monthPicker.onSelectedMonthChange = this._handleSelectedMonthChange.bind(this);
		this._monthPicker.onNavigate = this._handleYearNavigate.bind(this);

		this._yearPicker = {};
		this._yearPicker._hidden = true;
		this._yearPicker.onSelectedYearChange = this._handleSelectedYearChange.bind(this);
		this._yearPicker.onNavigate = this._handleYearNavigate.bind(this);

		this._isShiftingYears = false;
	}

	onBeforeRendering() {
		const localeData = getCachedLocaleDataInstance(getLocale());
		const oYearFormat = DateFormat.getDateInstance({ format: "y", calendarType: this._primaryCalendarType });
		const firstDayOfCalendarTimeStamp = this._getMinCalendarDate();

		if ((this.minDate || this.maxDate) && this._timestamp && !this.isInValidRange(this._timestamp * 1000)) {
			if (this._minDate) {
				this.timestamp = this._minDate / 1000;
			} else {
				this.timestamp = (new Date(firstDayOfCalendarTimeStamp)).getTime() / 1000;
			}
		}

		this._oMonth.formatPattern = this._formatPattern;
		this._oMonth.timestamp = this._timestamp;
		this._oMonth.selectedDates = [...this._selectedDates];
		this._oMonth.primaryCalendarType = this._primaryCalendarType;
		this._oMonth.minDate = this.minDate;
		this._oMonth.maxDate = this.maxDate;
		this._header.monthText = localeData.getMonths("wide", this._primaryCalendarType)[this._month];
		this._header.yearText = oYearFormat.format(this._localDate, true);

		// month picker
		this._monthPicker.primaryCalendarType = this._primaryCalendarType;
		this._monthPicker.timestamp = this._timestamp;

		this._yearPicker.primaryCalendarType = this._primaryCalendarType;

		if (!this._isShiftingYears) {
			// year picker
			this._yearPicker.timestamp = this._timestamp;
		}

		this._isShiftingYears = false;

		this._refreshNavigationButtonsState();
	}

	_refreshNavigationButtonsState() {
		const minDateParsed = this.minDate && this.getFormat().parse(this.minDate);
		const maxDateParsed = this.maxDate && this.getFormat().parse(this.maxDate);
		let currentMonth = 0;
		let currentYear = 1;

		currentMonth = this.timestamp && CalendarDate.fromTimestamp(this.timestamp * 1000).getMonth();
		currentYear = this.timestamp && CalendarDate.fromTimestamp(this.timestamp * 1000).getYear();

		if (!this._oMonth._hidden) {
			if (this.minDate
				&& minDateParsed.getMonth() === currentMonth
				&& minDateParsed.getFullYear() === currentYear) {
				this._header._isPrevButtonDisabled = true;
			} else {
				this._header._isPrevButtonDisabled = false;
			}

			if (this.maxDate
				&& maxDateParsed.getMonth() === currentMonth
				&& maxDateParsed.getFullYear() === currentYear) {
				this._header._isNextButtonDisabled = true;
			} else {
				this._header._isNextButtonDisabled = false;
			}
		}

		if (!this._monthPicker._hidden) {
			if (this.minDate
				&& currentYear === minDateParsed.getFullYear()) {
				this._header._isPrevButtonDisabled = true;
			} else {
				this._header._isPrevButtonDisabled = false;
			}

			if (this.maxDate
				&& currentYear === maxDateParsed.getFullYear()) {
				this._header._isNextButtonDisabled = true;
			} else {
				this._header._isNextButtonDisabled = false;
			}
		}

		if (!this._yearPicker._hidden) {
			const cellsFromTheStart = 7;
			const cellsToTheEnd = 12;

			currentYear = this._yearPicker.timestamp && CalendarDate.fromTimestamp(this._yearPicker.timestamp * 1000).getYear();
			if (this.minDate
				&& (currentYear - minDateParsed.getFullYear()) < cellsFromTheStart) {
				this._header._isPrevButtonDisabled = true;
			} else {
				this._header._isPrevButtonDisabled = false;
			}

			if (this.maxDate
				&& (maxDateParsed.getFullYear() - currentYear) < cellsToTheEnd) {
				this._header._isNextButtonDisabled = true;
			} else {
				this._header._isNextButtonDisabled = false;
			}
		}
	}

	get _timestamp() {
		return this.timestamp !== undefined ? this.timestamp : Math.floor(new Date().getTime() / 1000);
	}

	get _localDate() {
		return new Date(this._timestamp * 1000);
	}

	get _calendarDate() {
		return CalendarDate.fromTimestamp(this._localDate.getTime(), this._primaryCalendarType);
	}

	get _month() {
		return this._calendarDate.getMonth();
	}

	get _primaryCalendarType() {
		const localeData = getCachedLocaleDataInstance(getLocale());
		return this.primaryCalendarType || getCalendarType() || localeData.getPreferredCalendarType();
	}

	get _formatPattern() {
		return this.formatPattern || "medium"; // get from config
	}

	get _isPattern() {
		return this._formatPattern !== "medium" && this._formatPattern !== "short" && this._formatPattern !== "long";
	}

	get _selectedDates() {
		return this.selectedDates || [];
	}

	get _maxDate() {
		return this.maxDate ? this._getTimeStampFromString(this.maxDate) : this._getMaxCalendarDate();
	}

	get _minDate() {
		return this.minDate ? this._getTimeStampFromString(this.minDate) : this._getMinCalendarDate();
	}

	_getTimeStampFromString(value) {
		const jsDate = this.getFormat().parse(value);
		if (jsDate) {
			return CalendarDate.fromLocalJSDate(jsDate, this._primaryCalendarType).toUTCJSDate().valueOf();
		}
		return undefined;
	}

	_getMinCalendarDate() {
		const minDate = new CalendarDate(1, 0, 1, this._primaryCalendarType);
		minDate.setYear(1);
		minDate.setMonth(0);
		minDate.setDate(1);
		return minDate.valueOf();
	}

	_getMaxCalendarDate() {
		const maxDate = new CalendarDate(1, 0, 1, this._primaryCalendarType);
		maxDate.setYear(9999);
		maxDate.setMonth(11);
		const tempDate = new CalendarDate(maxDate, this._primaryCalendarType);
		tempDate.setDate(1);
		tempDate.setMonth(tempDate.getMonth() + 1, 0);
		maxDate.setDate(tempDate.getDate());// 31st for Gregorian Calendar
		return maxDate.valueOf();
	}

	_onkeydown(event) {
		if (isF4(event) && this._monthPicker._hidden) {
			this._showMonthPicker();
			if (!this._yearPicker._hidden) {
				this._hideYearPicker();
			}
		}

		if (isF4Shift(event) && this._yearPicker._hidden) {
			this._showYearPicker();
			if (!this._monthPicker._hidden) {
				this._hideMonthPicker();
			}
		}
	}

	_handleSelectedDatesChange(event) {
		this.selectedDates = [...event.detail.dates];

		this.fireEvent("selected-dates-change", { dates: event.detail.dates });
	}

	_handleMonthNavigate(event) {
		this.timestamp = event.detail.timestamp;
	}

	_handleYearNavigate(event) {
		if (event.detail.start) {
			this._handlePrevious();
		}

		if (event.detail.end) {
			this._handleNext();
		}
	}

	_handleSelectedMonthChange(event) {
		const oNewDate = this._calendarDate;
		const newMonthIndex = CalendarDate.fromTimestamp(
			event.detail.timestamp * 1000,
			this._primaryCalendarType
		).getMonth();

		oNewDate.setMonth(newMonthIndex);
		this.timestamp = oNewDate.valueOf() / 1000;

		this._hideMonthPicker();

		this._focusFirstDayOfMonth(oNewDate);
	}

	_focusFirstDayOfMonth(targetDate) {
		let fistDayOfMonthIndex = -1;

		// focus first day of the month
		const dayPicker = this.shadowRoot.querySelector("[ui5-daypicker]");

		dayPicker._getVisibleDays(targetDate).forEach((date, index) => {
			if (date.getDate() === 1 && (fistDayOfMonthIndex === -1)) {
				fistDayOfMonthIndex = index;
			}
		});

		dayPicker._itemNav.currentIndex = fistDayOfMonthIndex;
		dayPicker._itemNav.focusCurrent();
	}

	_handleSelectedYearChange(event) {
		const oNewDate = CalendarDate.fromTimestamp(
			event.detail.timestamp * 1000,
			this._primaryCalendarType
		);
		oNewDate.setMonth(0);
		oNewDate.setDate(1);

		this.timestamp = oNewDate.valueOf() / 1000;

		this._hideYearPicker();

		this._focusFirstDayOfMonth(oNewDate);
	}

	_handleMonthButtonPress() {
		this._hideYearPicker();
		this._header._isMonthButtonHidden = true;

		this[`_${this._monthPicker._hidden ? "show" : "hide"}MonthPicker`]();
	}

	_handleYearButtonPress() {
		this._hideMonthPicker();

		this[`_${this._yearPicker._hidden ? "show" : "hide"}YearPicker`]();
	}

	_handlePrevious() {
		if (this._monthPicker._hidden && this._yearPicker._hidden) {
			this._showPrevMonth();
		} else if (this._monthPicker._hidden && !this._yearPicker._hidden) {
			this._showPrevPageYears();
		} else if (!this._monthPicker._hidden && this._yearPicker._hidden) {
			this._showPrevYear();
		}
	}

	_handleNext() {
		if (this._monthPicker._hidden && this._yearPicker._hidden) {
			this._showNextMonth();
		} else if (this._monthPicker._hidden && !this._yearPicker._hidden) {
			this._showNextPageYears();
		} else if (!this._monthPicker._hidden && this._yearPicker._hidden) {
			this._showNextYear();
		}
	}

	_showNextMonth() {
		const nextMonth = this._calendarDate;
		const maxCalendarDateYear = CalendarDate.fromTimestamp(this._getMaxCalendarDate(), this._primaryCalendarType).getYear();
		nextMonth.setDate(1);
		nextMonth.setMonth(nextMonth.getMonth() + 1);

		if (nextMonth.getYear() > maxCalendarDateYear) {
			return;
		}

		if (!this.isInValidRange(nextMonth.toLocalJSDate().valueOf())) {
			return;
		}

		this._focusFirstDayOfMonth(nextMonth);
		this.timestamp = nextMonth.valueOf() / 1000;
	}

	_showPrevMonth() {
		let iNewMonth = this._month - 1,
			iNewYear = this._calendarDate.getYear();

		const minCalendarDateYear = CalendarDate.fromTimestamp(this._getMinCalendarDate(), this._primaryCalendarType).getYear();

		// focus first day of the month
		const dayPicker = this.shadowRoot.querySelector("[ui5-daypicker]");
		const currentMonthDate = dayPicker._calendarDate.setMonth(dayPicker._calendarDate.getMonth());
		const lastMonthDate = dayPicker._calendarDate.setMonth(dayPicker._calendarDate.getMonth() - 1);

		// set the date to last day of last month
		currentMonthDate.setDate(-1);

		// find the index of the last day
		let lastDayOfMonthIndex = -1;

		if (!this.isInValidRange(currentMonthDate.toLocalJSDate().valueOf())) {
			return;
		}

		dayPicker._getVisibleDays(lastMonthDate).forEach((date, index) => {
			const isSameDate = currentMonthDate.getDate() === date.getDate();
			const isSameMonth = currentMonthDate.getMonth() === date.getMonth();

			if (isSameDate && isSameMonth) {
				lastDayOfMonthIndex = (index + 1);
			}
		});

		const weekDaysCount = 7;

		if (lastDayOfMonthIndex !== -1) {
			// find the DOM for the last day index
			const lastDay = dayPicker.shadowRoot.querySelector(".ui5-dp-content").children[parseInt(lastDayOfMonthIndex / weekDaysCount) + 1].children[(lastDayOfMonthIndex % weekDaysCount)];

			// update current item in ItemNavigation
			dayPicker._itemNav.current = lastDayOfMonthIndex;

			// focus the item
			lastDay.focus();
		}

		if (iNewMonth > 11) {
			iNewMonth = 0;
			iNewYear = this._calendarDate.getYear() + 1;
		}

		if (iNewMonth < 0) {
			iNewMonth = 11;
			iNewYear = this._calendarDate.getYear() - 1;
		}

		const oNewDate = this._calendarDate;
		oNewDate.setYear(iNewYear);
		oNewDate.setMonth(iNewMonth);


		if (oNewDate.getYear() < minCalendarDateYear) {
			return;
		}
		this.timestamp = oNewDate.valueOf() / 1000;
	}

	_showNextYear() {
		const maxCalendarDateYear = CalendarDate.fromTimestamp(this._getMaxCalendarDate(), this._primaryCalendarType).getYear();
		if (this._calendarDate.getYear() === maxCalendarDateYear) {
			return;
		}

		const newDate = this._calendarDate;
		newDate.setYear(this._calendarDate.getYear() + 1);

		this.timestamp = newDate.valueOf() / 1000;
	}

	_showPrevYear() {
		const minCalendarDateYear = CalendarDate.fromTimestamp(this._getMinCalendarDate(), this._primaryCalendarType).getYear();
		if (this._calendarDate.getYear() === minCalendarDateYear) {
			return;
		}

		const oNewDate = this._calendarDate;
		oNewDate.setYear(this._calendarDate.getYear() - 1);

		this.timestamp = oNewDate.valueOf() / 1000;
	}

	_showNextPageYears() {
		if (!this._isYearInRange(this._yearPicker.timestamp,
			YearPicker._ITEMS_COUNT - YearPicker._MIDDLE_ITEM_INDEX,
			CalendarDate.fromTimestamp(this._minDate, this._primaryCalendarType).getYear(),
			CalendarDate.fromTimestamp(this._maxDate, this._primaryCalendarType).getYear())) {
			return;
		}

		const newDate = CalendarDate.fromTimestamp(this._yearPicker.timestamp * 1000, this._primaryCalendarType);
		newDate.setYear(newDate.getYear() + YearPicker._ITEMS_COUNT);

		this._yearPicker = Object.assign({}, this._yearPicker, {
			timestamp: newDate.valueOf() / 1000,
		});

		this.timestamp = this._yearPicker.timestamp;

		this._isShiftingYears = true;
	}

	_showPrevPageYears() {
		if (!this._isYearInRange(this._yearPicker.timestamp,
			-YearPicker._MIDDLE_ITEM_INDEX - 1,
			CalendarDate.fromTimestamp(this._minDate, this._primaryCalendarType).getYear(),
			CalendarDate.fromTimestamp(this._maxDate, this._primaryCalendarType).getYear())) {
			return;
		}

		const newDate = CalendarDate.fromTimestamp(this._yearPicker.timestamp * 1000, this._primaryCalendarType);
		newDate.setYear(newDate.getYear() - YearPicker._ITEMS_COUNT);

		this._yearPicker = Object.assign({}, this._yearPicker, {
			timestamp: newDate.valueOf() / 1000,
		});

		this.timestamp = this._yearPicker.timestamp;

		this._isShiftingYears = true;
	}

	_showMonthPicker() {
		this._monthPicker = Object.assign({}, this._monthPicker);
		this._oMonth = Object.assign({}, this._oMonth);

		this._monthPicker.timestamp = this._timestamp;
		this._monthPicker._hidden = false;
		this._oMonth._hidden = true;

		const calendarRect = this.shadowRoot.querySelector(".ui5-cal-root").getBoundingClientRect();

		this._calendarWidth = calendarRect.width.toString();
		this._calendarHeight = calendarRect.height.toString();
		this._header._isMonthButtonHidden = true;
	}

	_showYearPicker() {
		this._yearPicker = Object.assign({}, this._yearPicker);
		this._oMonth = Object.assign({}, this._oMonth);

		this._yearPicker.timestamp = this._timestamp;
		this._yearPicker._selectedYear = this._calendarDate.getYear();
		this._yearPicker._hidden = false;
		this._oMonth._hidden = true;

		const calendarRect = this.shadowRoot.querySelector(".ui5-cal-root").getBoundingClientRect();

		this._calendarWidth = calendarRect.width.toString();
		this._calendarHeight = calendarRect.height.toString();
	}

	_hideMonthPicker() {
		this._monthPicker = Object.assign({}, this._monthPicker);
		this._oMonth = Object.assign({}, this._oMonth);

		if (this._yearPicker._hidden) {
			this._oMonth._hidden = false;
		}
		this._monthPicker._hidden = true;
		this._header._isMonthButtonHidden = false;
	}

	_hideYearPicker() {
		this._yearPicker = Object.assign({}, this._yearPicker);
		this._oMonth = Object.assign({}, this._oMonth);

		if (this._monthPicker._hidden) {
			this._oMonth._hidden = false;
		}
		this._yearPicker._hidden = true;
	}

	_isYearInRange(timestamp, yearsoffset, minYear, maxYear) {
		if (timestamp) {
			const oCalDate = CalendarDate.fromTimestamp(timestamp * 1000, this._primaryCalendarType);
			oCalDate.setMonth(0);
			oCalDate.setDate(1);
			oCalDate.setYear(oCalDate.getYear() + yearsoffset);
			return oCalDate.getYear() >= minYear && oCalDate.getYear() <= maxYear;
		}
	}

	get classes() {
		return {
			main: {
				"ui5-cal-root": true,
			},
			dayPicker: {
				".ui5-daypicker--hidden": !this._yearPicker._hidden || !this._monthPicker._hidden,
			},
			yearPicker: {
				"ui5-yearpicker--hidden": this._yearPicker._hidden,
			},
			monthPicker: {
				"ui5-monthpicker--hidden": this._monthPicker._hidden,
			},
		};
	}

	/**
	 * Checks if a date is in range between minimum and maximum date
	 * @param {object} value
	 * @public
	 */
	isInValidRange(value = "") {
		const pickedDate = CalendarDate.fromTimestamp(value).toLocalJSDate(),
			minDate = this._minDate && new Date(this._minDate),
			maxDate = this._maxDate && new Date(this._maxDate);

		if (minDate && maxDate) {
			if (minDate <= pickedDate && maxDate >= pickedDate) {
				return true;
			}
		} else if (minDate && !maxDate) {
			if (minDate <= pickedDate) {
				return true;
			}
		} else if (maxDate && !minDate) {
			if (maxDate >= pickedDate) {
				return true;
			}
		} else if (!maxDate && !minDate) {
			return true;
		}

		return false;
	}

	getFormat() {
		if (this._isPattern) {
			this._oDateFormat = DateFormat.getInstance({
				pattern: this._formatPattern,
				calendarType: this._primaryCalendarType,
			});
		} else {
			this._oDateFormat = DateFormat.getInstance({
				style: this._formatPattern,
				calendarType: this._primaryCalendarType,
			});
		}
		return this._oDateFormat;
	}

	get styles() {
		return {
			main: {
				"height": `${this._calendarHeight ? `${this._calendarHeight}px` : "auto"}`,
				"width": `${this._calendarWidth ? `${this._calendarWidth}px` : "auto"}`,
			},
		};
	}

	static get dependencies() {
		return [
			CalendarHeader,
			DayPicker,
			MonthPicker,
			YearPicker,
		];
	}

	static async onDefine() {
		await fetchCldr(getLocale().getLanguage(), getLocale().getRegion(), getLocale().getScript());
	}
}

Calendar.define();

export default Calendar;
