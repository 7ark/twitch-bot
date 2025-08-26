//Inkarnate grid is 32 columns by 24 rows

import {LocationResourceType, LocationType, MapLocation, TerrainType} from "./valueDefinitions";

export const AllLocations: Array<MapLocation<any>> = [
    {
        Name: "Osavetus",
        ContextualName: "Osavetus",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `An abandoned arctic city overrun with undead`,
            Civilized: false
        },
        Coordinates: [ { X: 7, Y: 1 } ],

        MineNodes: { Min: 70, Max: 110 },
        FishNodes: { Min: 70, Max: 110 },
        CookNodes: { Min: 10, Max: 40 },
    },

    {
        Name: "Internum",
        ContextualName: "Internum",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A dangerous alien city of Star Spawn`,
            Civilized: false
        },
        Coordinates: [ { X: 6, Y: 3 } ],

        MineNodes: { Min: 40, Max: 70 },
        FishNodes: { Min: 50, Max: 100 },
        CookNodes: { Min: 5, Max: 20 },
    },

    {
        Name: "Ligna Vallis",
        ContextualName: "Ligna Vallis",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `Arctic city that exports lumber`,
            Civilized: true
        },
        Coordinates: [ { X: 16, Y: 4 } ],

        MineNodes: { Min: 40, Max: 90 },
        FishNodes: { Min: 10, Max: 40 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Nexum",
        ContextualName: "Nexum",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A coastal fishing city`,
            Civilized: true
        },
        Coordinates: [ { X: 22, Y: 4 } ],

        MineNodes: { Min: 10, Max: 40 },
        FishNodes: { Min: 70, Max: 110 },
        CookNodes: { Min: 70, Max: 110 },
    },

    {
        Name: "Canadian Canada",
        ContextualName: "Canadian Canada",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `An underground metropolis that loves art`,
            Civilized: true
        },
        Coordinates: [ { X: 30, Y: 4 } ],

        MineNodes: { Min: 50, Max: 100 },
        FishNodes: { Min: 40, Max: 90 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Alba Arce",
        ContextualName: "Alba Arce",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `An arctic mining city`,
            Civilized: true
        },
        Coordinates: [ { X: 12, Y: 5 } ],

        MineNodes: { Min: 80, Max: 120 },
        FishNodes: { Min: 10, Max: 40 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Chalybeum Thronum",
        ContextualName: "Chalybeum Thronum",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: ``,
            Civilized: true
        },
        Coordinates: [ { X: 14, Y: 7 } ],

        MineNodes: { Min: 50, Max: 100 },
        FishNodes: { Min: 70, Max: 110 },
        CookNodes: { Min: 50, Max: 100 },
    },

    {
        Name: "Umformati Fre",
        ContextualName: "Umformati Fre",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `Capital city of the Holy Empire of Monteanti`,
            Civilized: true
        },
        Coordinates: [ { X: 20, Y: 8 } ],

        MineNodes: { Min: 70, Max: 110 },
        FishNodes: { Min: 10, Max: 60 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Hemosanguine",
        ContextualName: "Hemosanguine",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A religion metropolis that worships Gazicmalzen`,
            Civilized: true
        },
        Coordinates: [ { X: 4, Y: 10 } ],

        MineNodes: { Min: 10, Max: 30 },
        FishNodes: { Min: 50, Max: 100 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Norcha",
        ContextualName: "Norcha",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A village in the mountains with a barter system`,
            Civilized: true
        },
        Coordinates: [ { X: 24, Y: 16 } ],

        MineNodes: { Min: 80, Max: 120 },
        FishNodes: { Min: 40, Max: 70 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Polygon City",
        ContextualName: "Polygon City",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `An underground city that specializes in crafted goods`,
            Civilized: true
        },
        Coordinates: [ { X: 5, Y: 17 } ],

        MineNodes: { Min: 70, Max: 110 },
        FishNodes: { Min: 30, Max: 60 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Portcullis",
        ContextualName: "Portcullis",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A mountain town that makes portcullis'`,
            Civilized: true
        },
        Coordinates: [ { X: 29, Y: 17 } ],

        MineNodes: { Min: 70, Max: 110 },
        FishNodes: { Min: 40, Max: 70 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "New Artlet",
        ContextualName: "New Artlet",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A town filled with werewolves`,
            Civilized: false
        },
        Coordinates: [ { X: 21, Y: 18 } ],

        MineNodes: { Min: 10, Max: 40 },
        FishNodes: { Min: 70, Max: 110 },
        CookNodes: { Min: 10, Max: 60 },
    },

    {
        Name: "Port Royal",
        ContextualName: "Port Royal",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `A coastal city that makes portcullis'`,
            Civilized: true
        },
        Coordinates: [ { X: 29, Y: 19 } ],

        MineNodes: { Min: 40, Max: 70 },
        FishNodes: { Min: 70, Max: 110 },
        CookNodes: { Min: 40, Max: 70 },
    },

    {
        Name: "Sawbridgeworth",
        ContextualName: "Sawbridgeworth",
        Type: LocationType.Settlement,
        NavigationCost: 1,
        Info: {
            Description: `Small logging village`,
            Civilized: true
        },
        Coordinates: [ { X: 28, Y: 21 } ],

        MineNodes: { Min: 50, Max: 100 },
        FishNodes: { Min: 50, Max: 100 },
        CookNodes: { Min: 50, Max: 100 },
    },
    {
        Name: "Ocean",
        ContextualName: "an ocean",
        Type: LocationType.Wilderness,
        NavigationCost: 100,
        Info: {
            Type: TerrainType.Ocean
        },
        Coordinates: [ { X: 1, Y: 1 }, { X: 2, Y: 1 }, { X: 3, Y: 1 }, { X: 4, Y: 1 }, { X: 5, Y: 1 }, { X: 11, Y: 1 }, { X: 12, Y: 1 }, { X: 13, Y: 1 }, { X: 14, Y: 1 }, { X: 15, Y: 1 }, { X: 16, Y: 1 }, { X: 17, Y: 1 }, { X: 18, Y: 1 }, { X: 19, Y: 1 }, { X: 20, Y: 1 }, { X: 21, Y: 1 }, { X: 22, Y: 1 }, { X: 23, Y: 1 }, { X: 24, Y: 1 }, { X: 25, Y: 1 }, { X: 26, Y: 1 }, { X: 27, Y: 1 }, { X: 28, Y: 1 }, { X: 29, Y: 1 }, { X: 30, Y: 1 }, { X: 31, Y: 1 }, { X: 32, Y: 1 }, { X: 1, Y: 2 }, { X: 2, Y: 2 }, { X: 3, Y: 2 }, { X: 4, Y: 2 }, { X: 5, Y: 2 }, { X: 12, Y: 2 }, { X: 13, Y: 2 }, { X: 20, Y: 2 }, { X: 21, Y: 2 }, { X: 22, Y: 2 }, { X: 23, Y: 2 }, { X: 24, Y: 2 }, { X: 25, Y: 2 }, { X: 26, Y: 2 }, { X: 27, Y: 2 }, { X: 28, Y: 2 }, { X: 29, Y: 2 }, { X: 32, Y: 2 }, { X: 1, Y: 3 }, { X: 2, Y: 3 }, { X: 3, Y: 3 }, { X: 4, Y: 3 }, { X: 12, Y: 3 }, { X: 23, Y: 3 }, { X: 24, Y: 3 }, { X: 25, Y: 3 }, { X: 26, Y: 3 }, { X: 27, Y: 3 }, { X: 28, Y: 3 }, { X: 32, Y: 3 }, { X: 1, Y: 4 }, { X: 2, Y: 4 }, { X: 3, Y: 4 }, { X: 24, Y: 4 }, { X: 25, Y: 4 }, { X: 26, Y: 4 }, { X: 27, Y: 4 }, { X: 28, Y: 4 }, { X: 32, Y: 4 }, { X: 1, Y: 5 }, { X: 2, Y: 5 }, { X: 3, Y: 5 }, { X: 24, Y: 5 }, { X: 25, Y: 5 }, { X: 26, Y: 5 }, { X: 27, Y: 5 }, { X: 28, Y: 5 }, { X: 32, Y: 5 }, { X: 1, Y: 6 }, { X: 2, Y: 6 }, { X: 3, Y: 6 }, { X: 4, Y: 6 }, { X: 24, Y: 6 }, { X: 25, Y: 6 }, { X: 26, Y: 6 }, { X: 27, Y: 6 }, { X: 28, Y: 6 }, { X: 29, Y: 6 }, { X: 32, Y: 6 }, { X: 1, Y: 7 }, { X: 2, Y: 7 }, { X: 3, Y: 7 }, { X: 4, Y: 7 }, { X: 12, Y: 7 }, { X: 13, Y: 7 }, { X: 24, Y: 7 }, { X: 25, Y: 7 }, { X: 26, Y: 7 }, { X: 27, Y: 7 }, { X: 28, Y: 7 }, { X: 29, Y: 7 }, { X: 32, Y: 7 }, { X: 1, Y: 8 }, { X: 2, Y: 8 }, { X: 13, Y: 8 }, { X: 14, Y: 8 }, { X: 23, Y: 8 }, { X: 24, Y: 8 }, { X: 25, Y: 8 }, { X: 26, Y: 8 }, { X: 27, Y: 8 }, { X: 28, Y: 8 }, { X: 29, Y: 8 }, { X: 30, Y: 8 }, { X: 32, Y: 8 }, { X: 1, Y: 9 }, { X: 2, Y: 9 }, { X: 3, Y: 9 }, { X: 4, Y: 9 }, { X: 5, Y: 9 }, { X: 6, Y: 9 }, { X: 14, Y: 9 }, { X: 15, Y: 9 }, { X: 16, Y: 9 }, { X: 17, Y: 9 }, { X: 22, Y: 9 }, { X: 23, Y: 9 }, { X: 24, Y: 9 }, { X: 25, Y: 9 }, { X: 26, Y: 9 }, { X: 27, Y: 9 }, { X: 28, Y: 9 }, { X: 29, Y: 9 }, { X: 30, Y: 9 }, { X: 31, Y: 9 }, { X: 32, Y: 9 }, { X: 1, Y: 10 }, { X: 2, Y: 10 }, { X: 5, Y: 10 }, { X: 6, Y: 10 }, { X: 7, Y: 10 }, { X: 9, Y: 10 }, { X: 10, Y: 10 }, { X: 13, Y: 10 }, { X: 14, Y: 10 }, { X: 17, Y: 10 }, { X: 18, Y: 10 }, { X: 21, Y: 10 }, { X: 22, Y: 10 }, { X: 23, Y: 10 }, { X: 24, Y: 10 }, { X: 25, Y: 10 }, { X: 26, Y: 10 }, { X: 27, Y: 10 }, { X: 28, Y: 10 }, { X: 29, Y: 10 }, { X: 30, Y: 10 }, { X: 31, Y: 10 }, { X: 32, Y: 10 }, { X: 1, Y: 11 }, { X: 2, Y: 11 }, { X: 5, Y: 11 }, { X: 6, Y: 11 }, { X: 7, Y: 11 }, { X: 8, Y: 11 }, { X: 9, Y: 11 }, { X: 10, Y: 11 }, { X: 11, Y: 11 }, { X: 12, Y: 11 }, { X: 13, Y: 11 }, { X: 19, Y: 11 }, { X: 20, Y: 11 }, { X: 21, Y: 11 }, { X: 22, Y: 11 }, { X: 23, Y: 11 }, { X: 24, Y: 11 }, { X: 25, Y: 11 }, { X: 26, Y: 11 }, { X: 27, Y: 11 }, { X: 28, Y: 11 }, { X: 29, Y: 11 }, { X: 30, Y: 11 }, { X: 31, Y: 11 }, { X: 32, Y: 11 }, { X: 1, Y: 12 }, { X: 5, Y: 12 }, { X: 6, Y: 12 }, { X: 7, Y: 12 }, { X: 8, Y: 12 }, { X: 9, Y: 12 }, { X: 10, Y: 12 }, { X: 11, Y: 12 }, { X: 12, Y: 12 }, { X: 19, Y: 12 }, { X: 20, Y: 12 }, { X: 21, Y: 12 }, { X: 22, Y: 12 }, { X: 23, Y: 12 }, { X: 24, Y: 12 }, { X: 25, Y: 12 }, { X: 26, Y: 12 }, { X: 27, Y: 12 }, { X: 28, Y: 12 }, { X: 29, Y: 12 }, { X: 30, Y: 12 }, { X: 31, Y: 12 }, { X: 32, Y: 12 }, { X: 1, Y: 13 }, { X: 6, Y: 13 }, { X: 7, Y: 13 }, { X: 8, Y: 13 }, { X: 9, Y: 13 }, { X: 10, Y: 13 }, { X: 11, Y: 13 }, { X: 12, Y: 13 }, { X: 13, Y: 13 }, { X: 14, Y: 13 }, { X: 15, Y: 13 }, { X: 16, Y: 13 }, { X: 19, Y: 13 }, { X: 24, Y: 13 }, { X: 25, Y: 13 }, { X: 26, Y: 13 }, { X: 27, Y: 13 }, { X: 28, Y: 13 }, { X: 29, Y: 13 }, { X: 30, Y: 13 }, { X: 31, Y: 13 }, { X: 32, Y: 13 }, { X: 1, Y: 14 }, { X: 9, Y: 14 }, { X: 10, Y: 14 }, { X: 11, Y: 14 }, { X: 12, Y: 14 }, { X: 13, Y: 14 }, { X: 14, Y: 14 }, { X: 15, Y: 14 }, { X: 16, Y: 14 }, { X: 17, Y: 14 }, { X: 18, Y: 14 }, { X: 19, Y: 14 }, { X: 26, Y: 14 }, { X: 27, Y: 14 }, { X: 28, Y: 14 }, { X: 29, Y: 14 }, { X: 30, Y: 14 }, { X: 31, Y: 14 }, { X: 32, Y: 14 }, { X: 1, Y: 15 }, { X: 10, Y: 15 }, { X: 13, Y: 15 }, { X: 17, Y: 15 }, { X: 18, Y: 15 }, { X: 19, Y: 15 }, { X: 20, Y: 15 }, { X: 21, Y: 15 }, { X: 28, Y: 15 }, { X: 29, Y: 15 }, { X: 30, Y: 15 }, { X: 31, Y: 15 }, { X: 32, Y: 15 }, { X: 1, Y: 16 }, { X: 2, Y: 16 }, { X: 10, Y: 16 }, { X: 13, Y: 16 }, { X: 17, Y: 16 }, { X: 18, Y: 16 }, { X: 19, Y: 16 }, { X: 20, Y: 16 }, { X: 21, Y: 16 }, { X: 30, Y: 16 }, { X: 31, Y: 16 }, { X: 32, Y: 16 }, { X: 1, Y: 17 }, { X: 2, Y: 17 }, { X: 10, Y: 17 }, { X: 17, Y: 17 }, { X: 18, Y: 17 }, { X: 19, Y: 17 }, { X: 20, Y: 17 }, { X: 21, Y: 17 }, { X: 30, Y: 17 }, { X: 31, Y: 17 }, { X: 32, Y: 17 }, { X: 1, Y: 18 }, { X: 2, Y: 18 }, { X: 10, Y: 18 }, { X: 13, Y: 18 }, { X: 14, Y: 18 }, { X: 17, Y: 18 }, { X: 18, Y: 18 }, { X: 19, Y: 18 }, { X: 23, Y: 18 }, { X: 30, Y: 18 }, { X: 31, Y: 18 }, { X: 32, Y: 18 }, { X: 1, Y: 19 }, { X: 2, Y: 19 }, { X: 10, Y: 19 }, { X: 13, Y: 19 }, { X: 14, Y: 19 }, { X: 17, Y: 19 }, { X: 18, Y: 19 }, { X: 19, Y: 19 }, { X: 20, Y: 19 }, { X: 22, Y: 19 }, { X: 23, Y: 19 }, { X: 24, Y: 19 }, { X: 30, Y: 19 }, { X: 31, Y: 19 }, { X: 32, Y: 19 }, { X: 1, Y: 20 }, { X: 9, Y: 20 }, { X: 10, Y: 20 }, { X: 11, Y: 20 }, { X: 13, Y: 20 }, { X: 17, Y: 20 }, { X: 18, Y: 20 }, { X: 19, Y: 20 }, { X: 20, Y: 20 }, { X: 21, Y: 20 }, { X: 22, Y: 20 }, { X: 23, Y: 20 }, { X: 24, Y: 20 }, { X: 25, Y: 20 }, { X: 26, Y: 20 }, { X: 30, Y: 20 }, { X: 31, Y: 20 }, { X: 32, Y: 20 }, { X: 1, Y: 21 }, { X: 9, Y: 21 }, { X: 10, Y: 21 }, { X: 11, Y: 21 }, { X: 13, Y: 21 }, { X: 14, Y: 21 }, { X: 15, Y: 21 }, { X: 16, Y: 21 }, { X: 17, Y: 21 }, { X: 18, Y: 21 }, { X: 19, Y: 21 }, { X: 20, Y: 21 }, { X: 21, Y: 21 }, { X: 22, Y: 21 }, { X: 23, Y: 21 }, { X: 24, Y: 21 }, { X: 25, Y: 21 }, { X: 26, Y: 21 }, { X: 29, Y: 21 }, { X: 30, Y: 21 }, { X: 31, Y: 21 }, { X: 32, Y: 21 }, { X: 1, Y: 22 }, { X: 8, Y: 22 }, { X: 9, Y: 22 }, { X: 10, Y: 22 }, { X: 11, Y: 22 }, { X: 12, Y: 22 }, { X: 13, Y: 22 }, { X: 14, Y: 22 }, { X: 15, Y: 22 }, { X: 16, Y: 22 }, { X: 17, Y: 22 }, { X: 18, Y: 22 }, { X: 19, Y: 22 }, { X: 20, Y: 22 }, { X: 21, Y: 22 }, { X: 22, Y: 22 }, { X: 23, Y: 22 }, { X: 24, Y: 22 }, { X: 25, Y: 22 }, { X: 26, Y: 22 }, { X: 29, Y: 22 }, { X: 30, Y: 22 }, { X: 31, Y: 22 }, { X: 32, Y: 22 }, { X: 1, Y: 23 }, { X: 2, Y: 23 }, { X: 3, Y: 23 }, { X: 6, Y: 23 }, { X: 7, Y: 23 }, { X: 8, Y: 23 }, { X: 9, Y: 23 }, { X: 10, Y: 23 }, { X: 11, Y: 23 }, { X: 12, Y: 23 }, { X: 13, Y: 23 }, { X: 14, Y: 23 }, { X: 15, Y: 23 }, { X: 16, Y: 23 }, { X: 17, Y: 23 }, { X: 18, Y: 23 }, { X: 19, Y: 23 }, { X: 20, Y: 23 }, { X: 21, Y: 23 }, { X: 22, Y: 23 }, { X: 23, Y: 23 }, { X: 24, Y: 23 }, { X: 25, Y: 23 }, { X: 26, Y: 23 }, { X: 27, Y: 23 }, { X: 28, Y: 23 }, { X: 29, Y: 23 }, { X: 30, Y: 23 }, { X: 31, Y: 23 }, { X: 32, Y: 23 }, { X: 1, Y: 24 }, { X: 2, Y: 24 }, { X: 3, Y: 24 }, { X: 4, Y: 24 }, { X: 5, Y: 24 }, { X: 6, Y: 24 }, { X: 7, Y: 24 }, { X: 8, Y: 24 }, { X: 9, Y: 24 }, { X: 10, Y: 24 }, { X: 11, Y: 24 }, { X: 12, Y: 24 }, { X: 13, Y: 24 }, { X: 14, Y: 24 }, { X: 15, Y: 24 }, { X: 16, Y: 24 }, { X: 17, Y: 24 }, { X: 18, Y: 24 }, { X: 19, Y: 24 }, { X: 20, Y: 24 }, { X: 21, Y: 24 }, { X: 22, Y: 24 }, { X: 23, Y: 24 }, { X: 24, Y: 24 }, { X: 25, Y: 24 }, { X: 26, Y: 24 }, { X: 27, Y: 24 }, { X: 28, Y: 24 }, { X: 29, Y: 24 }, { X: 30, Y: 24 }, { X: 31, Y: 24 }, { X: 32, Y: 24 } ],

        MineNodes: { Min: 0, Max: 0 },
        FishNodes: { Min: 80, Max: 120 },
        CookNodes: { Min: 0, Max: 20 },
    },

    {
        Name: "Tundra",
        ContextualName: "a tundra",
        Type: LocationType.Wilderness,
        NavigationCost: 2,
        Info: {
            Type: TerrainType.Tundra,
        },
        Coordinates: [ { X: 6, Y: 1 }, { X: 8, Y: 1 }, { X: 9, Y: 1 }, { X: 10, Y: 1 }, { X: 6, Y: 2 }, { X: 10, Y: 2 }, { X: 11, Y: 2 }, { X: 14, Y: 2 }, { X: 15, Y: 2 }, { X: 16, Y: 2 }, { X: 17, Y: 2 }, { X: 18, Y: 2 }, { X: 19, Y: 2 }, { X: 5, Y: 3 }, { X: 10, Y: 3 }, { X: 11, Y: 3 }, { X: 13, Y: 3 }, { X: 18, Y: 3 }, { X: 19, Y: 3 }, { X: 20, Y: 3 }, { X: 21, Y: 3 }, { X: 22, Y: 3 }, { X: 4, Y: 4 }, { X: 5, Y: 4 }, { X: 6, Y: 4 }, { X: 11, Y: 4 }, { X: 12, Y: 4 }, { X: 13, Y: 4 }, { X: 19, Y: 4 }, { X: 23, Y: 4 }, { X: 4, Y: 5 }, { X: 5, Y: 5 }, { X: 6, Y: 5 }, { X: 11, Y: 5 }, { X: 22, Y: 5 }, { X: 23, Y: 5 }, { X: 5, Y: 6 }, { X: 11, Y: 6 }, { X: 12, Y: 6 }, { X: 13, Y: 6 }, { X: 14, Y: 6 }, { X: 18, Y: 6 }, { X: 20, Y: 6 }, { X: 21, Y: 6 }, { X: 23, Y: 6 }, { X: 5, Y: 7 }, { X: 6, Y: 7 }, { X: 8, Y: 7 }, { X: 11, Y: 7 }, { X: 15, Y: 7 }, { X: 16, Y: 7 }, { X: 17, Y: 7 }, { X: 18, Y: 7 }, { X: 19, Y: 7 }, { X: 21, Y: 7 }, { X: 22, Y: 7 }, { X: 23, Y: 7 }, { X: 3, Y: 8 }, { X: 4, Y: 8 }, { X: 5, Y: 8 }, { X: 6, Y: 8 }, { X: 7, Y: 8 }, { X: 8, Y: 8 }, { X: 9, Y: 8 }, { X: 12, Y: 8 }, { X: 15, Y: 8 }, { X: 16, Y: 8 }, { X: 17, Y: 8 }, { X: 18, Y: 8 }, { X: 19, Y: 8 }, { X: 21, Y: 8 }, { X: 22, Y: 8 }, { X: 7, Y: 9 }, { X: 8, Y: 9 }, { X: 9, Y: 9 }, { X: 10, Y: 9 }, { X: 13, Y: 9 }, { X: 18, Y: 9 }, { X: 19, Y: 9 }, { X: 20, Y: 9 }, { X: 21, Y: 9 }, { X: 8, Y: 10 }, { X: 11, Y: 10 }, { X: 12, Y: 10 }, { X: 19, Y: 10 }, { X: 20, Y: 10 } ],

        MineNodes: { Min: 10, Max: 40 },
        FishNodes: { Min: 0, Max: 30 },
        CookNodes: { Min: 10, Max: 40 },
    },

    {
        Name: "Mountain",
        ContextualName: "a mountain",
        Type: LocationType.Wilderness,
        NavigationCost: 20,
        Info: {
            Type: TerrainType.Mountain,
        },
        Coordinates: [ { X: 7, Y: 2 }, { X: 8, Y: 2 }, { X: 9, Y: 2 }, { X: 7, Y: 3 }, { X: 8, Y: 3 }, { X: 9, Y: 3 }, { X: 14, Y: 3 }, { X: 15, Y: 3 }, { X: 16, Y: 3 }, { X: 17, Y: 3 }, { X: 7, Y: 4 }, { X: 8, Y: 4 }, { X: 9, Y: 4 }, { X: 10, Y: 4 }, { X: 14, Y: 4 }, { X: 15, Y: 4 }, { X: 17, Y: 4 }, { X: 18, Y: 4 }, { X: 7, Y: 5 }, { X: 8, Y: 5 }, { X: 9, Y: 5 }, { X: 10, Y: 5 }, { X: 13, Y: 5 }, { X: 14, Y: 5 }, { X: 17, Y: 5 }, { X: 18, Y: 5 }, { X: 19, Y: 5 }, { X: 8, Y: 6 }, { X: 9, Y: 6 }, { X: 10, Y: 6 }, { X: 15, Y: 6 }, { X: 16, Y: 6 }, { X: 17, Y: 6 }, { X: 19, Y: 6 }, { X: 9, Y: 7 }, { X: 10, Y: 7 }, { X: 20, Y: 7 }, { X: 10, Y: 8 }, { X: 11, Y: 8 }, { X: 11, Y: 9 }, { X: 12, Y: 9 }, { X: 22, Y: 14 }, { X: 23, Y: 14 }, { X: 6, Y: 15 }, { X: 7, Y: 15 }, { X: 24, Y: 15 }, { X: 25, Y: 15 }, { X: 5, Y: 16 }, { X: 6, Y: 16 }, { X: 7, Y: 16 }, { X: 25, Y: 16 }, { X: 26, Y: 16 }, { X: 27, Y: 16 }, { X: 6, Y: 17 }, { X: 7, Y: 17 }, { X: 26, Y: 17 }, { X: 27, Y: 17 }, { X: 28, Y: 17 }, { X: 5, Y: 18 }, { X: 6, Y: 18 }, { X: 7, Y: 18 }, { X: 27, Y: 18 }, { X: 28, Y: 18 }, { X: 5, Y: 19 }, { X: 6, Y: 19 }, { X: 7, Y: 19 }, { X: 4, Y: 20 }, { X: 5, Y: 20 }, { X: 6, Y: 20 } ],

        MineNodes: { Min: 50, Max: 80 },
        FishNodes: { Min: 10, Max: 30 },
        CookNodes: { Min: 20, Max: 40 },
    },

    {
        Name: "Desert",
        ContextualName: "a desert",
        Type: LocationType.Wilderness,
        NavigationCost: 5,
        Info: {
            Type: TerrainType.Desert,
        },
        Coordinates: [ { X: 30, Y: 2 }, { X: 31, Y: 2 }, { X: 29, Y: 3 }, { X: 30, Y: 3 }, { X: 31, Y: 3 }, { X: 29, Y: 4 }, { X: 31, Y: 4 }, { X: 29, Y: 5 }, { X: 30, Y: 5 }, { X: 31, Y: 5 }, { X: 30, Y: 6 }, { X: 31, Y: 6 }, { X: 30, Y: 7 }, { X: 31, Y: 7 }, { X: 31, Y: 8 }, { X: 6, Y: 14 }, { X: 7, Y: 14 }, { X: 8, Y: 14 }, { X: 8, Y: 15 }, { X: 9, Y: 15 }, { X: 8, Y: 16 }, { X: 9, Y: 16 }, { X: 8, Y: 17 }, { X: 9, Y: 17 }, { X: 8, Y: 18 }, { X: 9, Y: 18 }, { X: 8, Y: 19 }, { X: 9, Y: 19 }, { X: 8, Y: 20 }, { X: 8, Y: 21 } ],

        MineNodes: { Min: 20, Max: 40 },
        FishNodes: { Min: 0, Max: 0 },
        CookNodes: { Min: 10, Max: 20 },
    },

    {
        Name: "Lake",
        ContextualName: "a lake",
        Type: LocationType.Wilderness,
        NavigationCost: 10,
        Info: {
            Type: TerrainType.Lake,
        },
        Coordinates: [ { X: 20, Y: 4 }, { X: 21, Y: 4 }, { X: 20, Y: 5 }, { X: 21, Y: 5 }, { X: 6, Y: 6 }, { X: 7, Y: 6 }, { X: 22, Y: 6 }, { X: 7, Y: 7 }, { X: 4, Y: 15 }, { X: 5, Y: 15 }, { X: 25, Y: 18 }, { X: 4, Y: 21 }, { X: 5, Y: 21 }, { X: 4, Y: 22 }, { X: 5, Y: 22 } ],

        MineNodes: { Min: 0, Max: 0 },
        FishNodes: { Min: 50, Max: 80 },
        CookNodes: { Min: 10, Max: 30 },
    },

    {
        Name: "Forest",
        ContextualName: "a forest",
        Type: LocationType.Wilderness,
        NavigationCost: 5,
        Info: {
            Type: TerrainType.Forest,
        },
        Coordinates: [ { X: 15, Y: 5 }, { X: 16, Y: 5 }, { X: 3, Y: 10 }, { X: 3, Y: 11 }, { X: 4, Y: 11 }, { X: 2, Y: 12 }, { X: 3, Y: 12 }, { X: 4, Y: 12 }, { X: 2, Y: 13 }, { X: 3, Y: 13 }, { X: 4, Y: 13 }, { X: 5, Y: 13 }, { X: 2, Y: 14 }, { X: 3, Y: 14 }, { X: 4, Y: 14 }, { X: 5, Y: 14 }, { X: 2, Y: 15 }, { X: 3, Y: 15 }, { X: 3, Y: 16 }, { X: 4, Y: 16 }, { X: 3, Y: 17 }, { X: 4, Y: 17 }, { X: 3, Y: 18 }, { X: 4, Y: 18 }, { X: 3, Y: 19 }, { X: 4, Y: 19 } ],

        MineNodes: { Min: 10, Max: 30 },
        FishNodes: { Min: 20, Max: 40 },
        CookNodes: { Min: 20, Max: 40 },
    },

    {
        Name: "Wasteland",
        ContextualName: "a wasteland",
        Type: LocationType.Wilderness,
        NavigationCost: 15,
        Info: {
            Type: TerrainType.Wasteland,
        },
        Coordinates: [ { X: 15, Y: 10 }, { X: 16, Y: 10 }, { X: 14, Y: 11 }, { X: 17, Y: 11 }, { X: 18, Y: 11 }, { X: 13, Y: 12 }, { X: 14, Y: 12 }, { X: 15, Y: 12 }, { X: 16, Y: 12 }, { X: 17, Y: 12 }, { X: 18, Y: 12 }, { X: 17, Y: 13 }, { X: 18, Y: 13 } ],

        MineNodes: { Min: 30, Max: 60 },
        FishNodes: { Min: 0, Max: 0 },
        CookNodes: { Min: 0, Max: 20 },
    },

    {
        Name: "Volcano",
        ContextualName: "a volcano",
        Type: LocationType.Wilderness,
        NavigationCost: 40,
        Info: {
            Type: TerrainType.Volcano,
        },
        Coordinates: [ { X: 15, Y: 11 }, { X: 16, Y: 11 } ],

        MineNodes: { Min: 50, Max: 80 },
        FishNodes: { Min: 0, Max: 0 },
        CookNodes: { Min: 0, Max: 20 },
    },

    {
        Name: "Plains",
        ContextualName: "some plains",
        Type: LocationType.Wilderness,
        NavigationCost: 1,
        Info: {
            Type: TerrainType.Plains,
        },
        Coordinates: [ { X: 20, Y: 13 }, { X: 21, Y: 13 }, { X: 22, Y: 13 }, { X: 23, Y: 13 }, { X: 20, Y: 14 }, { X: 21, Y: 14 }, { X: 24, Y: 14 }, { X: 25, Y: 14 }, { X: 22, Y: 15 }, { X: 23, Y: 15 }, { X: 26, Y: 15 }, { X: 27, Y: 15 }, { X: 22, Y: 16 }, { X: 23, Y: 16 }, { X: 22, Y: 17 }, { X: 23, Y: 17 }, { X: 24, Y: 17 }, { X: 25, Y: 17 }, { X: 20, Y: 18 }, { X: 22, Y: 18 }, { X: 24, Y: 18 }, { X: 26, Y: 18 }, { X: 21, Y: 19 }, { X: 25, Y: 19 }, { X: 26, Y: 19 }, { X: 2, Y: 20 }, { X: 3, Y: 20 }, { X: 7, Y: 20 }, { X: 2, Y: 21 }, { X: 3, Y: 21 }, { X: 6, Y: 21 }, { X: 7, Y: 21 }, { X: 2, Y: 22 }, { X: 3, Y: 22 }, { X: 6, Y: 22 }, { X: 7, Y: 22 }, { X: 4, Y: 23 }, { X: 5, Y: 23 } ],

        MineNodes: { Min: 10, Max: 40 },
        FishNodes: { Min: 10, Max: 40 },
        CookNodes: { Min: 20, Max: 40 },
    },

    {
        Name: "Swamp",
        ContextualName: "a swamp",
        Type: LocationType.Wilderness,
        NavigationCost: 3,
        Info: {
            Type: TerrainType.Swamp,
        },
        Coordinates: [ { X: 11, Y: 15 }, { X: 12, Y: 15 }, { X: 14, Y: 15 }, { X: 15, Y: 15 }, { X: 16, Y: 15 }, { X: 11, Y: 16 }, { X: 12, Y: 16 }, { X: 14, Y: 16 }, { X: 15, Y: 16 }, { X: 16, Y: 16 }, { X: 11, Y: 17 }, { X: 12, Y: 17 }, { X: 13, Y: 17 }, { X: 14, Y: 17 }, { X: 15, Y: 17 }, { X: 16, Y: 17 }, { X: 11, Y: 18 }, { X: 12, Y: 18 }, { X: 15, Y: 18 }, { X: 16, Y: 18 }, { X: 11, Y: 19 }, { X: 12, Y: 19 }, { X: 15, Y: 19 }, { X: 16, Y: 19 }, { X: 12, Y: 20 }, { X: 14, Y: 20 }, { X: 15, Y: 20 }, { X: 16, Y: 20 }, { X: 12, Y: 21 } ],

        MineNodes: { Min: 0, Max: 30 },
        FishNodes: { Min: 30, Max: 60 },
        CookNodes: { Min: 20, Max: 40 },
    },

    {
        Name: "Jungle",
        ContextualName: "a jungle",
        Type: LocationType.Wilderness,
        NavigationCost: 8,
        Info: {
            Type: TerrainType.Jungle,
        },
        Coordinates: [ { X: 28, Y: 16 }, { X: 29, Y: 16 }, { X: 29, Y: 18 }, { X: 27, Y: 19 }, { X: 28, Y: 19 }, { X: 27, Y: 20 }, { X: 28, Y: 20 }, { X: 29, Y: 20 }, { X: 27, Y: 21 }, { X: 27, Y: 22 }, { X: 28, Y: 22 } ],

        MineNodes: { Min: 0, Max: 30 },
        FishNodes: { Min: 20, Max: 40 },
        CookNodes: { Min: 20, Max: 40 },
    },
];
