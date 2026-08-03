import { startStimulusApp } from '@symfony/stimulus-bundle';
import BookingFormController from './controllers/booking_form_controller.js';
import CalendarController from './controllers/calendar_controller.js';
import DayScheduleController from './controllers/day_schedule_controller.js';
import DayViewController from './controllers/day_view_controller.js';
import QuickBookingController from './controllers/quick_booking_controller.js';
import QuickBookingFormController from './controllers/quick_booking_form_controller.js';
import RoomBookingHomeController from './controllers/room_booking_home_controller.js';
import RoomSelectionController from './controllers/room_selection_controller.js';
import TelegramController from './controllers/telegram_controller.js';

const app = startStimulusApp();

app.register('booking-form', BookingFormController);
app.register('calendar', CalendarController);
app.register('day-schedule', DayScheduleController);
app.register('day-view', DayViewController);
app.register('quick-booking', QuickBookingController);
app.register('quick-booking-form', QuickBookingFormController);
app.register('room-booking-home', RoomBookingHomeController);
app.register('room-selection', RoomSelectionController);
app.register('telegram', TelegramController);
