import {AllLocations} from "../locationDefinitions";
import {FormatSeconds, GetRandomIntI, GetRandomItem, GetSecondsBetweenDates} from "./utils";
import {Client} from "tmi.js";
import {
    BaseLocation,
    coordKey,
    CoordKey,
    LocationCoordinate,
    LocationResourceType,
    LocationType,
    MapLocation,
    Player,
    SessionLocationData,
    SessionSaveableWorldData,
    TerrainType,
    WildernessLocationInfo
} from "../valueDefinitions";
import {GetPlayerCoordinates, LoadAllPlayers, SavePlayer} from "./playerGameUtils";
import fs from "fs";
import {MinigameType} from "./minigameUtils";
import {InventoryObject} from "../inventoryDefinitions";

export let WorldData: SessionSaveableWorldData;
let playerTravelSchedules: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
let navigationGraph: Graph;

export function CreateNewWorldData() {
    let minigameNodes: Record<CoordKey, SessionLocationData> = {};

    for (let i = 0; i < AllLocations.length; i++) {
        for (let j = 0; j < AllLocations[i].Coordinates.length; j++) {
            let valueMultiplier = 1;

            function GetRandomValueMultiplier() {
                switch (GetRandomIntI(1, 4)) {
                    case 1:
                        return 0.25;
                    case 2:
                        return 0.5;
                    case 3:
                        return 1.5;
                    case 4:
                        return 2;
                }

                console.log("ERROR: Returned a value multiplier of 1 but shouldnt be possible")
                return 1;
            }

            if(AllLocations[i].Type == LocationType.Settlement) {
                if(GetRandomIntI(1, 100) >= 90) { //10% chance for a settlement to have a special multiplier
                    valueMultiplier = GetRandomValueMultiplier();
                }
            }
            else {
                if(GetRandomIntI(1, 100) >= 95) { //5% chance for wilderness to have a special multiplier
                    valueMultiplier = GetRandomValueMultiplier();
                }
            }

            minigameNodes[coordKey(AllLocations[i].Coordinates[j].X, AllLocations[i].Coordinates[j].Y)] = {
                MineNodesLeft: GetRandomIntI(AllLocations[i].MineNodes.Min, AllLocations[i].MineNodes.Max),
                FishNodesLeft: GetRandomIntI(AllLocations[i].FishNodes.Min, AllLocations[i].FishNodes.Max),
                CookNodesLeft: GetRandomIntI(AllLocations[i].CookNodes.Min, AllLocations[i].CookNodes.Max),
                ValueMultiplier: valueMultiplier
            }
        }
    }

    WorldData = {
        LocationMinigameNodes: minigameNodes
    };
    SaveWorldData();
}

export function SaveWorldData() {
    fs.writeFileSync('worlddata.json', JSON.stringify(WorldData, null, 2));
}

export async function SetupWorldGrid() {
    const GRID_WIDTH = 32;
    const GRID_HEIGHT = 24;
    const grid: number[][] = Array.from({ length: GRID_WIDTH }, () =>
        Array.from({ length: GRID_HEIGHT }, () => 0)
    );

    for (let location of AllLocations) {
        if(location.Type == LocationType.Settlement || location.Type == LocationType.Wilderness) {
            for(let coord of location.Coordinates) {
                grid[coord.X][coord.Y] = location.NavigationCost;
            }
        }
    }

    navigationGraph = new Graph(grid);
}

export function GetLocation(name: string): MapLocation<any> | undefined {
    return AllLocations.find(x => x.Name.toLowerCase() == name.toLowerCase());
}

export function GetLocationFromCoordinate(coord: LocationCoordinate) {
    return AllLocations.find(x => x.Coordinates.some(y => y.X == coord.X && y.Y == coord.Y));
}

export function GetLocations(type?: LocationType, condition: (loc: BaseLocation) => boolean = undefined) {
    return AllLocations.filter(x => (type == undefined || x.Type == type) && (condition == undefined || condition(x)));
}

export function GetRandomLocation(type?: LocationType, condition: (loc: BaseLocation) => boolean = undefined): BaseLocation {
    let options = GetLocations(type, condition);
    return GetRandomItem(options)!;
}

export async function StartTravelToLocation(client: Client, player: Player, destinationName: string) {
    const loc = GetLocation(destinationName);
    if (!loc) throw new Error(`Unknown location: "${destinationName}"`);

    const destCoord = loc.Coordinates[0]; //Get the first coordinate for now. If we want something else, build it then

    await StartTravelToCoordinate(client, player, destCoord);
}

export async function StartTravelToCoordinate(client: Client, player: Player, coord: LocationCoordinate) {
    let location = GetLocationFromCoordinate(coord);

    let playerCoord = GetPlayerCoordinates(player);

    if(CoordinatesEqual(playerCoord, coord)) {
        if(playerTravelSchedules.has(player.Username)) {
            let timeout = playerTravelSchedules.get(player.Username)!;
            clearTimeout(timeout);
            playerTravelSchedules.delete(player.Username);
        }

        if(player.Travelling) {
            //Stop travelling, you want to go where you are
            player.TravelDestination = undefined;
            player.TravelDestinationCoordinates = undefined;
            player.TravelStartTime = undefined;
            player.TravelTimeInSeconds = undefined;
            player.Travelling = false;
            SavePlayer(player);

            await client.say(process.env.CHANNEL!, `@${player.Username}, you were already at ${player.CurrentLocation}! So you stop traveling.`);
        }
        else {
            //You're already there. Don't bother. Might need to inform player
            await client.say(process.env.CHANNEL!, `@${player.Username}, you're already at ${player.CurrentLocation}!'`);
        }
    }
    else {
        const timeToTravel = ComputeTravelSecondsFromCoords(GetPlayerCoordinates(player), coord);

        player.TravelDestination = location.Name;
        player.TravelDestinationCoordinates = coord;
        player.TravelStartTime = new Date();
        player.TravelTimeInSeconds = timeToTravel;
        player.Travelling = true;
        SavePlayer(player);

        await client.say(process.env.CHANNEL!, `@${player.Username}, you have started traveling to ${player.TravelDestination}. It will take ${FormatSeconds(timeToTravel)}.`);

        ScheduleArrivalTimer(client, player);
    }

}

export function ScheduleArrivalTimer(client: Client, player: Player) {
    if(!player.Travelling) {
        return;
    }
    let end = new Date(player.TravelStartTime!);
    end.setSeconds(end.getSeconds() + player.TravelTimeInSeconds);
    const delay = Math.max(0, GetSecondsBetweenDates(new Date(), end)) * 1000;

    if(playerTravelSchedules.has(player.Username)) {
        let timeout = playerTravelSchedules.get(player.Username)!;
        clearTimeout(timeout);
        playerTravelSchedules.delete(player.Username);
    }

    let to = setTimeout(async () => {
        if (HasArrivedToLocation(player)) {
            await FinishTravel(client, player);
        }
    }, delay + 1000);

    playerTravelSchedules.set(player.Username, to);
}

async function FinishTravel(client: Client, player: Player) {
    if(!player.Travelling) {
        return;
    }

    if(player.TravelDestination != undefined && player.TravelDestinationCoordinates != undefined) {
        player.CurrentLocation = player.TravelDestination;
        player.CurrentLocationCoordinates = player.TravelDestinationCoordinates;
    }

    let minigameNode = GetSessionFromCoordinates(player.TravelDestinationCoordinates!.X, player.TravelDestinationCoordinates!.Y);

    player.Travelling = false;
    player.TravelStartTime = undefined;
    player.TravelTimeInSeconds = undefined;
    player.TravelDestination = undefined;
    player.TravelDestinationCoordinates = undefined;

    SavePlayer(player);

    if(playerTravelSchedules.has(player.Username)) {
        playerTravelSchedules.delete(player.Username);
    }

    let text = `@${player.Username}, you have arrived at ${player.CurrentLocation}!`;

    if(minigameNode!.ValueMultiplier < 1) {
        text += ` This location is currently paying out LESS gems than usual.`
    }
    else if(minigameNode!.ValueMultiplier > 1) {
        text += ` This location is currently paying out MORE gems than usual!`
    }

    await client.say(process.env.CHANNEL!, text);
}

export function HasArrivedToLocation(player: Player): boolean {
    if (!player.Travelling || !player.TravelStartTime || player.TravelTimeInSeconds == null) return false;
    return GetTravelSecondsRemaining(player) <= 0;
}

export function GetTravelSecondsRemaining(player: Player): number {
    if (!player.Travelling) {
        return 0;
    }

    let endDate = new Date(player.TravelStartTime!);
    endDate.setSeconds(endDate.getSeconds() + player.TravelTimeInSeconds);

    return GetSecondsBetweenDates(new Date(), endDate);
}

function DistanceBetweenCoordinates(a: LocationCoordinate, b: LocationCoordinate): number {
    const dx = a.X - b.X;
    const dy = a.Y - b.Y;
    return Math.hypot(dx, dy);
}

function ComputeTravelSecondsFromCoords(
    origin: LocationCoordinate,
    destination: LocationCoordinate
): number {
    const dist = DistanceBetweenCoordinates(origin, destination);
    if (dist === 0) return 0;

    let timeScalar = 15;//25;

    return Math.max(1, Math.ceil(dist * timeScalar));
}

export function CoordinatesEqual(a: LocationCoordinate, b: LocationCoordinate): boolean {
    return a.X === b.X && a.Y === b.Y;
}

export async function SetupPlayerTravel(client: Client) {
    let allPlayers = LoadAllPlayers();
    allPlayers.forEach(player => {
        if(player.Travelling) {
            ScheduleArrivalTimer(client, player);
        }
    })
}

function GetCoordinatesAroundCoordinate(coord: LocationCoordinate, includeSelf: boolean = true): Array<LocationCoordinate> {
    let coords = [
        { X: coord.X + 1, Y: coord.Y },
        { X: coord.X, Y: coord.Y + 1 },
        { X: coord.X + 1, Y: coord.Y + 1 },
        { X: coord.X - 1, Y: coord.Y },
        { X: coord.X, Y: coord.Y - 1 },
        { X: coord.X - 1, Y: coord.Y - 1 },
        { X: coord.X + 1, Y: coord.Y - 1 },
        { X: coord.X - 1, Y: coord.Y + 1 },
    ];

    if(includeSelf) {
        coords.push(coord);
    }

    return coords;
}

export function GetLocationsAroundCoordinate(coord: LocationCoordinate): Array<MapLocation<any>> {
    let locations = [];
    let locationCoordinates: Array<LocationCoordinate> = GetCoordinatesAroundCoordinate(coord);

    for (let i = 0; i < locationCoordinates.length; i++) {
        let loc = GetLocationFromCoordinate(locationCoordinates[i]);
        if(loc !== undefined) {
            locations.push(loc);
        }
    }

    return locations;
}

export function GetWildernessLocationsAroundCoordinate(coord: LocationCoordinate): Array<{
    Location: MapLocation<WildernessLocationInfo>,
    Coordinate: LocationCoordinate
}> {
    let locations = [];
    let locationCoordinates: Array<LocationCoordinate> = GetCoordinatesAroundCoordinate(coord);

    for (let i = 0; i < locationCoordinates.length; i++) {
        let loc = GetLocationFromCoordinate(locationCoordinates[i]);
        if(loc !== undefined && (loc.Info && (loc.Info as WildernessLocationInfo).Type !== undefined)) {
            locations.push({
                Location: loc,
                Coordinate: locationCoordinates[i]
            });
        }
    }

    return locations;
}

export function GetWildernessTypesAroundCoordinate(coord: LocationCoordinate): Array<TerrainType> {
    let locations = GetLocationsAroundCoordinate(coord);

    let types: Array<TerrainType> = [];

    for (let i = 0; i < locations.length; i++) {
        let loc = locations[i];

        if(loc.Type == LocationType.Wilderness) {
            let wildernessType = (loc.Info as WildernessLocationInfo).Type;

            if(!types.includes(wildernessType)) {
                types.push(wildernessType);
            }
        }
    }

    return types;
}

export function GetSessionFromCoordinates(x: number, y: number): SessionLocationData | undefined {
    return WorldData.LocationMinigameNodes[coordKey(x, y)];
}

export function DeductMinigameNode(x: number, y: number, minigameType: MinigameType) {
    switch (minigameType) {
        case MinigameType.Fish:
            WorldData.LocationMinigameNodes[coordKey(x, y)].FishNodesLeft--;
            break;
        case MinigameType.Cook:
            WorldData.LocationMinigameNodes[coordKey(x, y)].CookNodesLeft--;
            break;
        case MinigameType.Mine:
            WorldData.LocationMinigameNodes[coordKey(x, y)].MineNodesLeft--;
            break;
    }
    SaveWorldData();
}

export function FilterObjectsByLocation(items: InventoryObject[], loc: MapLocation<WildernessLocationInfo>): InventoryObject[] {
    let terrainType = loc.Info!.Type;
    let resources = GetResourcesFromTerrain(terrainType);

    let itemOptions = items.filter(x =>
        //Get items located in this terrain
        x.TerrainsLocatedIn &&
        x.TerrainsLocatedIn.includes(terrainType) &&
        //Get items with this resource type
        x.ResourceCategories!.some(y => resources.includes(y))
    );

    return itemOptions;
}

export function GetResourcesFromTerrain(type: TerrainType): Array<LocationResourceType> {
    let options = [];
    let rareOptions = [];
    switch (type) {
        case TerrainType.Ocean:
            options = [
                LocationResourceType.SaltWater
            ];
            break;
        case TerrainType.Tundra:
            options = [
                LocationResourceType.MineralRock,
                LocationResourceType.SmallGame,
                LocationResourceType.LargeGame
            ];
            rareOptions = [
                LocationResourceType.OreRock,
            ];
            break;
        case TerrainType.Mountain:
            options = [
                LocationResourceType.OreRock,
                LocationResourceType.Crystals,
                LocationResourceType.SmallGame,
                LocationResourceType.LargeGame
            ];
            rareOptions = [
                LocationResourceType.HardWood,
            ];
            break;
        case TerrainType.Lake:
            options = [
                LocationResourceType.FreshWater,
                LocationResourceType.SmallGame, // fish, waterfowl
                LocationResourceType.Grassland, // fertile shore plants
            ];
            break;
        case TerrainType.Desert:
            options = [
                LocationResourceType.MineralRock, // salt, sulfur
                LocationResourceType.Dryland,   // sparse forage plants, cactus
                LocationResourceType.SmallGame,   // lizards, birds
                LocationResourceType.LargeGame    // camels, antelope
            ];
            break;
        case TerrainType.Forest:
            options = [
                LocationResourceType.SoftWood,
                LocationResourceType.HardWood,
                LocationResourceType.SmallGame,
                LocationResourceType.LargeGame,
                LocationResourceType.FreshWater, //rivers, streams
            ];
            rareOptions = [
                LocationResourceType.Wetland,
            ];
            break;
        case TerrainType.Wasteland:
            options = [
                LocationResourceType.MineralRock, // scavenged clays, salts
                LocationResourceType.SmallGame    // vermin, carrion feeders
            ];
            rareOptions = [
                LocationResourceType.FreshWater,
                LocationResourceType.Dryland
            ];
            break;
        case TerrainType.Volcano:
            options = [
                LocationResourceType.OreRock,
                LocationResourceType.Crystals,
                LocationResourceType.MineralRock // sulfur, ash
            ];
            break;
        case TerrainType.Plains:
            options = [
                LocationResourceType.Grassland,
                LocationResourceType.SmallGame, // birds, rabbits
                LocationResourceType.LargeGame  // bison, deer
            ];
            rareOptions = [
                LocationResourceType.SoftWood,
            ];
            break;
        case TerrainType.Swamp:
            options = [
                LocationResourceType.Wetland,
                LocationResourceType.FreshWater,
                LocationResourceType.SmallGame, // amphibians, fish
                LocationResourceType.LargeGame  // alligators, boar
            ];
            rareOptions = [
                LocationResourceType.MineralRock,
            ];
            break;
        case TerrainType.Jungle:
            options = [
                LocationResourceType.SoftWood,
                LocationResourceType.HardWood,
                LocationResourceType.Wetland,   // vines, herbs, medicinal plants
                LocationResourceType.SmallGame,
                LocationResourceType.LargeGame
            ];
            break;
    }

    if(rareOptions.length > 0) {
        for (let i = 0; i < rareOptions.length; i++) {
            if(GetRandomIntI(0, 2) == 0) {
                options.push(rareOptions[i]);
            }
        }
    }

    return options;
}
