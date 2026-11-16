jest.mock('../models', () => ({
  Event: { findByPk: jest.fn(), update: jest.fn() },
  Team: { findOne: jest.fn() },
  User: {},
  sequelize: {},
}));
jest.mock('../services/criteriaService', () => ({}));

const { ForeignKeyConstraintError } = require('sequelize');
const { Event, Team } = require('../models');
const eventService = require('../services/eventService');

const EVENT_ID = 'e0000000-0000-4000-8000-000000000001';
const TEAM_ID = 't0000000-0000-4000-8000-000000000001';

describe('eventService.selectWinner', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('updates winner_team_id and returns { id, winner_team_id } when event and team exist', async () => {
    Event.findByPk.mockResolvedValue({ id: EVENT_ID });
    Team.findOne.mockResolvedValue({ id: TEAM_ID });
    Event.update.mockResolvedValue([1]);

    const result = await eventService.selectWinner(EVENT_ID, TEAM_ID);

    expect(result).toEqual({ id: EVENT_ID, winner_team_id: TEAM_ID });
    expect(Event.update).toHaveBeenCalledWith(
      { winner_team_id: TEAM_ID },
      { where: { id: EVENT_ID } }
    );
  });

  it('is idempotent: selecting the same team twice succeeds both times', async () => {
    Event.findByPk.mockResolvedValue({ id: EVENT_ID });
    Team.findOne.mockResolvedValue({ id: TEAM_ID });
    Event.update.mockResolvedValue([1]);

    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).resolves.toEqual({ id: EVENT_ID, winner_team_id: TEAM_ID });
    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).resolves.toEqual({ id: EVENT_ID, winner_team_id: TEAM_ID });
  });

  it('throws 404 "Event not found" and does not update when the event is missing', async () => {
    Event.findByPk.mockResolvedValue(null);

    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).rejects.toMatchObject({
      status: 404,
      message: 'Event not found',
    });
    expect(Team.findOne).not.toHaveBeenCalled();
    expect(Event.update).not.toHaveBeenCalled();
  });

  it('throws 404 "Team not found" when the team is missing or in another event, scoping the lookup to the event', async () => {
    Event.findByPk.mockResolvedValue({ id: EVENT_ID });
    Team.findOne.mockResolvedValue(null);

    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).rejects.toMatchObject({
      status: 404,
      message: 'Team not found',
    });
    expect(Team.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: TEAM_ID, event_id: EVENT_ID } })
    );
    expect(Event.update).not.toHaveBeenCalled();
  });

  it('maps a foreign key error (team deleted mid-request) to 404 "Team not found"', async () => {
    Event.findByPk.mockResolvedValue({ id: EVENT_ID });
    Team.findOne.mockResolvedValue({ id: TEAM_ID });
    Event.update.mockRejectedValue(new ForeignKeyConstraintError({}));

    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).rejects.toMatchObject({
      status: 404,
      message: 'Team not found',
    });
  });

  it('rethrows other database errors unchanged', async () => {
    const dbError = new Error('connection lost');
    Event.findByPk.mockResolvedValue({ id: EVENT_ID });
    Team.findOne.mockResolvedValue({ id: TEAM_ID });
    Event.update.mockRejectedValue(dbError);

    await expect(eventService.selectWinner(EVENT_ID, TEAM_ID)).rejects.toBe(dbError);
  });
});
