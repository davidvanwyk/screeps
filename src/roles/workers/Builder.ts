import { Harvester } from './Harvester';
import { WorkerState } from './worker_states';

export class Builder extends Harvester {

  // ---------- Constant Settings/Parameters ------------- //

  _build_text: string = '🔨 build';
  _build_route_colour = '#aa9900';

  // ----------------------------------------------------- //

  // --------------- FSM Implementation ------------------ //

  public run(creep: Creep) {

    // Our harvester creep should either be harvesting, depositing or upgrading the room controller, in that order of
    // precedence.

    if(!creep.memory.state) {
      creep.memory.state = WorkerState.SPAWNING;
    }

    switch(creep.memory.state) {
      // FSM of the Builder Type Creep

      case WorkerState.SPAWNING:
        // On spawn, immediately start harvesting resources to be able to build.
        this.transitionFromSpawningToHarvesting(creep);
        break;

      case WorkerState.BUILDING:
        // On spawn, immediately start harvesting.
        if (this.shouldBuild(creep)) {
          // Move to build site
          this.moveToBuilding(creep);
        } else {
          // Otherwise transition to harvesting (which can handle sub-transitions)
          this.transitionFromAnyToHarvesting(creep);
        }
        break;

      default:
        // This is a builder, so building should be the first priority.
        if (this.shouldStartBuilding(creep)) {
          this.transitionFromAnyToBuilding(creep);
        }

    }

    super.run(creep);

  }

  // Transition Functions

  private transitionFromSpawningToBuilding(creep: Creep) {
    creep.memory.state = WorkerState.BUILDING;
    creep.say(this._build_text);
  }

  private transitionFromAnyToBuilding(creep: Creep) {
    creep.memory.state = WorkerState.BUILDING;
    creep.say(this._build_text);
  }

  // ----------------------------------------------------- //

  // ------------------ Logic Checks --------------------- //

  private shouldBuild(creep: Creep) {
    // Should we be building? Slightly different from should we start building.
    // Should continue building if there are build locations and we have resources.
    const hasResources = this.hasResources(creep);
    const hasLocationsToBuild = this.getBuildingLocations(creep).length > 0;
    return hasResources && hasLocationsToBuild;
  }

  private shouldStartBuilding(creep: Creep) {
    // Should only start building once we have full resources.
    return this.hasNoCapacity(creep);
  }

  private hasResources(creep: Creep) {
    return creep.store.getUsedCapacity() != 0;
  }

  // ----------------------------------------------------- //

  // ----------------- Location Parsing ------------------ //

  private getBuildingLocations(creep: Creep) {
    const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    return _.sortBy(targets,target => creep.pos.getRangeTo(target))
  }

  // ----------------------------------------------------- //

  // -------------------- Movement ----------------------- //

  private moveToBuilding(creep: Creep) {
    const targets = this.getBuildingLocations(creep);
    if (targets.length > 0) {
      if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {
          visualizePathStyle: {
            stroke: this._build_route_colour
          }
        });
      }
    }
  }

  // ----------------------------------------------------- //

  // ----------- Associated Static Functions ------------- //

  static calculateBuilderBody(room: Room) {

  }

  // ----------------------------------------------------- //

}
