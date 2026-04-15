import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { InlineKeyboard } from 'grammy';

const getFormattedDays = () => {
	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const date = addDays(new Date(), i);
		return {
			label: format(date, 'dd.MM', { locale: ru }),
			value: format(date, 'dd.MM.yyyy', { locale: ru })
		};
	});
	return weekDays;
};

export const createInlineKeyboardWithDates = () => {
	const weekDays = getFormattedDays();
	let keyboard = new InlineKeyboard();
	weekDays.forEach((day) => {
		keyboard = keyboard.text(day.label, day.value);
	});
	return keyboard;

};