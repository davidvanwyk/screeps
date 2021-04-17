import { ErrorMapper } from "utils/ErrorMapper";
import { Harvester } from './roles/workers/Harvester';
import { Builder } from './roles/workers/Builder';

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  const numberHarvesters = 12;
  const harvesterBody = [ WORK, CARRY, MOVE, MOVE ];

  const harvesterRole = new Harvester();
  const builderRole = new Builder();

  const creeps = Game.creeps;
  const num_creeps = Object.keys(creeps).length;
  const energy_per_tick_per_worker_body = 2;
  let worker_body_parts = 0;

  if (num_creeps > 0) {
    for(let name in creeps) {
      let creep = Game.creeps[name];
      if(creep.memory.role == 'harvester') {
        const body_parts = _.countBy(creep.body.map(bodyParts => bodyParts.type));
        worker_body_parts += body_parts[WORK];
        harvesterRole.run(creep);
      } else if (creep.memory.role == 'builder') {
        builderRole.run(creep);
      }
    }
  }

  const total_energy_harvested_per_tick = worker_body_parts*energy_per_tick_per_worker_body;

  function calculate_energy_recovered_per_tick(source: Source) {
    return {'energy_recovered_per_tick': (source.energyCapacity - source.energy)/source.ticksToRegeneration};
  }

  const total_energy_recovered_per_tick = _(Game.rooms['W7N1'].find(FIND_SOURCES)).map(calculate_energy_recovered_per_tick).sum('energy_recovered_per_tick');

  if (numberHarvesters > num_creeps) {
    Game.spawns["Spawn1"].spawnCreep(harvesterBody, "Harvester_" + Game.time.toString(), {
      memory: {
        role: 'harvester',
      }
    });
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
