class MapNode {
    constructor(id, type, floor) {
        this.id = id;
        this.type = type; // 'enemy', 'elite', 'safe', 'boss'
        this.floor = floor; // How deep into the map this is (0 to max)
        this.connectedNodes = []; // IDs of nodes you can travel to next
        this.completed = false; // Has the player beaten this node?
    }
}

class MapGenerator {
    constructor(floors) {
        this.totalFloors = floors;
        this.nodes = {}; // Dictionary of all nodes by ID
        this.floorNodes = []; // Array of Arrays [ [nodes on floor 0], [nodes on floor 1] ]
    }

    generate() {
        this.nodes = {};
        this.floorNodes = [];

        // Generate nodes per floor
        for (let f = 0; f < this.totalFloors; f++) {
            this.floorNodes[f] = [];

            // Determine number of nodes on this floor (1 to 3)
            // The boss is always 1 node on the final floor
            let numNodes = (f === this.totalFloors - 1) ? 1 : Math.floor(Math.random() * 3) + 2; // 2 to 4 paths

            for (let n = 0; n < numNodes; n++) {
                let type = 'enemy';

                if (f === this.totalFloors - 1) {
                    type = 'boss';
                } else if (f > 0) {
                    // Randomize types somewhat based on floor depth
                    const roll = Math.random();
                    if (roll < 0.15) type = 'safe';
                    else if (roll < 0.3 && f > 2) type = 'elite';
                }

                const id = `node_${f}_${n}`;
                const node = new MapNode(id, type, f);
                this.nodes[id] = node;
                this.floorNodes[f].push(id);
            }
        }

        // Connect floors
        for (let f = 0; f < this.totalFloors - 1; f++) {
            const currentFloorIds = this.floorNodes[f];
            const nextFloorIds = this.floorNodes[f + 1];

            // Ensure every node on current floor connects to at least one node on next floor
            currentFloorIds.forEach(id => {
                const targetId = nextFloorIds[Math.floor(Math.random() * nextFloorIds.length)];
                this.nodes[id].connectedNodes.push(targetId);
            });

            // Make sure no node on the next floor is orphaned (unreachable)
            nextFloorIds.forEach(nextId => {
                // If no node on the current floor connects to here
                let hasConnection = currentFloorIds.some(currId => this.nodes[currId].connectedNodes.includes(nextId));
                if (!hasConnection) {
                    // Pick a random node from the previous floor and force a connection
                    const forceId = currentFloorIds[Math.floor(Math.random() * currentFloorIds.length)];
                    if (!this.nodes[forceId].connectedNodes.includes(nextId)) {
                        this.nodes[forceId].connectedNodes.push(nextId);
                    }
                }
            });
        }
    }

    getSelectableStartNodes() {
        return this.floorNodes[0].map(id => this.nodes[id]);
    }
}
