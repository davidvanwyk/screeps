import StateMachine from "@taoqf/javascript-state-machine";

export enum HarvesterState {
  SPAWNING,
  HARVESTING,
  DEPOSITING,
  UPGRADING
}

export class Harvester {

  // ---------- Constant Settings/Parameters ------------- //

  _harvest_text: string = '🔄 harvest';
  _harvest_route_colour = '#aaff00';

  _deposit_text: string = '🔄 deposit';
  _deposit_route_colour = '#ffffff';

  _upgrade_text: string = '🚧 upgrade';
  _upgrade_route_colour = '#ffaa00';

  // ----------------------------------------------------- //

  // --------------- FSM Implementation ------------------ //

  public run(creep: Creep) {

    // Our harvester creep should either be harvesting, depositing or upgrading the room controller, in that order of
    // precedence.

    if(!creep.memory.state) {
      creep.memory.state = HarvesterState.SPAWNING;
    }

    switch(creep.memory.state) {
      // FSM of the Harvester Type Creep

      case HarvesterState.SPAWNING:
        // On spawn, immediately start harvesting.
        this.transitionFromSpawningToHarvesting(creep);
        break;

      case HarvesterState.HARVESTING:
        // Harvesting takes first priority so is our first check.
        if (this.shouldHarvest(creep)) {
          this.moveToHarvest(creep);
        } else if (this.shouldDeposit(creep)) {
          this.transitionFromHarvestingToDepositing(creep);
        } else {
          this.transitionFromHarvestingToUpgrading(creep);
        }
        break;

      case HarvesterState.DEPOSITING:
        // In this state, depositing is our first priority (we won't have lost any resources), so is our first check.
        if (this.shouldDeposit(creep)) {
          this.moveToDeposit(creep);
        } else if (this.shouldHarvest(creep)) {
          this.transitionFromAnyToHarvesting(creep);
        } else {
          this.transitionFromDepositingToUpgrading(creep);
        }
        break;

      case HarvesterState.UPGRADING:
        // In this state, upgrading is our last priority, so is our last check as we would rather switch to depositing
        // or harvesting if possible.
        if (this.shouldDeposit(creep)) {
          this.transitionFromUpgradingToDepositing(creep);
        } else if (this.shouldHarvest(creep)) {
          this.transitionFromAnyToHarvesting(creep);
        } else {
          this.moveToUpgrade(creep);
        }
        break;

    }

  }

  // Transition Functions

  private transitionFromSpawningToHarvesting(creep: Creep) {
    creep.memory.state = HarvesterState.HARVESTING;
    creep.say(this._harvest_text);
  }

  private transitionFromHarvestingToDepositing(creep: Creep) {
    creep.memory.state = HarvesterState.DEPOSITING;
    creep.say(this._deposit_text);
  }

  private transitionFromHarvestingToUpgrading(creep: Creep) {
    creep.memory.state = HarvesterState.UPGRADING;
    creep.say(this._upgrade_text);
  }

  private transitionFromDepositingToUpgrading(creep: Creep) {
    creep.memory.state = HarvesterState.UPGRADING;
    creep.say(this._upgrade_text);
  }

  private transitionFromUpgradingToDepositing(creep: Creep) {
    creep.memory.state = HarvesterState.DEPOSITING;
    creep.say(this._deposit_text);
  }

  private transitionFromAnyToHarvesting(creep: Creep) {
    creep.memory.state = HarvesterState.HARVESTING;
    creep.say(this._harvest_text);
  }

  // ----------------------------------------------------- //

  // ------------------ Logic Checks --------------------- //

  private shouldHarvest(creep: Creep) {
    // Should harvest if we have free capacity.
    return creep.store.getFreeCapacity() != 0;
  }

  private shouldDeposit(creep: Creep) {
    // Check if our creep should deposit resources
    // This should happen if it has no capacity, and if there are locations to deposit into.
    const hasNoCapacity = this.hasNoCapacity(creep);
    const hasLocationsToDeposit = this.getLocationsToDepositInto(creep).length > 0;  // Should maybe only call this once.
    return hasNoCapacity && hasLocationsToDeposit;
  }

  private hasNoCapacity(creep: Creep) {
    // Check if our creep has capacity for any resources.
    return creep.store.getFreeCapacity() == 0;
  }

  // ----------------------------------------------------- //

  // ----------------- Location Parsing ------------------ //

  private getLocationsToDepositInto(creep: Creep) {
    // Check if our creep has any locations it can deposit into, and return them.
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION
          || structure.structureType == STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });
    return _.sortBy(targets,target => creep.pos.getRangeTo(target))
  }

  // ----------------------------------------------------- //

  // -------------------- Movement ----------------------- //

  private moveToHarvest(creep: Creep) {
    const closest_source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if(closest_source) {
      if(creep.harvest(closest_source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(closest_source, {
          visualizePathStyle: {
            stroke: this._harvest_route_colour
          }
        });
      }
    }
  }

  private moveToDeposit(creep: Creep) {
    const targets = this.getLocationsToDepositInto(creep);
    if (targets.length > 0) {
      if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {
          visualizePathStyle: {
            stroke: this._deposit_route_colour
          }
        });
      }
    }
  }

  private moveToUpgrade(creep: Creep) {
    const controller = creep.room.controller;
    // move my creep to the controller and upgrade it, if it exists
    if (controller) {
      if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, {
          visualizePathStyle: {
            stroke: this._upgrade_route_colour
          }
        });
      }
    }
  }

  // ----------------------------------------------------- //

  // ----------- Associated Static Functions ------------- //

  static calculateHarvesterBody(room: Room) {

  }

  // ----------------------------------------------------- //

}
