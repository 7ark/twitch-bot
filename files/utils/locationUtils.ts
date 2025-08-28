import {AllLocations} from "../locationDefinitions";
import {FormatSeconds, GetMostCommonEnum, GetRandomIntI, GetRandomItem} from "./utils";
import {Client} from "tmi.js";
import {
    BaseLocation,
    coordKey,
    CoordKey,
    LocationCoordinate,
    LocationResourceType,
    LocationType,
    MapLocation,
    NamedLocationInfo,
    Player,
    SessionLocationData,
    SessionSaveableWorldData,
    TerrainType,
    TravelChunk,
    TravelChunkPath,
    WildernessLocationInfo
} from "../valueDefinitions";
import {GetPlayerCoordinates, LoadAllPlayers, SavePlayer} from "./playerGameUtils";
import fs from "fs";
import {MinigameType} from "./minigameUtils";
import {InventoryObject} from "../inventoryDefinitions";
import {AStarFinder, Grid} from "pathfinding";
import {TravelTimeInSeconds} from "../globals";

const { Graph, astar } = require('javascript-astar');
const PF = require('pathfinding');

export let WorldData: SessionSaveableWorldData;
let playerTravelSchedules: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
let navigationGrid: Grid;
let emptyGrid: Grid;
let oceanGrid: Grid;

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
    // const grid: number[][] = Array.from({ length: GRID_WIDTH + 1 }, () =>
    //     Array.from({ length: GRID_HEIGHT + 1 }, () => 0)
    // );
    // const emptyGrid: number[][] = Array.from({ length: GRID_WIDTH + 1 }, () =>
    //     Array.from({ length: GRID_HEIGHT + 1 }, () => 0)
    // );
    navigationGrid = new Grid(GRID_WIDTH + 1, GRID_HEIGHT + 1);
    emptyGrid = new Grid(GRID_WIDTH + 1, GRID_HEIGHT + 1);
    oceanGrid = new Grid(GRID_WIDTH + 1, GRID_HEIGHT + 1);

    for (let location of AllLocations) {
        if(location.Type == LocationType.Settlement || location.Type == LocationType.Wilderness) {
            let terrain: TerrainType = TerrainType.Urban;
            if(location.Type == LocationType.Wilderness) {
                terrain = (location.Info as WildernessLocationInfo).TerrainType;
            }

            for(let coord of location.Coordinates) {
                navigationGrid.setCostAt(coord.X - 1, coord.Y - 1, location.NavigationCost);
                // if(location.NavigationCost > 5) {
                //     console.log(`Non walk ${coord.X} ${coord.Y}`)
                //     navigationGrid.setWalkableAt(coord.X, coord.Y, false);
                // }
                if(terrain == TerrainType.Ocean) {
                    emptyGrid.setWalkableAt(coord.X - 1, coord.Y - 1, false);
                    oceanGrid.setCostAt(coord.X - 1, coord.Y - 1, 1);
                }
                else {
                    oceanGrid.setCostAt(coord.X - 1, coord.Y - 1, 100);
                    // oceanGrid.setWalkableAt(coord.X - 1, coord.Y - 1, false);
                }
                // grid[coord.X][coord.Y] = location.NavigationCost;
                // emptyGrid[coord.X][coord.Y] = location.Type == LocationType.Wilderness && (location.Info as WildernessLocationInfo).Type == TerrainType.Ocean ? 0 : 1;
            }
        }
    }


    // navigationGraph = new Graph(grid);
    // emptyGraph = new Graph(emptyGrid);
}

export function GetLocation(name: string): MapLocation<any> | undefined {
    return AllLocations.find(x => x.Name.toLowerCase() == name.toLowerCase());
}

export function GetLocationFromCoordinate(coord: LocationCoordinate, type: LocationType = undefined) {
    return AllLocations.find(x => x.Coordinates.some(y => y.X == coord.X && y.Y == coord.Y) &&
        (type == undefined ?
            (x.Type == LocationType.Settlement || x.Type == LocationType.Wilderness) :
            x.Type == type));
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
    let playerCoord = GetPlayerCoordinates(player);
    let playerLocation = GetLocationFromCoordinate(playerCoord);
    let destinationLocation = GetLocationFromCoordinate(coord);

    if(CoordinatesEqual(playerCoord, coord)) {
        if(playerTravelSchedules.has(player.Username)) {
            let timeout = playerTravelSchedules.get(player.Username)!;
            clearTimeout(timeout);
            playerTravelSchedules.delete(player.Username);
        }

        if(player.Travelling) {
            //Stop travelling, you want to go where you are
            ClearTravel(player);
            SavePlayer(player);

            await client.say(process.env.CHANNEL!, `@${player.Username}, you were already at ${player.CurrentLocation}! So you stop traveling.`);
        }
        else {
            //You're already there. Don't bother. Might need to inform player
            await client.say(process.env.CHANNEL!, `@${player.Username}, you're already at ${player.CurrentLocation}!'`);
        }
    }
    else {
        //Make travel plan
        let finder = new AStarFinder({
            allowDiagonal: true
        });

        //First, check if its on the same continent. If this path is empty, theres no path to it without going over the ocean
        let oceanTestPath = finder.findPath(
            playerCoord.X - 1, playerCoord.Y - 1,
            coord.X - 1, coord.Y - 1,
            emptyGrid.clone());

        let travelPlan: Array<TravelChunk> = [];
        if(oceanTestPath.length == 0) {
            //Over ocean

            //TODO: Define where continents are so we can determine info more easily.

            //Find a port
            let departingLocation: LocationCoordinate = playerCoord;
            if(playerLocation.Type != LocationType.Settlement || !(playerLocation.Info as NamedLocationInfo).HasPort) {
                departingLocation = GetPortNearCoordinate(playerCoord, coord);

                if(!CoordinatesEqual(playerCoord, departingLocation)) {
                    //Navigate to departing location
                    travelPlan.push(...PlanTravelChunk(playerCoord, departingLocation, navigationGrid));
                }
            }

            let arrivalLocation = GetPortNearCoordinate(coord, playerCoord);

            //Navigate to arrival location
            travelPlan.push(...PlanTravelChunk(departingLocation, arrivalLocation, oceanGrid));

            //Navigate to final location
            travelPlan.push(...PlanTravelChunk(arrivalLocation, coord, navigationGrid));
        }
        else {
            travelPlan = PlanTravelChunk(playerCoord, coord, navigationGrid);
        }

        console.log("Plan: ")
        for (let i = 0; i < travelPlan.length; i++) {
            console.log(TerrainType[travelPlan[i].PathOptions[0].HighestCostTerrain]);
            console.log(`Start: ${JSON.stringify(travelPlan[i].StartCoordinate)}`)
            for (let j = 0; j < travelPlan[i].PathOptions[0].Path.length; j++) {
                console.log(`${JSON.stringify(travelPlan[i].PathOptions[0].Path[j])}`)
            }
            console.log(`End: ${JSON.stringify(travelPlan[i].EndCoordinate)}`)
        }

        player.Travelling = true;
        player.TravelPlan = travelPlan;
        player.TravelDestination = destinationLocation.Name;
        player.TravelDestinationCoordinates = coord;
        let firstLoc = GetLocationFromCoordinate(player.TravelPlan[0].StartCoordinate);
        player.CurrentLocationCoordinates = player.TravelPlan[0].StartCoordinate;
        player.CurrentLocation = firstLoc.Name;
        player.TravelTick = firstLoc.NavigationTimeInTicks;
        player.TravelChunkIndex = 0;
        SavePlayer(player);
        await client.say(process.env.CHANNEL!, `@${player.Username}, you have started traveling to ${player.TravelDestination}. It will take about ${FormatSeconds(GetTravelSecondsRemaining(player))}`);

        //If it ISNT, check if the continent you're on has a port
        //If it DOESNT, travel to nearest coast

        //Then, ocean travel to either closest port on continent you're going to, or closest piece of land on that continent



        // const timeToTravel = ComputeTravelSecondsFromCoords(GetPlayerCoordinates(player), coord);
        //
        // player.TravelDestination = location.Name;
        // player.TravelDestinationCoordinates = coord;
        // player.TravelStartTime = new Date();
        // player.TravelTimeInSeconds = timeToTravel;
        // player.Travelling = true;
        // SavePlayer(player);
        //
        // await client.say(process.env.CHANNEL!, `@${player.Username}, you have started traveling to ${player.TravelDestination}. It will take ${FormatSeconds(timeToTravel)}.`);
        //
        // ScheduleArrivalTimer(client, player);
    }
}

export async function TickPlayerTravel(client: Client) {
    let travellingPlayers = LoadAllPlayers().filter(x => x.Travelling);
    for(let player of travellingPlayers) {
        await TickPlayer(client, player);
    }
}

async function TickPlayer(client: Client, player: Player) {
    if(player.TravelWaiting) {
        return; //Player must do something
    }

    player.TravelTick--;
    if(player.TravelTick <= 0) { //This tile of travel is over
        //Move to next location, if there is any
        let travelPlanChunk = player.TravelPlan![player.TravelChunkIndex];

        // console.log("Ran out of ticks")

        //They have not started down a specific path yet
        if(player.TravelPathChoiceIndex == undefined) {
            // console.log("Path choice empty")
            //At the start, we may have to make a choice
            if(travelPlanChunk.PathOptions.length > 1) {
                // console.log("Multiple choice options")
                //Player must make a choice
                player.TravelWaiting = true;
                let text = `you see several routes you can take. `;
                let onlyTwoOptions = travelPlanChunk.PathOptions.length == 2;

                if(onlyTwoOptions) {
                    let pathOne = travelPlanChunk.PathOptions[0];
                    let pathTwo = travelPlanChunk.PathOptions[1];
                    let terrainOne = pathOne.MajorityTerrainType;
                    let terrainTwo = pathTwo.MajorityTerrainType;
                    let pathOneMoreDifficult = pathOne.DifficultyScore > pathTwo.DifficultyScore;
                    if(terrainOne == terrainTwo) {
                        if(pathOneMoreDifficult) {
                            terrainTwo = pathTwo.LowestCostTerrain;
                        }
                        else {
                            terrainOne = pathOne.LowestCostTerrain;
                        }
                    }
                    let locationOne = GetWildernessLocationByTerrainType(terrainOne);
                    let locationTwo = GetWildernessLocationByTerrainType(terrainTwo);

                    //Path 1
                    text += `Type '!path 1' to go through a path with mostly ${locationOne.PluralizedName}, `;
                    if(pathOneMoreDifficult) {
                        text += `it's more dangerous but takes ~${FormatSeconds(GetSecondsToTravelPath(pathOne.Path))}. `
                    }
                    else {
                        text += `it's safer but takes ~${FormatSeconds(GetSecondsToTravelPath(pathOne.Path))}. `
                    }

                    //Path 2
                    text += `Alternatively, choose '!path 2' to go through ${locationTwo.PluralizedName}, `;
                    if(!pathOneMoreDifficult) {
                        text += `which is more dangerous but takes ~${FormatSeconds(GetSecondsToTravelPath(pathTwo.Path))}. `
                    }
                    else {
                        text += `which is safer but takes ~${FormatSeconds(GetSecondsToTravelPath(pathTwo.Path))}. `
                    }
                }
                else {
                    for (let j = 0; j < travelPlanChunk.PathOptions.length; j++) {
                        // let lowCostLocation = GetWildernessLocationByTerrainType(travelPlanChunk.PathOptions[j].LowestCostTerrain);
                        // let highCostLocation = GetWildernessLocationByTerrainType(travelPlanChunk.PathOptions[j].HighestCostTerrain);
                        let commonLocation = GetWildernessLocationByTerrainType(travelPlanChunk.PathOptions[j].MajorityTerrainType);
                        text += `Type '!path ${(j + 1)}' to go through a path with mostly ${commonLocation.PluralizedName}, `;
                        text += `its danger score is ${travelPlanChunk.PathOptions[j].DifficultyScore} and will take ~${FormatSeconds(GetSecondsToTravelPath(travelPlanChunk.PathOptions[j].Path))}. `
                    }
                }

                text += `You must choose one path before you can continue.`
                player.TravelChoiceText = text;

                await client.say(process.env.CHANNEL!, `@${player.Username}, as you're travelling, ${text}`);
            }
            else {
                // console.log("Only one choice");
                //Only one path
                player.TravelPathChoiceIndex = 0;
                player.TravelPathProgressIndex = 0;
                let location = GetLocationFromCoordinate(player.CurrentLocationCoordinates);
                player.CurrentLocationCoordinates = travelPlanChunk.PathOptions[player.TravelPathChoiceIndex].Path[player.TravelPathChoiceIndex];
                player.CurrentLocation = location.Name;
            }
        }
        //We are travelling on a path
        else {
            // console.log("Travelling on the path!")
            //Is the player at the end coordinate
            if(CoordinatesEqual(player.CurrentLocationCoordinates, travelPlanChunk.EndCoordinate)) {
                // console.log("We're at the end coordinate")
                player.TravelChunkIndex++;
                player.TravelPathChoiceIndex = undefined;
                player.TravelPathProgressIndex = 0;

                //We arrived!!!!
                if(player.TravelChunkIndex >= player.TravelPlan!.length) {
                    // console.log("We arrived!")
                    player.CurrentLocation = player.TravelDestination!;
                    player.CurrentLocationCoordinates = player.TravelDestinationCoordinates!;
                    let text = `@${player.Username}, you have arrived at your destination of ${player.TravelDestination}!`;

                    let minigameNode = GetSessionFromCoordinates(player.TravelDestinationCoordinates!.X, player.TravelDestinationCoordinates!.Y);
                    if(minigameNode!.ValueMultiplier < 1) {
                        text += ` This location is currently paying out LESS gems than usual.`
                    }
                    else if(minigameNode!.ValueMultiplier > 1) {
                        text += ` This location is currently paying out MORE gems than usual!`
                    }
                    await client.say(process.env.CHANNEL!, text);
                    ClearTravel(player);
                }
                //Move to the next chunk
                else {
                    // console.log("Moving to next chunk")
                    let newChunk = player.TravelPlan![player.TravelChunkIndex];
                    let location = GetLocationFromCoordinate(newChunk.StartCoordinate);
                    player.CurrentLocationCoordinates = newChunk.StartCoordinate;
                    player.CurrentLocation = location.Name;
                }
            }
            else {
                // console.log("Continue down path")
                //Increment index
                player.TravelPathProgressIndex++;
                if(player.TravelPathProgressIndex >= travelPlanChunk.PathOptions[player.TravelPathChoiceIndex].Path.length) {
                    // console.log("Reached end of the path, setting to end coord")
                    //They have reached the end of the path
                    let location = GetLocationFromCoordinate(travelPlanChunk.EndCoordinate);
                    player.CurrentLocationCoordinates = travelPlanChunk.EndCoordinate;
                    player.CurrentLocation = location.Name;
                }
                else {
                    // console.log("Just moving to next progress index")
                    let newCoord = travelPlanChunk.PathOptions[player.TravelPathChoiceIndex].Path[player.TravelPathProgressIndex];
                    let location = GetLocationFromCoordinate(newCoord);
                    player.CurrentLocationCoordinates = newCoord;
                    player.CurrentLocation = location.Name;
                }
            }
        }

        if(player.Travelling && !player.TravelWaiting) {
            player.TravelTick = GetLocationFromCoordinate(player.CurrentLocationCoordinates).NavigationTimeInTicks;
        }
    }


    SavePlayer(player);
}

export async function SelectPlayerTravelPath(client: Client, player: Player, selectedPath: number) {
    if(player.Travelling && player.TravelWaiting && player.TravelPathChoiceIndex == undefined) {
        player.TravelPathChoiceIndex = selectedPath;
        player.TravelWaiting = false;
        player.TravelPathProgressIndex = 0;
        player.CurrentLocationCoordinates = player.TravelPlan![player.TravelChunkIndex].PathOptions[player.TravelPathChoiceIndex].Path[0];
        let loc = GetLocationFromCoordinate(player.CurrentLocationCoordinates);
        player.CurrentLocation = loc.Name;
        player.TravelTick = loc.NavigationTimeInTicks;
        let commonLocation = GetWildernessLocationByTerrainType(player.TravelPlan![player.TravelChunkIndex].PathOptions[player.TravelPathChoiceIndex].MajorityTerrainType);
        await client.say(process.env.CHANNEL!, `@${player.Username}, you continue on your journey, heading towards ${commonLocation.PluralizedName} in the distance.`);
        SavePlayer(player);
    }
    else {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you don't currently need to select a path.`);
    }
}

function ClearTravel(player: Player) {
    player.Travelling = false;
    player.TravelWaiting = false;
    player.TravelPlan = undefined;
    player.TravelChunkIndex = undefined;
    player.TravelPathChoiceIndex = undefined;
    player.TravelPathProgressIndex = undefined;
    player.TravelDestination = undefined;
    player.TravelDestinationCoordinates = undefined;
    player.TravelTick = undefined;
    player.TravelChoiceText = undefined;
}

function GetSecondsToTravelPath(path: Array<LocationCoordinate>): number {
    let time = 0;
    for (let i = 0; i < path.length; i++) {
        let location = GetLocationFromCoordinate(path[i]);
        time += location.NavigationTimeInTicks * TravelTimeInSeconds;
    }

    return time;
}

export function GetTravelSecondsRemaining(player: Player): number {
    if (!player.Travelling || !player.TravelPlan || player.TravelChunkIndex === undefined) return 0;

    let seconds = 0;

    // Time left on the current tile (fallback to full tile if TravelTick missing)
    const currentTileTicks =
        player.TravelTick ?? GetLocationFromCoordinate(player.CurrentLocationCoordinates).NavigationTimeInTicks;
    seconds += currentTileTicks * TravelTimeInSeconds;

    const plan = player.TravelPlan;
    const currentChunk = plan[player.TravelChunkIndex];

    // Remaining in current chunk
    if (currentChunk) {
        if (player.TravelPathChoiceIndex !== undefined) {
            const path = currentChunk.PathOptions[player.TravelPathChoiceIndex].Path;
            const nextStepIndex = Math.max((player.TravelPathProgressIndex ?? -1) + 1, 0);
            if (nextStepIndex < path.length) {
                seconds += GetSecondsToTravelPath(path.slice(nextStepIndex));
            }
        } else {
            // No choice made yet: assume fastest option for ETA
            let best = Infinity;
            for (const option of currentChunk.PathOptions) {
                const s = GetSecondsToTravelPath(option.Path);
                if (s < best) best = s;
            }
            if (isFinite(best)) seconds += best;
        }
    }

    // All future chunks (assume fastest option for ETA)
    for (let i = player.TravelChunkIndex + 1; i < plan.length; i++) {
        const chunk = plan[i];
        let best = Infinity;
        for (const option of chunk.PathOptions) {
            const s = GetSecondsToTravelPath(option.Path);
            if (s < best) best = s;
        }
        if (isFinite(best)) seconds += best;
    }

    return Math.max(0, Math.round(seconds));
}

function GetPortNearCoordinate(originCoord: LocationCoordinate, destinationCoord: LocationCoordinate): LocationCoordinate {
    let finder = new AStarFinder({
        allowDiagonal: true
    });

    let departingLocation: LocationCoordinate;
    let lowestDistance = 999999999999;
    let found = false;
    let settlements = AllLocations.filter(x => x.Type == LocationType.Settlement && (x.Info as NamedLocationInfo).HasPort);
    for (let i = 0; i < settlements.length; i++) {
        let loc = settlements[i];

        let settlementTestPath = finder.findPath(
            originCoord.X - 1, originCoord.Y - 1,
            loc.Coordinates[0].X - 1, loc.Coordinates[0].Y - 1,
            emptyGrid.clone());


        let dist = DistanceBetweenCoordinates(originCoord, loc.Coordinates[0]);
        // console.log(`Checking ${loc.Name}. ${JSON.stringify(originCoord)} - ${JSON.stringify(loc.Coordinates[0])} Plan ${settlementTestPath.length} and dist ${dist}`)
        if((settlementTestPath.length > 0 || AreCoordinatesNeighbors(originCoord, loc.Coordinates[0])) && dist < lowestDistance) {
            departingLocation = loc.Coordinates[0];
            lowestDistance = dist;
            found = true;
        }
    }

    if(!found) {
        //Must depart from closest spot to ocean
        let current = { X: originCoord.X, Y: originCoord.Y };
        let prev = current;

        while (true) {
            if(destinationCoord.X > current.X) {
                current.X++;
            }
            else if(destinationCoord.X < current.X) {
                current.X--;
            }
            if(destinationCoord.Y > current.Y) {
                current.Y++;
            }
            else if(destinationCoord.Y < current.Y) {
                current.Y--;
            }

            let newLoc = GetLocationFromCoordinate(current);
            if(newLoc == undefined) {
                console.log("BIG BIG ERROR TRYING TO FIND POINT TO DEPART")
                break;
            }

            if(newLoc.Type == LocationType.Wilderness && (newLoc.Info as WildernessLocationInfo).TerrainType == TerrainType.Ocean) {
                departingLocation = prev;
                break;
            }

            prev = current;
        }
    }

    return departingLocation;
}

function PlanTravelChunk(startingCoord: LocationCoordinate, destinationCoord: LocationCoordinate, gridToUse: Grid): Array<TravelChunk> {
    let finder = new AStarFinder({
        allowDiagonal: true
    });

    let goldenTravelPath = finder.findPath(
        startingCoord.X - 1, startingCoord.Y - 1,
        destinationCoord.X - 1, destinationCoord.Y - 1,
        gridToUse.clone());

    //Go through path, find travel segments
    let terrainsOrder: Array<{
        Terrain: TerrainType,
        Coord: LocationCoordinate
    }> = [];
    let skipTracker = 0; //Just tracks so we skip 1-off instances of terrain
    for (let i = 0; i < goldenTravelPath.length; i++) {
        let coord = { X: goldenTravelPath[i][0] + 1, Y: goldenTravelPath[i][1] + 1 }; //Returns 0-index based but our coords are 1-indexed
        let location = GetLocationFromCoordinate(coord);
        if(location == undefined) {
            console.log(`Location undefined! Coord ${goldenTravelPath[i]}`)
        }

        if(terrainsOrder.length == 0 || location.Type == LocationType.Settlement || (terrainsOrder.at(-1) != (location.Info as WildernessLocationInfo).TerrainType)) {
            if(location.Type == LocationType.Settlement) {
                terrainsOrder.push({
                    Terrain: TerrainType.Urban,
                    Coord: coord
                });
                skipTracker = 0;
            }
            else {
                if(skipTracker >= 1) {
                    terrainsOrder.push({
                        Terrain: (location.Info as WildernessLocationInfo).TerrainType,
                        Coord: coord
                    });
                    skipTracker = 0;
                }
                else {
                    skipTracker++;
                }
            }
        }
    }

    if(terrainsOrder.length == 0) {
        console.log("uh oh");
        console.log(`${JSON.stringify(startingCoord)} to ${JSON.stringify(destinationCoord)}`)
        console.log(goldenTravelPath)
    }

    //Go through each, keep track of the last cost. If the cost drops, then 2 places back (if it exists) is a point for divergence.
    let travelChunks: Array<TravelChunk> = [];
    let previousCost = 0;
    let currentChunkStart: LocationCoordinate = { X: terrainsOrder[0].Coord.X, Y: terrainsOrder[0].Coord.Y };
    let chunkLength = 0;
    for (let i = 0; i < terrainsOrder.length; i++) {
        let location = GetLocationFromCoordinate(terrainsOrder[i].Coord);
        let currentCost = location.NavigationCost;
        let reset = false;

        if(currentCost < previousCost) {
            if(chunkLength >= 2) {
                travelChunks.push({
                    StartCoordinate: { X: currentChunkStart.X, Y: currentChunkStart.Y },
                    EndCoordinate: terrainsOrder[i].Coord,
                    PathOptions: []
                });
                currentChunkStart = { X: terrainsOrder[i].Coord.X, Y: terrainsOrder[i].Coord.Y };
                chunkLength = 0;
                reset = true;
            }
        }

        if(!reset) {
            chunkLength++;
        }

        previousCost = currentCost;
    }
    //Add last chunk no matter what it is
    if(chunkLength > 0) {
        travelChunks.push({
            StartCoordinate: { X: currentChunkStart.X, Y: currentChunkStart.Y },
            EndCoordinate: terrainsOrder.at(-1)!.Coord,
            PathOptions: []
        });
    }

    //Now for each chunk, run extra pathfinding to determine possible shorter paths
    for (let i = 0; i < travelChunks.length; i++) {
        let chunk = travelChunks[i];

        let normalRoute = finder.findPath(
            chunk.StartCoordinate.X, chunk.StartCoordinate.Y,
            chunk.EndCoordinate.X, chunk.EndCoordinate.Y,
            gridToUse.clone());
        let fastRoute = finder.findPath(
            chunk.StartCoordinate.X, chunk.StartCoordinate.Y,
            chunk.EndCoordinate.X, chunk.EndCoordinate.Y,
            emptyGrid.clone());

        let pathOptions: Array<TravelChunkPath> = [
            RouteToTravelPath(normalRoute)
        ];

        if(normalRoute.length - fastRoute.length >= 2 && fastRoute.length > 0) {
            pathOptions.push(RouteToTravelPath(fastRoute));
        }

        travelChunks[i].PathOptions = pathOptions;

        // console.log(`Chunk ${i}: Normal ${normalRoute.length} to Fast ${fastRoute.length}`);
        // console.log(normalRoute)
        // console.log(fastRoute)
    }

    return travelChunks;
}

function RouteToTravelPath(path: number[][]): TravelChunkPath {
    let currentMostDangerousTerrain: TerrainType;
    let highestDangerousTerrainCost = 0;
    let currentLeastDangerousTerrain: TerrainType;
    let lowestTerrainCost = 9999999;
    let difficultyScore = 0;
    let terrains: Array<TerrainType> = [];

    let coordinates: Array<LocationCoordinate> = [];
    for (let i = 0; i < path.length; i++) {
        let coord: LocationCoordinate = { X: path[i][0] + 1, Y: path[i][1] + 1 }; //Returns 0-index based but our coords are 1-indexed
        let location = GetLocationFromCoordinate(coord);
        coordinates.push(coord);

        let terrain = location.Type == LocationType.Settlement ? TerrainType.Urban : (location.Info as WildernessLocationInfo).TerrainType;

        if(location.NavigationCost > highestDangerousTerrainCost) {
            highestDangerousTerrainCost = location.NavigationCost;
            currentMostDangerousTerrain = terrain;
        }
        if(location.NavigationCost < lowestTerrainCost && location.Type != LocationType.Settlement) {
            lowestTerrainCost = location.NavigationCost;
            currentLeastDangerousTerrain = (location.Info as WildernessLocationInfo).TerrainType;
        }
        terrains.push(terrain);

        difficultyScore += location.DangerRating;
    }

    let mostCommonTerrain: TerrainType = GetMostCommonEnum(terrains)!;

    return {
        Path: coordinates,
        HighestCostTerrain: currentMostDangerousTerrain,
        LowestCostTerrain: currentLeastDangerousTerrain,
        MajorityTerrainType: mostCommonTerrain,
        DifficultyScore: difficultyScore,
    }
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

function AreCoordinatesNeighbors(coord1: LocationCoordinate, coord2: LocationCoordinate): boolean {
    const around = GetCoordinatesAroundCoordinate(coord1, false);
    return around.some(c => CoordinatesEqual(c, coord2));
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
        if(loc !== undefined && (loc.Info && (loc.Info as WildernessLocationInfo).TerrainType !== undefined)) {
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
            let wildernessType = (loc.Info as WildernessLocationInfo).TerrainType;

            if(!types.includes(wildernessType)) {
                types.push(wildernessType);
            }
        }
    }

    return types;
}

function GetWildernessLocationByTerrainType(terrain: TerrainType): MapLocation<WildernessLocationInfo> {
    return AllLocations.find(x => x.Type == LocationType.Wilderness && (x.Info as WildernessLocationInfo).TerrainType == terrain);
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
    let terrainType = loc.Info!.TerrainType;
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
