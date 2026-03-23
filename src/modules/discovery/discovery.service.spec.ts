import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverySource } from '../../common/enums/discovery-source.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscoverInput, DiscoveryService } from './discovery.service';

const mockCharacter = {
  id: 1,
  name: 'TestChar',
  world: 'Calmera',
  isConfirmedWorld: false,
  discoverySource: DiscoverySource.OnlineList,
  firstSeenAt: new Date(),
  lastSeenAt: new Date(),
  lastSeenOnlineAt: null,
  lastProfileScanAt: null,
  isActiveCandidate: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  character: {
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  discoveryEdge: {
    create: jest.fn(),
  },
};

describe('DiscoveryService', () => {
  let service: DiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
    jest.clearAllMocks();
  });

  describe('discover()', () => {
    const input: DiscoverInput = {
      characterName: 'TestChar',
      world: 'Calmera',
      source: DiscoverySource.OnlineList,
    };

    it('upserts character with correct create payload', async () => {
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover(input);

      expect(mockPrisma.character.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.character.upsert.mock.calls[0][0];
      expect(call.where).toEqual({
        name_world: { name: 'TestChar', world: 'Calmera' },
      });
      expect(call.create).toMatchObject({
        name: 'TestChar',
        world: 'Calmera',
        isConfirmedWorld: false,
        isActiveCandidate: true,
        discoverySource: DiscoverySource.OnlineList,
      });
    });

    it('always creates a discovery_edge regardless of character existence', async () => {
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover(input);
      await service.discover(input);

      expect(mockPrisma.discoveryEdge.create).toHaveBeenCalledTimes(2);
    });

    it('sets lastSeenOnlineAt when seenOnlineAt is provided', async () => {
      const seenOnlineAt = new Date('2024-01-01T10:00:00Z');
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover({ ...input, seenOnlineAt });

      const call = mockPrisma.character.upsert.mock.calls[0][0];
      expect(call.create.lastSeenOnlineAt).toEqual(seenOnlineAt);
      expect(call.update.lastSeenOnlineAt).toEqual(seenOnlineAt);
    });

    it('does not set lastSeenOnlineAt when seenOnlineAt is absent', async () => {
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover(input);

      const call = mockPrisma.character.upsert.mock.calls[0][0];
      expect(call.create.lastSeenOnlineAt).toBeUndefined();
      expect(call.update.lastSeenOnlineAt).toBeUndefined();
    });

    it('uses sourceKey in discovery_edge when provided', async () => {
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover({
        ...input,
        sourceKey: 'highscores:experience:page1',
      });

      expect(mockPrisma.discoveryEdge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceKey: 'highscores:experience:page1',
        }),
      });
    });

    it('falls back to source as sourceKey when sourceKey is absent', async () => {
      mockPrisma.character.upsert.mockResolvedValue(mockCharacter);
      mockPrisma.discoveryEdge.create.mockResolvedValue({});

      await service.discover(input);

      expect(mockPrisma.discoveryEdge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceKey: DiscoverySource.OnlineList,
        }),
      });
    });
  });

  describe('confirmWorld()', () => {
    it('sets isConfirmedWorld = true and updates lastProfileScanAt', async () => {
      mockPrisma.character.update.mockResolvedValue(mockCharacter);

      await service.confirmWorld('TestChar', 'Calmera');

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { name_world: { name: 'TestChar', world: 'Calmera' } },
        data: expect.objectContaining({ isConfirmedWorld: true }),
      });
      const data = mockPrisma.character.update.mock.calls[0][0].data;
      expect(data.lastProfileScanAt).toBeInstanceOf(Date);
    });
  });

  describe('getDiscoveryQueue()', () => {
    it('queries active candidates with unconfirmed characters first, then null-first scan date', async () => {
      mockPrisma.character.findMany.mockResolvedValue([mockCharacter]);

      const result = await service.getDiscoveryQueue('Calmera', 10);

      expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
        where: { world: 'Calmera', isActiveCandidate: true },
        orderBy: [
          { isConfirmedWorld: 'asc' },
          { lastProfileScanAt: 'asc' },
        ],
        take: 10,
      });
      expect(result).toHaveLength(1);
    });

    it('respects the limit parameter', async () => {
      mockPrisma.character.findMany.mockResolvedValue([]);

      await service.getDiscoveryQueue('Calmera', 50);

      expect(mockPrisma.character.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });
});
