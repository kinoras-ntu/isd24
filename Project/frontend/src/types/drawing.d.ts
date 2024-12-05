export type NodeId = number

export type Point = {
    x: number
    y: number
}

export type Line = Point[]

export type Frame = Line[]

export interface Node extends Point {
    nodeId: NodeId
}

export interface RCObject {
    nodeId: NodeId[]
    refPoint: Point
    frames: Frame[]
}
