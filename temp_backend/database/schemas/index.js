const sequelize = require('../connection');
const User = require('./User');
const AdminPermission = require('./AdminPermission');
const AdminPermissionAlloted = require('./AdminPermissionAlloted');
const Club = require('./Club');
const ClubAdmin = require('./ClubAdmin');
const Location = require('./Location');
const Event = require('./Event');
const EventCategory = require('./EventCategory');
const EventCategoryAlloted = require('./EventCategoryAlloted');
const EventUpdate = require('./EventUpdate');
const Reminder = require('./Reminder');
const UserNotPreferredCategory = require('./UserNotPreferredCategory');
const UserNotPreferredClub = require('./UserNotPreferredClub');
const UserPreferredCategory = require('./UserPreferredCategory');
const UserPreferredClub = require('./UserPreferredClub');

// ─── Associations ────────────────────────────────────────────────────────────

// AdminPermission <-> User (through AdminPermissionAlloted)
AdminPermission.belongsToMany(User, { through: AdminPermissionAlloted, foreignKey: 'admin_permission_id' });
User.belongsToMany(AdminPermission, { through: AdminPermissionAlloted, foreignKey: 'user_id' });

// Club <-> User (admins, through ClubAdmin)
Club.belongsToMany(User, { through: ClubAdmin, foreignKey: 'club_id', as: 'admins' });
User.belongsToMany(Club, { through: ClubAdmin, foreignKey: 'user_id', as: 'adminOf' });

ClubAdmin.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ClubAdmin, { foreignKey: 'user_id' });

// Event -> Club
Event.belongsTo(Club, { foreignKey: 'club_id' });
Club.hasMany(Event, { foreignKey: 'club_id' });

// Event -> Location
Event.belongsTo(Location, { foreignKey: 'location_id' });
Location.hasMany(Event, { foreignKey: 'location_id' });

// EventCategory <-> Event (through EventCategoryAlloted)
EventCategory.belongsToMany(Event, { through: EventCategoryAlloted, foreignKey: 'event_category_id' });
Event.belongsToMany(EventCategory, { through: EventCategoryAlloted, foreignKey: 'event_id' });

// EventUpdate -> Event
EventUpdate.belongsTo(Event, { foreignKey: 'event_id' });
Event.hasMany(EventUpdate, { foreignKey: 'event_id' });

// Reminder -> Event, User
Reminder.belongsTo(Event, { foreignKey: 'event_id' });
Reminder.belongsTo(User, { foreignKey: 'user_id' });
Event.hasMany(Reminder, { foreignKey: 'event_id' });
User.hasMany(Reminder, { foreignKey: 'user_id' });

// UserNotPreferredCategory <-> User, EventCategory
UserNotPreferredCategory.belongsTo(User, { foreignKey: 'user_id' });
UserNotPreferredCategory.belongsTo(EventCategory, { foreignKey: 'event_category_id' });

// UserNotPreferredClub <-> User, Club
UserNotPreferredClub.belongsTo(User, { foreignKey: 'user_id' });
UserNotPreferredClub.belongsTo(Club, { foreignKey: 'club_id' });

// UserPreferredCategory <-> User, EventCategory
UserPreferredCategory.belongsTo(User, { foreignKey: 'user_id' });
UserPreferredCategory.belongsTo(EventCategory, { foreignKey: 'event_category_id' });

// UserPreferredClub <-> User, Club
UserPreferredClub.belongsTo(User, { foreignKey: 'user_id' });
UserPreferredClub.belongsTo(Club, { foreignKey: 'club_id' });

// ─── Export ──────────────────────────────────────────────────────────────────

module.exports = {
    sequelize,
    User,
    AdminPermission,
    AdminPermissionAlloted,
    Club,
    ClubAdmin,
    Location,
    Event,
    EventCategory,
    EventCategoryAlloted,
    EventUpdate,
    Reminder,
    UserNotPreferredCategory,
    UserNotPreferredClub,
    UserPreferredCategory,
    UserPreferredClub,
};