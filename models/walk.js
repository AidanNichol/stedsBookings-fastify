let { format, parseISO } = require('date-fns');
const { DataTypes } = require('sequelize');
// const Op = sequelize.Sequelize.Op;
const today = () => format(new Date(), 'yyyy-MM-dd');
const now = () => format(new Date(), 'yyyy-MM-ddTHH:mm:ss.SSS');
const Walk = {
  walkId: {
    allowNull: false,
    // autoIncrement: true,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  capacity: DataTypes.NUMBER,
  closed: { type: DataTypes.BOOLEAN },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  fee: DataTypes.NUMBER,
  firstBooking: DataTypes.STRING,
  lastCancel: DataTypes.STRING,
  venue: DataTypes.STRING,
  shortCode: DataTypes.STRING,
  bookable: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.firstBooking <= today() && !this.closed;
    },
  },
  longName: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.venue || '').split('-', 2)[0].replace(/\(.*\)/, '');
    },
  },
  walkDate: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.walkId || '').substr(1);
    },
  },
  displayDate: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.walkId) return '';
      const tdat = parseISO(this.walkId.substr(1));
      return format(tdat, 'dd MMM');
    },
  },
  isLateCancel: {
    type: DataTypes.VIRTUAL,
    get() {
      return now() > this.lastCancel;
    },
  },
  shortName: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.venue || '').split(/[ -]/, 2)[0];
    },
  },
};

module.exports = Walk;
