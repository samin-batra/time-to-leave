/* eslint-disable no-undef */

const Store = require('electron-store');
const { defaultPreferences } = require('../../../js/user-preferences');
const Calendar = require('../../../js/classes/Calendar');

window.$ = window.jQuery = require('jquery');

describe('Calendar class Tests', () => {
    process.env.NODE_ENV = 'test';

    const store = new Store();
    const waivedWorkdays = new Store({name: 'waived-workdays'});

    store.clear();
    const regularEntries = {
        '2020-3-1-day-begin': '08:00',
        '2020-3-1-day-end': '17:00',
        '2020-3-1-day-total': '08:00',
        '2020-3-1-lunch-begin': '12:00',
        '2020-3-1-lunch-end': '13:00',
        '2020-3-1-lunch-total': '01:00',
        '2020-3-2-day-begin': '10:00',
        '2020-3-2-day-end': '18:00',
        '2020-3-2-day-total': '08:00',
    };
    store.set(regularEntries);

    waivedWorkdays.clear();
    const waivedEntries = {
        '2019-12-31': {reason: 'New Year\'s eve', hours: '08:00'},
        '2020-01-01': {reason: 'New Year\'s Day', hours: '08:00'},
        '2020-04-10': {reason: 'Good Friday', hours: '08:00'}
    };
    waivedWorkdays.set(waivedEntries);

    const today = new Date();
    let testPreferences = defaultPreferences;
    let calendar = new Calendar(testPreferences);

    test('Calendar creates with today\'s date', () => {
        expect(calendar._today.getDate()).toBe(today.getDate());
        expect(calendar._year).toBe(today.getFullYear());
        expect(calendar._month).toBe(today.getMonth());
    });

    test('Calendar internal storage correct loading', () => {
        expect(calendar._internalStore['2020-3-1-day-begin']).toBe('08:00');
        expect(calendar._getStore(1, 3, 2020, 'day-begin')).toBe('08:00');
        expect(calendar._internalStore['2010-3-1-day-begin']).toBe(undefined);
        expect(calendar._getStore(1, 3, 2010, 'day-begin')).toBe(undefined);

        expect(Object.keys(calendar._internalStore).length).toStrictEqual(9);
        expect(store.size).toStrictEqual(9);

        calendar._setStore(1, 3, 2010, 'day-begin', '05:00');
        expect(calendar._internalStore['2010-3-1-day-begin']).toBe('05:00');
        expect(calendar._getStore(1, 3, 2010, 'day-begin')).toBe('05:00');

        expect(Object.keys(calendar._internalStore).length).toStrictEqual(10);
        expect(store.size).toStrictEqual(10);

        calendar._removeStore(1, 3, 2010, 'day-begin');
        expect(calendar._internalStore['2010-3-1-day-begin']).toBe(undefined);
        expect(calendar._getStore(1, 3, 2010, 'day-begin')).toBe(undefined);

        // remove just sets the value as undefined in internal store, if it existed
        expect(Object.keys(calendar._internalStore).length).toStrictEqual(10);
        expect(store.size).toStrictEqual(9);
    });

    test('Calendar internal waiver storage correct loading', () => {
        // Waiver Store internally saves the human month index, but the calendar methods use JS month index
        expect(calendar._internalWaiverStore['2019-12-31']).toStrictEqual({reason: 'New Year\'s eve', hours: '08:00'});
        expect(calendar._getWaiverStore(31, 11, 2019)).toStrictEqual({reason: 'New Year\'s eve', hours: '08:00'});
        expect(calendar._internalWaiverStore['2010-12-31']).toStrictEqual(undefined);
        expect(calendar._getWaiverStore(31, 11, 2010)).toStrictEqual(undefined);

        expect(waivedWorkdays.size).toStrictEqual(3);
        expect(Object.keys(calendar._internalWaiverStore).length).toStrictEqual(3);

        const newWaivedEntry = {
            '2010-12-31': {reason: 'New Year\'s eve', hours: '08:00'}
        };
        waivedWorkdays.set(newWaivedEntry);

        expect(calendar._internalWaiverStore['2010-12-31']).toStrictEqual(undefined);
        expect(calendar._getWaiverStore(31, 11, 2010)).toStrictEqual(undefined);

        calendar.loadInternalWaiveStore();

        expect(Object.keys(calendar._internalWaiverStore).length).toStrictEqual(4);

        expect(calendar._internalWaiverStore['2010-12-31']).toStrictEqual({reason: 'New Year\'s eve', hours: '08:00'});
        expect(calendar._getWaiverStore(31, 11, 2010)).toStrictEqual({reason: 'New Year\'s eve', hours: '08:00'});
    });

    test('Calendar Month Changes', () => {
        expect(calendar._month).toBe(today.getMonth());
        const expectedNextMonth = today.getMonth() + 1 === 12 ? 0 : (today.getMonth() + 1);
        const expectedPrevMonth = today.getMonth() === 0 ? 11 : (today.getMonth() - 1);

        calendar._nextMonth();
        expect(calendar._month).toBe(expectedNextMonth);
        expect(calendar._getMonth()).toBe(expectedNextMonth);

        calendar._prevMonth();
        expect(calendar._month).toBe(today.getMonth());
        expect(calendar._getMonth()).toBe(today.getMonth());

        calendar._prevMonth();
        expect(calendar._month).toBe(expectedPrevMonth);
        expect(calendar._getMonth()).toBe(expectedPrevMonth);

        calendar._goToCurrentDate();
        expect(calendar._month).toBe(today.getMonth());
        expect(calendar._getMonth()).toBe(today.getMonth());
    });

    test('Calendar Year Changes', () => {
        expect(calendar._year).toBe(today.getFullYear());
        expect(calendar._getYear()).toBe(today.getFullYear());
        const expectedNextYear = today.getFullYear() + 1;
        const expectedPrevYear = today.getFullYear() - 1;

        for (let i = 0; i < 12; i++) {
            calendar._nextMonth();
        }

        expect(calendar._month).toBe(today.getMonth());
        expect(calendar._getMonth()).toBe(today.getMonth());
        expect(calendar._year).toBe(expectedNextYear);
        expect(calendar._getYear()).toBe(expectedNextYear);

        calendar._goToCurrentDate();
        expect(calendar._year).toBe(today.getFullYear());
        expect(calendar._getYear()).toBe(today.getFullYear());

        for (let i = 0; i < 12; i++) {
            calendar._prevMonth();
        }

        expect(calendar._month).toBe(today.getMonth());
        expect(calendar._getMonth()).toBe(today.getMonth());
        expect(calendar._year).toBe(expectedPrevYear);
        expect(calendar._getYear()).toBe(expectedPrevYear);

        calendar._goToCurrentDate();
        expect(calendar._year).toBe(today.getFullYear());
        expect(calendar._getYear()).toBe(today.getFullYear());
    });
});
