declare module "pathfinding" {
    namespace PF {
        // If your installed @types has FinderOptions, widen it:
        interface FinderOptions {
            tieBreakerBias?: number;
            hex?: boolean; // if your fork reads this
        }

        interface Grid {
            setCostAt(x: number, y: number, cost: number): void;
        }

        // New class from your fork
        class HexAStarFinder {
            constructor(options?: FinderOptions);
            findPath(
                startX: number,
                startY: number,
                endX: number,
                endY: number,
                grid: Grid
            ): number[][];
        }
    }
    export = PF;
}
